"use client";

import { motion } from "framer-motion";
import { Rocket, Brain, Zap, Target } from "lucide-react";

export default function WelcomeSection() {
  return (
    <section id="welcome" className="min-h-[80vh] sm:min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Simplified Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-space-900 via-space-800 to-space-900"></div>
      <div className="absolute inset-0 bg-cyber-grid opacity-10"></div>
      
      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Main Title */}
          <div className="space-y-6">
            <motion.h1 
              className="text-5xl md:text-8xl font-bold neon-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              SVD
            </motion.h1>
            <motion.h2 
              className="text-xl md:text-4xl font-semibold hologram-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Quantum Image Compression
            </motion.h2>
            <motion.p 
              className="text-base md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Experience the future of image compression through Singular Value Decomposition. 
              Discover how mathematics transforms digital images into efficient quantum representations.
            </motion.p>
          </div>

          {/* Simplified Features Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto"
          >
            <div className="bg-gradient-to-br from-space-800/50 to-space-700/50 p-4 sm:p-6 rounded-xl border border-space-600">
              <Rocket className="w-7 h-7 sm:w-8 sm:h-8 text-neon-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm">Ultra Fast</h3>
              <p className="text-xs text-gray-400 mt-1">Lightning speed processing</p>
            </div>

            <div className="bg-gradient-to-br from-space-800/50 to-space-700/50 p-4 sm:p-6 rounded-xl border border-space-600">
              <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-plasma-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm">Linear Algebra</h3>
              <p className="text-xs text-gray-400 mt-1">Applied SVD concepts</p>
            </div>

            <div className="bg-gradient-to-br from-space-800/50 to-space-700/50 p-4 sm:p-6 rounded-xl border border-space-600">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-matrix-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm">High Quality</h3>
              <p className="text-xs text-gray-400 mt-1">Preserve image fidelity</p>
            </div>

            <div className="bg-gradient-to-br from-space-800/50 to-space-700/50 p-4 sm:p-6 rounded-xl border border-space-600">
              <Target className="w-7 h-7 sm:w-8 sm:h-8 text-quantum-400 mx-auto mb-2 sm:mb-3" />
              <h3 className="font-semibold text-sm">Precise Control</h3>
              <p className="text-xs text-gray-400 mt-1">Fine-tune compression</p>
            </div>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <a
              href="#demo"
              className="inline-flex items-center space-x-2 plasma-button"
            >
              <span>Start Compressing</span>
              <Zap className="w-5 h-5" />
            </a>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-8 sm:mt-12"
          >
            <div className="animate-bounce">
              <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
            </div>
            <p className="text-sm text-gray-400 mt-2">Scroll to explore</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
