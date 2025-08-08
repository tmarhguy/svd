"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Cpu, Upload, Brain, Zap, Atom, Rocket, Target, Database, Network, Code, BarChart3, TrendingUp, Eye, Palette, Layers, CpuIcon, Video, Settings, Gauge, Shield, Sparkles } from "lucide-react";
import { compressImage, getSingularValues, CompressionResult, CompressionOptions, estimateOptimalRank, calculateCompressionEfficiency, precomputeSVD, reconstructFromPrecomputed } from "../utils/svdCompression";

import DropZone from "../components/DropZone";
import Quiz from "../components/Quiz";
import WelcomeSection from "../components/WelcomeSection";
import ErrorCurve from "../components/ErrorCurve";
import ProcessingProgressRing from "../components/ProcessingProgressRing";
import SVDVisualization from "../components/SVDVisualization";
import SVDComputationGuide from "../components/SVDComputationGuide";
import CompressionComparison from "../components/CompressionComparison";
import WriteupSection from "../components/WriteupSection";
import ReferencesSection from "../components/ReferencesSection";
import AboutAuthor from "../components/AboutAuthor";
import MatrixRepresentation from "../components/MatrixRepresentation";
import ErrorBoundary from "../components/ErrorBoundary";
import PerformanceMonitor from "../components/PerformanceMonitor";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
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
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const [singularValues, setSingularValues] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
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

  // Precompute SVD factors on file or color mode change (channels differ)
  useEffect(() => {
    if (!file) return;

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
        const svPayload: any = isColor
          ? { grayscale: first.S, rgb: pc.factors.map((f) => f.S) }
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
  }, [file, compressionOptions.colorMode]);

  // Fast reconstruction when rank or engine/size constraints change
  useEffect(() => {
    if (!file || !precomputed) return;
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
  }, [precomputed, compressionOptions.rank, compressionOptions.maxSize, compressionOptions.colorMix]);

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
    setError("");
    setCompressionResult(null);
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
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center space-x-2 px-4 py-2 bg-space-800 hover:bg-space-700 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Advanced</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-16 md:space-y-24">
        {/* Welcome Section */}
        <WelcomeSection />

        {/* Main Compression Interface */}
        <section id="demo" className="pt-1 mt-16 md:mt-24 mb-12">
          {/* Image Comparison - Full Width */}
          {file && compressedUrl && (
            <div className="mb-8">
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
                <h3 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Image Comparison</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Original Image</h4>
                      <div className="relative aspect-square bg-space-900 rounded-lg overflow-hidden">
                        <Image 
                          src={URL.createObjectURL(file)} 
                          alt="Original" 
                          fill
                          className="object-contain rounded-lg" 
                        />
                      </div>
                    <div className="text-center text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      Size: {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Compressed Image</h4>
                    <div className="relative aspect-square bg-space-900 rounded-lg overflow-hidden">
                      <Image 
                        src={compressedUrl} 
                        alt="Compressed" 
                        fill
                        className="object-contain rounded-lg" 
                      />
                    </div>
                    <div className="text-center text-sm font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                      {compressionResult && (
                        <>
                          Size: {(compressionResult.compressedSize / 1024).toFixed(1)} KB •{' '}
                          Rank: {compressionResult.rank} •{' '}
                          Quality: {(compressionResult.quality * 100).toFixed(1)}%
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Controls (near image) */}
                <div className="mt-6 p-4 bg-space-800/50 rounded-lg border border-space-600">
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
                        className="w-full h-3 bg-space-600 rounded-lg appearance-none cursor-pointer rank-slider"
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
                        className="w-full h-3 bg-space-600 rounded-lg appearance-none cursor-pointer rank-slider"
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
                          {compressionResult.compressionRatio.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Size Reduction</div>
                      </div>
                      <div className="text-center p-3 bg-space-700 rounded-lg">
                        <div className="text-xl font-bold text-blue-400">
                          {(compressionResult.quality * 100).toFixed(1)}%
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
                          {compressionResult.processingTime.toFixed(0)}ms
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
          {file && (
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
                  <span>Image Upload</span>
                </h2>
                
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
                      className="w-full h-3 bg-space-600 rounded-lg appearance-none cursor-pointer rank-slider"
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
              {showAdvancedOptions && (
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
              )}
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
                        {compressionResult.compressionRatio.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Size Reduction</div>
                    </div>
                    
                    <div className="text-center p-3 bg-space-700 rounded-lg">
                      <div className="text-2xl font-bold text-blue-400">
                        {(compressionResult.quality * 100).toFixed(1)}%
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
                        {compressionResult.processingTime.toFixed(0)}ms
                      </div>
                      <div className="text-xs text-gray-400">Processing Time</div>
                    </div>
                  </div>

                  {efficiencyMetrics && (
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>• Storage Efficiency: {efficiencyMetrics.storageEfficiency.toFixed(1)}%</p>
                      <p>• Quality Efficiency: {efficiencyMetrics.qualityEfficiency.toFixed(1)}%</p>
                      <p>• Reconstruction Error: {compressionResult.error.toFixed(4)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Error Curve */}
        {Object.keys(singularValues).length > 0 && (
          <section className="mb-12">
            <ErrorCurve
              singularValues={singularValues}
              currentRank={compressionOptions.rank || 50}
              imageType="grayscale"
            />
          </section>
        )}

        {/* SVD Visualization */}
        {Object.keys(singularValues).length > 0 && (
          <section className="mb-12">
            <SVDVisualization
              singularValues={singularValues}
              currentRank={compressionOptions.rank || 50}
              imageType="grayscale"
            />
          </section>
        )}

                 {/* Compression Metrics */}
         {compressionResult && (
           <section className="mb-12">
             <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
               <h3 className="text-lg font-semibold mb-4">Compression Metrics</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="text-center p-3 bg-space-700 rounded-lg">
                   <div className="text-2xl font-bold text-green-400">
                     {((compressionResult.originalSize - compressionResult.compressedSize) / compressionResult.originalSize * 100).toFixed(1)}%
                   </div>
                   <div className="text-xs text-gray-400">Size Reduction</div>
                 </div>
                 <div className="text-center p-3 bg-space-700 rounded-lg">
                   <div className="text-2xl font-bold text-blue-400">
                     {(compressionResult.quality * 100).toFixed(1)}%
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
                     {compressionResult.processingTime.toFixed(0)}ms
                   </div>
                   <div className="text-xs text-gray-400">Processing Time</div>
                 </div>
               </div>
             </div>
           </section>
         )}

        {/* What is an Image? Section */}
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
                                                 <span className="text-neon-400 font-semibold">Grayscale Image:</span> Matrix A ∈ ℝ^(m×n)
                      </div>
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-plasma-400 font-semibold">Color Image:</span> Three matrices A_R, A_G, A_B ∈ ℝ^(m×n)
                      </div>
                      <div className="p-3 bg-space-800/50 rounded-lg">
                        <span className="text-matrix-400 font-semibold">Pixel Value:</span> a_ij ∈ [0, 255] for grayscale
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
                        <span><span className="text-purple-400 font-semibold">Perceptual redundancy</span> - humans don't notice small changes</span>
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
        <WriteupSection />

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
        <SVDComputationGuide />

        {/* References */}
        <ReferencesSection />

        {/* Quiz Section (Placed Last) */}
        <section id="quiz" className="mb-12">
          <div className="bg-gradient-to-br from-space-900 to-space-800 p-8 rounded-xl border border-space-700">
            <h2 className="text-3xl font-bold text-center mb-8 neon-text">Test Your Knowledge</h2>
            <Quiz />
          </div>
        </section>

        {/* About the Author */}
        <AboutAuthor />
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
