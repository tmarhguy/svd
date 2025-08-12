"use client";

import { useState, useEffect, lazy, Suspense, useCallback, useMemo, memo, useRef } from "react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { Gauge } from "../components/icons";
import { CompressionResult, CompressionOptions, precomputeSVD, reconstructFromPrecomputed, startStatefulCompression, StatefulCompressionSession } from "../utils/svdCompression";
import { useSampleData } from "../hooks/useSampleData";

import DropZone from "../components/DropZone";
import WelcomeSection from "../components/WelcomeSection";
import ErrorBoundary from "../components/ErrorBoundary";

// Lazy load heavy components
const MatrixRepresentation = dynamic(() => import("../components/MatrixRepresentation"), {
  loading: () => <div className="h-96 bg-space-800 animate-pulse rounded-xl" />,
  ssr: false
});

const PerformanceMonitor = dynamic(() => import("../components/PerformanceMonitor"), {
  loading: () => null,
  ssr: false
});

const Quiz = lazy(() => import("../components/Quiz"));
const SVDComputationGuide = lazy(() => import("../components/SVDComputationGuide"));
const CompressionComparison = lazy(() => import("../components/CompressionComparison"));
const WriteupSection = lazy(() => import("../components/WriteupSection"));
const ReferencesSection = lazy(() => import("../components/ReferencesSection"));
const AboutAuthor = lazy(() => import("../components/AboutAuthor"));

// Memoized control panel component
const ControlPanel = memo(({ 
  compressionOptions, 
  onOptionsChange,
  processingProgress,
  loading,
  compressionResult,
  maxRank
}: {
  compressionOptions: CompressionOptions;
  onOptionsChange: (options: CompressionOptions) => void;
  processingProgress: number;
  loading: boolean;
  compressionResult: CompressionResult | null;
  maxRank: number;
}) => {
  const handleRankChange = useCallback((value: number) => {
    onOptionsChange({ ...compressionOptions, rank: value });
  }, [compressionOptions, onOptionsChange]);

  const handleColorMixChange = useCallback((value: number) => {
    onOptionsChange({ ...compressionOptions, colorMix: value / 100 });
  }, [compressionOptions, onOptionsChange]);

  const handleAlgorithmChange = useCallback((value: string) => {
    onOptionsChange({ 
      ...compressionOptions, 
      algorithm: value as 'power-iteration' | 'jacobi' | 'qr-iteration' 
    });
  }, [compressionOptions, onOptionsChange]);

  // Nonlinear slider mapping: stretch [1..pivotRank] over pivotFrac of track
  const pivotRank = Math.min(50, Math.max(2, Math.floor(maxRank * 0.2)));
  const pivotFrac = 0.7; // 70% of track dedicated to low ranks
  const sliderMax = 1000; // high-resolution track for smooth mapping

  const rankToSlider = (rank: number): number => {
    const r = Math.max(1, Math.min(maxRank, Math.floor(rank)));
    if (maxRank <= 1) return 0;
    if (maxRank <= pivotRank) {
      return Math.round(((r - 1) / (maxRank - 1)) * sliderMax);
    }
    if (r <= pivotRank) {
      return Math.round(((r - 1) / (pivotRank - 1)) * pivotFrac * sliderMax);
    }
    return Math.round((pivotFrac + ((r - pivotRank) / (maxRank - pivotRank)) * (1 - pivotFrac)) * sliderMax);
  };

  const sliderToRank = (pos: number): number => {
    const p = Math.max(0, Math.min(1, pos / sliderMax));
    if (maxRank <= 1) return 1;
    if (maxRank <= pivotRank) {
      return Math.max(1, Math.min(maxRank, Math.round(1 + p * (maxRank - 1))));
    }
    if (p <= pivotFrac) {
      const local = p / pivotFrac;
      return Math.max(1, Math.min(pivotRank, Math.round(1 + local * (pivotRank - 1))));
    }
    const local = (p - pivotFrac) / (1 - pivotFrac);
    return Math.max(pivotRank, Math.min(maxRank, Math.round(pivotRank + local * (maxRank - pivotRank))));
  };

  const sliderValue = rankToSlider(compressionOptions.rank || 1);
  const rangeRef = useRef<HTMLInputElement | null>(null);
  const [trackWidth, setTrackWidth] = useState<number>(0);
  useEffect(() => {
    const el = rangeRef.current;
    if (!el) return;
    const update = () => setTrackWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro.disconnect(); window.removeEventListener('resize', update); };
  }, []);

  // Accessible keyboard controls mapped in rank units (not raw slider units)
  const onSliderKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const rankNow = compressionOptions.rank || 1;
      let nextRank: number | null = null;
      const stepSmall = 1;
      const stepMedium = 5;
      const stepLarge = 10;
      const isShift = e.shiftKey;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          nextRank = rankNow - (isCtrlOrMeta ? stepLarge : isShift ? stepMedium : stepSmall);
          break;
        case 'ArrowRight':
        case 'ArrowUp':
          nextRank = rankNow + (isCtrlOrMeta ? stepLarge : isShift ? stepMedium : stepSmall);
          break;
        case 'PageDown':
          nextRank = rankNow - stepLarge;
          break;
        case 'PageUp':
          nextRank = rankNow + stepLarge;
          break;
        case 'Home':
          nextRank = 1;
          break;
        case 'End':
          nextRank = maxRank;
          break;
      }
      if (nextRank != null) {
        e.preventDefault();
        handleRankChange(Math.max(1, Math.min(maxRank, nextRank)));
      }
    },
    [compressionOptions.rank, handleRankChange, maxRank]
  );

  // Build irregular tick marks reflecting the nonlinear scale
  const tickRanks = useMemo(() => {
    const base = [1, 2, 3, 5, 10, 20, 30, 40, 50, 60, 80, 100, 150, 200, 256, 300, 400, 500];
    let ranks = base.filter((r) => r <= maxRank);
    if (!ranks.includes(maxRank)) ranks = [...ranks, maxRank];
    // Deduplicate and sort
    ranks = Array.from(new Set(ranks)).sort((a, b) => a - b);
    return ranks;
  }, [maxRank]);
  const labelRanks = useMemo(() => {
    const minDelta = Math.floor(sliderMax * 0.09); // require ~9% spacing between labels
    let lastPos = -Infinity;
    const out: number[] = [];
    for (const r of tickRanks) {
      if (!(r === 1 || r >= 5)) continue; // hide 2–4 to reduce clutter
      const pos = rankToSlider(r);
      if (out.length === 0 || pos - lastPos >= minDelta) {
        out.push(r);
        lastPos = pos;
      }
    }
    // Ensure last label (maxRank) is included even if spacing is tight
    if (!out.includes(maxRank)) out.push(maxRank);
    return out;
  }, [tickRanks, maxRank]);

  return (
    <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
      <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Gauge className="w-5 h-5 text-blue-400" />
        <span>Compression Controls</span>
      </h3>
      
      <div className="space-y-4">
        {/* Rank Control */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Rank (k = {compressionOptions.rank})
            </span>
            <span className="text-xs text-gray-400">
              Lower = More Compression
            </span>
          </label>
          <input
            ref={rangeRef}
            type="range"
            min={0}
            max={sliderMax}
            step={1}
            value={sliderValue}
            onChange={(e) => handleRankChange(sliderToRank(parseInt(e.target.value)))}
            onKeyDown={onSliderKeyDown}
            aria-label="Rank (k)"
            aria-valuemin={1}
            aria-valuemax={maxRank}
            aria-valuenow={compressionOptions.rank}
            aria-valuetext={`k = ${compressionOptions.rank}`}
            list="rank-ticks"
            className="w-full rounded-lg appearance-none cursor-pointer slider"
          />
          <datalist id="rank-ticks">
            {tickRanks.map((r) => (
              <option key={r} value={rankToSlider(r)} label={String(r)} />
            ))}
          </datalist>
          <div className="relative h-4 mt-1 select-none">
            {labelRanks.map((r) => (
              <span
                key={`label-${r}`}
                className="absolute text-[10px] text-gray-500"
                style={{
                  left: trackWidth
                    ? `${(rankToSlider(r) / sliderMax) * trackWidth + (r === 10 ? 8 : 0)}px`
                    : `${(rankToSlider(r) / sliderMax) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Color Mix Control */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Grayscale to Color ({Math.round((compressionOptions.colorMix ?? 1) * 100)}%)
            </span>
            <span className="text-xs text-gray-400">
              Visual Fidelity
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={(compressionOptions.colorMix ?? 1) * 100}
            onChange={(e) => handleColorMixChange(parseInt(e.target.value))}
            className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Algorithm Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Algorithm
          </label>
          <select
            value={compressionOptions.algorithm || 'power-iteration'}
            onChange={(e) => handleAlgorithmChange(e.target.value)}
            className="w-full px-3 py-2 bg-space-700 border border-space-600 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="power-iteration">Power Iteration (Fast)</option>
            <option value="jacobi">Jacobi (Balanced)</option>
            <option value="qr-iteration">QR Iteration (Accurate)</option>
          </select>
        </div>

        {/* Performance note */}
        <p className="text-xs text-gray-500 mt-2">
          Tip: Smaller images (lower resolution) process and update faster. Large uploads may be downscaled for responsiveness.
        </p>

        {/* Progress Indicator removed */}

        {/* Compression Stats */}
        {compressionResult && !loading && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-space-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Number.isFinite(compressionResult.compressionRatio) ? Math.round(compressionResult.compressionRatio) : 0}%
              </div>
              <div className="text-xs text-gray-400">Compression</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round((compressionOptions.colorMix ?? 1) * 100)}%
              </div>
              <div className="text-xs text-gray-400">Color</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    rank: 30,
    quality: 0.8,
    colorMix: 1,
    algorithm: 'power-iteration',
    colorMode: 'auto',
    optimization: 'balanced',
    maxSize: 5 * 1024 * 1024,
    errorThreshold: 1e-5,
    maxIterations: 35
  });
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const sessionRef = useRef<StatefulCompressionSession | null>(null);
  const previousCompressedUrlRef = useRef<string>("");
  // Track processing time for uploaded images (stateful path)
  const uploadStartTimeRef = useRef<number | null>(null);
  const uploadMeasuredRef = useRef<boolean>(false);
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const previousOriginalUrlRef = useRef<string>("");
  const [originalAspect, setOriginalAspect] = useState<number>(1);
  
  // Simple fallback - only if sample data failed to load
  // Note: depends on sampleLoading/sampleData/sampleError, so declare after hook

  // Track original image aspect ratio
  useEffect(() => {
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        if (img.width > 0 && img.height > 0) {
          setOriginalAspect(img.width / img.height);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } catch {}
  }, [file]);

  // Stable object URL for original image to prevent flicker on re-renders
  useEffect(() => {
    if (!file) {
      // Cleanup when file is cleared
      if (previousOriginalUrlRef.current) {
        try { URL.revokeObjectURL(previousOriginalUrlRef.current); } catch {}
      }
      setOriginalUrl("");
      previousOriginalUrlRef.current = "";
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    const prev = previousOriginalUrlRef.current;
    setOriginalUrl(nextUrl);
    previousOriginalUrlRef.current = nextUrl;
    if (prev) {
      try { URL.revokeObjectURL(prev); } catch {}
    }
    return () => {
      if (previousOriginalUrlRef.current) {
        try { URL.revokeObjectURL(previousOriginalUrlRef.current); } catch {}
        previousOriginalUrlRef.current = "";
      }
    };
  }, [file]);
  const [singularValues, setSingularValues] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  // Progress ring removed
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [precomputed, setPrecomputed] = useState<{
    factors: { U: number[][]; S: number[]; Vt: number[][] }[];
    imageData: ImageData;
    metadata: { width: number; height: number; channels: number; format: string; colorSpace: 'grayscale' | 'rgb' | 'rgba'; maxRank: number; optimalRank: number };
    originalFileSize: number;
  } | null>(null);

  // Load sample data
  const { 
    sampleData, 
    loading: sampleLoading, 
    error: sampleError,
    getSampleFile,
    getPrecomputedResult,
    getSingularValues,
    getPrecomputedData
  } = useSampleData();
  // Simple fallback - only if sample data failed to load
  useEffect(() => {
    if (isClient && !file && isDefaultImage && !sampleLoading && (!sampleData || sampleError)) {
      const loadSimpleSample = async () => {
        try {
          console.log('🔄 Loading simple sample fallback...');
          const response = await fetch('/ghanaimage.jpg');
          if (response.ok) {
            const blob = await response.blob();
            const sampleFile = new File([blob], 'ghanaimage.jpg', { type: 'image/jpeg' });
            setFile(sampleFile);
            setCompressedUrl("");
            console.log('✅ Simple sample loaded');
          }
        } catch (err) {
          console.error('❌ Error loading simple sample:', err);
        }
      };
      loadSimpleSample();
    }
  }, [isClient, file, isDefaultImage, sampleLoading, sampleData, sampleError]);

  // Project Information
  const projectInfo = useMemo(() => ({
    student: "Tyrone Marhguy",
    course: "MATH 3120 - Numerical Linear Algebra",
    project: "SVD Image Compression",
    instructor: "Maxine Calle",
    semester: "Fall 2024",
    university: "University of Pennsylvania"
  }), []);
  // Compute dynamic max rank with a responsiveness cap
  const dynamicMaxRank = useMemo(() => {
    const fromMeta = compressionResult?.metadata?.maxRank ?? precomputed?.metadata?.maxRank ?? 256;
    return Math.max(1, Math.min(1024, Math.floor(fromMeta)));
  }, [compressionResult?.metadata?.maxRank, precomputed?.metadata?.maxRank]);


  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoized compression handler
  const handleCompression = useCallback(async (imageFile: File, options: CompressionOptions) => {
    setLoading(true);
    setError("");
    // Start timing for uploaded image processing
    uploadStartTimeRef.current = performance.now();
    uploadMeasuredRef.current = false;

    // progress ring removed

    try {
      // Prefer new stateful pipeline with streaming updates
      sessionRef.current?.dispose();
      sessionRef.current = await startStatefulCompression(imageFile, options.rank || 30, (update) => {
        setCompressedUrl(update.imageUrl);
        // Continuously feed the performance monitor with size info as frames stream in
        setCompressionResult((prev) => prev ? {
          ...prev,
          compressedImage: update.imageUrl,
          compressedSize: Math.ceil(update.imageUrl.length * 0.75),
          compressionRatio: Math.max(0, Math.min(100, ((imageFile.size - Math.ceil(update.imageUrl.length * 0.75)) / Math.max(1, imageFile.size)) * 100)),
          quality: prev.quality || 0,
        } : {
          compressedImage: update.imageUrl,
          singularValues: [],
          originalSize: imageFile.size,
          compressedSize: Math.ceil(update.imageUrl.length * 0.75),
          rank: options.rank || 30,
          error: 0,
          quality: 0,
          compressionRatio: Math.max(0, Math.min(100, ((imageFile.size - Math.ceil(update.imageUrl.length * 0.75)) / Math.max(1, imageFile.size)) * 100)),
          processingTime: 0,
          metadata: { width: update.width, height: update.height, channels: 3, format: imageFile.type || 'image/jpeg', colorSpace: 'rgb', maxRank: Math.min(update.width, update.height), optimalRank: Math.min(Math.min(update.width, update.height), Math.floor(Math.min(update.width, update.height) * 0.1)) }
        });
        setSingularValues({
          red: update.singularValues.red,
          green: update.singularValues.green,
          blue: update.singularValues.blue,
        });
        // When the exact (non-approximate) frame arrives for the first time, record final processing time
        if (!update.isApproximation && !uploadMeasuredRef.current && uploadStartTimeRef.current != null) {
          uploadMeasuredRef.current = true;
          const elapsed = performance.now() - uploadStartTimeRef.current;
          setCompressionResult((prev) => prev ? { ...prev, processingTime: elapsed } : prev);
        }
      }, options.colorMix ?? 1);
      // progress ring removed
      // Also set a summary CompressionResult-like object for metrics panel using current image
      setCompressionResult((prev) => prev ? { ...prev, compressedImage: compressedUrl, rank: options.rank || 30 } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed");
      console.error("Compression error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Revoke old blob URLs to avoid memory leaks
  useEffect(() => {
    const previous = previousCompressedUrlRef.current;
    if (previous && previous !== compressedUrl) {
      try { URL.revokeObjectURL(previous); } catch {}
    }
    if (compressedUrl) {
      previousCompressedUrlRef.current = compressedUrl;
    }
    return () => {
      if (previousCompressedUrlRef.current) {
        try { URL.revokeObjectURL(previousCompressedUrlRef.current); } catch {}
      }
    };
  }, [compressedUrl]);

  // Initialize with sample data when available
  useEffect(() => {
    console.log('🎯 Sample initialization effect:', { 
      hasSampleData: !!sampleData, 
      hasFile: !!file, 
      isDefaultImage, 
      sampleLoading,
      sampleError 
    });
    
    if (sampleData && !file && isDefaultImage) {
      const initializeSample = async () => {
        try {
          console.log('🚀 Initializing sample...');
          
          // Load the sample file
          const sampleFile = await getSampleFile();
          console.log('📁 Sample file loaded:', !!sampleFile);
          
          if (sampleFile) {
            setFile(sampleFile);
            const sizesMatch = !!sampleData && typeof sampleData.metadata?.originalSize === 'number' && sampleData.metadata.originalSize === sampleFile.size;
            if (sizesMatch) {
              // Use precomputed only if it matches current default image
              const precomputedData = getPrecomputedData();
              if (precomputedData) {
                setPrecomputed(precomputedData);
                const result = await reconstructFromPrecomputed(precomputedData, compressionOptions.rank || 30, compressionOptions);
                setCompressionResult(result);
                setCompressedUrl(result.compressedImage);
              } else {
                setCompressedUrl("");
              }
              const singularVals = getSingularValues();
              if (singularVals.red && singularVals.green && singularVals.blue) {
                setSingularValues(singularVals);
              }
            } else {
              console.warn('⚠️ Sample JSON does not match current default image; computing fresh.');
              setPrecomputed(null);
              setCompressionResult(null);
              setSingularValues({});
              setCompressedUrl("");
              await handleCompression(sampleFile, compressionOptions);
            }
            
            console.log('✅ Sample initialization complete');
          }
        } catch (err) {
          console.error('❌ Error initializing sample:', err);
        }
      };
      
      initializeSample();
    }
  }, [sampleData, file, isDefaultImage, compressionOptions, getSampleFile, getPrecomputedResult, getSingularValues, getPrecomputedData, sampleLoading, sampleError, handleCompression]);

  // Duplicate definition removed (see single definition above)

  // Handle file drop
  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    const imageFile = acceptedFiles[0];
    if (!imageFile) return;

    // Reset all relevant states for a new image
    setFile(imageFile);
    setIsDefaultImage(false);
    setPrecomputed(null);
    setCompressionResult(null);
    setSingularValues({});
    setCompressedUrl(''); // Clear previous compressed image
    setError('');

    // Immediately trigger compression for the new file
    await handleCompression(imageFile, compressionOptions);
  }, [compressionOptions, handleCompression]);

  // Unified options change handler with debouncing
  const handleOptionsChange = useCallback((newOptions: CompressionOptions) => {
    setCompressionOptions(newOptions);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      // Route updates through stateful session if available
      const rank = newOptions.rank || 30;
      const colorMix = newOptions.colorMix ?? 1;
      if (sessionRef.current) {
        sessionRef.current.setRank(rank);
        // @ts-ignore expose setColorMix via session
        (sessionRef.current as any).setColorMix?.(colorMix);
        return;
      }
      // Fallback to legacy path
      setLoading(true);
      try {
        if (precomputed) {
          const result = await reconstructFromPrecomputed(precomputed, rank, newOptions);
          // Preserve initial processingTime so it doesn't change on each slider move for default image
          setCompressionResult((prev) => {
            const preservedTime = prev?.processingTime ?? result.processingTime;
            return { ...result, processingTime: preservedTime };
          });
          setCompressedUrl(result.compressedImage);
        } else if (file) {
          await handleCompression(file, newOptions);
        }
      } catch (err) {
        console.error("Compression/Reconstruction error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during image processing.");
      } finally {
        setLoading(false);
      }
    }, isDefaultImage ? 50 : 250);
  }, [file, precomputed, isDefaultImage, handleCompression]);

  // Cleanup session on unmount or when file changes
  useEffect(() => {
    return () => {
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, []);

  // Treat default-image operations like non-blocking (no visible processing ring/state)
  const effectiveLoading = loading && !isDefaultImage;


  return (
    <ErrorBoundary>
      <main className="min-h-screen">
        {/* Welcome Section */}
        <WelcomeSection />

        {/* Interactive Demo Section */}
        <section id="demo" className="py-12 sm:py-20 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
                Interactive SVD Compression
              </h2>
              <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the power of Singular Value Decomposition in real-time. 
                Upload an image or use our default to see how mathematical decomposition 
                can achieve impressive compression ratios while preserving visual quality.
              </p>
                      </div>
                      
                        {/* File Upload Area */}
            <div className="mb-6 sm:mb-8">
              <DropZone onFile={(file) => handleFileDrop([file])} />
              
              {/* Show sample loading status */}
              {isClient && sampleLoading && !file && (
                <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-300">
                  Loading sample image and data...
                          </div>
                        )}
                        
              {isClient && sampleError && (
                <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-300">
                  Could not load sample data: {sampleError}
                          </div>
                        )}
              
              {isClient && error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                  {error}
                        </div>
                      )}

                            {/* Sample indicator removed */}
              
              {!isDefaultImage && file && sampleData && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      // Stop any active streaming session from the uploaded image to avoid overwriting state
                      try { sessionRef.current?.dispose(); } catch {}
                      sessionRef.current = null;
                      const sampleFile = await getSampleFile();
                      if (sampleFile) {
                        setFile(sampleFile);
                        setIsDefaultImage(true);
                          const rankNow = compressionOptions.rank || 30;
                          const result = getPrecomputedResult(rankNow);
                          const precomputedData = getPrecomputedData();
                          if (result) {
                            setCompressionResult(result);
                            setCompressedUrl(result.compressedImage);
                          } else if (precomputedData) {
                            try {
                              const reconstructed = await reconstructFromPrecomputed(precomputedData, rankNow, compressionOptions);
                              setCompressionResult(reconstructed);
                              setCompressedUrl(reconstructed.compressedImage);
                              setPrecomputed(precomputedData);
                            } catch {}
                          }
                        const singularVals = getSingularValues();
                        if (singularVals.red && singularVals.green && singularVals.blue) {
                          setSingularValues(singularVals);
                        }
                          if (precomputedData) {
                            setPrecomputed(precomputedData);
                          }
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Back to Default Image
                  </button>
                      </div>
                )}
                </div>

            {/* Debug Info removed */}

            {/* Compression Interface */}
            {file && (
              <div className="space-y-6 sm:space-y-8">
                {/* Top horizontal bar: Controls + Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                  <ControlPanel
                    compressionOptions={compressionOptions}
                    onOptionsChange={handleOptionsChange}
                    loading={effectiveLoading}
                    compressionResult={compressionResult}
                    maxRank={dynamicMaxRank}
                  />
                  {isClient && (
                    <PerformanceMonitor
                      isProcessing={effectiveLoading}
                      metrics={compressionResult && compressionResult.metadata ? (() => {
                        const actualCompression = Number.isFinite(compressionResult.compressionRatio)
                          ? compressionResult.compressionRatio
                          : 0;
                        return {
                          processingTime: Math.max(1, compressionResult.processingTime),
                          memoryUsage: compressionResult.compressedSize,
                          cpuUsage: 0,
                          compressionRatio: Math.max(0, Math.min(100, actualCompression)),
                          qualityScore: compressionResult.quality,
                          originalSize: compressionResult.originalSize,
                          compressedSize: compressionResult.compressedSize,
                        };
                      })() : null}
                      colorMix={compressionOptions.colorMix ?? 1}
                    />
                  )}
                </div>

                {/* Image Comparison (now larger, full-width) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                  {/* Original Image */}
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 h-full">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">Original</h3>
                    <div className="relative rounded-lg overflow-hidden bg-black/50" style={{ paddingTop: `${100 / Math.max(0.0001, originalAspect)}%` }}>
                      {isClient && originalUrl && (
                        <NextImage
                          src={originalUrl}
                          alt="Original"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                  </div>

                  {/* Compressed Image */}
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 h-full">
                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center">
                      Compressed (k={compressionOptions.rank})
                    </h3>
                    <div className="relative rounded-lg overflow-hidden bg-black/50" style={{ paddingTop: `${100 / Math.max(0.0001, originalAspect)}%` }}>
                      {compressedUrl && (
                        <NextImage
                          src={compressedUrl}
                          alt="Compressed"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Matrix Representation */}
            {file && !effectiveLoading && (
              <div className="mt-8 sm:mt-12">
                <MatrixRepresentation
                  file={file}
                  compressionResult={compressionResult}
                  singularValues={singularValues}
                  displayAspect={originalAspect}
                />
              </div>
            )}

            {/* Writeup: moved directly after Matrix */}
            <Suspense fallback={<div className="h-72 sm:h-96 bg-space-800 animate-pulse rounded-xl" />}>
              <div className="mt-8 sm:mt-12">
                <WriteupSection />
              </div>
            </Suspense>
        </div>
        </section>

        {/* Educational Content - Lazy Loaded */}
        <Suspense fallback={<div className="h-96 bg-space-900 animate-pulse" />}>
          <section className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-space-900 to-space-800">
            <div className="max-w-7xl mx-auto">
        <CompressionComparison 
          originalSize={compressionResult?.originalSize ?? null}
          compressedSize={compressionResult?.compressedSize ?? null}
          compressionRatio={compressionResult?.compressionRatio ?? null}
          quality={compressionResult?.quality ?? null}
          rank={compressionOptions.rank ?? null}
          width={compressionResult?.metadata?.width ?? null}
          height={compressionResult?.metadata?.height ?? null}
        />
              <SVDComputationGuide />
          </div>
        </section>
        </Suspense>

        {/* Interactive Content */}
        <Suspense fallback={<div className="h-96 bg-space-800 animate-pulse" />}>
          <section className="py-12 sm:py-20 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto">
              <Quiz />
          </div>
        </section>
        </Suspense>

        {/* Footer Content */}
        <Suspense fallback={null}>
          <footer className="py-12 sm:py-20 px-4 sm:px-6 bg-gradient-to-t from-space-950 to-space-900">
            <div className="max-w-7xl mx-auto">
              <ReferencesSection />
          <AboutAuthor />
              
              {/* Project Info */}
              <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-space-800 text-center text-xs sm:text-sm text-gray-400">
                <p>
                  {projectInfo.project} by {projectInfo.student}
                </p>
                <p className="mt-1">
                  {projectInfo.course} • {projectInfo.semester} • {projectInfo.university}
            </p>
          </div>
        </div>
      </footer>
        </Suspense>
      </main>
    </ErrorBoundary>
  );
}
