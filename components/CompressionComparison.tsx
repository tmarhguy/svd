"use client";

import { useMemo } from "react";
import NextImage from "next/image";
import { motion } from "framer-motion";
import { FileImage, Archive, TrendingDown, Zap, ArrowRight, CheckCircle } from "lucide-react";

interface CompressionComparisonProps {
  originalSize: number | null;
  compressedSize: number | null;
  compressionRatio: number | null; // percent
  quality?: number | null; // 0..1
  rank?: number | null;
  width?: number | null;
  height?: number | null;
}

interface CompressionMetric {
  label: string;
  original: string;
  compressed: string;
  improvement: string;
  color: string;
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val >= 100 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)} ${sizes[i]}`;
}

//

export default function CompressionComparison({
  originalSize,
  compressedSize,
  compressionRatio,
  quality,
  rank,
  width,
  height,
}: CompressionComparisonProps) {
  const metrics = useMemo<CompressionMetric[]>(() => {
    // File size metric based on actual sizes
    const fileSizeMetric: CompressionMetric = {
      label: "File Size",
      original: formatBytes(originalSize),
      compressed: formatBytes(compressedSize),
      improvement:
        compressionRatio != null && Number.isFinite(compressionRatio)
          ? `${Math.max(0, Math.min(100, compressionRatio)).toFixed(0)}% reduction`
          : "—",
      color: "text-green-400",
    };

    // Storage values metric (theoretical) if dims and rank available
    let storageMetric: CompressionMetric = {
      label: "Storage Values",
      original: "—",
      compressed: "—",
      improvement: "—",
      color: "text-blue-400",
    };
    if (
      width != null && height != null && rank != null &&
      Number.isFinite(width) && Number.isFinite(height) && Number.isFinite(rank)
    ) {
      const m = Math.max(1, Math.floor(height!));
      const n = Math.max(1, Math.floor(width!));
      const kNow = Math.max(1, Math.min(Math.floor(rank!), Math.min(m, n)));
      const originalVals = m * n;
      const compressedVals = kNow * (1 + m + n);
      const fewer = Math.max(0, 100 * (1 - compressedVals / Math.max(1, originalVals)));
      storageMetric = {
        label: "Storage Values",
        original: originalVals.toLocaleString(),
        compressed: compressedVals.toLocaleString(),
        improvement: `${fewer.toFixed(0)}% fewer values`,
        color: "text-blue-400",
      };
    }

    // Quality retention metric from actual quality (0..1)
    const q = quality != null && Number.isFinite(quality) ? Math.max(0, Math.min(1, quality!)) : null;
    const qualityMetric: CompressionMetric = {
      label: "Quality Retention",
      original: "100%",
      compressed: q != null ? `${(q * 100).toFixed(0)}%` : "—",
      improvement: q != null ? `${(100 - q * 100).toFixed(0)}% loss` : "—",
      color: "text-purple-400",
    };

    return [fileSizeMetric, storageMetric, qualityMetric];
  }, [originalSize, compressedSize, compressionRatio, quality, rank, width, height]);
  return (
    <section className="mb-12">
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 sm:p-8 rounded-xl border border-space-700">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 neon-text">Image Compression Comparison</h2>
          <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto">
            See how SVD compression dramatically reduces file size while preserving visual quality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* SVG Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 sm:p-6 rounded-xl border border-space-600">
              <div className="relative w-full h-64 sm:h-80">
                <NextImage
                  src="/slides/assets/svg/compression-comparison.svg"
                  alt="Compression Comparison"
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority={false}
                />
              </div>
            </div>
          </motion.div>

          {/* Compression Analysis */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                <Archive className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-200">Compression Analysis</h3>
            </div>

            {/* Metrics Grid (live) */}
            <div className="grid grid-cols-1 gap-4">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-300">{metric.label}</h4>
                    <div className="flex items-center space-x-2">
                      <ArrowRight className="w-4 h-4 text-green-400" />
                      <span className={`text-sm font-semibold ${metric.color}`}>
                        {metric.improvement}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-400 mb-1">Original</div>
                      <div className="text-base sm:text-lg font-bold text-red-400">{metric.original}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-400 mb-1">Compressed</div>
                      <div className="text-base sm:text-lg font-bold text-green-400">{metric.compressed}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Key Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gradient-to-br from-green-500/20 to-blue-500/20 p-3 sm:p-4 rounded-lg border border-green-500/30"
            >
              <h4 className="font-semibold text-green-400 mb-3 flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Key Benefits</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-300">Faster loading times</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileImage className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">Reduced storage costs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">Preserved visual quality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Archive className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-300">Efficient transmission</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6 sm:mt-8 bg-gradient-to-br from-space-800 to-space-700 p-5 sm:p-6 rounded-xl border border-space-600"
        >
          <h3 className="text-lg sm:text-xl font-bold text-center mb-3 sm:mb-4 text-blue-400">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 text-sm">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold text-red-400 mb-2">Decompose</h4>
              <p className="text-gray-400">Break image into U, Σ, Vᵀ components</p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold text-yellow-400 mb-2">Truncate</h4>
              <p className="text-gray-400">Keep only the most important singular values</p>
            </div>
            
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold text-green-400 mb-2">Reconstruct</h4>
              <p className="text-gray-400">Rebuild image with reduced data</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
