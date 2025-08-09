"use client";

import { motion } from "framer-motion";
import { FileImage, Archive, TrendingDown, Zap, ArrowRight, CheckCircle } from "lucide-react";

interface CompressionMetric {
  label: string;
  original: string;
  compressed: string;
  improvement: string;
  color: string;
}

const compressionMetrics: CompressionMetric[] = [
  {
    label: "File Size",
    original: "65 KB",
    compressed: "15 KB",
    improvement: "77% reduction",
    color: "text-green-400"
  },
  {
    label: "Storage Values",
    original: "65,536",
    compressed: "15,630",
    improvement: "76% fewer values",
    color: "text-blue-400"
  },
  {
    label: "Quality Retention",
    original: "100%",
    compressed: "95%",
    improvement: "5% loss",
    color: "text-purple-400"
  },
  {
    label: "Processing Speed",
    original: "Slow",
    compressed: "Fast",
    improvement: "3x faster",
    color: "text-orange-400"
  }
];

export default function CompressionComparison() {
  return (
    <section className="mb-12">
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 neon-text">Image Compression Comparison</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how SVD compression dramatically reduces file size while preserving visual quality
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* SVG Visualization */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
              <div className="relative w-full h-80">
                <img 
                  src="/slides/assets/svg/compression-comparison.svg" 
                  alt="Compression Comparison" 
                  className="w-full h-full object-contain"
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
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                <Archive className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200">Compression Analysis</h3>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-4">
              {compressionMetrics.map((metric, index) => (
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
                      <div className="text-sm text-gray-400 mb-1">Original</div>
                      <div className="text-lg font-bold text-red-400">{metric.original}</div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-full flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-1">Compressed</div>
                      <div className="text-lg font-bold text-green-400">{metric.compressed}</div>
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
              className="bg-gradient-to-br from-green-500/20 to-blue-500/20 p-4 rounded-lg border border-green-500/30"
            >
              <h4 className="font-semibold text-green-400 mb-3 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5" />
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
          className="mt-8 bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600"
        >
          <h3 className="text-xl font-bold text-center mb-4 text-blue-400">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold text-red-400 mb-2">Decompose</h4>
              <p className="text-gray-400">Break image into U, Σ, Vᵀ components</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold text-yellow-400 mb-2">Truncate</h4>
              <p className="text-gray-400">Keep only the most important singular values</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
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
