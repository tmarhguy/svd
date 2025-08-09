import { useState, useEffect } from 'react';
import { CompressionResult } from '../utils/svdCompression';

interface SampleData {
  metadata: {
    width: number;
    height: number;
    channels: number;
    format: string;
    colorSpace: 'grayscale' | 'rgb' | 'rgba';
    maxRank: number;
    optimalRank: number;
    originalSize: number;
  };
  channels: {
    red: { U: number[][]; S: number[]; Vt: number[][]; fullRank: number };
    green: { U: number[][]; S: number[]; Vt: number[][]; fullRank: number };
    blue: { U: number[][]; S: number[]; Vt: number[][]; fullRank: number };
  };
  precomputedResults: Record<string, CompressionResult>;
}

export function useSampleData() {
  const [sampleData, setSampleData] = useState<SampleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSampleData = async () => {
      try {
        setLoading(true);
        // Load the preprocessed data
        const response = await fetch('/ghanaimage-svd-data.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load sample data: ${response.status}`);
        }
        
        const data = await response.json();
        setSampleData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading sample data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load sample data');
      } finally {
        setLoading(false);
      }
    };

    loadSampleData();
  }, []);

  const getSampleFile = async (): Promise<File | null> => {
    try {
      const response = await fetch('/ghanaimage.jpg');
      if (!response.ok) return null;
      
      const blob = await response.blob();
      return new File([blob], 'ghanaimage.jpg', { type: 'image/jpeg' });
    } catch (err) {
      console.error('Error loading sample file:', err);
      return null;
    }
  };

  const getPrecomputedResult = (rank: number): CompressionResult | null => {
    if (!sampleData) return null;
    return sampleData.precomputedResults[rank.toString()] || null;
  };

  const getSingularValues = (): Record<string, number[]> => {
    if (!sampleData) return {};
    
    return {
      red: sampleData.channels.red.S || [],
      green: sampleData.channels.green.S || [],
      blue: sampleData.channels.blue.S || []
    };
  };

  const getPrecomputedData = () => {
    if (!sampleData) return null;
    
    return {
      factors: [
        sampleData.channels.red,
        sampleData.channels.green,
        sampleData.channels.blue
      ],
      imageData: new ImageData(sampleData.metadata.width, sampleData.metadata.height),
      metadata: sampleData.metadata,
      originalFileSize: sampleData.metadata.originalSize
    };
  };

  return {
    sampleData,
    loading,
    error,
    getSampleFile,
    getPrecomputedResult,
    getSingularValues,
    getPrecomputedData
  };
}
