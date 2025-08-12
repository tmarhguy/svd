"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Grid, Eye, EyeOff } from "lucide-react";
import { CompressionResult } from "../utils/svdCompression";

interface MatrixRepresentationProps {
  file: File | null;
  compressionResult: CompressionResult | null;
  singularValues: Record<string, number[]>;
}

interface MatrixData {
  rows: number;
  cols: number;
  type: 'grayscale' | 'rgb';
  channels?: number[][][]; // [R, G, B]
}

export default function MatrixRepresentation({ file, compressionResult }: MatrixRepresentationProps) {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<number>(0); // 0:R,1:G,2:B
  const [viewMode, setViewMode] = useState<'color' | 'numbers'>('color');
  const [palette, setPalette] = useState<'hue' | 'channel'>('hue');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Convert HSV to RGB (0-360, 0-1, 0-1) → [0-255, 0-255, 0-255]
  const hsvToRgb = useCallback((h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const hh = (h % 360) / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r = 0, g = 0, b = 0;
    if (hh >= 0 && hh < 1) [r, g, b] = [c, x, 0];
    else if (hh >= 1 && hh < 2) [r, g, b] = [x, c, 0];
    else if (hh >= 2 && hh < 3) [r, g, b] = [0, c, x];
    else if (hh >= 3 && hh < 4) [r, g, b] = [0, x, c];
    else if (hh >= 4 && hh < 5) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const m = v - c;
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }, []);

  // Load and sample to exactly 256x256 square for consistent visualization
  const loadMatrixData = useCallback(async () => {
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      let sourceObj: CanvasImageSource | null = null;
      let sw = 0, sh = 0;

      // Decode original file
      try {
        if (typeof createImageBitmap === 'function') {
          const bmp = await createImageBitmap(file);
          sourceObj = bmp;
          sw = bmp.width; sh = bmp.height;
        }
      } catch {}

      if (!sourceObj) {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(file!);
        });
        sourceObj = img;
        sw = (sourceObj as HTMLImageElement).width;
        sh = (sourceObj as HTMLImageElement).height;
      }

      const side = Math.max(1, Math.min(sw, sh));
      const cropX = Math.max(0, Math.floor((sw - side) / 2));
      const cropY = Math.max(0, Math.floor((sh - side) / 2));

      const target = 256;
      canvas.width = target;
      canvas.height = target;
      ctx.clearRect(0, 0, target, target);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sourceObj, cropX, cropY, side, side, 0, 0, target, target);

      const imageData = ctx.getImageData(0, 0, target, target);
      const pixels = imageData.data;

      // Build RGB channel matrices
      const rChannel: number[][] = Array.from({ length: target }, () => Array(target).fill(0));
      const gChannel: number[][] = Array.from({ length: target }, () => Array(target).fill(0));
      const bChannel: number[][] = Array.from({ length: target }, () => Array(target).fill(0));

      for (let y = 0; y < target; y++) {
        const rRow = rChannel[y]!;
        const gRow = gChannel[y]!;
        const bRow = bChannel[y]!;
        for (let x = 0; x < target; x++) {
          const idx = (y * target + x) * 4;
          rRow[x] = pixels[idx] ?? 0;
          gRow[x] = pixels[idx + 1] ?? 0;
          bRow[x] = pixels[idx + 2] ?? 0;
        }
      }

      setMatrixData({
        rows: target,
        cols: target,
        type: 'rgb',
        channels: [rChannel, gChannel, bChannel]
      });
    } catch (err) {
      setError('Failed to load image matrix');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [file]);

  useEffect(() => {
    if (showMatrix && file) {
      loadMatrixData();
    }
  }, [showMatrix, file, loadMatrixData]);

  const currentMatrix = useMemo(() => {
    if (!matrixData?.channels) return [] as number[][];
    return matrixData.channels[selectedChannel] || [];
  }, [matrixData, selectedChannel]);

  // Memoize text rows for numbers mode to avoid heavy DOM trees
  const numberRows = useMemo(() => {
    if (!currentMatrix || currentMatrix.length === 0) return [] as string[];
    // Downsample to 128×128 by sampling every 2 pixels for performance
    const stride = 2;
    const out: string[] = [];
    for (let y = 0; y < currentMatrix.length; y += stride) {
      const row = currentMatrix[y] as number[] | undefined;
      if (!row) continue;
      const cells: string[] = [];
      for (let x = 0; x < row.length; x += stride) {
        const v = row[x] ?? 0;
        const n = Number.isFinite(v) ? Math.round(v) : 0;
        cells.push(String(n).padStart(3, ' '));
      }
      out.push(cells.join(' '));
    }
    return out;
  }, [currentMatrix]);

  // Draw full matrix to canvas efficiently
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !matrixData) return;

    if (viewMode !== 'color') {
      // In numbers mode we don't draw the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const rows = matrixData.rows;
    const cols = matrixData.cols;

    // scale factor for visibility: 2px per cell → 512×512 canvas
    const scale = 2;
    canvas.width = cols * scale;
    canvas.height = rows * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    // Render color based on palette selection (hue applies to all pixels)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = (currentMatrix[y]?.[x] ?? 0) | 0;
        let r = 0, g = 0, b = 0;
        if (palette === 'channel') {
          // Color the selected channel by intensity only
          r = selectedChannel === 0 ? v : 0;
          g = selectedChannel === 1 ? v : 0;
          b = selectedChannel === 2 ? v : 0;
        } else {
          // Hue mapping: map value 0..255 to hue 0..360 for all pixels
          const hue = (v / 255) * 360;
          [r, g, b] = hsvToRgb(hue, 1, 1);
        }

        // Fill scale×scale block
        const pxY = y * scale;
        const pxX = x * scale;
        for (let dy = 0; dy < scale; dy++) {
          const rowStart = ((pxY + dy) * canvas.width + pxX) * 4;
          for (let dx = 0; dx < scale; dx++) {
            const i = rowStart + dx * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [matrixData, currentMatrix, selectedChannel, viewMode, palette, hsvToRgb]);

  if (!file) return null;

  const tabClass = (active: boolean) =>
    `px-3 py-1 rounded-md text-sm border ${active ? 'bg-blue-600 border-blue-500 text-white' : 'bg-space-700 border-space-600 text-gray-300 hover:bg-space-600'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center space-x-2">
          <Grid className="w-6 h-6 text-blue-400" />
          <span>Matrix Representation</span>
        </h3>
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className="flex items-center space-x-2 px-4 py-2 bg-space-700 hover:bg-space-600 rounded-lg transition-colors"
        >
          {showMatrix ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>{showMatrix ? 'Hide' : 'Show'} Matrix</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showMatrix && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {loading ? (
              <div className="bg-space-800 p-8 rounded-xl border border-space-700">
                <div className="flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">Loading matrix data...</div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-500/20 p-4 rounded-lg border border-red-500">
                <p className="text-red-300">{error}</p>
              </div>
            ) : matrixData ? (
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                {/* Tabs + View mode */}
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <button className={tabClass(palette==='channel' && selectedChannel===0)} onClick={() => { setPalette('channel'); setSelectedChannel(0); }}>
                      <span className="text-red-400">Red</span>
                    </button>
                    <button className={tabClass(palette==='channel' && selectedChannel===1)} onClick={() => { setPalette('channel'); setSelectedChannel(1); }}>
                      <span className="text-green-400">Green</span>
                    </button>
                    <button className={tabClass(palette==='channel' && selectedChannel===2)} onClick={() => { setPalette('channel'); setSelectedChannel(2); }}>
                      <span className="text-blue-400">Blue</span>
                    </button>
                    <button className={tabClass(palette==='hue')} onClick={() => setPalette('hue')}>Hue</button>
                  </div>

                  {/* Source toggle removed */}

                  <div className="ml-auto flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">View:</span>
                      <button
                        onClick={() => setViewMode(viewMode === 'color' ? 'numbers' : 'color')}
                        className="px-3 py-1 bg-space-700 hover:bg-space-600 border border-space-600 rounded text-sm transition-colors"
                      >
                        {viewMode === 'color' ? 'Show Numbers' : 'Show Colors'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Matrix Display */}
                <div className="overflow-auto max-h-96">
                  <div className="inline-block">
                    <div className="text-xs text-gray-400 mb-2">
                      <span className={palette==='hue' ? 'text-sky-400' : (selectedChannel===0 ? 'text-red-400' : selectedChannel===1 ? 'text-green-400' : 'text-blue-400')}>
                        {palette==='hue' ? 'Hue' : ['Red','Green','Blue'][selectedChannel]}
                      </span>
                      {` `}Matrix (
                        {viewMode === 'color' ? `${matrixData.rows} × ${matrixData.cols}` : `${Math.floor(matrixData.rows/2)} × ${Math.floor(matrixData.cols/2)}`}
                      )
                    </div>
                    {viewMode === 'color' ? (
                      <canvas ref={canvasRef} className="bg-space-900 rounded border border-space-700" />
                    ) : (
                      <pre className="bg-space-900 rounded border border-space-700 p-2 font-mono text-[10px] text-gray-200 overflow-auto max-w-full whitespace-pre">
{numberRows.join('\n')}
                      </pre>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="mt-4 text-sm text-gray-400">
                  <p>
                    Matrix sampled to 256×256 for analysis. Color view renders full 256×256. Numbers view is downsampled to 128×128 for smooth performance.
                  </p>
                  {compressionResult && (
                    <p className="mt-1">
                      SVD Rank: {compressionResult.rank} | Original dimensions: {compressionResult.metadata.width} × {compressionResult.metadata.height}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}