"use client";

import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload } from "lucide-react";

interface DropZoneProps {
  onFile: (file: File) => void;
  isActive?: boolean;
}

export default function DropZone({ onFile, isActive = false }: DropZoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFile(acceptedFiles[0]!);
      }
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp']
    },
    multiple: false
  });

  return (
    <div
      {...getRootProps()}
      className={`cyber-dropzone p-8 rounded-xl text-center cursor-pointer transition-all duration-300 ${
        isDragActive || isActive ? 'cyber-dropzone-active' : ''
      }`}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-r from-neon-500 to-plasma-500 rounded-xl">
              <Upload className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium neon-text">
              {isDragActive ? "Drop your image here" : "Drag & drop an image"}
            </p>
            <p className="text-sm text-gray-400">or click to browse</p>
          </div>
          <p className="text-xs text-gray-500">Supports: JPEG, PNG, GIF, BMP</p>
        </div>
      </motion.div>
    </div>
  );
}
