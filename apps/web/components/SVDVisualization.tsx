"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Square, Layers, Zap } from "lucide-react";
import Image from "next/image";


interface SVDVisualizationProps {
  singularValues: any;
  currentRank: number;
  imageType: 'grayscale' | 'color';
}

export default function SVDVisualization({ 
  singularValues, 
  currentRank, 
  imageType 
}: SVDVisualizationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentFormula, setCurrentFormula] = useState<'svd' | 'compression' | 'quality' | 'storage'>('svd');

  const steps = [
    {
      title: "Original Matrix A",
      description: "Every image is represented as a matrix where each element is a pixel value.",
      formula: "A ∈ ℝ^{m×n}",
      icon: Square,
      color: "neon"
    },
    {
      title: "SVD Decomposition",
      description: "We decompose A into three matrices: U (left singular vectors), Σ (singular values), and V^T (right singular vectors).",
      formula: "A = UΣV^T",
      icon: Layers,
      color: "plasma"
    },
    {
      title: "Rank-k Approximation",
      description: "We keep only the top k singular values and discard the rest to achieve compression.",
      formula: "A_k = U_k Σ_k V_k^T",
      icon: Zap,
      color: "matrix"
    },
    {
      title: "Compressed Result",
      description: "The reconstructed image uses only k singular values, significantly reducing storage requirements.",
      formula: "Storage: k × (m + n + 1) numbers",
      icon: Zap,
      color: "quantum"
    }
  ];

  const getStepColor = (color: string) => {
    switch (color) {
      case "neon": return "neon-500";
      case "plasma": return "plasma-500";
      case "matrix": return "matrix-500";
      case "quantum": return "quantum-500";
      default: return "neon-500";
    }
  };

  const getStepBgColor = (color: string) => {
    switch (color) {
      case "neon": return "neon-500/20";
      case "plasma": return "plasma-500/20";
      case "matrix": return "matrix-500/20";
      case "quantum": return "quantum-500/20";
      default: return "neon-500/20";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Enhanced SVD Process Flow */}
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
        <h3 className="text-xl font-bold text-center mb-6 neon-text">SVD Process Flow</h3>
        <div className="relative w-full h-64 md:h-80">
          <div className="w-full h-full bg-gradient-to-br from-space-800 to-space-700 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-2">🔄</div>
              <div className="text-sm">SVD Process Flow</div>
              <div className="text-xs mt-1">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Matrix Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
          <h3 className="text-xl font-bold text-center mb-6 neon-text">Matrix Visualization</h3>
          <div className="relative w-full h-64">
            <div className="w-full h-full bg-gradient-to-br from-space-800 to-space-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm">Matrix Visualization</div>
                <div className="text-xs mt-1">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
          <h3 className="text-xl font-bold text-center mb-6 neon-text">Mathematical Formulas</h3>
          <div className="relative w-full h-64">
            <div className="w-full h-full bg-gradient-to-br from-space-800 to-space-700 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-2xl mb-2">📐</div>
                <div className="text-sm">Mathematical Formulas</div>
                <div className="text-xs mt-1">Coming Soon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 mb-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
        <div className="px-4 py-2 bg-space-800 rounded-lg border border-space-600">
          <span className="text-sm text-gray-400">SVD Decomposition Process</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
      </div>

      {/* Step-by-step explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 hover:border-current transition-colors duration-200"
            style={{ borderColor: getStepColor(step.color) + '40' }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-3 bg-gradient-to-r from-${getStepColor(step.color)} to-${getStepColor(step.color)}/80 rounded-xl`}>
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold neon-text">{step.title}</h4>
            </div>
            
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              {step.description}
            </p>
            
            <div className="bg-space-700 p-3 rounded-lg">
              <code className="text-sm font-mono text-neon-400">
                {step.formula}
              </code>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Mathematical context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Square className="w-5 h-5" />
          <span>Mathematical Context</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="p-3 bg-space-700 rounded-lg">
              <span className="text-neon-400 font-semibold">U:</span> Left singular vectors (orthogonal matrix)
            </div>
            <div className="p-3 bg-space-700 rounded-lg">
              <span className="text-plasma-400 font-semibold">Σ:</span> Singular values (diagonal matrix)
            </div>
            <div className="p-3 bg-space-700 rounded-lg">
              <span className="text-matrix-400 font-semibold">V^T:</span> Right singular vectors (orthogonal matrix)
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="p-3 bg-space-700 rounded-lg">
              <span className="text-quantum-400 font-semibold">Rank-k:</span> Keep only top k singular values
            </div>
            <div className="p-3 bg-space-700 rounded-lg">
              <span className="text-neon-400 font-semibold">Compression:</span> A_k = U_k Σ_k V_k^T
            </div>
            <div className="p-3 bg-space-700 rounded-lg">
              <span className="text-plasma-400 font-semibold">Storage:</span> k × (m + n + 1) numbers
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
