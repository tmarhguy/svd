#!/usr/bin/env node

// Script to preprocess a sample image and generate SVD data
// This runs in Node.js environment

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// SVD implementation for Node.js preprocessing
class NodeSVD {
  constructor(matrix) {
    this.matrix = matrix.map(row => [...row]);
    this.m = matrix.length;
    this.n = matrix[0].length;
    this.minDim = Math.min(this.m, this.n);
  }

  powerIteration(maxIterations = 30, tolerance = 1e-5, targetRank = null) {
    const rankToCompute = Math.min(this.minDim, Math.max(1, targetRank || this.minDim));
    const U = Array(this.m).fill(0).map(() => Array(rankToCompute).fill(0));
    const S = Array(rankToCompute).fill(0);
    const Vt = Array(rankToCompute).fill(0).map(() => Array(this.n).fill(0));
    
    const A = this.matrix.map(row => [...row]);
    
    for (let k = 0; k < rankToCompute; k++) {
      let u = Array(this.m).fill(0).map(() => Math.random() - 0.5);
      let v = Array(this.n).fill(0).map(() => Math.random() - 0.5);
      
      let prevSigma = 0;
      let sigma = 0;
      
      for (let iter = 0; iter < maxIterations; iter++) {
        // Update v = A^T * u
        for (let j = 0; j < this.n; j++) {
          let accum = 0;
          for (let i = 0; i < this.m; i++) {
            accum += A[i][j] * u[i];
          }
          v[j] = accum;
        }
        
        // Normalize v
        const vNorm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
        if (vNorm > 1e-10) {
          for (let j = 0; j < this.n; j++) v[j] = v[j] / vNorm;
        }
        
        // Update u = A * v
        for (let i = 0; i < this.m; i++) {
          let accum = 0;
          for (let j = 0; j < this.n; j++) {
            accum += A[i][j] * v[j];
          }
          u[i] = accum;
        }
        
        // Normalize u
        const uNorm = Math.sqrt(u.reduce((sum, val) => sum + val * val, 0));
        if (uNorm > 1e-10) {
          for (let i = 0; i < this.m; i++) u[i] = u[i] / uNorm;
        }
        
        // Calculate singular value
        sigma = 0;
        for (let i = 0; i < this.m; i++) {
          for (let j = 0; j < this.n; j++) {
            sigma += A[i][j] * u[i] * v[j];
          }
        }
        
        if (Math.abs(sigma - prevSigma) < tolerance) break;
        prevSigma = sigma;
      }
      
      S[k] = Math.abs(sigma);
      for (let i = 0; i < this.m; i++) {
        U[i][k] = u[i];
      }
      for (let j = 0; j < this.n; j++) {
        Vt[k][j] = v[j];
      }
      
      // Deflation
      for (let i = 0; i < this.m; i++) {
        for (let j = 0; j < this.n; j++) {
          A[i][j] = A[i][j] - sigma * u[i] * v[j];
        }
      }
    }
    
    return { U, S, Vt };
  }

  decompose(rank = null) {
    return this.powerIteration(30, 1e-5, rank);
  }
}

async function preprocessSampleImage() {
  console.log('🔄 Starting sample image preprocessing...');

  // Skip in CI/Vercel to avoid native canvas dependency issues during cloud builds
  if (process.env.VERCEL || process.env.CI) {
    console.log('⏭️  Skipping preprocessing in CI/VERCEL environment');
    return null;
  }
  
  try {
    // Use the existing ghanaimage.jpg as the sample
    const originalImagePath = path.join(__dirname, '../public/ghanaimage.jpg');
    if (!fs.existsSync(originalImagePath)) {
      throw new Error('ghanaimage.jpg not found in public folder');
    }
    
    console.log('📸 Using existing ghanaimage.jpg as sample image');

    // Load and process the image
    const image = await loadImage(originalImagePath);
    console.log(`📏 Image dimensions: ${image.width}x${image.height}`);
    
    // Resize for processing (256x256 for good balance of detail and speed)
    const targetSize = 256;
    const canvas = createCanvas(targetSize, targetSize);
    const ctx = canvas.getContext('2d');
    
    // Center-crop to square to preserve aspect ratio before scaling
    const side = Math.min(image.width, image.height);
    const sx = Math.floor((image.width - side) / 2);
    const sy = Math.floor((image.height - side) / 2);
    ctx.drawImage(image, sx, sy, side, side, 0, 0, targetSize, targetSize);
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
    
    // Extract RGB channels
    const { r, g, b } = extractChannels(imageData);
    
    console.log('🔢 Computing SVD for each channel...');
    
    // Compute SVD for each channel with multiple ranks
    const svdData = {
      metadata: {
        width: targetSize,
        height: targetSize,
        channels: 3,
        format: 'jpeg',
        colorSpace: 'rgb',
        maxRank: Math.min(targetSize, targetSize),
        optimalRank: 50,
        originalSize: fs.statSync(originalImagePath).size
      },
      channels: {
        red: computeChannelSVD(r, 'Red'),
        green: computeChannelSVD(g, 'Green'),
        blue: computeChannelSVD(b, 'Blue')
      },
      precomputedResults: {}
    };

    // Precompute results for common ranks
    const commonRanks = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    console.log('🎯 Precomputing results for ranks:', commonRanks.join(', '));
    
    for (const rank of commonRanks) {
      if (rank <= svdData.metadata.maxRank) {
        svdData.precomputedResults[rank] = await computeCompressedResult(
          svdData.channels, 
          rank, 
          svdData.metadata
        );
        console.log(`✅ Rank ${rank} complete`);
      }
    }

    // Save the preprocessed data
    const outputPath = path.join(__dirname, '../public/ghanaimage-svd-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(svdData, null, 2));
    
    console.log(`💾 Preprocessed data saved to: ${outputPath}`);
    console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    console.log('✨ Preprocessing complete!');
    
    return svdData;
    
  } catch (error) {
    console.error('❌ Error during preprocessing:', error);
    process.exit(1);
  }
}

function extractChannels(imageData) {
  const { data, width, height } = imageData;
  const r = [], g = [], b = [];
  
  for (let y = 0; y < height; y++) {
    const rRow = [], gRow = [], bRow = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      rRow.push(data[idx]);
      gRow.push(data[idx + 1]);
      bRow.push(data[idx + 2]);
    }
    r.push(rRow);
    g.push(gRow);
    b.push(bRow);
  }
  
  return { r, g, b };
}

function computeChannelSVD(matrix, channelName) {
  console.log(`  🔄 Computing SVD for ${channelName} channel...`);
  const svd = new NodeSVD(matrix);
  const result = svd.decompose();
  
  // Keep only top 100 singular values for storage efficiency
  const maxStore = 100;
  return {
    U: result.U.map(row => row.slice(0, maxStore)),
    S: result.S.slice(0, maxStore),
    Vt: result.Vt.slice(0, maxStore),
    fullRank: result.S.length
  };
}

async function computeCompressedResult(channels, rank, metadata) {
  // Reconstruct each channel with the given rank
  const reconstructed = {
    red: reconstructChannel(channels.red, rank),
    green: reconstructChannel(channels.green, rank),
    blue: reconstructChannel(channels.blue, rank)
  };
  
  // Calculate compression metrics
  const originalPixels = metadata.width * metadata.height * 3;
  const compressedPixels = rank * (metadata.width + metadata.height + 1) * 3;
  const compressionRatio = Math.round((1 - compressedPixels / originalPixels) * 100);
  
  // Calculate quality score (simplified)
  const quality = Math.min(0.95, 0.5 + (rank / metadata.maxRank) * 0.45);
  
  // Calculate error (simplified)
  const error = Math.max(0.01, 0.2 - (rank / metadata.maxRank) * 0.19);
  
  return {
    rank,
    compressionRatio,
    quality,
    error,
    originalSize: metadata.originalSize,
    compressedSize: Math.round(metadata.originalSize * (1 - compressionRatio / 100)),
    processingTime: Math.round(50 + Math.random() * 100), // Simulated
    singularValues: channels.red.S.slice(0, rank),
    metadata
  };
}

function reconstructChannel(channelSVD, rank) {
  const k = Math.min(rank, channelSVD.S.length);
  const { U, S, Vt } = channelSVD;
  
  // Reconstruct: A_k = U_k * S_k * Vt_k
  const result = [];
  for (let i = 0; i < U.length; i++) {
    const row = [];
    for (let j = 0; j < Vt[0].length; j++) {
      let value = 0;
      for (let l = 0; l < k; l++) {
        value += (U[i][l] || 0) * (S[l] || 0) * (Vt[l][j] || 0);
      }
      row.push(Math.max(0, Math.min(255, Math.round(value))));
    }
    result.push(row);
  }
  
  return result;
}



// Run the preprocessing when executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  preprocessSampleImage().catch(console.error);
}

export { preprocessSampleImage };
