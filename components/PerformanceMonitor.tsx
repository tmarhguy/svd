"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, Zap, TrendingUp, HardDrive, Archive } from "lucide-react";

interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  compressionRatio: number;
  qualityScore: number;
  originalSize?: number;
  compressedSize?: number;
}

interface PerformanceMonitorProps {
  isProcessing: boolean;
  metrics: PerformanceMetrics | null;
  colorMix?: number; // 0..1 grayscale↔color control from UI
}

export default function PerformanceMonitor({ 
  isProcessing, 
  metrics,
  colorMix = 1,
}: PerformanceMonitorProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [cachedMetrics, setCachedMetrics] = useState<PerformanceMetrics | null>(null);

  // Track processing time
  useEffect(() => {
    if (isProcessing && !startTime) {
      setStartTime(Date.now());
      setElapsedTime(0);
    } else if (!isProcessing && startTime) {
      setStartTime(null);
    }
  }, [isProcessing, startTime]);

  // Update elapsed time
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime]);

  // Persist last known non-null metrics so the panel stays populated between uploads
  useEffect(() => {
    if (metrics) setCachedMetrics(metrics);
  }, [metrics]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  const formatProcessingTime = (ms: number) => {
    if (ms <= 0 || !Number.isFinite(ms)) return '…';
    return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(2)}ms`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value >= threshold * 0.8) return "text-green-400";
    if (value >= threshold * 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const shown = metrics ?? cachedMetrics;

  const performanceScore = useMemo(() => {
    if (!shown) return 0;
    const timeScore = Math.max(0, 100 - (shown.processingTime / 1000) * 10);
    const qualityScore = shown.qualityScore * 100;
    const compressionScore = shown.compressionRatio;
    return Math.round((timeScore + qualityScore + compressionScore) / 3);
  }, [shown]);

  return (
    <AnimatePresence>
      {(isProcessing || shown) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Performance Monitor</span>
            </h3>
            {performanceScore > 0 && (
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className={`text-sm font-semibold ${getPerformanceColor(performanceScore, 100)}`}>
                  {performanceScore}/100
                </span>
              </div>
            )}
          </div>

           <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* Processing Time */}
            <div className="text-center p-3 bg-space-900/50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
               <div className="text-lg font-bold text-blue-400">
                 {isProcessing ? formatTime(elapsedTime) : (shown?.processingTime ? formatProcessingTime(shown.processingTime) : '0.00ms')}
              </div>
              <div className="text-xs text-gray-400">Processing Time</div>
            </div>

            {/* Memory Usage */}
             {shown && (
              <div className="text-center p-3 bg-space-900/50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                 <div className="text-lg font-bold text-yellow-400">
                   {formatBytes(shown.memoryUsage)}
                </div>
                <div className="text-xs text-gray-400">Memory Usage</div>
              </div>
            )}

            {/* Compression Ratio */}
             {shown && (
              <div className="text-center p-3 bg-space-900/50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                 <div className={`text-lg font-bold ${getPerformanceColor(shown.compressionRatio, 80)}`}>
                   {Math.round(shown.compressionRatio)}%
                </div>
                <div className="text-xs text-gray-400">Compression</div>
              </div>
            )}

              {/* Color Mix (replaces Quality) */}
              <div className="text-center p-3 bg-space-900/50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div className={`text-lg font-bold ${getPerformanceColor(colorMix * 100, 90)}`}>
                  {Math.round(colorMix * 100)}%
                </div>
                <div className="text-xs text-gray-400">Color</div>
              </div>

              {/* Original Size */}
              {shown?.originalSize != null && (
                <div className="text-center p-3 bg-space-900/50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <HardDrive className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="text-lg font-bold text-cyan-400">
                    {formatBytes(shown.originalSize)}
                  </div>
                  <div className="text-xs text-gray-400">Original Size</div>
                </div>
              )}

              {/* Compressed Size */}
              {(shown?.compressedSize != null || shown?.memoryUsage != null) && (
                <div className="text-center p-3 bg-space-900/50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    <Archive className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="text-lg font-bold text-teal-400">
                    {formatBytes(shown?.compressedSize ?? shown!.memoryUsage)}
                  </div>
                  <div className="text-xs text-gray-400">Compressed Size</div>
                </div>
              )}
          </div>

          {/* Real-time progress bar */}
          {isProcessing && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Processing...</span>
                <span>{formatProcessingTime(elapsedTime)}</span>
              </div>
              <div className="w-full bg-space-900 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(95, (elapsedTime / 5000) * 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}