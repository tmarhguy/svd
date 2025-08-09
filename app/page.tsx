"use client";

import { useState, useEffect, lazy, Suspense, useCallback, useMemo, memo, useRef } from "react";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { Gauge } from "../components/icons";
import { CompressionResult, CompressionOptions, precomputeSVD, reconstructFromPrecomputed } from "../utils/svdCompression";
import { useSampleData } from "../hooks/useSampleData";

import DropZone from "../components/DropZone";
import WelcomeSection from "../components/WelcomeSection";
import ProcessingProgressRing from "../components/ProcessingProgressRing";
import ErrorBoundary from "../components/ErrorBoundary";

// Lazy load heavy components
const MatrixRepresentation = dynamic(() => import("../components/MatrixRepresentation"), {
  loading: () => <div className="h-96 bg-space-800 animate-pulse rounded-xl" />,
  ssr: false
});

const PerformanceMonitor = dynamic(() => import("../components/PerformanceMonitor"), {
  loading: () => null,
  ssr: false
});

const Quiz = lazy(() => import("../components/Quiz"));
const SVDComputationGuide = lazy(() => import("../components/SVDComputationGuide"));
const CompressionComparison = lazy(() => import("../components/CompressionComparison"));
const WriteupSection = lazy(() => import("../components/WriteupSection"));
const ReferencesSection = lazy(() => import("../components/ReferencesSection"));
const AboutAuthor = lazy(() => import("../components/AboutAuthor"));

// Memoized control panel component
const ControlPanel = memo(({ 
  compressionOptions, 
  onOptionsChange,
  processingProgress,
  loading,
  compressionResult 
}: {
  compressionOptions: CompressionOptions;
  onOptionsChange: (options: CompressionOptions) => void;
  processingProgress: number;
  loading: boolean;
  compressionResult: CompressionResult | null;
}) => {
  const handleRankChange = useCallback((value: number) => {
    onOptionsChange({ ...compressionOptions, rank: value });
  }, [compressionOptions, onOptionsChange]);

  const handleColorMixChange = useCallback((value: number) => {
    onOptionsChange({ ...compressionOptions, colorMix: value / 100 });
  }, [compressionOptions, onOptionsChange]);

  const handleAlgorithmChange = useCallback((value: string) => {
    onOptionsChange({ 
      ...compressionOptions, 
      algorithm: value as 'power-iteration' | 'jacobi' | 'qr-iteration' 
    });
  }, [compressionOptions, onOptionsChange]);

  return (
    <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600">
      <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
        <Gauge className="w-5 h-5 text-blue-400" />
        <span>Compression Controls</span>
      </h3>
      
      <div className="space-y-4">
        {/* Rank Control */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Rank (k = {compressionOptions.rank})
            </span>
            <span className="text-xs text-gray-400">
              Lower = More Compression
            </span>
          </label>
          <input
            type="range"
            min="5"
            max="100"
            value={compressionOptions.rank}
            onChange={(e) => handleRankChange(parseInt(e.target.value))}
            className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Color Mix Control */}
        <div>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Grayscale to Color ({Math.round((compressionOptions.colorMix ?? 1) * 100)}%)
            </span>
            <span className="text-xs text-gray-400">
              Visual Fidelity
            </span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={(compressionOptions.colorMix ?? 1) * 100}
            onChange={(e) => handleColorMixChange(parseInt(e.target.value))}
            className="w-full h-2 bg-space-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Algorithm Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Algorithm
          </label>
          <select
            value={compressionOptions.algorithm || 'power-iteration'}
            onChange={(e) => handleAlgorithmChange(e.target.value)}
            className="w-full px-3 py-2 bg-space-700 border border-space-600 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="power-iteration">Power Iteration (Fast)</option>
            <option value="jacobi">Jacobi (Balanced)</option>
            <option value="qr-iteration">QR Iteration (Accurate)</option>
          </select>
        </div>

        {/* Performance note */}
        <p className="text-xs text-gray-500 mt-2">
          Tip: Smaller images (lower resolution) process and update faster. Large uploads may be downscaled for responsiveness.
        </p>

        {/* Progress Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <ProcessingProgressRing
              progress={processingProgress}
              done={false}
              label="Processing"
            />
          </div>
        )}

        {/* Compression Stats */}
        {compressionResult && !loading && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-space-600">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {Number.isFinite(compressionResult.compressionRatio) ? Math.round(compressionResult.compressionRatio) : 0}%
              </div>
              <div className="text-xs text-gray-400">Compression</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {Math.round((compressionOptions.colorMix ?? 1) * 100)}%
              </div>
              <div className="text-xs text-gray-400">Color</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ControlPanel.displayName = 'ControlPanel';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    rank: 30,
    quality: 0.8,
    colorMix: 1,
    algorithm: 'power-iteration',
    colorMode: 'auto',
    optimization: 'balanced',
    maxSize: 5 * 1024 * 1024,
    errorThreshold: 1e-5,
    maxIterations: 35
  });
  const [compressedUrl, setCompressedUrl] = useState<string>("");
  const previousCompressedUrlRef = useRef<string>("");
  const [originalUrl, setOriginalUrl] = useState<string>("");
  const previousOriginalUrlRef = useRef<string>("");
  const [originalAspect, setOriginalAspect] = useState<number>(1);
  
  // Simple fallback - only if sample data failed to load
  // Note: depends on sampleLoading/sampleData/sampleError, so declare after hook

  // Track original image aspect ratio
  useEffect(() => {
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        if (img.width > 0 && img.height > 0) {
          setOriginalAspect(img.width / img.height);
        }
        URL.revokeObjectURL(url);
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } catch {}
  }, [file]);

  // Stable object URL for original image to prevent flicker on re-renders
  useEffect(() => {
    if (!file) {
      // Cleanup when file is cleared
      if (previousOriginalUrlRef.current) {
        try { URL.revokeObjectURL(previousOriginalUrlRef.current); } catch {}
      }
      setOriginalUrl("");
      previousOriginalUrlRef.current = "";
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    const prev = previousOriginalUrlRef.current;
    setOriginalUrl(nextUrl);
    previousOriginalUrlRef.current = nextUrl;
    if (prev) {
      try { URL.revokeObjectURL(prev); } catch {}
    }
    return () => {
      if (previousOriginalUrlRef.current) {
        try { URL.revokeObjectURL(previousOriginalUrlRef.current); } catch {}
        previousOriginalUrlRef.current = "";
      }
    };
  }, [file]);
  const [singularValues, setSingularValues] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [compressionResult, setCompressionResult] = useState<CompressionResult | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [precomputed, setPrecomputed] = useState<{
    factors: { U: number[][]; S: number[]; Vt: number[][] }[];
    imageData: ImageData;
    metadata: { width: number; height: number; channels: number; format: string; colorSpace: 'grayscale' | 'rgb' | 'rgba'; maxRank: number; optimalRank: number };
    originalFileSize: number;
  } | null>(null);

  // Load sample data
  const { 
    sampleData, 
    loading: sampleLoading, 
    error: sampleError,
    getSampleFile,
    getPrecomputedResult,
    getSingularValues,
    getPrecomputedData
  } = useSampleData();
  // Simple fallback - only if sample data failed to load
  useEffect(() => {
    if (isClient && !file && isDefaultImage && !sampleLoading && (!sampleData || sampleError)) {
      const loadSimpleSample = async () => {
        try {
          console.log('🔄 Loading simple sample fallback...');
          const response = await fetch('/ghanaimage.jpg');
          if (response.ok) {
            const blob = await response.blob();
            const sampleFile = new File([blob], 'ghanaimage.jpg', { type: 'image/jpeg' });
            setFile(sampleFile);
            setCompressedUrl("");
            console.log('✅ Simple sample loaded');
          }
        } catch (err) {
          console.error('❌ Error loading simple sample:', err);
        }
      };
      loadSimpleSample();
    }
  }, [isClient, file, isDefaultImage, sampleLoading, sampleData, sampleError]);

  // Project Information
  const projectInfo = useMemo(() => ({
    student: "Tyrone Marhguy",
    course: "MATH 3120 - Numerical Linear Algebra",
    project: "SVD Image Compression",
    instructor: "Maxine Calle",
    semester: "Fall 2024",
    university: "University of Pennsylvania"
  }), []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoized compression handler
  const handleCompression = useCallback(async (imageFile: File, options: CompressionOptions) => {
    setLoading(true);
    setError("");
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => Math.min(prev + 5, 90));
    }, 200);

    try {
      const precomputedData = await precomputeSVD(imageFile, options);
      setPrecomputed(precomputedData);

      const svdData: Record<string, number[]> = {};
      precomputedData.factors.forEach((factor, idx) => {
        svdData[idx === 0 ? 'red' : idx === 1 ? 'green' : 'blue'] = factor.S;
      });
      setSingularValues(svdData);

      const result = await reconstructFromPrecomputed(precomputedData, options.rank || 30, options);
      setCompressionResult(result);
      setCompressedUrl(result.compressedImage);
      setProcessingProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compression failed");
      console.error("Compression error:", err);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setTimeout(() => setProcessingProgress(0), 1000);
    }
  }, []);

  // Revoke old blob URLs to avoid memory leaks
  useEffect(() => {
    const previous = previousCompressedUrlRef.current;
    if (previous && previous !== compressedUrl) {
      try { URL.revokeObjectURL(previous); } catch {}
    }
    if (compressedUrl) {
      previousCompressedUrlRef.current = compressedUrl;
    }
    return () => {
      if (previousCompressedUrlRef.current) {
        try { URL.revokeObjectURL(previousCompressedUrlRef.current); } catch {}
      }
    };
  }, [compressedUrl]);

  // Initialize with sample data when available
  useEffect(() => {
    console.log('🎯 Sample initialization effect:', { 
      hasSampleData: !!sampleData, 
      hasFile: !!file, 
      isDefaultImage, 
      sampleLoading,
      sampleError 
    });
    
    if (sampleData && !file && isDefaultImage) {
      const initializeSample = async () => {
        try {
          console.log('🚀 Initializing sample...');
          
          // Load the sample file
          const sampleFile = await getSampleFile();
          console.log('📁 Sample file loaded:', !!sampleFile);
          
          if (sampleFile) {
            setFile(sampleFile);
            const sizesMatch = !!sampleData && typeof sampleData.metadata?.originalSize === 'number' && sampleData.metadata.originalSize === sampleFile.size;
            if (sizesMatch) {
              // Use precomputed only if it matches current default image
              const precomputedData = getPrecomputedData();
              if (precomputedData) {
                setPrecomputed(precomputedData);
                const result = await reconstructFromPrecomputed(precomputedData, compressionOptions.rank || 30, compressionOptions);
                setCompressionResult(result);
                setCompressedUrl(result.compressedImage);
              } else {
                setCompressedUrl("");
              }
              const singularVals = getSingularValues();
              if (singularVals.red && singularVals.green && singularVals.blue) {
                setSingularValues(singularVals);
              }
            } else {
              console.warn('⚠️ Sample JSON does not match current default image; computing fresh.');
              setPrecomputed(null);
              setCompressionResult(null);
              setSingularValues({});
              setCompressedUrl("");
              await handleCompression(sampleFile, compressionOptions);
            }
            
            console.log('✅ Sample initialization complete');
          }
        } catch (err) {
          console.error('❌ Error initializing sample:', err);
        }
      };
      
      initializeSample();
    }
  }, [sampleData, file, isDefaultImage, compressionOptions, getSampleFile, getPrecomputedResult, getSingularValues, getPrecomputedData, sampleLoading, sampleError, handleCompression]);

  // Duplicate definition removed (see single definition above)

  // Handle file drop
  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    const imageFile = acceptedFiles[0];
    if (!imageFile) return;

    // Reset all relevant states for a new image
    setFile(imageFile);
    setIsDefaultImage(false);
    setPrecomputed(null);
    setCompressionResult(null);
    setSingularValues({});
    setCompressedUrl(''); // Clear previous compressed image
    setError('');

    // Immediately trigger compression for the new file
    await handleCompression(imageFile, compressionOptions);
  }, [compressionOptions, handleCompression]);

  // Unified options change handler with debouncing
  const handleOptionsChange = useCallback((newOptions: CompressionOptions) => {
    setCompressionOptions(newOptions);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (precomputed) {
          // Use fast reconstruction if precomputed data is available
          const result = await reconstructFromPrecomputed(precomputed, newOptions.rank || 30, newOptions);
          setCompressionResult(result);
          setCompressedUrl(result.compressedImage);
        } else if (file) {
          // Otherwise, perform a full compression
          await handleCompression(file, newOptions);
        } else {
          // No inputs available yet; skip
          return;
        }
      } catch (err) {
        console.error("Compression/Reconstruction error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred during image processing.");
      } finally {
        setLoading(false);
      }
    }, isDefaultImage ? 50 : 250); // Shorter delay for responsive sample, longer for uploads
  }, [file, precomputed, isDefaultImage, handleCompression]);


  return (
    <ErrorBoundary>
      <main className="min-h-screen">
        {/* Welcome Section */}
        <WelcomeSection />

        {/* Interactive Demo Section */}
        <section id="demo" className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Interactive SVD Compression
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the power of Singular Value Decomposition in real-time. 
                Upload an image or use our default to see how mathematical decomposition 
                can achieve impressive compression ratios while preserving visual quality.
              </p>
                      </div>
                      
                        {/* File Upload Area */}
            <div className="mb-8">
              <DropZone onFile={(file) => handleFileDrop([file])} />
              
              {/* Show sample loading status */}
              {isClient && sampleLoading && !file && (
                <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-300">
                  Loading sample image and data...
                          </div>
                        )}
                        
              {isClient && sampleError && (
                <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg text-yellow-300">
                  Could not load sample data: {sampleError}
                          </div>
                        )}
              
              {isClient && error && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                  {error}
                        </div>
                      )}

                            {/* Sample indicator removed */}
              
              {!isDefaultImage && file && sampleData && (
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      const sampleFile = await getSampleFile();
                      if (sampleFile) {
                        setFile(sampleFile);
                        setIsDefaultImage(true);
                        const result = getPrecomputedResult(compressionOptions.rank || 30);
                        if (result) {
                          setCompressionResult(result);
                          setCompressedUrl(result.compressedImage);
                        }
                        const singularVals = getSingularValues();
                        if (singularVals.red && singularVals.green && singularVals.blue) {
                          setSingularValues(singularVals);
                        }
                        const precomputedData = getPrecomputedData();
                        if (precomputedData) {
                          setPrecomputed(precomputedData);
                        }
                      }
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Back to Default Image
                  </button>
                      </div>
                )}
                </div>

            {/* Debug Info removed */}

            {/* Compression Interface */}
            {file && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls */}
                <div className="lg:col-span-1">
                  <ControlPanel
                    compressionOptions={compressionOptions}
                    onOptionsChange={handleOptionsChange}
                    processingProgress={processingProgress}
                    loading={loading}
                compressionResult={compressionResult}
              />
            </div>
              
                {/* Image Comparison */}
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-2 gap-6 items-stretch">
                    {/* Original Image */}
              <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 h-full">
                      <h3 className="text-lg font-semibold mb-4 text-center">Original</h3>
                      <div className="relative rounded-lg overflow-hidden bg-black/50" style={{ paddingTop: `${100 / Math.max(0.0001, originalAspect)}%` }}>
                        {isClient && originalUrl && (
                          <NextImage 
                            src={originalUrl} 
                            alt="Original"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        )}
                      </div>
                </div>
 
                     {/* Compressed Image */}
                <div className="bg-gradient-to-br from-space-800 to-space-700 p-6 rounded-xl border border-space-600 h-full">
                      <h3 className="text-lg font-semibold mb-4 text-center">
                        Compressed (k={compressionOptions.rank})
                  </h3>
                      <div className="relative rounded-lg overflow-hidden bg-black/50" style={{ paddingTop: `${100 / Math.max(0.0001, originalAspect)}%` }}>
                        {compressedUrl && (
                          <NextImage 
                            src={compressedUrl} 
                            alt="Compressed" 
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        )}
                      </div>
                     </div>
             </div>

              {/* Performance Monitor */}
                  {isClient && (
                    <div className="mt-6">
              <PerformanceMonitor 
                isProcessing={loading}
                metrics={compressionResult ? {
                  processingTime: compressionResult.processingTime,
                          memoryUsage: compressionResult.compressedSize,
                          cpuUsage: 0,
                  compressionRatio: compressionResult.compressionRatio,
                  qualityScore: compressionResult.quality
                } : null}
                        onMetricsUpdate={() => {}}
                      />
                    </div>
                  )}
                </div>
            </div>
            )}

            {/* Matrix Representation */}
            {file && !loading && (
              <div className="mt-12">
                <MatrixRepresentation
                  file={file}
                  compressionResult={compressionResult}
                  singularValues={singularValues}
                />
              </div>
            )}

            {/* Writeup: moved directly after Matrix */}
            <Suspense fallback={<div className="h-96 bg-space-800 animate-pulse rounded-xl" />}>
              <div className="mt-12">
                <WriteupSection />
              </div>
            </Suspense>
        </div>
        </section>

        {/* Educational Content - Lazy Loaded */}
        <Suspense fallback={<div className="h-96 bg-space-900 animate-pulse" />}>
          <section className="py-20 px-6 bg-gradient-to-b from-space-900 to-space-800">
            <div className="max-w-7xl mx-auto">
        <CompressionComparison />
              <SVDComputationGuide />
          </div>
        </section>
        </Suspense>

        {/* Interactive Content */}
        <Suspense fallback={<div className="h-96 bg-space-800 animate-pulse" />}>
          <section className="py-20 px-6">
            <div className="max-w-7xl mx-auto">
              <Quiz />
          </div>
        </section>
        </Suspense>

        {/* Footer Content */}
        <Suspense fallback={null}>
          <footer className="py-20 px-6 bg-gradient-to-t from-space-950 to-space-900">
            <div className="max-w-7xl mx-auto">
              <ReferencesSection />
          <AboutAuthor />
              
              {/* Project Info */}
              <div className="mt-12 pt-8 border-t border-space-800 text-center text-sm text-gray-400">
                <p>
                  {projectInfo.project} by {projectInfo.student}
                </p>
                <p className="mt-1">
                  {projectInfo.course} • {projectInfo.semester} • {projectInfo.university}
            </p>
          </div>
        </div>
      </footer>
        </Suspense>
      </main>
    </ErrorBoundary>
  );
}
