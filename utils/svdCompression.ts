// Robust client-side SVD compression utilities with advanced features
import { runChannelSVDs, runChannelReconstruct } from './workerCoordinator';
import { createStatefulSvdSession, SessionUpdate } from './statefulSession';

export interface CompressionResult {
  compressedImage: string; // base64 data URL
  singularValues: number[];
  originalSize: number;
  compressedSize: number;
  rank: number;
  error: number;
  quality: number;
  compressionRatio: number;
  processingTime: number;
  metadata: ImageMetadata;
}

export interface SVDRawResult {
  U: number[][];
  S: number[];
  Vt: number[][];
}

export interface ImageMetadata {
  width: number;
  height: number;
  channels: number;
  format: string;
  colorSpace: 'grayscale' | 'rgb' | 'rgba';
  maxRank: number;
  optimalRank: number;
}

export interface PrecomputedSVD {
  factors: SVDRawResult[]; // one per channel (1 or 3)
  imageData: ImageData; // possibly resized for computation
  metadata: ImageMetadata;
  originalFileSize: number;
  cacheKey?: string; // for caching optimization
  timestamp?: number; // for cache invalidation
}

export interface CompressionOptions {
  rank?: number;
  quality?: number; // 0-1, target quality
  maxSize?: number; // max file size in bytes
  algorithm?: 'power-iteration' | 'jacobi' | 'qr-iteration';
  colorMode?: 'grayscale' | 'rgb' | 'auto';
  colorMix?: number; // 0 (grayscale) .. 1 (full color)
  optimization?: 'speed' | 'quality' | 'balanced';
  errorThreshold?: number;
  maxIterations?: number;
  // Engine to use for reconstruction: truncated = classic U_k Σ_k V_k^T; weighted = prior quality-weighted variant
  engine?: 'truncated' | 'weighted';
}

// Stateful session handle (approx-first, incremental updates). Optional alternative to precompute+reconstruct API.
export interface StatefulCompressionSession {
  setRank: (rank: number) => void;
  dispose: () => void;
  metadata: ImageMetadata;
}

// Create a stateful compression session that streams approximate results first, then exact
export async function startStatefulCompression(
  imageFile: File,
  initialRank: number,
  onUpdate: (result: { imageUrl: string; width: number; height: number; isApproximation: boolean; singularValues: { red: number[]; green: number[]; blue: number[] } }) => void,
  initialColorMix: number = 1,
): Promise<StatefulCompressionSession> {
  const processor = new ImageProcessor();
  const { imageData, metadata } = await processor.loadAndNormalize(imageFile, { maxPixels: pickComputePixelBudget(), extremeAspectThreshold: 2.5 });
  const session = await createStatefulSvdSession(imageData, initialRank, (update: SessionUpdate) => {
    // Convert ImageData to data URL for UI
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = update.imageData.width;
    canvas.height = update.imageData.height;
    ctx.putImageData(update.imageData, 0, 0);
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onUpdate({
      imageUrl,
      width: update.imageData.width,
      height: update.imageData.height,
      isApproximation: update.isApproximation,
      singularValues: {
        red: Array.from(update.singularValues.red),
        green: Array.from(update.singularValues.green),
        blue: Array.from(update.singularValues.blue),
      },
    });
  }, initialColorMix);
  return {
    setRank: (rank: number) => session.setRank(rank),
    // Expose color mix control into session
    // @ts-ignore - Caller may not use it
    setColorMix: (mix: number) => (session as any).setColorMix?.(mix),
    dispose: () => session.dispose(),
    metadata,
  };
}

// ----- Config & Adaptive Limits -----
const getEnvNumber = (name: string, fallback: number): number => {
  const v = (process?.env as any)?.[name];
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// Simple cache for precomputed SVD factors (in-memory only)
const svdCache = new Map<string, PrecomputedSVD>();
const CACHE_MAX_SIZE = 5; // Keep last 5 computations
const CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

const generateCacheKey = (file: File, options: CompressionOptions): string => {
  const key = `${file.name}_${file.size}_${file.lastModified}_${options.rank || 30}_${options.algorithm || 'power-iteration'}`;
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
};

const getCachedSVD = (cacheKey: string): PrecomputedSVD | null => {
  const cached = svdCache.get(cacheKey);
  if (!cached) return null;
  
  // Check expiry
  const now = Date.now();
  if (cached.timestamp && (now - cached.timestamp) > CACHE_EXPIRY_MS) {
    svdCache.delete(cacheKey);
    return null;
  }
  
  return cached;
};

const setCachedSVD = (cacheKey: string, precomputed: PrecomputedSVD): void => {
  // Limit cache size
  if (svdCache.size >= CACHE_MAX_SIZE) {
    const firstKey = svdCache.keys().next().value;
    if (firstKey) svdCache.delete(firstKey);
  }
  
  precomputed.cacheKey = cacheKey;
  precomputed.timestamp = Date.now();
  svdCache.set(cacheKey, precomputed);
};

const DEFAULT_FILE_SIZE_LIMIT = getEnvNumber('NEXT_PUBLIC_FILE_SIZE_LIMIT', 20 * 1024 * 1024); // 20MB - reduced for web performance
const DEFAULT_MAX_LOAD_DIM = getEnvNumber('NEXT_PUBLIC_MAX_LOAD_DIM', 1024); // reduced from 2048 for faster loading
const DEFAULT_COMPUTE_DIM = getEnvNumber('NEXT_PUBLIC_COMPUTE_DIM', 256); // reduced from 384 for much faster processing
const DEFAULT_PREVIEW_DIM = getEnvNumber('NEXT_PUBLIC_PREVIEW_DIM', 128); // reduced from 192 for instant previews
const DEFAULT_MAX_COMPUTE_PIXELS = getEnvNumber('NEXT_PUBLIC_MAX_COMPUTE_PIXELS', 2_000_000); // ~2MP budget by default

const getDeviceMemoryGb = (): number => {
  if (typeof navigator !== 'undefined' && (navigator as any)?.deviceMemory != null) {
    const dm = (navigator as any).deviceMemory as number | undefined;
    if (typeof dm === 'number' && dm > 0) return dm;
  }
  return 8; // assume a reasonable default
};

const pickComputeDim = (): number => {
  const dm = getDeviceMemoryGb();
  // Keep compute dimension modest for responsiveness
  if (dm <= 2) return 192;
  if (dm <= 4) return 224;
  return 256; // cap at 256 even on high-memory devices for speed
};

// Pick a pixel budget based on device memory to cap width*height for compute
const pickComputePixelBudget = (): number => {
  const dm = getDeviceMemoryGb();
  if (dm <= 2) return Math.min(DEFAULT_MAX_COMPUTE_PIXELS, 1_000_000); // ~1MP
  if (dm <= 4) return Math.min(DEFAULT_MAX_COMPUTE_PIXELS, 1_500_000); // ~1.5MP
  if (dm <= 8) return Math.min(DEFAULT_MAX_COMPUTE_PIXELS, 2_500_000); // ~2.5MP
  return Math.min(DEFAULT_MAX_COMPUTE_PIXELS, 4_000_000); // ~4MP
};

// Enhanced SVD implementation with multiple algorithms
export class RobustSVD {
  private matrix: number[][];
  private m: number;
  private n: number;
  private minDim: number;

  constructor(matrix: number[][]) {
    if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0]) || matrix[0].length === 0) {
      throw new Error('Invalid matrix: expected non-empty 2D array');
    }
    this.matrix = matrix.map(row => [...row]); // Deep copy
    this.m = matrix.length;
    this.n = matrix[0]!.length;
    this.minDim = Math.min(this.m, this.n);
  }

  // Power iteration method (faster, less accurate)
  private powerIteration(
    maxIterations: number = 50,
    tolerance: number = 1e-6,
    targetRank?: number
  ): SVDRawResult {
    const rankToCompute = Math.min(this.minDim, Math.max(1, targetRank ?? this.minDim));
    const U: number[][] = Array(this.m).fill(0).map(() => Array(rankToCompute).fill(0));
    const S: number[] = Array(rankToCompute).fill(0);
    const Vt: number[][] = Array(rankToCompute).fill(0).map(() => Array(this.n).fill(0));
    
    const A = this.matrix.map(row => [...row]);
    
    for (let k = 0; k < rankToCompute; k++) {
      // Initialize random vectors
      let u = Array(this.m).fill(0).map(() => Math.random() - 0.5);
      let v = Array(this.n).fill(0).map(() => Math.random() - 0.5);
      
      let prevSigma = 0;
      let sigma = 0;
      
      for (let iter = 0; iter < maxIterations; iter++) {
        // Update v = A^T * u
        for (let j = 0; j < this.n; j++) {
          let accum = 0;
          for (let i = 0; i < this.m; i++) {
            const Ai = A[i] as number[];
            const ui = u[i] ?? 0;
            accum += (Ai[j] ?? 0) * ui;
          }
          v[j] = accum;
        }
        
        // Normalize v
        const vNorm = Math.sqrt(v.reduce((sum, val) => sum + (val ?? 0) * (val ?? 0), 0));
        if (vNorm > 1e-10) {
          for (let j = 0; j < this.n; j++) {
            v[j] = ((v[j] ?? 0) / vNorm);
          }
        }
        
        // Update u = A * v
        for (let i = 0; i < this.m; i++) {
          let accum = 0;
          const Ai = A[i] as number[];
          for (let j = 0; j < this.n; j++) {
            const vj = v[j] ?? 0;
            accum += (Ai[j] ?? 0) * vj;
          }
          u[i] = accum;
        }
        
        // Normalize u
        const uNorm = Math.sqrt(u.reduce((sum, val) => sum + (val ?? 0) * (val ?? 0), 0));
        if (uNorm > 1e-10) {
          for (let i = 0; i < this.m; i++) {
            u[i] = ((u[i] ?? 0) / uNorm);
          }
        }
        
        // Calculate singular value
        sigma = 0;
        for (let i = 0; i < this.m; i++) {
          const Ai = A[i] as number[];
          const ui = u[i] ?? 0;
          for (let j = 0; j < this.n; j++) {
            const vj = v[j] ?? 0;
            sigma += (Ai[j] ?? 0) * ui * vj;
          }
        }
        
        // Check convergence
        if (Math.abs(sigma - prevSigma) < tolerance) {
          break;
        }
        prevSigma = sigma;
      }
      
      S[k] = Math.abs(sigma);
      
      // Store vectors
      for (let i = 0; i < this.m; i++) {
        const Ui = U[i] as number[];
        Ui[k] = u[i] ?? 0;
      }
      const Vtk = Vt[k] as number[];
      for (let j = 0; j < this.n; j++) {
        Vtk[j] = v[j] ?? 0;
      }
      
      // Deflate matrix: A = A - σ * u * v^T
      for (let i = 0; i < this.m; i++) {
        const Ai = A[i] as number[];
        const ui = u[i] ?? 0;
        for (let j = 0; j < this.n; j++) {
          const vj = v[j] ?? 0;
          Ai[j] = (Ai[j] ?? 0) - sigma * ui * vj;
        }
      }
    }
    
    return { U, S, Vt };
  }

  // QR iteration method (more accurate, slower)
  private qrIteration(targetRank?: number): SVDRawResult {
    // This is a simplified QR iteration - in practice, you'd use a more sophisticated implementation
    return this.powerIteration(100, 1e-8, targetRank);
  }

  // Jacobi method for symmetric matrices
  private jacobiIteration(targetRank?: number): SVDRawResult {
    // Convert to symmetric matrix A^T * A for V computation
    const ATA = Array(this.n).fill(0).map(() => Array(this.n).fill(0));
    
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        let accum = 0;
        for (let k = 0; k < this.m; k++) {
          const row = this.matrix[k] as number[];
          accum += (row[i] ?? 0) * (row[j] ?? 0);
        }
        const ATAr = ATA[i] as number[];
        ATAr[j] = accum;
      }
    }
    
    // Use power iteration for this implementation
    return this.powerIteration(75, 1e-7, targetRank);
  }

  public decompose(options: CompressionOptions = {}): SVDRawResult {
    const algorithm = options.algorithm || 'power-iteration';
    const maxIterations = options.maxIterations || 50;
    const tolerance = options.errorThreshold || 1e-6;
    const targetRank = Math.min(this.minDim, Math.max(1, options.rank ?? this.minDim));

    switch (algorithm) {
      case 'qr-iteration':
        return this.qrIteration(targetRank);
      case 'jacobi':
        return this.jacobiIteration(targetRank);
      case 'power-iteration':
      default:
        return this.powerIteration(maxIterations, tolerance, targetRank);
    }
  }
}

// Image processing utilities
export class ImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Decode → optional center-crop (extreme aspect) → scale to pixel budget → ImageData + metadata
  public async loadAndNormalize(
    file: File,
    options?: { maxPixels?: number; extremeAspectThreshold?: number }
  ): Promise<{ imageData: ImageData; metadata: ImageMetadata }> {
    // Cap pixel budget by computeDim^2 for consistent performance
    const computeDim = pickComputeDim();
    const defaultBudget = computeDim * computeDim; // e.g., 256×256
    const pixelBudget = Math.min(options?.maxPixels ?? defaultBudget, defaultBudget);
    const extremeAspectThreshold = options?.extremeAspectThreshold ?? 2.5;
    const LARGE_CROP_SIDE = getEnvNumber('NEXT_PUBLIC_LARGE_CROP_SIDE', 1024);

    // 1) Decode to image/bitmap without creating huge ImageData
    let sourceWidth = 0;
    let sourceHeight = 0;
    let drawSource: CanvasImageSource;
    let useBitmap = false;
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      drawSource = bitmap;
      sourceWidth = bitmap.width;
      sourceHeight = bitmap.height;
      useBitmap = true;
    } else {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Failed to load image'));
        el.src = URL.createObjectURL(file);
      });
      drawSource = img;
      sourceWidth = img.width;
      sourceHeight = img.height;
    }

    if (sourceWidth < 10 || sourceHeight < 10) {
      throw new Error('Image dimensions too small. Minimum 10x10 pixels.');
    }

    // 2) Determine crop for extreme aspect or large square center crop (cap to 1024)
    const aspect = sourceWidth / sourceHeight;
    const isExtreme = aspect > extremeAspectThreshold || aspect < 1 / extremeAspectThreshold;
    let cropX = 0, cropY = 0, cropW = sourceWidth, cropH = sourceHeight;
    if (isExtreme) {
      const side = Math.min(sourceWidth, sourceHeight);
      const capped = Math.min(side, LARGE_CROP_SIDE);
      cropX = Math.floor((sourceWidth - capped) / 2);
      cropY = Math.floor((sourceHeight - capped) / 2);
      cropW = capped;
      cropH = capped;
    }

    // 3) Compute target size to fit pixel budget while preserving aspect
    const cropAspect = cropW / cropH;
    const targetH = Math.max(1, Math.floor(Math.sqrt(pixelBudget / cropAspect)));
    const targetW = Math.max(1, Math.floor(targetH * cropAspect));

    // 4) Draw scaled (and cropped if needed) directly, then read ImageData
    this.canvas.width = targetW;
    this.canvas.height = targetH;
    this.ctx.clearRect(0, 0, targetW, targetH);
    (this.ctx as any).imageSmoothingEnabled = true;
    (this.ctx as any).imageSmoothingQuality = 'high';
    this.ctx.drawImage(
      drawSource,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      targetW,
      targetH
    );
    const imageData = this.ctx.getImageData(0, 0, targetW, targetH);
    const metadata = this.detectMetadata(imageData, file.type || 'image/png');

    // 5) Cleanup bitmap URL/handle
    if (useBitmap && 'close' in drawSource && typeof (drawSource as any).close === 'function') {
      try { (drawSource as any).close(); } catch {}
    }

    return { imageData, metadata };
  }

  // Fallback loader: always center-crop to a fixed square side (e.g., 1024)
  public async loadAndForceSquare(file: File, side: number): Promise<{ imageData: ImageData; metadata: ImageMetadata }> {
    let drawSource: CanvasImageSource;
    let width = 0, height = 0;
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      drawSource = bitmap;
      width = bitmap.width;
      height = bitmap.height;
    } else {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error('Failed to load image'));
        el.src = URL.createObjectURL(file);
      });
      drawSource = img;
      width = img.width;
      height = img.height;
    }
    const cropX = Math.max(0, Math.floor((width - side) / 2));
    const cropY = Math.max(0, Math.floor((height - side) / 2));
    this.canvas.width = side;
    this.canvas.height = side;
    this.ctx.clearRect(0, 0, side, side);
    (this.ctx as any).imageSmoothingEnabled = true;
    (this.ctx as any).imageSmoothingQuality = 'high';
    this.ctx.drawImage(drawSource, cropX, cropY, Math.min(side, width), Math.min(side, height), 0, 0, side, side);
    const imageData = this.ctx.getImageData(0, 0, side, side);
    const metadata = this.detectMetadata(imageData, file.type || 'image/png');
    return { imageData, metadata };
  }

  // Load and validate image
  public async loadImage(file: File): Promise<{ imageData: ImageData; metadata: ImageMetadata }> {
    // Prefer imageBitmap decode when available (faster, lower memory)
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file);

        if (bitmap.width < 10 || bitmap.height < 10) {
          throw new Error('Image dimensions too small. Minimum 10x10 pixels.');
        }

        this.canvas.width = bitmap.width;
        this.canvas.height = bitmap.height;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(bitmap, 0, 0);
        const imageData = this.ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        const metadata = this.detectMetadata(imageData, file.type || 'image/png');
        bitmap.close();
        URL.revokeObjectURL(URL.createObjectURL(file)); // Clean up blob URL
        return { imageData, metadata };
      } catch {
        // Fall through to HTMLImageElement path
      }
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          if (img.width < 10 || img.height < 10) {
            throw new Error('Image dimensions too small. Minimum 10x10 pixels.');
          }
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          const metadata = this.detectMetadata(imageData, file.type || 'image/png');
          resolve({ imageData, metadata });
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image. Please ensure it\'s a valid image file.'));
      img.src = URL.createObjectURL(file);
    });
  }

  private detectMetadata(imageData: ImageData, format: string): ImageMetadata {
    const data: Uint8ClampedArray = imageData.data as Uint8ClampedArray;
    let hasAlpha = false;
    let hasColor = false;
    for (let i = 0; i < data.length; i += 4) {
      if ((data[i + 3] ?? 255) < 255) hasAlpha = true;
      if ((data[i] ?? 0) !== (data[i + 1] ?? 0) || (data[i] ?? 0) !== (data[i + 2] ?? 0)) hasColor = true;
    }
    const colorSpace: 'grayscale' | 'rgb' | 'rgba' = hasAlpha ? 'rgba' : hasColor ? 'rgb' : 'grayscale';
    const channels = colorSpace === 'rgba' ? 4 : colorSpace === 'rgb' ? 3 : 1;
    const maxRank = Math.min(imageData.width, imageData.height);
    return {
      width: imageData.width,
      height: imageData.height,
      channels,
      format,
      colorSpace,
      maxRank,
      optimalRank: Math.min(maxRank, Math.floor(maxRank * 0.1))
    };
  }

  // Center-crop to a square (1:1) using the smaller dimension
  public cropToSquare(imageData: ImageData): ImageData {
    const { width: ow, height: oh } = imageData;
    if (ow === oh) return imageData;

    const side = Math.min(ow, oh);
    const sx = Math.floor((ow - side) / 2);
    const sy = Math.floor((oh - side) / 2);

    // Draw source into a working canvas first
    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCanvas.width = ow;
    srcCanvas.height = oh;
    srcCtx.putImageData(imageData, 0, 0);

    // Crop into our internal canvas
    this.canvas.width = side;
    this.canvas.height = side;
    this.ctx.clearRect(0, 0, side, side);
    this.ctx.drawImage(srcCanvas, sx, sy, side, side, 0, 0, side, side);

    return this.ctx.getImageData(0, 0, side, side);
  }

  // Resize ImageData to fit within a max pixel budget while preserving aspect ratio
  public resizeToFitPixels(imageData: ImageData, maxPixels: number): { imageData: ImageData; width: number; height: number; scale: number } {
    const { width: ow, height: oh } = imageData;
    const currentPixels = ow * oh;
    if (currentPixels <= maxPixels) {
      return { imageData, width: ow, height: oh, scale: 1 };
    }
    const aspect = ow / oh;
    const targetHeight = Math.max(1, Math.floor(Math.sqrt(maxPixels / aspect)));
    const targetWidth = Math.max(1, Math.floor(targetHeight * aspect));

    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d')!;
    srcCanvas.width = ow;
    srcCanvas.height = oh;
    srcCtx.putImageData(imageData, 0, 0);

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;
    this.ctx.clearRect(0, 0, targetWidth, targetHeight);
    (this.ctx as any).imageSmoothingEnabled = true;
    (this.ctx as any).imageSmoothingQuality = 'high';
    this.ctx.drawImage(srcCanvas, 0, 0, ow, oh, 0, 0, targetWidth, targetHeight);
    const resized = this.ctx.getImageData(0, 0, targetWidth, targetHeight);
    return { imageData: resized, width: targetWidth, height: targetHeight, scale: targetWidth / ow };
  }

  // Convert image data to matrix format
  public imageDataToMatrix(imageData: ImageData, colorMode: 'grayscale' | 'rgb' | 'auto' = 'auto'): number[][][] {
    const { data, width, height } = imageData;
    const matrices: number[][][] = [];

    if (colorMode === 'grayscale' || (colorMode === 'auto' && this.isGrayscale(data))) {
      // Single grayscale matrix
      const matrix: number[][] = Array(height)
        .fill(0)
        .map(() => Array(width).fill(0));
      for (let y = 0; y < height; y++) {
        const row = matrix[y] as number[];
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx] ?? 0;
          const g = data[idx + 1] ?? 0;
          const b = data[idx + 2] ?? 0;
          row[x] = 0.299 * r + 0.587 * g + 0.114 * b;
        }
      }
      matrices.push(matrix);
    } else {
      // RGB matrices
      for (let channel = 0; channel < 3; channel++) {
        const matrix: number[][] = Array(height)
          .fill(0)
          .map(() => Array(width).fill(0));
        for (let y = 0; y < height; y++) {
          const row = matrix[y] as number[];
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            row[x] = data[idx + channel] ?? 0;
          }
        }
        matrices.push(matrix);
      }
    }

    return matrices;
  }

  // Convert matrix back to image data
  public matrixToImageData(matrices: number[][][], originalImageData: ImageData): ImageData {
    const width = originalImageData.width;
    const height = originalImageData.height;
    const newData = new Uint8ClampedArray(originalImageData.data.length);

    if (matrices.length === 1) {
      // Grayscale
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const row = matrices[0]?.[y] as number[] | undefined;
          const raw = row?.[x] ?? 0;
          const gray = Math.max(0, Math.min(255, Math.round(raw)));
          newData[idx] = gray;     // R
          newData[idx + 1] = gray; // G
          newData[idx + 2] = gray; // B
          newData[idx + 3] = 255;  // A
        }
      }
    } else {
      // RGB
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const rRow = matrices[0]?.[y] as number[] | undefined;
          const gRow = matrices[1]?.[y] as number[] | undefined;
          const bRow = matrices[2]?.[y] as number[] | undefined;
          const r = rRow?.[x] ?? 0;
          const g = gRow?.[x] ?? 0;
          const b = bRow?.[x] ?? 0;
          newData[idx] = Math.max(0, Math.min(255, Math.round(r)));     // R
          newData[idx + 1] = Math.max(0, Math.min(255, Math.round(g))); // G
          newData[idx + 2] = Math.max(0, Math.min(255, Math.round(b))); // B
          newData[idx + 3] = 255;  // A
        }
      }
    }

    return new ImageData(newData, width, height);
  }

  // Check if image is grayscale
  private isGrayscale(data: Uint8ClampedArray): boolean {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) {
        return false;
      }
    }
    return true;
  }

  // Calculate image quality metrics
  public calculateQuality(original: ImageData, compressed: ImageData): number {
    const originalData = original.data;
    const compressedData = compressed.data;
    let totalError = 0;
    let totalPixels = 0;

    for (let i = 0; i < originalData.length; i += 4) {
      const or = (originalData[i] ?? 0);
      const og = (originalData[i + 1] ?? 0);
      const ob = (originalData[i + 2] ?? 0);
      const cr = (compressedData[i] ?? 0);
      const cg = (compressedData[i + 1] ?? 0);
      const cb = (compressedData[i + 2] ?? 0);
      const originalGray = 0.299 * or + 0.587 * og + 0.114 * ob;
      const compressedGray = 0.299 * cr + 0.587 * cg + 0.114 * cb;
      totalError += Math.pow(originalGray - compressedGray, 2);
      totalPixels++;
    }

    const mse = totalError / totalPixels;
    const psnr = 20 * Math.log10(255 / Math.sqrt(mse));
    return Math.max(0, Math.min(1, psnr / 50)); // Normalize to 0-1
  }
}

// Main compression function with robust error handling
export async function compressImage(
  imageFile: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = performance.now();
  
  try {
    // Validate input
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.');
    }

    if (imageFile.size > DEFAULT_FILE_SIZE_LIMIT) {
      throw new Error(`File too large. Maximum size is ${Math.round(DEFAULT_FILE_SIZE_LIMIT / (1024*1024))}MB.`);
    }

    // Set default options (optimized for online performance)
    const opts: Required<CompressionOptions> = {
      rank: options.rank || 30, // reduced from 50 for faster processing
      quality: options.quality ?? 0.8,
      maxSize: options.maxSize || 5 * 1024 * 1024, // 5MB
      algorithm: options.algorithm || 'power-iteration',
      colorMode: options.colorMode || 'auto',
      colorMix: options.colorMix ?? 1,
      optimization: options.optimization || 'balanced',
      errorThreshold: options.errorThreshold || 1e-5, // slightly relaxed for speed
      maxIterations: options.maxIterations || 35, // reduced from 50 for faster convergence
      engine: options.engine || 'truncated'
    };

    // Process image: decode → optional crop (extreme aspect) → scale to pixel budget in one pass
    const processor = new ImageProcessor();
    let imageData: ImageData;
    let loadedMetadata: ImageMetadata;
    try {
      const loaded = await processor.loadAndNormalize(imageFile, {
        maxPixels: pickComputePixelBudget(),
        extremeAspectThreshold: 2.5
      });
      imageData = loaded.imageData;
      loadedMetadata = loaded.metadata;
    } catch (e) {
      // Fallback: force square center-crop at 1024
      const loaded = await processor.loadAndForceSquare(imageFile, getEnvNumber('NEXT_PUBLIC_LARGE_CROP_SIDE', 1024));
      imageData = loaded.imageData;
      loadedMetadata = loaded.metadata;
    }
    const metadata: ImageMetadata = {
      ...loadedMetadata,
      width: imageData.width,
      height: imageData.height,
      maxRank: Math.min(imageData.width, imageData.height),
      optimalRank: Math.min(Math.min(imageData.width, imageData.height), Math.floor(Math.min(imageData.width, imageData.height) * 0.1))
    };
    
    // Convert to matrices
    const matrices = processor.imageDataToMatrix(imageData, opts.colorMode);
    
    // Perform SVD on each channel (prefer workers)
    const svdResults: SVDRawResult[] = await runChannelSVDs(matrices, opts);

    // Determine rank to use
    // For truncated engine, honor explicit rank control (like imgsvd). For weighted, keep prior quality heuristic.
    let kUsed = Math.max(1, Math.min(metadata.maxRank, opts.rank));
    if (
      opts.engine === 'weighted' &&
      opts.quality < 1 &&
      Array.isArray(svdResults) &&
      svdResults.length > 0 &&
      svdResults[0] != null &&
      Array.isArray((svdResults[0] as SVDRawResult).S)
    ) {
      const singularValues = svdResults[0]!.S as number[];
      let optimalRank = estimateOptimalRank(singularValues, opts.quality);
      if (opts.optimization === 'quality') {
        optimalRank = Math.min(metadata.maxRank, Math.ceil(optimalRank * 1.2));
      } else if (opts.optimization === 'speed') {
        optimalRank = Math.max(1, Math.floor(optimalRank * 0.8));
      }
      kUsed = Math.max(1, Math.min(metadata.maxRank, optimalRank));
    }

    // Compress each channel
    const compressedMatrices: number[][][] = [];
    for (let c = 0; c < matrices.length; c++) {
      const result = svdResults[c];
      if (!result) continue;
      const { U, S, Vt } = result as SVDRawResult;
      const matrix = matrices[c] as number[][];

      const k = Math.min(kUsed, S.length);

      if (opts.engine === 'truncated') {
        // Classic truncated SVD reconstruction: A_k = U_k Σ_k V_k^T
        const compressedMatrix: number[][] = [];
        for (let i = 0; i < matrix.length; i++) {
          compressedMatrix[i] = [];
          const row0 = matrix[0] as number[];
          for (let j = 0; j < row0.length; j++) {
            let sum = 0;
            const Ui = U[i] as number[];
            for (let l = 0; l < k; l++) {
              const Vtl = Vt[l] as number[];
              sum += (Ui[l] ?? 0) * (S[l] ?? 0) * (Vtl[j] ?? 0);
            }
            // Clamp to valid pixel range
            const outRow = (compressedMatrix[i] ||= [] as number[]);
            outRow[j] = Math.max(0, Math.min(255, sum));
          }
        }
        compressedMatrices.push(compressedMatrix);
      } else {
        // Previous weighted reconstruction path (kept for compatibility)
        const sortedIndices = S.map((value, index) => ({ value, index }))
          .sort((a, b) => b.value - a.value)
          .map(item => item.index);

        const Uk: number[][] = [];
        const Sk: number[] = [];
        const Vtk: number[][] = [];

        const qualityWeight = opts.quality;
        const maxSV = Math.max(...S);

        for (let i = 0; i < U.length; i++) {
          const Ui = U[i] as number[];
          const UkRow = (Uk[i] ||= [] as number[]);
          for (let j = 0; j < k; j++) {
            const rawIndex = sortedIndices[j] as number | undefined;
            const svIndex = Math.max(0, Math.min(S.length - 1, rawIndex ?? 0));
            const svWeight = Math.pow((S[svIndex] ?? 0) / (maxSV || 1), qualityWeight);
            UkRow[j] = (Ui[svIndex] ?? 0) * svWeight;
          }
        }

        for (let j = 0; j < k; j++) {
          const rawIndex = sortedIndices[j] as number | undefined;
          const svIndex = Math.max(0, Math.min(S.length - 1, rawIndex ?? 0));
          const svWeight = Math.pow((S[svIndex] ?? 0) / (maxSV || 1), qualityWeight);
          Sk[j] = (S[svIndex] ?? 0) * svWeight;
        }

        for (let i = 0; i < k; i++) {
          const VtkRow = (Vtk[i] ||= [] as number[]);
          const rawIndex = sortedIndices[i] as number | undefined;
          const svIndex = Math.max(0, Math.min(S.length - 1, rawIndex ?? 0));
          const VtRow = Vt[svIndex] as number[];
          const vt0Len = (Vt[0] as number[] | undefined)?.length ?? VtRow.length ?? 0;
          for (let j = 0; j < vt0Len; j++) {
            const svWeight = Math.pow((S[svIndex] ?? 0) / (maxSV || 1), qualityWeight);
            VtkRow[j] = (VtRow[j] ?? 0) * svWeight;
          }
        }

        const compressedMatrix: number[][] = [];
        const qualityEnhancement = opts.quality >= 0.8 ? 1.1 : opts.quality >= 0.6 ? 1.0 : 0.9;
        for (let i = 0; i < matrix.length; i++) {
          compressedMatrix[i] = [];
          const row0 = matrix[0] as number[];
          for (let j = 0; j < row0.length; j++) {
            let sum = 0;
            const Uki = Uk[i] as number[];
            for (let l = 0; l < k; l++) {
              const Vtkl = Vtk[l] as number[];
              sum += (Uki[l] ?? 0) * (Sk[l] ?? 0) * (Vtkl[j] ?? 0);
            }
            const enhancedValue = sum * qualityEnhancement;
            const clampRange = opts.quality >= 0.9 ? 255 : opts.quality >= 0.7 ? 250 : 245;
            const outRow = (compressedMatrix[i] ||= [] as number[]);
            outRow[j] = Math.max(0, Math.min(clampRange, enhancedValue));
          }
        }
        compressedMatrices.push(compressedMatrix);
      }
    }

    // Convert back to image data
    // Apply colorMix (0..1): 0 = grayscale; 1 = full color; blend RGB toward luminance
    let mixedMatrices = compressedMatrices;
    if (compressedMatrices.length === 3 && opts.colorMix < 1) {
      const first = compressedMatrices[0] as number[][] | undefined;
      const height = first?.length ?? 0;
      const width = (first?.[0] as number[] | undefined)?.length ?? 0;
      if (height > 0 && width > 0) {
      // build luminance from current compressed channels
        const Y: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
        for (let i = 0; i < height; i++) {
          const Yi = Y[i] as number[];
          for (let j = 0; j < width; j++) {
            const r = compressedMatrices[0]?.[i]?.[j] ?? 0;
            const g = compressedMatrices[1]?.[i]?.[j] ?? 0;
            const b = compressedMatrices[2]?.[i]?.[j] ?? 0;
            Yi[j] = 0.299 * r + 0.587 * g + 0.114 * b;
          }
        }
        const mix = Math.max(0, Math.min(1, opts.colorMix));
        const outR: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
        const outG: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
        const outB: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));
        for (let i = 0; i < height; i++) {
          const outRi = outR[i] as number[];
          const outGi = outG[i] as number[];
          const outBi = outB[i] as number[];
          const Yi = Y[i] as number[];
          for (let j = 0; j < width; j++) {
            const r = compressedMatrices[0]?.[i]?.[j] ?? 0;
            const g = compressedMatrices[1]?.[i]?.[j] ?? 0;
            const b = compressedMatrices[2]?.[i]?.[j] ?? 0;
            const y = Yi[j] ?? 0;
            outRi[j] = y * (1 - mix) + r * mix;
            outGi[j] = y * (1 - mix) + g * mix;
            outBi[j] = y * (1 - mix) + b * mix;
          }
        }
        mixedMatrices = [outR, outG, outB];
      }
    }
    const compressedImageData = processor.matrixToImageData(mixedMatrices, imageData);
    
    // Create compressed image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = metadata.width;
    canvas.height = metadata.height;
    ctx.putImageData(compressedImageData, 0, 0);

    // Convert to base64 with format preservation and quality optimization (JPEG only)
    const outputFormat = metadata.format.includes('png') ? 'image/png' : 'image/jpeg';
    let quality = 0.9;
    let compressedImage =
      outputFormat === 'image/jpeg'
        ? canvas.toDataURL('image/jpeg', quality)
        : canvas.toDataURL('image/png');
    
    // Optimize file size if needed (JPEG only)
    if (outputFormat === 'image/jpeg') {
      while (compressedImage.length * 0.75 > opts.maxSize && quality > 0.1) {
        quality -= 0.1;
        compressedImage = canvas.toDataURL('image/jpeg', quality);
      }
    }

    // Calculate metrics
    const processingTime = performance.now() - startTime;
    const originalSize = imageFile.size;
    const compressedSize = Math.ceil(compressedImage.length * 0.75);
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    const qualityScore = processor.calculateQuality(imageData, compressedImageData);

    // Calculate reconstruction error (guarded)
    let totalError = 0;
    const channelCount = Math.min(matrices.length, compressedMatrices.length);
    for (let c = 0; c < channelCount; c++) {
      const origC = matrices[c];
      const compC = compressedMatrices[c];
      if (!origC || !compC) continue;
      const h = origC.length;
      const w = (origC[0] as number[] | undefined)?.length ?? 0;
      for (let i = 0; i < h; i++) {
        const origRow = origC[i] as number[] | undefined;
        const compRow = compC[i] as number[] | undefined;
        for (let j = 0; j < w; j++) {
          const diff = (origRow?.[j] ?? 0) - (compRow?.[j] ?? 0);
          totalError += diff * diff;
        }
      }
    }
    const denom = Math.max(1, metadata.width * metadata.height * Math.max(1, channelCount));
    const error = Math.sqrt(totalError / denom);

    const firstS = (Array.isArray(svdResults) && svdResults.length > 0 && Array.isArray(svdResults[0]?.S))
      ? (svdResults[0]!.S as number[])
      : [] as number[];
    return {
      compressedImage,
      singularValues: firstS.slice(0, Math.min(kUsed, firstS.length)),
      originalSize,
      compressedSize,
      rank: kUsed,
      error,
      quality: qualityScore,
      compressionRatio,
      processingTime,
      metadata
    };

  } catch (error) {
    throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get singular values for visualization
export async function getSingularValues(imageFile: File): Promise<{ grayscale: number[]; rgb?: number[][]; metadata: ImageMetadata }> {
  try {
    const processor = new ImageProcessor();
    const { imageData, metadata } = await processor.loadAndNormalize(imageFile, { maxPixels: DEFAULT_PREVIEW_DIM * DEFAULT_PREVIEW_DIM });
    const matrices = processor.imageDataToMatrix(imageData, 'auto');

    // Downscale matrices for quick preview to avoid heavy computation
    const MAX_PREVIEW_DIM = DEFAULT_PREVIEW_DIM;
    const downscaleMatrix = (matrix: number[][], targetMaxDim: number): number[][] => {
      const originalHeight = matrix.length;
      const originalWidth = (matrix[0] as number[] | undefined)?.length ?? 0;
      if (originalHeight === 0 || originalWidth === 0) return matrix;
      const scale = Math.max(originalWidth, originalHeight) / targetMaxDim;
      if (scale <= 1) return matrix; // No downscale needed

      const newWidth = Math.max(1, Math.floor(originalWidth / scale));
      const newHeight = Math.max(1, Math.floor(originalHeight / scale));
      const result: number[][] = Array(newHeight).fill(0).map(() => Array(newWidth).fill(0));

      // Simple area averaging
      for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
          const xStart = Math.floor((x / newWidth) * originalWidth);
          const xEnd = Math.floor(((x + 1) / newWidth) * originalWidth);
          const yStart = Math.floor((y / newHeight) * originalHeight);
          const yEnd = Math.floor(((y + 1) / newHeight) * originalHeight);

          let sum = 0;
          let count = 0;
          for (let yy = yStart; yy < Math.max(yStart + 1, yEnd); yy++) {
            const row = matrix[yy] as number[] | undefined;
            for (let xx = xStart; xx < Math.max(xStart + 1, xEnd); xx++) {
              sum += row?.[xx] ?? 0;
              count++;
            }
          }
          const resRow = result[y] as number[];
          resRow[x] = count > 0 ? sum / count : 0;
        }
      }
      return result;
    };
    
    const results: { grayscale: number[]; rgb?: number[][]; metadata: ImageMetadata } = {
      grayscale: [],
      metadata
    };

    if (matrices.length === 1) {
      // Grayscale
      const baseMatrix = matrices[0] as number[][];
      const small = downscaleMatrix(baseMatrix, MAX_PREVIEW_DIM);
      const width = (small[0] as number[] | undefined)?.length ?? 0;
      const rankCap = Math.max(1, Math.min(80, Math.min(small.length, width)));
      const svd = new RobustSVD(small);
      const { S } = svd.decompose({ rank: rankCap, maxIterations: 40, errorThreshold: 1e-5, algorithm: 'power-iteration' });
      results.grayscale = S.slice(0, rankCap);
    } else {
      // RGB
      results.rgb = [];
      for (const matrix of matrices) {
        const baseMatrix = matrix as number[][];
        const small = downscaleMatrix(baseMatrix, MAX_PREVIEW_DIM);
        const width = (small[0] as number[] | undefined)?.length ?? 0;
        const rankCap = Math.max(1, Math.min(60, Math.min(small.length, width)));
        const svd = new RobustSVD(small);
        const { S } = svd.decompose({ rank: rankCap, maxIterations: 35, errorThreshold: 1e-5, algorithm: 'power-iteration' });
        results.rgb!.push(S.slice(0, rankCap));
      }
      results.grayscale = (results.rgb && results.rgb.length > 0 ? results.rgb[0]! : []);
    }

    return results;

  } catch (error) {
    throw new Error(`Failed to get singular values: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Enhanced utility function to estimate optimal rank based on quality
export function estimateOptimalRank(singularValues: number[], targetQuality: number = 0.8): number {
  if (singularValues.length === 0) return 1;
  
  // Normalize singular values
  const maxSV = Math.max(...singularValues);
  const denom = maxSV || 1;
  const normalizedSVs = singularValues.map(sv => (sv ?? 0) / denom);
  
  // Calculate energy-based rank
  const totalEnergy = normalizedSVs.reduce((sum, val) => sum + (val ?? 0) * (val ?? 0), 0);
  let cumulativeEnergy = 0;
  let energyRank = 1;
  
  for (let i = 0; i < normalizedSVs.length; i++) {
    const vi = normalizedSVs[i] ?? 0;
    cumulativeEnergy += vi * vi;
    if (cumulativeEnergy / totalEnergy >= targetQuality) {
      energyRank = i + 1;
      break;
    }
  }
  
  // Calculate magnitude-based rank (more conservative)
  const magnitudeThreshold = targetQuality * maxSV;
  let magnitudeRank = 1;
  
  for (let i = 0; i < singularValues.length; i++) {
    const svi = singularValues[i] ?? 0;
    if (svi >= magnitudeThreshold) {
      magnitudeRank = i + 1;
    } else {
      break;
    }
  }
  
  // Combine both approaches with quality-based weighting
  const qualityWeight = targetQuality;
  const combinedRank = Math.round(
    energyRank * qualityWeight + magnitudeRank * (1 - qualityWeight)
  );
  
  // Apply quality-based fine-tuning
  let finalRank = combinedRank;
  
  if (targetQuality >= 0.9) {
    // High quality: be more conservative
    finalRank = Math.max(combinedRank, Math.floor(singularValues.length * 0.3));
  } else if (targetQuality <= 0.3) {
    // Low quality: be more aggressive
    finalRank = Math.min(combinedRank, Math.ceil(singularValues.length * 0.1));
  }
  
  // Ensure rank is within bounds
  return Math.max(1, Math.min(singularValues.length, finalRank));
}

// Applies color mixing to reconstructed RGB matrices
function applyColorMix(matrices: number[][][], colorMix: number): number[][][] {
  if (matrices.length !== 3 || colorMix >= 1) {
    return matrices;
  }

  const [rMatrix, gMatrix, bMatrix] = matrices;
  const height = rMatrix.length;
  const width = rMatrix[0]?.length ?? 0;

  if (height === 0 || width === 0) {
    return matrices;
  }

  const mixedR = Array(height).fill(0).map(() => Array(width).fill(0));
  const mixedG = Array(height).fill(0).map(() => Array(width).fill(0));
  const mixedB = Array(height).fill(0).map(() => Array(width).fill(0));

  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const r = rMatrix[i][j];
      const g = gMatrix[i][j];
      const b = bMatrix[i][j];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      
      mixedR[i][j] = luminance * (1 - colorMix) + r * colorMix;
      mixedG[i][j] = luminance * (1 - colorMix) + g * colorMix;
      mixedB[i][j] = luminance * (1 - colorMix) + b * colorMix;
    }
  }

  return [mixedR, mixedG, mixedB];
}

// Utility function to calculate compression efficiency
export function calculateCompressionEfficiency(
  originalSize: number,
  compressedSize: number,
  rank: number,
  totalRank: number
): {
  sizeReduction: number;
  storageEfficiency: number;
  qualityEfficiency: number;
} {
  const sizeReduction = ((originalSize - compressedSize) / originalSize) * 100;
  const storageEfficiency = (compressedSize / originalSize) * 100;
  const qualityEfficiency = (rank / totalRank) * 100;

  return {
    sizeReduction,
    storageEfficiency,
    qualityEfficiency
  };
}

// Precompute truncated SVD factors once (similar to imgsvd behavior)
export async function precomputeSVD(
  imageFile: File,
  options: CompressionOptions = {},
  topK?: number
): Promise<PrecomputedSVD> {
  // Defaults mirroring compressImage (optimized for performance)
  const opts: Required<CompressionOptions> = {
    rank: options.rank || 30, // reduced for faster processing
    quality: options.quality ?? 0.8,
    maxSize: options.maxSize || 5 * 1024 * 1024,
    algorithm: options.algorithm || 'power-iteration',
    colorMode: options.colorMode || 'auto',
    colorMix: options.colorMix ?? 1,
    optimization: options.optimization || 'balanced',
    errorThreshold: options.errorThreshold || 1e-5, // slightly relaxed for speed
    maxIterations: options.maxIterations || 35, // reduced for faster convergence
    engine: options.engine || 'truncated'
  };

  // Check cache first
  const cacheKey = generateCacheKey(imageFile, opts);
  const cached = getCachedSVD(cacheKey);
  if (cached) {
    return cached;
  }

  const processor = new ImageProcessor();
  let imageData: ImageData;
  let loadedMetadata: ImageMetadata;
  try {
    const { imageData, metadata: loadedMetadata } = await processor.loadAndNormalize(imageFile, {
      maxPixels: undefined, // let loadAndNormalize cap to computeDim^2
      extremeAspectThreshold: 2.5
    });
    const metadata: ImageMetadata = {
      ...loadedMetadata,
      width: imageData.width,
      height: imageData.height,
      maxRank: Math.min(imageData.width, imageData.height),
      optimalRank: Math.min(Math.min(imageData.width, imageData.height), Math.floor(Math.min(imageData.width, imageData.height) * 0.1))
    };
 
    const matrices = processor.imageDataToMatrix(imageData, opts.colorMode);
    // Compute only up to requested rank (with a reasonable cap for stability)
    const rankCap = 24; // lower cap for better responsiveness
    const desiredRank = Math.max(1, Math.min(metadata.maxRank, topK ?? opts.rank ?? 30));
    const rankToCompute = Math.min(desiredRank, rankCap);
 
    // Prefer workers for precompute
    const factors: SVDRawResult[] = await runChannelSVDs(matrices, { ...opts, rank: rankToCompute, algorithm: 'power-iteration', maxIterations: Math.min(20, opts.maxIterations) });

    const result: PrecomputedSVD = {
      factors,
      imageData,
      metadata,
      originalFileSize: imageFile.size
    };

    // Cache the result
    setCachedSVD(cacheKey, result);
    
    return result;
  } catch (e) {
    const loaded = await processor.loadAndForceSquare(imageFile, getEnvNumber('NEXT_PUBLIC_LARGE_CROP_SIDE', 1024));
    imageData = loaded.imageData;
    loadedMetadata = loaded.metadata;
  }
  const metadata: ImageMetadata = {
    ...loadedMetadata,
    width: imageData.width,
    height: imageData.height,
    maxRank: Math.min(imageData.width, imageData.height),
    optimalRank: Math.min(Math.min(imageData.width, imageData.height), Math.floor(Math.min(imageData.width, imageData.height) * 0.1))
  };

  const matrices = processor.imageDataToMatrix(imageData, opts.colorMode);
  // Compute only up to requested rank (with a reasonable cap for stability)
  const rankCap = 40; // adjust if needed for quality vs speed
  const desiredRank = Math.max(1, Math.min(metadata.maxRank, topK ?? opts.rank ?? 30));
  const rankToCompute = Math.min(desiredRank, rankCap);

  // Prefer workers for precompute
  const factors: SVDRawResult[] = await runChannelSVDs(matrices, { ...opts, rank: rankToCompute });

  const result: PrecomputedSVD = {
    factors,
    imageData,
    metadata,
    originalFileSize: imageFile.size
  };

  // Cache the result
  setCachedSVD(cacheKey, result);
  
  return result;
}

// Reconstruct from precomputed factors using rank k, producing a full CompressionResult
export async function reconstructFromPrecomputed(
  precomputed: PrecomputedSVD,
  k: number,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = performance.now();
  const opts: Required<CompressionOptions> = {
    rank: options.rank || k || 50,
    quality: options.quality ?? 0.8,
    maxSize: options.maxSize || 5 * 1024 * 1024,
    algorithm: options.algorithm || 'power-iteration',
    colorMode: options.colorMode || 'auto',
    colorMix: options.colorMix ?? 1,
    optimization: options.optimization || 'balanced',
    errorThreshold: options.errorThreshold || 1e-6,
    maxIterations: options.maxIterations || 50,
    engine: options.engine || 'truncated'
  };

  const { factors, imageData, metadata } = precomputed;
  const targetK = Math.max(1, Math.min(metadata.maxRank, k));

  // Ensure we have a valid ImageData to write into and for metrics
  const safeImageData: ImageData = imageData || new ImageData(
    new Uint8ClampedArray(Math.max(1, metadata.width) * Math.max(1, metadata.height) * 4),
    Math.max(1, metadata.width),
    Math.max(1, metadata.height)
  );

  // Reconstruct each channel in parallel via workers
  const compressedMatrices: number[][][] = await runChannelReconstruct(factors, targetK);

  const processor = new ImageProcessor();
  // Apply colorMix blending for reconstructed channels
  const mixedMatrices = applyColorMix(compressedMatrices, opts.colorMix);
  
  // Clamp after colorMix blending for correct range
  const clampedMatrices = mixedMatrices.map((mat) =>
    mat.map((row) => row.map((v) => Math.max(0, Math.min(255, v))))
  );
  const compressedImageData = processor.matrixToImageData(clampedMatrices, safeImageData);

  // Convert to base64 JPEG with size constraint
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = metadata.width;
  canvas.height = metadata.height;
  ctx.putImageData(compressedImageData, 0, 0);

  const outputFormat = metadata.format.includes('png') ? 'image/png' : 'image/jpeg';
  let quality = 0.9;
  let compressedImage =
    outputFormat === 'image/jpeg'
      ? canvas.toDataURL('image/jpeg', quality)
      : canvas.toDataURL('image/png');
  if (outputFormat === 'image/jpeg') {
    while (compressedImage.length * 0.75 > opts.maxSize && quality > 0.1) {
      quality -= 0.1;
      compressedImage = canvas.toDataURL('image/jpeg', quality);
    }
  }

  const processingTime = performance.now() - startTime;
  const originalSize = precomputed.originalFileSize;
  const compressedSize = Math.ceil(compressedImage.length * 0.75);
  const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
  const qualityScore = processor.calculateQuality(safeImageData, compressedImageData);

  // Calculate reconstruction error
  let totalError = 0;
  // Derive original matrices from imageData for error computation
  const originalMatrices = processor.imageDataToMatrix(safeImageData, factors.length === 1 ? 'grayscale' : 'rgb');
  for (let c = 0; c < compressedMatrices.length; c++) {
    const oc = originalMatrices[c] as number[][] | undefined;
    const cc = compressedMatrices[c] as number[][] | undefined;
    if (!oc || !cc) continue;
    const h = oc.length;
    const w = (oc[0] as number[] | undefined)?.length ?? 0;
    for (let i = 0; i < h; i++) {
      const ori = oc[i] as number[] | undefined;
      const cpi = cc[i] as number[] | undefined;
      for (let j = 0; j < w; j++) {
        const diff = (ori?.[j] ?? 0) - (cpi?.[j] ?? 0);
        totalError += diff * diff;
      }
    }
  }
  const error = Math.sqrt(totalError / (metadata.width * metadata.height * Math.max(1, compressedMatrices.length)));

  const firstS = (Array.isArray(factors) && factors.length > 0 && Array.isArray(factors[0]?.S))
    ? (factors[0]!.S as number[])
    : [] as number[];
  return {
    compressedImage,
    singularValues: firstS.slice(0, Math.min(targetK, firstS.length)),
    originalSize,
    compressedSize,
    rank: targetK,
    error,
    quality: qualityScore,
    compressionRatio,
    processingTime,
    metadata
  };
}
