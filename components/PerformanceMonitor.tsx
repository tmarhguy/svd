"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Clock, Zap, TrendingUp } from "lucide-react";

interface PerformanceMetrics {
  processingTime: number;
  memoryUsage: number;
  cpuUsage: number;
  compressionRatio: number;
  qualityScore: number;
}

interface PerformanceMonitorProps {
  isProcessing: boolean;
  metrics: PerformanceMetrics | null;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export default function PerformanceMonitor({ 
  isProcessing, 
  metrics, 
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`;
  };

  const formatProcessingTime = (ms: number) => {
    // Handle both cases: elapsed time (large ms) and processing result (could be smaller)
    if (ms >= 1000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      return `${ms.toFixed(2)}ms`;
    }
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

  const performanceScore = useMemo(() => {
    if (!metrics) return 0;
    
    const timeScore = Math.max(0, 100 - (metrics.processingTime / 1000) * 10);
    const qualityScore = metrics.qualityScore * 100;
    const compressionScore = metrics.compressionRatio;
    
    return Math.round((timeScore + qualityScore + compressionScore) / 3);
  }, [metrics]);

  return (
    <AnimatePresence>
      {(isProcessing || metrics) && (
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Processing Time */}
            <div className="text-center p-3 bg-space-900/50 rounded-lg">
              <div className="flex justify-center mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-blue-400">
                {isProcessing ? formatTime(elapsedTime) : (metrics?.processingTime ? formatProcessingTime(metrics.processingTime) : '0.00ms')}
              </div>
              <div className="text-xs text-gray-400">Processing Time</div>
            </div>

            {/* Memory Usage */}
            {metrics && (
              <div className="text-center p-3 bg-space-900/50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-lg font-bold text-yellow-400">
                  {formatBytes(metrics.memoryUsage)}
                </div>
                <div className="text-xs text-gray-400">Memory Usage</div>
              </div>
            )}

            {/* Compression Ratio */}
            {metrics && (
              <div className="text-center p-3 bg-space-900/50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className={`text-lg font-bold ${getPerformanceColor(metrics.compressionRatio, 80)}`}>
                  {metrics.compressionRatio.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Compression</div>
              </div>
            )}

            {/* Quality Score */}
            {metrics && (
              <div className="text-center p-3 bg-space-900/50 rounded-lg">
                <div className="flex justify-center mb-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <div className={`text-lg font-bold ${getPerformanceColor(metrics.qualityScore * 100, 90)}`}>
                  {(metrics.qualityScore * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-400">Quality</div>
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
