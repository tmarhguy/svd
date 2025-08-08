"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Grid3X3, Eye, EyeOff, ZoomIn, ZoomOut } from "lucide-react";

interface MatrixRepresentationProps {
  file: File | null;
  compressionResult: any;
  singularValues: any;
}

interface MatrixData {
  width: number;
  height: number;
  data: number[][];
  type: 'grayscale' | 'rgb';
  channels?: number[][][];
}

export default function MatrixRepresentation({ file, compressionResult, singularValues }: MatrixRepresentationProps) {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<number>(0); // 0: R, 1: G, 2: B
  const [viewMode, setViewMode] = useState<'color' | 'numbers'>('color');

  useEffect(() => {
    if (!file) {
      setMatrixData(null);
      return;
    }

    const loadMatrixData = async () => {
      setLoading(true);
      setError("");

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();

        img.onload = () => {
          try {
            // Limit size for performance
            const maxSize = 100;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            const scaledWidth = Math.floor(img.width * scale);
            const scaledHeight = Math.floor(img.height * scale);

            canvas.width = scaledWidth;
            canvas.height = scaledHeight;
            ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

             const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
             const data: Uint8ClampedArray = imageData.data;

            // Check if grayscale
            let isGrayscale = true;
            for (let i = 0; i < data.length; i += 4) {
              if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) {
                isGrayscale = false;
                break;
              }
            }

            if (isGrayscale) {
              // Grayscale matrix
              const matrix: number[][] = [];
              for (let y = 0; y < scaledHeight; y++) {
                const row: number[] = [];
                for (let x = 0; x < scaledWidth; x++) {
                  const idx = (y * scaledWidth + x) * 4;
                  row.push(data[idx] ?? 0); // Use red channel for grayscale
                }
                matrix[y] = row;
              }

              setMatrixData({
                width: scaledWidth,
                height: scaledHeight,
                data: matrix,
                type: 'grayscale'
              });
            } else {
              // RGB matrices
              const redMatrix: number[][] = [];
              const greenMatrix: number[][] = [];
              const blueMatrix: number[][] = [];

              for (let y = 0; y < scaledHeight; y++) {
                const rRow: number[] = [];
                const gRow: number[] = [];
                const bRow: number[] = [];
                for (let x = 0; x < scaledWidth; x++) {
                  const idx = (y * scaledWidth + x) * 4;
                  rRow.push(data[idx] ?? 0);
                  gRow.push(data[idx + 1] ?? 0);
                  bRow.push(data[idx + 2] ?? 0);
                }
                redMatrix[y] = rRow;
                greenMatrix[y] = gRow;
                blueMatrix[y] = bRow;
              }

              setMatrixData({
                width: scaledWidth,
                height: scaledHeight,
                data: redMatrix, // Use red channel as primary
                type: 'rgb',
                channels: [redMatrix, greenMatrix, blueMatrix]
              });
            }

          } catch (err) {
            setError("Failed to process image data");
            console.error("Matrix processing error:", err);
          } finally {
            setLoading(false);
          }
        };

        img.onerror = () => {
          setError("Failed to load image");
          setLoading(false);
        };

        img.src = URL.createObjectURL(file);

      } catch (err) {
        setError("Failed to process image");
        setLoading(false);
        console.error("Matrix loading error:", err);
      }
    };

    loadMatrixData();
  }, [file]);

  const getPixelColor = (value: number) => {
    const intensity = Math.floor((value / 255) * 100);
    return `rgb(${intensity}%, ${intensity}%, ${intensity}%)`;
  };

  const getRGBColor = (r: number, g: number, b: number) => {
    return `rgb(${r}, ${g}, ${b})`;
  };

  const formatValue = (value: number) => {
    return value.toString().padStart(3, ' ');
  };

  if (!file || !matrixData) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Grid3X3 className="w-5 h-5" />
          <span>Matrix Representation</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="flex items-center space-x-2 px-3 py-1 bg-space-700 hover:bg-space-600 rounded-lg transition-colors text-sm"
          >
            {showMatrix ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showMatrix ? 'Hide' : 'Show'} Matrix</span>
          </button>
          {showMatrix && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                className="p-1 bg-space-700 hover:bg-space-600 rounded transition-colors"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="text-xs text-gray-400 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.2))}
                className="p-1 bg-space-700 hover:bg-space-600 rounded transition-colors"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Processing matrix...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {matrixData && showMatrix && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {/* Matrix Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-2 bg-space-700 rounded-lg">
              <div className="text-lg font-bold text-blue-400">{matrixData.width}</div>
              <div className="text-xs text-gray-400">Width</div>
            </div>
            <div className="text-center p-2 bg-space-700 rounded-lg">
              <div className="text-lg font-bold text-green-400">{matrixData.height}</div>
              <div className="text-xs text-gray-400">Height</div>
            </div>
            <div className="text-center p-2 bg-space-700 rounded-lg">
              <div className="text-lg font-bold text-purple-400">{matrixData.type}</div>
              <div className="text-xs text-gray-400">Type</div>
            </div>
            <div className="text-center p-2 bg-space-700 rounded-lg">
              <div className="text-lg font-bold text-orange-400">{matrixData.channels ? 3 : 1}</div>
              <div className="text-xs text-gray-400">Channels</div>
            </div>
          </div>

          {/* Matrix Display */}
          <div className="overflow-auto border border-space-600 rounded-lg bg-space-900">
            <div 
              className="p-4"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
            >
              {/* Unified top controls: View mode (left), Channels (center), View mode (right) */}
              <div className="flex items-center justify-between gap-2 mb-3 flex-wrap" aria-label="Matrix controls">
                {/* View mode group (left) */}
                <div className="flex items-center gap-2" role="tablist" aria-label="View mode left">
                  {['Color', 'Numbers'].map((label, idx) => (
                    <button
                      key={`vm-left-${label}`}
                      role="tab"
                      aria-selected={(viewMode === 'color' ? 0 : 1) === idx}
                      onClick={() => setViewMode(idx === 0 ? 'color' : 'numbers')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors border ${
                        (viewMode === 'color' ? 0 : 1) === idx
                          ? 'bg-space-600 border-space-500 text-white'
                          : 'bg-space-700 hover:bg-space-600 border-space-600 text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Channel group (center) - only for RGB */}
                {matrixData.type === 'rgb' && (
                  <div className="flex items-center gap-2" role="tablist" aria-label="Color channels">
                    {['Red', 'Green', 'Blue'].map((label, idx) => (
                      <button
                        key={`ch-${label}`}
                        role="tab"
                        aria-selected={selectedChannel === idx}
                        onClick={() => setSelectedChannel(idx)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors border ${
                          selectedChannel === idx
                            ? 'bg-space-600 border-space-500 text-white'
                            : 'bg-space-700 hover:bg-space-600 border-space-600 text-gray-300'
                        }`}
                      >
                        <span className={idx === 0 ? 'text-red-400' : idx === 1 ? 'text-green-400' : 'text-blue-400'}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* View mode group (right) */}
                <div className="flex items-center gap-2" role="tablist" aria-label="View mode right">
                  {['Color', 'Numbers'].map((label, idx) => (
                    <button
                      key={`vm-right-${label}`}
                      role="tab"
                      aria-selected={(viewMode === 'color' ? 0 : 1) === idx}
                      onClick={() => setViewMode(idx === 0 ? 'color' : 'numbers')}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors border ${
                        (viewMode === 'color' ? 0 : 1) === idx
                          ? 'bg-space-600 border-space-500 text-white'
                          : 'bg-space-700 hover:bg-space-600 border-space-600 text-gray-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {matrixData.type === 'grayscale' ? (
                 <div className="inline-block">
                  {matrixData.data?.map((row, y) => (
                    <div key={y} className="flex">
                       {row?.map((value, x) => (
                        <div
                          key={`${x}-${y}`}
                          className={`border border-space-600 flex items-center justify-center font-mono ${viewMode === 'numbers' ? 'w-6 h-6 text-[9px] leading-none text-white bg-space-800' : 'w-6 h-6 text-xs'}`}
                          style={viewMode === 'color' ? { backgroundColor: getPixelColor(value) } : undefined}
                          title={`Pixel (${x}, ${y}): ${value}`}
                        >
                          {viewMode === 'numbers' ? (
                            <span>{Math.round(value)}</span>
                          ) : (
                            <span className="text-black font-bold">{value > 127 ? '█' : '░'}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Channel Matrix */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-300">
                      {['Red', 'Green', 'Blue'][selectedChannel]} Channel
                    </h4>
                    <div className="inline-block">
                      {matrixData.channels![selectedChannel]?.map((row, y) => (
                        <div key={y} className="flex">
                          {row.map((value, x) => (
                            <div
                              key={`${x}-${y}`}
                              className={`border border-space-600 flex items-center justify-center font-mono ${viewMode === 'numbers' ? 'w-6 h-6 text-[9px] leading-none text-white bg-space-800' : 'w-6 h-6 text-xs'}`}
                              style={
                                viewMode === 'color'
                                  ? {
                                      backgroundColor:
                                        selectedChannel === 0
                                          ? `rgb(${value}, 0, 0)`
                                          : selectedChannel === 1
                                          ? `rgb(0, ${value}, 0)`
                                          : `rgb(0, 0, ${value})`
                                    }
                                  : undefined
                              }
                              title={`${['Red','Green','Blue'][selectedChannel]} (${x}, ${y}): ${value}`}
                            >
                              {viewMode === 'numbers' ? (
                                <span>{Math.round(value)}</span>
                              ) : (
                                <span className="text-black font-bold">{value > 127 ? '█' : '░'}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Matrix Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {matrixData.type === 'grayscale' ? (
              <>
                <div className="text-center p-2 bg-space-700 rounded-lg">
                  <div className="text-lg font-bold text-blue-400">
                    {Math.round(matrixData.data.flat().reduce((a, b) => a + b, 0) / matrixData.data.flat().length)}
                  </div>
                  <div className="text-xs text-gray-400">Avg Value</div>
                </div>
                <div className="text-center p-2 bg-space-700 rounded-lg">
                  <div className="text-lg font-bold text-green-400">
                    {Math.max(...matrixData.data.flat())}
                  </div>
                  <div className="text-xs text-gray-400">Max Value</div>
                </div>
                <div className="text-center p-2 bg-space-700 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">
                    {Math.min(...matrixData.data.flat())}
                  </div>
                  <div className="text-xs text-gray-400">Min Value</div>
                </div>
                <div className="text-center p-2 bg-space-700 rounded-lg">
                  <div className="text-lg font-bold text-orange-400">
                    {matrixData.data.flat().filter(v => v > 127).length}
                  </div>
                  <div className="text-xs text-gray-400">Bright Pixels</div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center p-2 bg-space-700 rounded-lg">
                  <div className={`text-lg font-bold ${selectedChannel === 0 ? 'text-red-400' : selectedChannel === 1 ? 'text-green-400' : 'text-blue-400'}`}>
                    {Math.round(
                      (matrixData.channels![selectedChannel]?.flat().reduce((a, b) => (a || 0) + (b || 0), 0) || 0) /
                        (matrixData.channels![selectedChannel]?.flat().length || 1)
                    )}
                  </div>
                  <div className="text-xs text-gray-400">Avg {['Red','Green','Blue'][selectedChannel]}</div>
                </div>
                <div className="text-center p-2 bg-space-700 rounded-lg">
                  <div className="text-lg font-bold text-purple-400">
                    {matrixData.width * matrixData.height}
                  </div>
                  <div className="text-xs text-gray-400">Total Pixels</div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
