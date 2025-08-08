"use client";

import { motion } from "framer-motion";
import { Rocket, Brain, Zap, Target } from "lucide-react";


export default function WelcomeSection() {
  return (
    <section id="welcome" className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-space-900 via-space-800 to-space-900"></div>
      <div className="absolute inset-0 bg-cyber-grid opacity-20"></div>
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-neon-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-plasma-400 rounded-full animate-float opacity-80" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-matrix-400 rounded-full animate-float opacity-40" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-quantum-400 rounded-full animate-float opacity-70" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="space-y-8"
        >
          {/* Main Title */}
          <div className="space-y-6">
            <motion.h1 
              className="text-6xl md:text-8xl font-bold neon-text"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            >
              SVD
            </motion.h1>
            <motion.h2 
              className="text-2xl md:text-4xl font-semibold hologram-text"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              Quantum Image Compression
            </motion.h2>
            <motion.p 
              className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              Experience the future of image compression through Singular Value Decomposition. 
              Discover how mathematics transforms digital images into efficient quantum representations.
            </motion.p>
          </div>

          {/* Enhanced Welcome Animation */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mb-12"
          >
            <div className="w-full h-32 bg-gradient-to-br from-space-800 to-space-700 rounded-xl flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">🚀</div>
                <div className="text-sm">Welcome to SVD Compression</div>
              </div>
            </div>
          </motion.div>

          {/* Interactive Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            <div className="hologram-card p-6 rounded-xl text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-neon-500 to-plasma-500 rounded-xl">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold neon-text mb-2">Interactive Demo</h3>
              <p className="text-sm text-gray-400">Upload images and see real-time compression</p>
            </div>

            <div className="hologram-card p-6 rounded-xl text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-matrix-500 to-neon-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold neon-text mb-2">Mathematical Foundation</h3>
              <p className="text-sm text-gray-400">Understand the theory behind SVD</p>
            </div>

            <div className="hologram-card p-6 rounded-xl text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-plasma-500 to-quantum-500 rounded-xl">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold neon-text mb-2">Real-time Processing</h3>
              <p className="text-sm text-gray-400">Watch compression happen instantly</p>
            </div>

            <div className="hologram-card p-6 rounded-xl text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-quantum-500 to-matrix-500 rounded-xl">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold neon-text mb-2">Quality Control</h3>
              <p className="text-sm text-gray-400">Fine-tune compression parameters</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
