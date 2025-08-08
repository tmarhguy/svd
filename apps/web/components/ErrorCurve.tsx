"use client";

import { motion } from "framer-motion";
import Image from "next/image";


interface ErrorCurveProps {
  singularValues: any; // Can be array (grayscale) or object (color)
  currentRank: number;
  imageType: 'grayscale' | 'color';
}

export default function ErrorCurve({ singularValues, currentRank, imageType }: ErrorCurveProps) {
  if (Object.keys(singularValues).length === 0) {
    return (
      <motion.div 
        className="h-48 flex items-center justify-center text-gray-500 hologram-card rounded-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        Upload an image to see error curve
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
        <div className="relative w-full h-64 md:h-80">
          <div className="w-full h-full bg-gradient-to-br from-space-800 to-space-700 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm">Error Curve Visualization</div>
              <div className="text-xs mt-1">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
