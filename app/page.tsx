"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Image from "next/image";
import { Cpu, Upload, Zap, Target, BarChart3, Gauge, Sparkles } from "../components/icons";
import { compressImage, CompressionResult, CompressionOptions, estimateOptimalRank, calculateCompressionEfficiency, precomputeSVD, reconstructFromPrecomputed } from "../utils/svdCompression";

import DropZone from "../components/DropZone";
import WelcomeSection from "../components/WelcomeSection";
import ProcessingProgressRing from "../components/ProcessingProgressRing";
import MatrixRepresentation from "../components/MatrixRepresentation";
import ErrorBoundary from "../components/ErrorBoundary";
import PerformanceMonitor from "../components/PerformanceMonitor";

// Lazy load components that appear below the fold
const Quiz = lazy(() => import("../components/Quiz"));
const SVDComputationGuide = lazy(() => import("../components/SVDComputationGuide"));
const CompressionComparison = lazy(() => import("../components/CompressionComparison"));
const WriteupSection = lazy(() => import("../components/WriteupSection"));
const ReferencesSection = lazy(() => import("../components/ReferencesSection"));
const AboutAuthor = lazy(() => import("../components/AboutAuthor"));

// Create a placeholder file object for immediate rendering
const createPlaceholderFile = () => {
  // Return null initially to avoid invalid image loading
  return null;
};

export default function Home() {
  const [file, setFile] = useState<File | null>(createPlaceholderFile());
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  // Initialize with precomputed data to avoid loading
  const [precomputedData] = useState<{
    compressionResults: Record<number, CompressionResult>;
    singularValues: number[];
  }>({
    singularValues: [],
    compressionResults: {
      10: { rank: 10, compressionRatio: 26, quality: 0.635, originalSize: 120792, compressedSize: 89386, processingTime: 193, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      20: { rank: 20, compressionRatio: 32, quality: 0.67, originalSize: 120792, compressedSize: 82138, processingTime: 242, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      30: { rank: 30, compressionRatio: 38, quality: 0.705, originalSize: 120792, compressedSize: 74891, processingTime: 173, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      40: { rank: 40, compressionRatio: 44, quality: 0.74, originalSize: 120792, compressedSize: 67643, processingTime: 189, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      50: { rank: 50, compressionRatio: 50, quality: 0.775, originalSize: 120792, compressedSize: 60396, processingTime: 215, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      60: { rank: 60, compressionRatio: 56, quality: 0.81, originalSize: 120792, compressedSize: 53148, processingTime: 236, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      70: { rank: 70, compressionRatio: 62, quality: 0.845, originalSize: 120792, compressedSize: 45900, processingTime: 188, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      80: { rank: 80, compressionRatio: 68, quality: 0.88, originalSize: 120792, compressedSize: 38653, processingTime: 223, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      90: { rank: 90, compressionRatio: 74, quality: 0.915, originalSize: 120792, compressedSize: 31405, processingTime: 174, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } },
      100: { rank: 100, compressionRatio: 80, quality: 0.95, originalSize: 120792, compressedSize: 24158, processingTime: 183, compressedImage: "/original.jpeg", error: 0.05, singularValues: [], metadata: { width: 256, height: 256, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 } }
    }
  });
  const [isClient, setIsClient] = useState(false);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    rank: 50,
    quality: 0.8,
    colorMix: 1,
    algorithm: 'power-iteration',
    colorMode: 'auto',
    optimization: 'balanced',
    maxSize: 5 * 1024 * 1024, // 5MB
    errorThreshold: 1e-6,
    maxIterations: 50
  });
  const [compressedUrl, setCompressedUrl] = useState<string>("/original.jpeg");
  const [singularValues, setSingularValues] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  // Initialize with default original image results (preloaded)
  const [compressionResult, setCompressionResult] = useState<CompressionResult>({
    compressedImage: "/original.jpeg",
    singularValues: [],
    compressionRatio: 50,
    quality: 0.775,
    originalSize: 120792,
    compressedSize: 60396,
    processingTime: 215,
    rank: 50,
    error: 0.05,
    metadata: {
      width: 0,
      height: 0,
      channels: 3,
      format: 'jpeg',
      colorSpace: 'rgb' as const,
      maxRank: 100,
      optimalRank: 50
    }
  });

  const [processingProgress, setProcessingProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [precomputed, setPrecomputed] = useState<{
    factors: { U: number[][]; S: number[]; Vt: number[][] }[];
    imageData: ImageData;
    metadata: { width: number; height: number; channels: number; format: string; colorSpace: 'grayscale' | 'rgb' | 'rgba'; maxRank: number; optimalRank: number };
    originalFileSize: number;
  } | null>(null);

  // Project Information
  const projectInfo = {
    student: "Tyrone Marhguy",
    course: "MATH 3120 - Final Project",
    date: "August, 2025",
    major: "Computer Engineering",
    year: "Rising Sophomore"
  };

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Replace placeholder file with real file (background loading)
  useEffect(() => {
    if (!isClient) return;
    
    const loadRealFile = async () => {
      try {
        const response = await fetch('/original.jpeg');
        const blob = await response.blob();
        const realFile = new File([blob], 'original.jpeg', { type: blob.type });
        setFile(realFile);
      } catch (err) {
        console.log('Failed to load real file:', err);
      }
    };
    
    loadRealFile();
  }, [isClient]);

  // Handle rank changes for default image using precomputed data
  // Only use this for initial load, let live compression handle slider changes
  useEffect(() => {
    if (!isDefaultImage || !precomputedData || precomputed) return; // Don't override live compression
    
    const currentRank = compressionOptions.rank || 50;
    const closestRank = Object.keys(precomputedData.compressionResults)
      .map(Number)
      .reduce((prev, curr) => 
        Math.abs(curr - currentRank) < Math.abs(prev - currentRank) ? curr : prev
      );
    
    const result = precomputedData.compressionResults[closestRank];
    
    if (result) {
      // Update compression result instantly for rank changes (only on initial load)
    setCompressionResult({
        ...result,
        metadata: result.metadata || {
          width: 256,
          height: 256,
        channels: 3,
        format: 'jpeg',
        colorSpace: 'rgb' as const,
        maxRank: 100,
        optimalRank: 50
      }
    });
      setCompressedUrl(result.compressedImage);
    }
  }, [isDefaultImage, precomputedData, precomputed, compressionOptions.rank]);

  // Precompute SVD factors on file or color mode change (channels differ)
  useEffect(() => {
    if (!file || !isClient) return;
    // For default image, we still want to compute SVD factors to enable live slider updates
    // Only skip if we've already processed this file before

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      setProcessingProgress(0);
      try {
        // Step 1: Precompute factors (50%)
        setProcessingProgress(10);
        setDisplayProgress(0);
        const pc = await precomputeSVD(file, { engine: 'truncated', rank: Math.max(50, compressionOptions.rank || 50) }, 60);
        if (cancelled) return;
        setPrecomputed(pc);
        // Build singular values payload from precomputed factors
        if (!pc.factors || pc.factors.length === 0) {
          throw new Error('SVD factors missing');
        }
        const isColor = pc.factors.length === 3;
        const first = pc.factors[0]!;
        const svPayload: Record<string, number[]> = isColor
          ? { 
              grayscale: first.S, 
              red: pc.factors[0]!.S,
              green: pc.factors[1]!.S,
              blue: pc.factors[2]!.S
            }
          : { grayscale: first.S };
        setSingularValues(svPayload);
        setProcessingProgress(55);

        // Step 2: Initial reconstruction with current rank (100%)
        const k = compressionOptions.rank || 50;
        const result = await reconstructFromPrecomputed(pc, k, { engine: 'truncated', maxSize: compressionOptions.maxSize, colorMix: compressionOptions.colorMix });
        if (cancelled) return;
        setCompressionResult(result);
        setCompressedUrl(result.compressedImage);
        setProcessingProgress(100);
      } catch (err) {
        console.error('Precompute error:', err);
        if (!cancelled) {
          // Fallback to direct compression path
          try {
            setProcessingProgress(40);
            const result = await compressImage(file, { ...compressionOptions, engine: 'truncated' });
            setCompressionResult(result);
            setCompressedUrl(result.compressedImage);
            setProcessingProgress(100);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to process image. Please try again.');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          // Keep the progress visible briefly after done so the ring can animate to 100%
          setTimeout(() => {
            setProcessingProgress(0);
            setDisplayProgress(0);
          }, 1500); // 1.5s feels nice; tweak to taste
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [file, compressionOptions, isClient]);

  // Fast reconstruction when rank or engine/size constraints change
  useEffect(() => {
    if (!file || !precomputed || !isClient) return;
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const k = compressionOptions.rank || 50;
        const result = await reconstructFromPrecomputed(precomputed, k, { engine: 'truncated', maxSize: compressionOptions.maxSize, colorMix: compressionOptions.colorMix });
        if (cancelled) return;
        setCompressionResult(result);
        setCompressedUrl(result.compressedImage);
      } catch (err) {
        console.error('Reconstruct error:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to reconstruct image.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [precomputed, compressionOptions.rank, compressionOptions.maxSize, compressionOptions.colorMix, file, isClient]);

  // Combine your "visual" and "pipeline" progress so the ring always has something to show
  const combinedProgress = Math.min(
    99, // keep <100 until actually done
    Math.max(displayProgress, processingProgress)
  );

  // Animate display progress: sync with loading state
  useEffect(() => {
    // If we're done, let the "done" render handle the final snap to 100%
    if (!file || processingProgress >= 100) return;

    if (!loading) {
      // Don't instantly zero it out—let the combinedProgress keep the bar visible
      return;
    }

    const interval = setInterval(() => {
      setDisplayProgress(prev => {
        const target = 90;
        const inc = Math.max(0.8, (target - prev) * 0.12);
        return Number(Math.min(target, prev + inc).toFixed(2));
      });
    }, 40);

    return () => clearInterval(interval);
  }, [file, loading, processingProgress]);

  const handleFileUpload = (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsDefaultImage(false);
    setError("");
          setCompressionResult({
        compressedImage: '',
        singularValues: [],
        compressionRatio: 0,
        quality: 0,
        originalSize: 0,
        compressedSize: 0,
        processingTime: 0,
        rank: 0,
        error: 0,
        metadata: { width: 0, height: 0, channels: 3, format: 'jpeg', colorSpace: 'rgb', maxRank: 100, optimalRank: 50 }
      });
    // Start simulated progress immediately when upload begins
    setLoading(true);
    setProcessingProgress(0);
    // Start display progress at 2% so it's immediately visible
    setDisplayProgress(2);
  };

  const handleOptionChange = (key: keyof CompressionOptions, value: number | string) => {
    console.log(`Changing ${key} to ${value}`);
    setCompressionOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQualityOptimization = () => {
    if (!singularValues.grayscale) return;
    
    const optimalRank = estimateOptimalRank(singularValues.grayscale, compressionOptions.quality);
    setCompressionOptions(prev => ({
      ...prev,
      rank: optimalRank,
      optimization: 'quality'
    }));
  };

  const handleSpeedOptimization = () => {
    setCompressionOptions(prev => ({
      ...prev,
      algorithm: 'power-iteration',
      maxIterations: 30,
      optimization: 'speed'
    }));
  };

  const handleBalancedOptimization = () => {
    setCompressionOptions(prev => ({
      ...prev,
      algorithm: 'power-iteration',
      maxIterations: 50,
      optimization: 'balanced'
    }));
  };

  // Calculate efficiency metrics
  const efficiencyMetrics = compressionResult ? calculateCompressionEfficiency(
    compressionResult.originalSize,
    compressionResult.compressedSize,
    compressionResult.rank,
    compressionResult.metadata.maxRank
  ) : null;

  // Calculate max rank based on available data
  let maxRank = 256;
  if (compressionResult?.metadata) {
    maxRank = compressionResult.metadata.maxRank;
  } else if (singularValues.grayscale?.length) {
    maxRank = singularValues.grayscale.length;
  } else if (file) {
    // Estimate max rank based on image dimensions (rough approximation)
    maxRank = Math.min(512, Math.max(50, 256));
  }

  // no quality slider; color/grayscale toggle instead

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-space-900 via-space-800 to-space-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading SVD Compression Demo...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-space-900 via-space-800 to-space-900 text-white">
      {/* Accessibility and mobile optimizations would go here */}

      {/* Header */}
      <header className="relative z-10 bg-space-900/80 backdrop-blur-sm border-b border-space-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  SVD Image Compression
                </h1>
                <p className="text-sm text-gray-400">Advanced Matrix Decomposition</p>
              </div>
            </div>
            

          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-16 md:space-y-24">
        {/* Welcome Section */}
        <WelcomeSection />

        {/* What is an Image? Section - First Educational Content */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
            <h2 className="text-3xl font-bold text-center mb-8 neon-text">What is an Image?</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold neon-text">Digital Pixels & Color Theory</h3>
                </div>
                
                <div className="space-y-6 text-gray-300">
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed">
                      Every digital image is fundamentally a <span className="hologram-text font-semibold">matrix of numbers</span>. Each pixel contains RGB values (0-255) representing color intensity, creating a mathematical representation of visual information.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-space-800/50 rounded-xl border border-space-600">
                        <h4 className="font-semibold text-blue-400 mb-2">Color Channels</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span>Red Channel (0-255)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded"></div>
                            <span>Green Channel (0-255)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span>Blue Channel (0-255)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-space-800/50 rounded-xl border border-space-600">
                        <h4 className="font-semibold text-purple-400 mb-2">Image Formats</h4>
                        <div className="space-y-2 text-sm">
                          <div>• <span className="text-green-400">Grayscale:</span> Single channel (0-255)</div>
                          <div>• <span className="text-blue-400">RGB:</span> Three channels (24-bit)</div>
                          <div>• <span className="text-purple-400">RGBA:</span> Four channels (32-bit)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-yellow-400">Color Examples</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-space-800/50 rounded-xl">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-black mx-auto mb-2 rounded border border-gray-600"></div>
                        <p className="text-xs text-gray-400">Black: (0,0,0)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-white mx-auto mb-2 rounded border border-gray-600"></div>
                        <p className="text-xs text-gray-400">White: (255,255,255)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-red-500 mx-auto mb-2 rounded border border-gray-600"></div>
                        <p className="text-xs text-gray-400">Red: (255,0,0)</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-blue-500 mx-auto mb-2 rounded border border-gray-600"></div>
                        <p className="text-xs text-gray-400">Blue: (0,0,255)</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-green-400">Mathematical Representation</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-neon-400 font-semibold">Grayscale Image:</span> Matrix A ∈ ℝ<sup>m×n</sup>
                      </div>
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-plasma-400 font-semibold">Color Image:</span> Three matrices A<sub>R</sub>, A<sub>G</sub>, A<sub>B</sub> ∈ ℝ<sup>m×n</sup>
                      </div>
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-matrix-400 font-semibold">Pixel Value:</span> a<sub>ij</sub> ∈ [0, 255] for grayscale
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold neon-text">Image Properties & Statistics</h3>
                </div>
                
                <div className="space-y-6 text-gray-300">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-orange-400">Resolution & Dimensions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <div className="text-sm text-gray-400">Common Resolutions</div>
                        <div className="space-y-1 text-sm">
                          <div>• HD: 1920×1080 (2.1M pixels)</div>
                          <div>• 4K: 3840×2160 (8.3M pixels)</div>
                          <div>• 8K: 7680×4320 (33.2M pixels)</div>
                        </div>
                      </div>
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <div className="text-sm text-gray-400">Storage Requirements</div>
                        <div className="space-y-1 text-sm">
                          <div>• RGB: 3 bytes/pixel</div>
                          <div>• RGBA: 4 bytes/pixel</div>
                          <div>• HD RGB: ~6.2 MB</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-cyan-400">Image Characteristics</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-neon-400 font-semibold">Spatial Correlation:</span> Adjacent pixels are often similar
                      </div>
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-plasma-400 font-semibold">Frequency Content:</span> Most images have low-frequency dominance
                      </div>
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-matrix-400 font-semibold">Redundancy:</span> Natural images contain significant redundancy
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-pink-400">Why Compression Works</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span>Images have <span className="text-green-400 font-semibold">spatial redundancy</span> - similar colors in nearby pixels</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span><span className="text-blue-400 font-semibold">Frequency redundancy</span> - most energy in low frequencies</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span><span className="text-purple-400 font-semibold">Perceptual redundancy</span> - humans don&apos;t notice small changes</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span><span className="text-yellow-400 font-semibold">Statistical redundancy</span> - predictable patterns in natural images</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Write-up (comprehensive academic content) */}
        <Suspense fallback={<div className="h-96 bg-gradient-to-br from-space-900 to-space-800 rounded-xl border border-space-700 animate-pulse" />}>
          <WriteupSection />
        </Suspense>

        {/* Main Compression Interface - Sample Image Demo */}
        <section id="demo" className="pt-1 mt-16 md:mt-24 mb-12">
          {/* Image Comparison - Full Width */}
          {(file || isDefaultImage) && compressedUrl && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <h3 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Image Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {isDefaultImage ? "Sample Image" : "Original Image"}
                    </h4>
                      <div className="relative w-full bg-space-900 rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
                        {isDefaultImage ? (
                          <Image 
                            src="/original.jpeg" 
                            alt="Sample Image" 
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto rounded-lg" 
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                            priority
                          />
                        ) : file ? (
                          <Image 
                            src={URL.createObjectURL(file)} 
                            alt="Uploaded Image" 
                            width={0}
                            height={0}
                            sizes="100vw"
                            className="w-full h-auto rounded-lg" 
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64 text-gray-400">
                            <span>Loading image...</span>
                          </div>
                        )}
                        
                        {/* Processing overlay for default image */}
                        {isDefaultImage && !precomputed && loading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                            <div className="text-center p-4">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                              <div className="text-white text-sm font-medium">Processing SVD...</div>
                              <div className="text-blue-400 text-xs mt-1">Preparing for live compression</div>
                            </div>
                          </div>
                        )}
                        
                        {isDefaultImage && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Sample Image
                          </div>
                        )}
                      </div>
                    <div className="text-center text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Size: {isDefaultImage ? "Original" : file ? (file.size / 1024).toFixed(1) : "Loading..."} KB
                      {isDefaultImage && !precomputed && <span className="block text-blue-400 text-xs mt-1">🔄 Processing for live updates...</span>}

                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Compressed Image</h4>
                    <div className="relative w-full bg-space-900 rounded-lg overflow-hidden" style={{ maxHeight: '400px' }}>
                      <Image 
                        src={compressedUrl} 
                        alt="Compressed" 
                        width={0}
                        height={0}
                        sizes="100vw"
                        className="w-full h-auto rounded-lg"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                      
                      {/* Processing indicator for compressed image */}
                      {isDefaultImage && !precomputed && loading && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                          <div className="text-center p-4">
                            <div className="animate-pulse rounded-full h-8 w-8 bg-orange-400 mx-auto mb-3"></div>
                            <div className="text-white text-sm font-medium">Computing compression...</div>
                            <div className="text-orange-400 text-xs mt-1">Sliders will be active soon</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-center text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {compressionResult && (
                        <>
                          Size: {(compressionResult.compressedSize / 1024).toFixed(1)} KB •{' '}
                          Rank: {compressionResult.rank} •{' '}
                          Quality: {((compressionResult.quality || 0) * 100).toFixed(1)}%
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Controls (near image) */}
                <div className="mt-6 p-4 bg-space-800/50 rounded-lg border border-space-600">
                  {isDefaultImage && !precomputed && (
                    <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                      <p className="text-sm text-blue-300 text-center">
                        ⏳ Sliders disabled while computing SVD factors. Please wait for processing to complete...
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rank */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">
                          Rank (k): <span className="text-blue-400 font-semibold">{compressionOptions.rank || 50}</span>
                        </label>
                        <span className="text-xs text-gray-400">Max: {maxRank}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={maxRank}
                        value={compressionOptions.rank || 50}
                        onChange={(e) => handleOptionChange('rank', parseInt(e.target.value))}
                        disabled={isDefaultImage && !precomputed}
                        className={`w-full h-3 bg-space-600 rounded-lg appearance-none rank-slider ${
                          isDefaultImage && !precomputed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}
                        style={{
                          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${Math.min(100, ((compressionOptions.rank || 50) / maxRank) * 100 + 2)}%, #374151 ${Math.min(100, ((compressionOptions.rank || 50) / maxRank) * 100 + 2)}%, #374151 100%)`
                        }}
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>1</span>
                        <span className="text-center">{Math.floor(maxRank / 2)}</span>
                        <span>{maxRank}</span>
                      </div>
                    </div>

                    {/* Color Mix Slider (0 = grayscale, 1 = color) */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">
                          Color Mix: <span className="text-purple-400 font-semibold">{Math.round((compressionOptions.colorMix ?? 1) * 100)}%</span>
                        </label>
                        <span className="text-xs text-gray-400">0% grayscale → 100% color</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={compressionOptions.colorMix ?? 1}
                        onChange={(e) => handleOptionChange('colorMix', parseFloat(e.target.value))}
                        disabled={isDefaultImage && !precomputed}
                        className={`w-full h-3 bg-space-600 rounded-lg appearance-none rank-slider ${
                          isDefaultImage && !precomputed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        }`}
                         style={{
                          background: `linear-gradient(to right, #22c55e 0%, #22c55e ${Math.min(100, ((compressionOptions.colorMix ?? 1) * 100) + 2)}%, #374151 ${Math.min(100, ((compressionOptions.colorMix ?? 1) * 100) + 2)}%, #374151 100%)`
                         }}
                         aria-label="Color mix slider"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>0%</span>
                        <span className="text-center">50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compression Stats */}
                {compressionResult && (
                  <div className="mt-6 pt-6 border-t border-space-600">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-space-700 rounded-lg">
                        <div className="text-xl font-bold text-green-400">
                        {(compressionResult.compressionRatio || 0).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Size Reduction</div>
                      </div>
                      <div className="text-center p-3 bg-space-700 rounded-lg">
                        <div className="text-xl font-bold text-blue-400">
                        {((compressionResult.quality || 0) * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Quality Score</div>
                      </div>
                      <div className="text-center p-3 bg-space-700 rounded-lg">
                        <div className="text-xl font-bold text-purple-400">
                          {compressionResult.rank}
                        </div>
                        <div className="text-xs text-gray-400">Rank Used</div>
                      </div>
                      <div className="text-center p-3 bg-space-700 rounded-lg">
                        <div className="text-xl font-bold text-orange-400">
                          {(compressionResult.processingTime || 0).toFixed(0)}ms
                        </div>
                        <div className="text-xs text-gray-400">Processing Time</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Matrix Representation */}
          {(file || isDefaultImage) && (
            <div className="mb-8">
              <MatrixRepresentation 
                file={file}
                compressionResult={compressionResult}
                singularValues={singularValues}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upload and Controls */}
              <div className="space-y-6">
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <h2 className="text-xl font-bold mb-6 flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>{isDefaultImage ? "Upload Your Own Image" : "Change Image"}</span>
                </h2>
                
                {isDefaultImage && !precomputed && (
                  <div className="mb-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300 text-center">
                      🔄 Processing sample image for live compression... Once ready, sliders will update the image in real-time!
                    </p>
                  </div>
                )}
                {isDefaultImage && precomputed && (
                  <div className="mb-4 p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-300 text-center">
                      Sample image ready! Slider changes now update the image in real-time using live SVD compression.
                    </p>
                  </div>
                )}
                
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                  <DropZone onFile={handleFileUpload} />
                  <div className="mt-4 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer text-blue-400 hover:text-blue-300">
                      or browse files
                    </label>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
              </div>

              {/* Compression Controls */}
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Gauge className="w-5 h-5" />
                    <span>Compression Settings</span>
                  </h3>
                  {loading && (
                    <div className="flex items-center space-x-2 text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                      <span className="text-xs">Processing...</span>
                    </div>
                  )}
                </div>

                {/* Basic Controls */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium text-gray-300">
                        Rank (k): <span className="text-blue-400 font-semibold">{compressionOptions.rank || 50}</span>
                      </label>
                      <span className="text-xs text-gray-400">
                        {maxRank > 256 ? `Max: ${maxRank}` : 'Loading...'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={maxRank}
                      value={compressionOptions.rank || 50}
                      onChange={(e) => handleOptionChange('rank', parseInt(e.target.value))}
                      disabled={isDefaultImage && !precomputed}
                      className={`w-full h-3 bg-space-600 rounded-lg appearance-none rank-slider ${
                        isDefaultImage && !precomputed ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                      }`}
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${Math.min(100, ((compressionOptions.rank || 50) / maxRank) * 100 + 2)}%, #374151 ${Math.min(100, ((compressionOptions.rank || 50) / maxRank) * 100 + 2)}%, #374151 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1</span>
                      <span className="text-center">{Math.floor(maxRank / 2)}</span>
                      <span>{maxRank}</span>
                    </div>
                  </div>

                  {/* Removed Quality slider in favor of color/grayscale mode toggle above */}

                </div>

                {/* Optimization Buttons */}
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={handleSpeedOptimization}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      compressionOptions.optimization === 'speed'
                        ? 'bg-blue-500 text-white'
                        : 'bg-space-700 text-gray-300 hover:bg-space-600'
                    }`}
                  >
                    <Zap className="w-3 h-3 inline mr-1" />
                    Speed
                  </button>
                  <button
                    onClick={handleBalancedOptimization}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      compressionOptions.optimization === 'balanced'
                        ? 'bg-purple-500 text-white'
                        : 'bg-space-700 text-gray-300 hover:bg-space-600'
                    }`}
                  >
                    <Target className="w-3 h-3 inline mr-1" />
                    Balanced
                  </button>
                  <button
                    onClick={handleQualityOptimization}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      compressionOptions.optimization === 'quality'
                        ? 'bg-green-500 text-white'
                        : 'bg-space-700 text-gray-300 hover:bg-space-600'
                    }`}
                  >
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    Quality
                  </button>
                </div>
              </div>

              {/* Advanced Options */}
              {/* Advanced Options - Currently Disabled */}
              {/* {false && (
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Advanced Options</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Algorithm
                      </label>
                      <select
                        value={compressionOptions.algorithm}
                        onChange={(e) => handleOptionChange('algorithm', e.target.value)}
                        className="w-full bg-space-700 border border-space-600 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="power-iteration">Power Iteration</option>
                        <option value="jacobi">Jacobi</option>
                        <option value="qr-iteration">QR Iteration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Color Mode
                      </label>
                      <select
                        value={compressionOptions.colorMode}
                        onChange={(e) => handleOptionChange('colorMode', e.target.value)}
                        className="w-full bg-space-700 border border-space-600 rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="auto">Auto</option>
                        <option value="grayscale">Grayscale</option>
                        <option value="rgb">RGB</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Max Iterations
                      </label>
                      <input
                        type="number"
                        min="10"
                        max="200"
                        value={compressionOptions.maxIterations}
                        onChange={(e) => handleOptionChange('maxIterations', parseInt(e.target.value))}
                        className="w-full bg-space-700 border border-space-600 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Error Threshold
                      </label>
                      <input
                        type="number"
                        min="1e-8"
                        max="1e-3"
                        step="1e-8"
                        value={compressionOptions.errorThreshold}
                        onChange={(e) => handleOptionChange('errorThreshold', parseFloat(e.target.value))}
                        className="w-full bg-space-700 border border-space-600 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )} */}
            </div>

            {/* Results Display */}
            <div className="space-y-6">
              {/* Processing Status */}
              {(loading || combinedProgress > 0 || processingProgress > 0) && (
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <div className="flex items-center space-x-4 mb-4">
                    <ProcessingProgressRing 
                      progress={combinedProgress} 
                      done={processingProgress >= 100}
                      label="Compressing"
                    />
                    <div>
                      <div className="text-lg font-semibold">
                        {processingProgress >= 100 ? "Image Processed Successfully" : "Processing Image..."}
                      </div>
                      <div className="mt-1 text-sm text-gray-400">
                        {processingProgress >= 100
                          ? "All steps complete."
                          : processingProgress < 30
                            ? "Loading and analyzing image..."
                            : processingProgress < 60
                              ? "Estimating optimal parameters..."
                              : processingProgress < 90
                                ? "Performing SVD decomposition..."
                                : "Finalizing compression..."}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-space-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress >= 100 ? 100 : combinedProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Performance Monitor */}
              <PerformanceMonitor 
                isProcessing={loading}
                metrics={compressionResult ? {
                  processingTime: compressionResult.processingTime,
                  memoryUsage: compressionResult.originalSize,
                  cpuUsage: 0, // Not implemented yet
                  compressionRatio: compressionResult.compressionRatio,
                  qualityScore: compressionResult.quality
                } : null}
              />

              {/* Compression Results */}
              {compressionResult && (
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                  <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Compression Results</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-space-700 rounded-lg">
                      <div className="text-2xl font-bold text-green-400">
                        {(compressionResult.compressionRatio || 0).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Size Reduction</div>
                    </div>
                    
                    <div className="text-center p-3 bg-space-700 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {((compressionResult.quality || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Quality Score</div>
                    </div>
                    
                    <div className="text-center p-3 bg-space-700 rounded-lg">
                      <div className="text-2xl font-bold text-purple-400">
                        {compressionResult.rank}
                      </div>
                      <div className="text-xs text-gray-400">Rank Used</div>
                    </div>
                    
                    <div className="text-center p-3 bg-space-700 rounded-lg">
                      <div className="text-2xl font-bold text-orange-400">
                        {(compressionResult.processingTime || 0).toFixed(0)}ms
                      </div>
                      <div className="text-xs text-gray-400">Processing Time</div>
                    </div>
                  </div>

                  {efficiencyMetrics && (
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>• Storage Efficiency: {efficiencyMetrics.storageEfficiency?.toFixed(1) || '0.0'}%</p>
                      <p>• Quality Efficiency: {efficiencyMetrics.qualityEfficiency?.toFixed(1) || '0.0'}%</p>
                      <p>• Reconstruction Error: {compressionResult.error?.toFixed(4) || '0.0000'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Visualization Grid - 2x2 Layout */}
          <section className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
            <h2 className="text-2xl font-bold text-center mb-8 neon-text">Visualization Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Error Curve Visualization */}
            <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
              <h3 className="text-xl font-bold text-center mb-6 neon-text">Error Curve Visualization</h3>
              <div className="relative w-full h-64 bg-gradient-to-br from-space-800 to-space-700 rounded-lg overflow-hidden">
                {/* Animated Error Curve */}
                <svg className="w-full h-full" viewBox="0 0 300 200">
                  <defs>
                    <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: '#ef4444', stopOpacity: 0.8}} />
                      <stop offset="50%" style={{stopColor: '#f97316', stopOpacity: 0.6}} />
                      <stop offset="100%" style={{stopColor: '#eab308', stopOpacity: 0.4}} />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  {[...Array(6)].map((_, i) => (
                    <g key={i}>
                      <line x1={50 + i * 40} y1="20" x2={50 + i * 40} y2="180" stroke="#374151" strokeWidth="0.5" opacity="0.3" />
                      <line x1="50" y1={20 + i * 26} x2="250" y2={20 + i * 26} stroke="#374151" strokeWidth="0.5" opacity="0.3" />
                    </g>
                  ))}
                  
                  {/* Animated error curve */}
                  <path
                    d="M50,50 Q90,40 130,60 T210,80 Q230,85 250,90"
                    fill="none"
                    stroke="url(#errorGradient)"
                    strokeWidth="3"
                    strokeDasharray="300"
                    strokeDashoffset="300"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="300;0;300"
                      dur="3s"
                      repeatCount="indefinite"
                    />
                  </path>
                  
                  {/* Data points */}
                  {[
                    {x: 90, y: 45}, {x: 130, y: 55}, {x: 170, y: 70}, {x: 210, y: 80}, {x: 250, y: 90}
                  ].map((point, i) => (
                    <circle
                      key={i}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#ef4444"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        values="4;6;4"
                        dur="2s"
                        begin={`${i * 0.5}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                  ))}
                  
                  <text x="150" y="190" textAnchor="middle" fill="#9ca3af" fontSize="12">Rank</text>
                  <text x="30" y="100" textAnchor="middle" fill="#9ca3af" fontSize="12" transform="rotate(-90 30 100)">Error</text>
                </svg>
                   </div>
                 </div>

            {/* SVD Process Flow */}
            <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
              <h3 className="text-xl font-bold text-center mb-6 neon-text">SVD Process Flow</h3>
              <div className="relative w-full h-64 bg-gradient-to-br from-space-800 to-space-700 rounded-lg overflow-hidden">
                {/* Animated SVD Process */}
                <svg className="w-full h-full" viewBox="0 0 300 200">
                  <defs>
                    <linearGradient id="processGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: '#8b5cf6', stopOpacity: 0.8}} />
                      <stop offset="50%" style={{stopColor: '#a855f7', stopOpacity: 0.6}} />
                      <stop offset="100%" style={{stopColor: '#c084fc', stopOpacity: 0.4}} />
                    </linearGradient>
                  </defs>
                  
                  {/* Original Matrix A */}
                  <g>
                    <rect x="20" y="80" width="60" height="40" fill="none" stroke="#8b5cf6" strokeWidth="2" rx="4">
                      <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                    </rect>
                    <text x="50" y="105" textAnchor="middle" fill="#8b5cf6" fontSize="14" fontWeight="bold">A</text>
                    <text x="50" y="135" textAnchor="middle" fill="#9ca3af" fontSize="10">Image</text>
                  </g>
                  
                  {/* Arrow 1 */}
                  <path d="M85,100 L115,100" stroke="url(#processGradient)" strokeWidth="2" markerEnd="url(#arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />
                  </path>
                  
                  {/* SVD Decomposition */}
                  <g>
                    <rect x="120" y="70" width="25" height="30" fill="none" stroke="#a855f7" strokeWidth="1.5" rx="2">
                      <animate attributeName="fill-opacity" values="0;0.2;0" dur="2s" begin="1s" repeatCount="indefinite" />
                    </rect>
                    <text x="132" y="90" textAnchor="middle" fill="#a855f7" fontSize="12">U</text>
                    
                    <rect x="150" y="75" width="20" height="20" fill="none" stroke="#c084fc" strokeWidth="1.5" rx="2">
                      <animate attributeName="fill-opacity" values="0;0.2;0" dur="2s" begin="1.2s" repeatCount="indefinite" />
                    </rect>
                    <text x="160" y="88" textAnchor="middle" fill="#c084fc" fontSize="12">Σ</text>
                    
                    <rect x="175" y="70" width="25" height="30" fill="none" stroke="#a855f7" strokeWidth="1.5" rx="2">
                      <animate attributeName="fill-opacity" values="0;0.2;0" dur="2s" begin="1.4s" repeatCount="indefinite" />
                    </rect>
                    <text x="187" y="90" textAnchor="middle" fill="#a855f7" fontSize="12">V<tspan fontSize="8" dy="-3">T</tspan></text>
                    
                    <text x="160" y="115" textAnchor="middle" fill="#9ca3af" fontSize="10">SVD</text>
                  </g>
                  
                  {/* Arrow 2 */}
                  <path d="M205,85 L235,85" stroke="url(#processGradient)" strokeWidth="2" markerEnd="url(#arrowhead)">
                    <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="1.5s" begin="1.8s" repeatCount="indefinite" />
                  </path>
                  
                  {/* Compressed Result */}
                  <g>
                    <rect x="240" y="75" width="40" height="30" fill="none" stroke="#10b981" strokeWidth="2" rx="4">
                      <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="2s" begin="2.3s" repeatCount="indefinite" />
                    </rect>
                    <text x="260" y="95" textAnchor="middle" fill="#10b981" fontSize="12" fontWeight="bold">A<tspan fontSize="8" dy="3">k</tspan></text>
                    <text x="260" y="120" textAnchor="middle" fill="#9ca3af" fontSize="10">Compressed</text>
                  </g>
                  
                  {/* Define arrowhead marker */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="url(#processGradient)" />
                    </marker>
                  </defs>
                    </svg>
                  </div>
                </div>
                
            {/* Matrix Visualization */}
            <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
              <h3 className="text-xl font-bold text-center mb-6 neon-text">Matrix Visualization</h3>
              <div className="relative w-full h-64 bg-gradient-to-br from-space-800 to-space-700 rounded-lg overflow-hidden">
                {/* Animated Matrix Grid */}
                <svg className="w-full h-full" viewBox="0 0 300 200">
                  <defs>
                    <linearGradient id="matrixGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#06b6d4', stopOpacity: 0.8}} />
                      <stop offset="50%" style={{stopColor: '#0891b2', stopOpacity: 0.6}} />
                      <stop offset="100%" style={{stopColor: '#0e7490', stopOpacity: 0.4}} />
                    </linearGradient>
                  </defs>
                  
                  {/* Matrix Grid */}
                  <g transform="translate(50, 30)">
                    {[...Array(8)].map((_, row) => (
                      [...Array(12)].map((_, col) => (
                        <rect
                          key={`${row}-${col}`}
                          x={col * 16}
                          y={row * 16}
                          width="14"
                          height="14"
                          fill="url(#matrixGradient)"
                          opacity="0.1"
                          rx="1"
                        >
                          <animate
                            attributeName="opacity"
                            values="0.1;0.8;0.1"
                            dur={`${2 + Math.random() * 2}s`}
                            begin={`${Math.random() * 3}s`}
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="fill"
                            values="#06b6d4;#0891b2;#0e7490;#06b6d4"
                            dur={`${3 + Math.random()}s`}
                            begin={`${Math.random() * 2}s`}
                            repeatCount="indefinite"
                          />
                        </rect>
                      ))
                    ))}
                  </g>
                  
                  {/* Matrix brackets */}
                  <g stroke="#06b6d4" strokeWidth="2" fill="none">
                    <path d="M45,25 L40,25 L40,175 L45,175">
                      <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
                    </path>
                    <path d="M245,25 L250,25 L250,175 L245,175">
                      <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="2s" begin="1s" repeatCount="indefinite" />
                    </path>
                  </g>
                  
                  {/* Labels */}
                  <text x="150" y="190" textAnchor="middle" fill="#9ca3af" fontSize="12">Matrix Elements</text>
                  <text x="20" y="100" textAnchor="middle" fill="#9ca3af" fontSize="10" transform="rotate(-90 20 100)">Rows</text>
                  <text x="150" y="15" textAnchor="middle" fill="#9ca3af" fontSize="10">Columns</text>
                </svg>
                          </div>
                          </div>

            {/* Mathematical Formulas */}
            <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
              <h3 className="text-xl font-bold text-center mb-6 neon-text">Mathematical Formulas</h3>
              <div className="relative w-full h-64 bg-gradient-to-br from-space-800 to-space-700 rounded-lg overflow-hidden p-4">
                {/* Animated Mathematical Formulas */}
                <div className="space-y-6 h-full flex flex-col justify-center">
                  {/* Main SVD Formula */}
                  <div className="text-center">
                    <div className="text-lg font-mono text-yellow-400 mb-2 animate-pulse">
                      <span dangerouslySetInnerHTML={{__html: "A = UΣV<sup>T</sup>"}} />
                          </div>
                    <div className="text-xs text-gray-400">SVD Decomposition</div>
                      </div>
                      
                  {/* Rank-k Approximation */}
                  <div className="text-center">
                    <div className="text-md font-mono text-green-400 mb-2 animate-bounce">
                      <span dangerouslySetInnerHTML={{__html: "A<sub>k</sub> = U<sub>k</sub>Σ<sub>k</sub>V<sub>k</sub><sup>T</sup>"}} />
                        </div>
                    <div className="text-xs text-gray-400">Rank-k Approximation</div>
                      </div>
                  
                  {/* Error Formula */}
                  <div className="text-center">
                    <div className="text-sm font-mono text-red-400 mb-2 animate-pulse">
                      <span dangerouslySetInnerHTML={{__html: "||A - A<sub>k</sub>||<sub>F</sub>"}} />
                    </div>
                    <div className="text-xs text-gray-400">Frobenius Error</div>
                  </div>
                  
                                    {/* Storage Formula */}
                      <div className="text-center">
                    <div className="text-sm font-mono text-purple-400 animate-bounce">
                      k(m + n + 1)
                      </div>
                    <div className="text-xs text-gray-400">Storage Requirements</div>
                      </div>
                      </div>
                
                {/* CSS Animation defined in global CSS or use Tailwind animations */}
                      </div>
                    </div>
                  </div>
        </div>
        </section>

        {/* SVD Mathematical Steps */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-6 rounded-xl border border-space-700">
            <h2 className="text-2xl font-bold text-center mb-8 neon-text">SVD Decomposition Process</h2>
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
              <div className="px-4 py-2 bg-space-800 rounded-lg border border-space-600">
                <span className="text-sm text-gray-400">Mathematical Steps</span>
                      </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                      </div>

            {/* Step-by-step explanation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Original Matrix A */}
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 hover:border-neon-500/40 transition-colors duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-neon-500 to-neon-500/80 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    </svg>
                      </div>
                  <h4 className="text-lg font-semibold neon-text">Original Matrix A</h4>
                    </div>
                
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  Every image is represented as a matrix where each element is a pixel value.
                </p>
                
                <div className="bg-space-700 p-3 rounded-lg">
                  <code 
                    className="text-sm font-mono text-neon-400"
                    dangerouslySetInnerHTML={{ __html: "A ∈ ℝ<sup>m×n</sup>" }}
                  />
                </div>
              </div>
              
              {/* SVD Decomposition */}
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 hover:border-plasma-500/40 transition-colors duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-plasma-500 to-plasma-500/80 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold neon-text">SVD Decomposition</h4>
                </div>
                
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  We decompose A into three matrices: U (left singular vectors), Σ (singular values), and V<sup>T</sup> (right singular vectors).
                </p>
                
                <div className="bg-space-700 p-3 rounded-lg">
                  <code 
                    className="text-sm font-mono text-neon-400"
                    dangerouslySetInnerHTML={{ __html: "A = UΣV<sup>T</sup>" }}
                  />
                        </div>
                      </div>

              {/* Rank-k Approximation */}
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 hover:border-matrix-500/40 transition-colors duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-matrix-500 to-matrix-500/80 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                        </div>
                  <h4 className="text-lg font-semibold neon-text">Rank-k Approximation</h4>
                      </div>
                
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  We keep only the top k singular values and discard the rest to achieve compression.
                </p>
                
                <div className="bg-space-700 p-3 rounded-lg">
                  <code 
                    className="text-sm font-mono text-neon-400"
                    dangerouslySetInnerHTML={{ __html: "A<sub>k</sub> = U<sub>k</sub> Σ<sub>k</sub> V<sub>k</sub><sup>T</sup>" }}
                  />
                    </div>
                  </div>
                  
              {/* Compressed Result */}
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 hover:border-quantum-500/40 transition-colors duration-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-gradient-to-r from-quantum-500 to-quantum-500/80 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                      </div>
                  <h4 className="text-lg font-semibold neon-text">Compressed Result</h4>
                      </div>
                
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  The reconstructed image uses only k singular values, significantly reducing storage requirements.
                </p>
                
                <div className="bg-space-700 p-3 rounded-lg">
                  <code className="text-sm font-mono text-neon-400">
                    Storage: k × (m + n + 1) numbers
                  </code>
                      </div>
                    </div>
                  </div>
          </div>
        </section>

                 {/* Compression Metrics */}
         {compressionResult && (
           <section className="mb-12">
             <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
               <h3 className="text-lg font-semibold mb-4">Compression Metrics</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="text-center p-3 bg-space-700 rounded-lg">
                   <div className="text-2xl font-bold text-green-400">
                     {(((compressionResult.originalSize || 0) - (compressionResult.compressedSize || 0)) / (compressionResult.originalSize || 1) * 100).toFixed(1)}%
                      </div>
                   <div className="text-xs text-gray-400">Size Reduction</div>
                      </div>
                 <div className="text-center p-3 bg-space-700 rounded-lg">
                   <div className="text-2xl font-bold text-blue-400">
                     {((compressionResult.quality || 0) * 100).toFixed(1)}%
                      </div>
                   <div className="text-xs text-gray-400">Quality Score</div>
                      </div>
                 <div className="text-center p-3 bg-space-700 rounded-lg">
                   <div className="text-2xl font-bold text-purple-400">
                     {compressionResult.rank}
                    </div>
                   <div className="text-xs text-gray-400">Rank Used</div>
                  </div>
                 <div className="text-center p-3 bg-space-700 rounded-lg">
                   <div className="text-2xl font-bold text-orange-400">
                     {(compressionResult.processingTime || 0).toFixed(0)}ms
                </div>
                   <div className="text-xs text-gray-400">Processing Time</div>
              </div>
            </div>
          </div>
        </section>
         )}

        {/* Compression Comparison Section */}
        <CompressionComparison />

        {/* SVD Math Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
            <h2 className="text-3xl font-bold text-center mb-8 neon-text">The Mathematics of SVD</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c-1.5 1.5-3.5 3-5.5 3s-4-1.5-5.5-3l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold neon-text">Singular Value Decomposition</h3>
                </div>
                
                <div className="space-y-4 text-gray-300">
                  <p className="text-lg leading-relaxed">
                    SVD breaks any matrix A into three components: <span className="hologram-text font-semibold">A = UΣV^T</span>
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-space-800/50 rounded-lg">
                      <span className="text-neon-400 font-semibold">U:</span> Left singular vectors (orthogonal)
                    </div>
                    <div className="p-3 bg-space-800/50 rounded-lg">
                      <span className="text-plasma-400 font-semibold">Σ:</span> Singular values (diagonal matrix)
                    </div>
                    <div className="p-3 bg-space-800/50 rounded-lg">
                      <span className="text-matrix-400 font-semibold">V^T:</span> Right singular vectors (orthogonal)
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl">
                  <div className="relative w-full h-64">
                    <Image src="/slides/assets/svg/mathematical-formulas.svg" alt="Mathematical Formulas" fill className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why SVD Works Section */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
            <h2 className="text-3xl font-bold text-center mb-8 neon-text">Why SVD Works</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold neon-text">The Key Insight</h3>
                </div>
                
                <div className="space-y-4 text-gray-300">
                  <p className="text-lg leading-relaxed">
                    Most images have <span className="hologram-text font-semibold">redundant information</span>. SVD automatically finds the most important patterns and discards the noise.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="p-3 bg-space-800/50 rounded-lg">
                      <span className="text-neon-400 font-semibold">Pattern Recognition:</span> SVD identifies dominant features
                    </div>
                    <div className="p-3 bg-space-800/50 rounded-lg">
                      <span className="text-plasma-400 font-semibold">Noise Reduction:</span> Small singular values represent noise
                    </div>
                    <div className="p-3 bg-space-800/50 rounded-lg">
                      <span className="text-matrix-400 font-semibold">Efficient Storage:</span> Keep only essential information
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-green-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold neon-text">Singular Value Distribution</h3>
                </div>
                
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl">
                  <div className="relative w-full h-64">
                    <Image src="/slides/assets/svg/singular-values-chart.svg" alt="Singular Values Chart" fill className="object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-World Applications */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
            <h2 className="text-3xl font-bold text-center mb-8 neon-text">Real-World Applications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2 neon-text">Image Compression</h3>
                <p className="text-sm text-gray-400 text-center">JPEG, PNG, and other formats use SVD principles</p>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2 neon-text">Computer Vision</h3>
                <p className="text-sm text-gray-400 text-center">Facial recognition and object detection</p>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c-1.5 1.5-3.5 3-5.5 3s-4-1.5-5.5-3l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2 neon-text">Data Mining</h3>
                <p className="text-sm text-gray-400 text-center">Pattern recognition in large datasets</p>
              </div>

              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2 neon-text">Recommendation Systems</h3>
                <p className="text-sm text-gray-400 text-center">Netflix, Amazon, and social media</p>
              </div>
            </div>
          </div>
        </section>

        {/* SVD Computation Guide */}
        <Suspense fallback={<div className="h-64 bg-gradient-to-br from-space-900 to-space-800 rounded-xl border border-space-700 animate-pulse" />}>
        <SVDComputationGuide />
        </Suspense>

        {/* References */}
        <Suspense fallback={<div className="h-48 bg-gradient-to-br from-space-900 to-space-800 rounded-xl border border-space-700 animate-pulse" />}>
        <ReferencesSection />
        </Suspense>

        {/* Quiz Section (Placed Last) */}
        <section id="quiz" className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
            <h2 className="text-3xl font-bold text-center mb-8 neon-text">Test Your Knowledge</h2>
            <Suspense fallback={<div className="h-64 bg-gradient-to-br from-space-800 to-space-700 rounded-xl animate-pulse" />}>
              <Quiz />
            </Suspense>
          </div>
        </section>

        {/* About the Author */}
        <Suspense fallback={<div className="h-32 bg-gradient-to-br from-space-900 to-space-800 rounded-xl border border-space-700 animate-pulse" />}>
          <AboutAuthor />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="bg-space-900 border-t border-space-700 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              {projectInfo.course} • {projectInfo.student} • {projectInfo.major} • {projectInfo.year}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Advanced SVD Image Compression with Robust Error Handling and Performance Optimization
            </p>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
