"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Brain, Calculator, Database, Zap, Target, BookOpen, Code, BarChart3, Lightbulb, CheckCircle, AlertCircle, Grid3X3, Palette, Binary, Layers, Ruler, Image as ImageIcon } from "lucide-react";

export default function WriteupSection() {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: Brain },
    { id: "image", label: "What is an Image?", icon: ImageIcon },
    { id: "mathematics", label: "Mathematics", icon: Calculator },
    { id: "implementation", label: "Implementation", icon: Code },
    { id: "deepdive", label: "Deep Dive", icon: BookOpen },
    { id: "results", label: "Results", icon: BarChart3 },
    { id: "applications", label: "Applications", icon: Target }
  ];

  return (
    <section className="mb-16">
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 neon-text">How Computers See: SVD Image Compression</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A comprehensive exploration of Singular Value Decomposition for image compression, 
            combining mathematical rigor with practical implementation.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                    : "bg-space-700 text-gray-300 hover:bg-space-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Sections */}
        <div className="min-h-[600px]">
          {activeTab === "image" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <Grid3X3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-blue-400">Pixels as a Matrix</h3>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Grayscale images can be represented as a matrix A ∈ ℝ^(m×n). Each entry Aᵢⱼ is a brightness value (often 0–255 for 8-bit).
                  </p>
                  <div className="mt-3 bg-gray-800 p-3 rounded">
                    <span className="font-mono text-green-300 text-sm">A = [aᵢⱼ] ∈ ℝ^(m×n)</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                      <Palette className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-400">RGB: Three Matrices</h3>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Color images store Red, Green, and Blue channels separately. The displayed color is a combination of these values per pixel.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-red-500/20 rounded border border-red-500/30">Red</div>
                    <div className="text-center p-2 bg-green-500/20 rounded border border-green-500/30">Green</div>
                    <div className="text-center p-2 bg-blue-500/20 rounded border border-blue-500/30">Blue</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                      <Binary className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-yellow-400">Bit Depth</h3>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    8-bit per channel uses integers in [0, 255]. Higher bit depths allow finer gradations. We normalize to [0, 1] for stability.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Layers className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-purple-400">In Memory</h3>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    Pixel buffers are typically row-major (e.g., Uint8ClampedArray). RGB may be interleaved (RGBRGB...) or planar (RR.. GG.. BB..).
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl">
                    <Ruler className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-blue-400">Resolution & Aspect Ratio</h3>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">
                  Resolution is width × height in pixels. Aspect ratio is width/height. We preserve aspect ratio in the side-by-side comparison.
                </p>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                    <ImageIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-cyan-400">Why SVD Works for Images</h3>
                </div>
                <ul className="text-sm text-gray-300 list-disc list-inside space-y-2">
                  <li>Natural images have local correlation; energy concentrates in a few singular values.</li>
                  <li>Rank-k approximations capture dominant structures with far fewer numbers.</li>
                  <li>Channel-wise SVD is simple and effective for compression.</li>
                </ul>
              </div>
            </motion.div>
          )}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-400 flex items-center space-x-2">
                    <Lightbulb className="w-6 h-6" />
                    <span>The Problem</span>
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    Modern images contain millions of pixels, making storage and transmission expensive. 
                    However, images are highly structured - local regions are correlated, smooth areas dominate 
                    over high-frequency noise, and edges are sparse.
                  </p>
                  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 rounded-lg border border-red-500/30">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-400 mb-2">The Challenge</h4>
                        <p className="text-sm text-gray-300">
                          Can we approximate an image with a much smaller representation while keeping it visually faithful?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-green-400 flex items-center space-x-2">
                    <Target className="w-6 h-6" />
                    <span>My Solution</span>
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    We use a clean linear-algebraic approach: treat the image as a matrix and compress it with low rank. 
                    The Singular Value Decomposition (SVD) provides a mathematically optimal way to achieve this.
                  </p>
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-4 rounded-lg border border-green-500/30">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-green-400 mb-2">The Approach</h4>
                        <p className="text-sm text-gray-300">
                          SVD factors any matrix into orthonormal directions and singular values that quantify structure.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Storage Efficiency</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Achieve up to 90% compression while preserving visual quality
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Mathematical Rigor</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Provably optimal in Frobenius norm (Eckart–Young theorem)
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Real-time Processing</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Interactive compression with instant visual feedback
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "mathematics" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-purple-400">SVD Fundamentals</h3>
                  
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <h4 className="text-lg font-semibold text-blue-400 mb-3">The Decomposition</h4>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                      <span className="font-mono text-blue-300 text-lg">A = U Σ Vᵀ</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-3">
                      Where U and V are orthonormal matrices, and Σ contains the singular values σ₁ ≥ σ₂ ≥ ... ≥ σᵣ
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <h4 className="text-lg font-semibold text-green-400 mb-3">Rank-k Approximation</h4>
                    <div className="bg-gray-800 p-4 rounded-lg text-center">
                      <span className="font-mono text-green-300 text-lg">Aₖ = Uₖ Σₖ Vₖᵀ</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-3">
                      Keep only the top k singular values and vectors
                    </p>
                    <details className="mt-3 text-sm text-gray-400">
                      <summary className="cursor-pointer text-gray-200">Energy captured by top-k</summary>
                      <div className="mt-2 bg-gray-800 p-3 rounded">
                        <p className="font-mono text-green-300">E(k) = (∑ᵢ₌₁ᵏ σᵢ²) / (∑ᵢ₌₁ʳ σᵢ²)</p>
                        <p className="mt-2">Choose k so that E(k) ≥ 0.9–0.99 depending on desired fidelity.</p>
                      </div>
                    </details>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-orange-400">Optimality Results</h3>
                  
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-3">Eckart–Young Theorem</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Among all rank-k matrices B, the truncated SVD Aₖ uniquely minimizes the approximation error:
                    </p>
                    <div className="bg-gray-800 p-4 rounded-lg text-center mt-3">
                      <span className="font-mono text-yellow-300 text-sm">‖A - Aₖ‖_F = min ‖A - B‖_F</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <h4 className="text-lg font-semibold text-red-400 mb-3">Error Analysis</h4>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      The error is exactly the sum of squared singular values beyond k:
                    </p>
                    <div className="bg-gray-800 p-4 rounded-lg text-center mt-3">
                      <span className="font-mono text-red-300 text-sm">‖A - Aₖ‖_F² = Σᵢ₌ₖ₊₁ σᵢ²</span>
                    </div>
                    <details className="mt-3 text-sm text-gray-400">
                      <summary className="cursor-pointer text-gray-200">SVD vs. PCA</summary>
                      <p className="mt-2">For mean-centered data matrix X, PCA is obtained from SVD(X) with principal components in V and variances σᵢ²/(n−1). For images, applying SVD channel-wise is equivalent to PCA on pixel columns/rows.</p>
                    </details>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Storage & Compression Math</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="bg-gray-800 p-4 rounded-lg mb-3">
                      <span className="font-mono text-blue-300">Original: m × n</span>
                    </div>
                    <p className="text-sm text-gray-400">Raw storage</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-800 p-4 rounded-lg mb-3">
                      <span className="font-mono text-green-300">Compressed: k(m+n+1)</span>
                    </div>
                    <p className="text-sm text-gray-400">SVD storage</p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gray-800 p-4 rounded-lg mb-3">
                      <span className="font-mono text-purple-300">Ratio: mn/k(m+n+1)</span>
                    </div>
                    <p className="text-sm text-gray-400">Compression ratio</p>
                  </div>
                </div>
                <details className="mt-4 text-sm text-gray-400">
                  <summary className="cursor-pointer text-gray-200">Computational notes</summary>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Full SVD costs O(m n min(m,n)). For images we often use truncated or randomized SVD.</li>
                    <li>Color images: apply SVD per-channel or in a decorrelated space (e.g., YCbCr/YCgCo) and compress chroma more.</li>
                    <li>Quantization can further reduce storage after truncation.</li>
                  </ul>
                </details>
              </div>
            </motion.div>
          )}

          {activeTab === "implementation" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-400">My Interactive Pipeline</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                      <div>
                        <h4 className="font-semibold text-blue-400">Upload & Preprocess</h4>
                        <p className="text-sm text-gray-400">Decode image, normalize to [0,1], optionally downscale</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                      <div>
                        <h4 className="font-semibold text-green-400">Compute SVD</h4>
                        <p className="text-sm text-gray-400">Parallel processing for RGB channels</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                      <div>
                        <h4 className="font-semibold text-purple-400">Interactive Reconstruction</h4>
                        <p className="text-sm text-gray-400">Real-time rank-k approximation</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">4</div>
                      <div>
                        <h4 className="font-semibold text-orange-400">Visual Comparison</h4>
                        <p className="text-sm text-gray-400">Side-by-side original vs compressed</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-green-400">Technical Features</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                      <h4 className="font-semibold text-blue-400 mb-2">Web Workers</h4>
                      <p className="text-sm text-gray-400">Parallel SVD computation for RGB channels</p>
                      <details className="mt-2 text-sm text-gray-400">
                        <summary className="cursor-pointer text-gray-200">Why it matters</summary>
                        <p className="mt-1">Heavy linear algebra runs off the main thread to keep the UI responsive. Rank changes reuse precomputed factors, so updates are instant.</p>
                      </details>
                    </div>
                    
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                      <h4 className="font-semibold text-green-400 mb-2">Caching Strategy</h4>
                      <p className="text-sm text-gray-400">Store U, Σ, Vᵀ for instant rank changes</p>
                      <details className="mt-2 text-sm text-gray-400">
                        <summary className="cursor-pointer text-gray-200">Reconstruction</summary>
                        <p className="mt-1">We compute Aₖ = Uₖ Σₖ Vₖᵀ quickly by slicing cached factors; no need to recompute SVD for each slider move.</p>
                      </details>
                    </div>
                    
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                      <h4 className="font-semibold text-purple-400 mb-2">Adaptive Processing</h4>
                      <p className="text-sm text-gray-400">Auto-downscaling for large images</p>
                      <details className="mt-2 text-sm text-gray-400">
                        <summary className="cursor-pointer text-gray-200">Color handling</summary>
                        <p className="mt-1">Grayscale and color mixing happen consistently across original/uploaded images to avoid hue shifts.</p>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "deepdive" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-blue-400">Geometric Intuition</h3>
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <p className="text-sm text-gray-300 leading-relaxed">
                      SVD rotates the input basis to directions of maximal variance (columns of V), scales by singular values (Σ),
                      then rotates to the output basis (columns of U). Truncating small σᵢ removes fine detail/noise first.
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <h4 className="text-lg font-semibold text-green-400 mb-2">Choosing k</h4>
                    <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                      <li>Energy rule: pick smallest k with E(k) ≥ threshold (e.g., 95%).</li>
                      <li>Knee detection: look for elbow in singular value decay.</li>
                      <li>Task-driven: tune k for PSNR/SSIM target rather than fixed percent.</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-purple-400">Algorithms & Variants</h3>
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-2">Randomized SVD (high-level)</h4>
                    <ol className="text-sm text-gray-400 list-decimal list-inside space-y-1">
                      <li>Project A to a low-dimensional subspace with a random matrix Ω.</li>
                      <li>Orthogonalize Y = AΩ to get Q.</li>
                      <li>Compute SVD of the small matrix B = QᵀA, then map back: A ≈ Q (Ū Σ Vᵀ).</li>
                    </ol>
                    <p className="text-xs text-gray-500 mt-2">Gives near-optimal low-rank approximations with far less compute on large matrices.</p>
                  </div>
                  <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                    <h4 className="text-lg font-semibold text-red-400 mb-2">Limitations</h4>
                    <ul className="text-sm text-gray-400 list-disc list-inside space-y-1">
                      <li>Global low-rank may struggle with textures or sharp, repeated patterns.</li>
                      <li>Color bleeding if channels are compressed very differently.</li>
                      <li>Not entropy-coded by itself; consider pairing with quantization/zip.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <h3 className="text-xl font-bold text-green-400 mb-3">Practical Tips</h3>
                <ul className="text-sm text-gray-300 list-disc list-inside space-y-2">
                  <li>Normalize image data to [0,1] and handle color channels consistently.</li>
                  <li>Precompute SVD once per image; reuse factors for slider interactions.</li>
                  <li>Cap compute resolution (e.g., 256×256) for interactivity; upscale display separately if needed.</li>
                  <li>Use web workers to avoid blocking the main thread.</li>
                </ul>
              </div>
            </motion.div>
          )}

          {activeTab === "results" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-blue-400">Performance Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600 text-center">
                      <div className="text-2xl font-bold text-green-400">83%</div>
                      <div className="text-sm text-gray-400">Compression Ratio</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600 text-center">
                      <div className="text-2xl font-bold text-blue-400">~50ms</div>
                      <div className="text-sm text-gray-400">Reconstruction Time</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600 text-center">
                      <div className="text-2xl font-bold text-purple-400">95%</div>
                      <div className="text-sm text-gray-400">Quality Retention</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600 text-center">
                      <div className="text-2xl font-bold text-orange-400">3x</div>
                      <div className="text-sm text-gray-400">Speed Improvement</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-green-400">Quality Analysis</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                      <h4 className="font-semibold text-blue-400 mb-2">PSNR Comparison</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Original</span>
                          <span className="text-green-400">∞ dB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Rank-50</span>
                          <span className="text-blue-400">32.5 dB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Rank-20</span>
                          <span className="text-orange-400">28.1 dB</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                      <h4 className="font-semibold text-purple-400 mb-2">Storage Efficiency</h4>
                      <p className="text-sm text-gray-400">
                        For a 600×600 image with rank-50: 360,000 → 60,050 values (83% reduction)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "applications" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Educational Tool</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Perfect for teaching linear algebra concepts with visual feedback
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                      <Database className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Image Compression</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Efficient storage for large image datasets
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Noise Reduction</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Remove noise by dropping small singular values
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Fast Previews</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Generate low-rank previews for quick browsing
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Data Analysis</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Dimensionality reduction for large datasets
                  </p>
                </div>

                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-center mb-2">Machine Learning</h4>
                  <p className="text-sm text-gray-400 text-center">
                    Feature extraction and preprocessing
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <h3 className="text-xl font-bold text-blue-400 mb-4">Course Connections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-green-400 mb-2">Linear Algebra</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Orthogonal projections and bases</li>
                      <li>• Matrix decompositions</li>
                      <li>• Norms and error analysis</li>
                      <li>• Spectral theory</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-400 mb-2">Numerical Methods</h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• SVD algorithms</li>
                      <li>• Computational complexity</li>
                      <li>• Numerical stability</li>
                      <li>• Parallel processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}


