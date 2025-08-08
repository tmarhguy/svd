"use client";

import { motion } from "framer-motion";
import { Calculator, Palette, TrendingUp, Lightbulb, ArrowRight, CheckCircle, Code, BarChart3, Square } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  formula?: string;
  details?: string[];
  mathematicalNote?: string;
}

const computationSteps: Step[] = [
  {
    id: 1,
    title: "Form AᵀA Matrix",
    description: "Create the symmetric matrix AᵀA (n×n) with non-negative eigenvalues",
    formula: "AᵀA = (A^T) × A",
    details: ["Symmetric matrix", "Non-negative eigenvalues", "n×n dimensions"],
    mathematicalNote: "AᵀA is always symmetric and positive semi-definite, ensuring real, non-negative eigenvalues"
  },
  {
    id: 2,
    title: "Compute Eigenvalues & Eigenvectors",
    description: "Find eigenvalues λ and eigenvectors of AᵀA; singular values are σ = √λ",
    formula: "σᵢ = √λᵢ",
    details: ["Eigenvalues sorted descending", "Singular values = √(eigenvalues)", "Eigenvectors form V"],
    mathematicalNote: "The singular values σᵢ are the square roots of the eigenvalues of AᵀA, sorted in descending order"
  },
  {
    id: 3,
    title: "Build V Matrix",
    description: "Construct V from normalized eigenvectors; Vᵀ is its transpose",
    formula: "V = [v₁ | v₂ | ... | vₙ]",
    details: ["Normalized eigenvectors", "Orthonormal columns", "Vᵀ = V transpose"],
    mathematicalNote: "V contains the right singular vectors as columns, forming an orthonormal basis"
  },
  {
    id: 4,
    title: "Create Σ Matrix",
    description: "Place singular values σ on the diagonal, pad with zeros to match A's size",
    formula: "Σ = diag(σ₁, σ₂, ..., σᵣ, 0, ..., 0)",
    details: ["Diagonal matrix", "Singular values on diagonal", "Zeros for padding"],
    mathematicalNote: "Σ is a diagonal matrix with singular values on the main diagonal, padded with zeros to match A's dimensions"
  },
  {
    id: 5,
    title: "Compute U Matrix",
    description: "Calculate columns of U from A vᵢ = σᵢ uᵢ and normalize",
    formula: "uᵢ = (A vᵢ) / σᵢ",
    details: ["Normalize each column", "Orthonormal basis", "Left singular vectors"],
    mathematicalNote: "U contains the left singular vectors, computed from the relationship A vᵢ = σᵢ uᵢ"
  },
  {
    id: 6,
    title: "Assemble & Truncate",
    description: "Form A = U Σ Vᵀ and optionally truncate to rank k",
    formula: "Aₖ = Uₖ Σₖ Vₖᵀ",
    details: ["Full decomposition", "Rank-k truncation", "Optimal approximation"],
    mathematicalNote: "The rank-k approximation Aₖ is the optimal rank-k approximation in Frobenius norm (Eckart-Young theorem)"
  }
];

const colorProcessingInfo = [
  {
    title: "Per-Channel Processing",
    description: "Apply SVD separately to R, G, B channels for independent compression",
    details: ["Independent compression per channel", "Channel-specific quality control", "RGB space processing"],
    advantages: ["Simple implementation", "Independent optimization", "Easy to understand"]
  },
  {
    title: "Luminance/Chrominance",
    description: "Transform to YCbCr space for better energy concentration",
    details: ["Y: luminance channel (most important)", "Cb, Cr: chrominance channels", "Energy concentration in Y"],
    advantages: ["Better compression ratios", "Perceptually meaningful", "Industry standard"]
  },
  {
    title: "Error Analysis",
    description: "Monitor quality vs. compression trade-offs systematically",
    details: ["Rapid improvement for small k", "Diminishing returns for larger k", "Channel structure importance"],
    advantages: ["Quantitative quality assessment", "Optimal rank selection", "Performance prediction"]
  }
];

export default function SVDComputationGuide() {
  return (
    <section className="mb-16">
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold mb-4 neon-text">How to Compute an SVD</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A comprehensive guided walkthrough of the step-by-step SVD computation process with mathematical insights
          </p>
        </div>

        {/* Mathematical Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-8 bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Square className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-200">Mathematical Foundation</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">The SVD Decomposition</h4>
              <div className="bg-gray-800 p-4 rounded-lg mb-3">
                <span className="font-mono text-green-300 text-lg">A = U Σ Vᵀ</span>
              </div>
              <p className="text-sm text-gray-300">
                Where U and V are orthonormal matrices, and Σ is diagonal with singular values σ₁ ≥ σ₂ ≥ ... ≥ σᵣ
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-green-400 mb-2">Key Properties</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>U and V are orthonormal (UᵀU = I, VᵀV = I)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>Σ contains non-negative singular values</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                  <span>Rank(A) = number of non-zero singular values</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Computation Steps */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-200">Computation Steps</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {computationSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 hover:border-space-500 transition-all duration-300"
              >
                {/* Step Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.id}
                  </div>
                  <h4 className="text-lg font-semibold text-blue-400">{step.title}</h4>
                </div>

                {/* Step Description */}
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  {step.description}
                </p>

                {/* Formula */}
                {step.formula && (
                  <div className="bg-gray-800 p-3 rounded-lg mb-3">
                    <span className="font-mono text-green-300 text-sm">{step.formula}</span>
                  </div>
                )}

                {/* Details */}
                {step.details && (
                  <div className="space-y-1 mb-3">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-400" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mathematical Note */}
                {step.mathematicalNote && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-3 rounded-lg border border-blue-500/30">
                    <p className="text-xs text-blue-300 italic">{step.mathematicalNote}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Color Images & Error Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200">Color Image Processing</h3>
            </div>

            <div className="space-y-4">
              {colorProcessingInfo.map((info, index) => (
                <div key={index} className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                  <h4 className="font-semibold text-green-400 mb-2">{info.title}</h4>
                  <p className="text-sm text-gray-300 mb-3">{info.description}</p>
                  <div className="space-y-1 mb-3">
                    {info.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs text-gray-400">
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                  {info.advantages && (
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-2 rounded border border-green-500/30">
                      <p className="text-xs text-green-300 font-semibold mb-1">Advantages:</p>
                      <ul className="space-y-1">
                        {info.advantages.map((advantage, idx) => (
                          <li key={idx} className="text-xs text-green-300">• {advantage}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-200">Error Analysis & Insights</h3>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                <h4 className="font-semibold text-purple-400 mb-2">Error Curves</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Typically show rapid improvement for small k, then diminishing returns
                </p>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <span>Rapid improvement for small k</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-3 h-3 text-orange-400" />
                    <span>Diminishing returns for larger k</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                <h4 className="font-semibold text-orange-400 mb-2">Quality Insights</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Retaining only small σ yields poor quality until many σ are included
                </p>
                <div className="space-y-2 text-xs text-gray-400">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="w-3 h-3 text-yellow-400" />
                    <span>Largest σ dominate quality</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Palette className="w-3 h-3 text-green-400" />
                    <span>Green channel often has most structure</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-4 rounded-lg border border-space-600">
                <h4 className="font-semibold text-blue-400 mb-2">Channel Observations</h4>
                <p className="text-sm text-gray-300">
                  Channels with more structure (often green) can dominate perceived quality
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center p-2 bg-red-500/20 rounded">
                    <div className="font-semibold text-red-400">Red</div>
                    <div className="text-gray-400">Warm tones</div>
                  </div>
                  <div className="text-center p-2 bg-green-500/20 rounded">
                    <div className="font-semibold text-green-400">Green</div>
                    <div className="text-gray-400">Most structure</div>
                  </div>
                  <div className="text-center p-2 bg-blue-500/20 rounded">
                    <div className="font-semibold text-blue-400">Blue</div>
                    <div className="text-gray-400">Cool tones</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Implementation Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-200">Implementation Notes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-semibold text-yellow-400 mb-2">Numerical Stability</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Use normalized eigenvectors</li>
                <li>• Handle zero singular values</li>
                <li>• Consider numerical precision</li>
                <li>• Avoid ill-conditioned matrices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-400 mb-2">Performance Tips</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Parallel processing for RGB</li>
                <li>• Caching for repeated computations</li>
                <li>• Adaptive rank selection</li>
                <li>• Memory-efficient algorithms</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-400 mb-2">Practical Considerations</h4>
              <ul className="space-y-1 text-xs text-gray-400">
                <li>• Choose appropriate rank k</li>
                <li>• Balance quality vs. compression</li>
                <li>• Consider application requirements</li>
                <li>• Test with various image types</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
