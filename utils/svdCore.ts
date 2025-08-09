// DOM-free SVD core usable in both main thread and workers

export interface SVDRawResult {
  U: number[][];
  S: number[];
  Vt: number[][];
}

export interface CoreOptions {
  rank?: number;
  algorithm?: 'power-iteration' | 'jacobi' | 'qr-iteration';
  errorThreshold?: number;
  maxIterations?: number;
}

export class RobustSVD {
  private matrix: number[][];
  private m: number;
  private n: number;
  private minDim: number;

  constructor(matrix: number[][]) {
    if (!Array.isArray(matrix) || matrix.length === 0 || !Array.isArray(matrix[0]) || matrix[0].length === 0) {
      throw new Error('Invalid matrix: expected non-empty 2D array');
    }
    this.matrix = matrix.map(row => [...row]);
    this.m = matrix.length;
    this.n = matrix[0]!.length;
    this.minDim = Math.min(this.m, this.n);
  }

  private powerIteration(
    maxIterations: number = 50,
    tolerance: number = 1e-6,
    targetRank?: number
  ): SVDRawResult {
    const rankToCompute = Math.min(this.minDim, Math.max(1, targetRank ?? this.minDim));
    const U: number[][] = Array(this.m).fill(0).map(() => Array(rankToCompute).fill(0));
    const S: number[] = Array(rankToCompute).fill(0);
    const Vt: number[][] = Array(rankToCompute).fill(0).map(() => Array(this.n).fill(0));

    const A = this.matrix.map(row => [...row]);

    for (let k = 0; k < rankToCompute; k++) {
      let u = Array(this.m).fill(0).map(() => Math.random() - 0.5);
      let v = Array(this.n).fill(0).map(() => Math.random() - 0.5);

      let prevSigma = 0;
      let sigma = 0;

      for (let iter = 0; iter < maxIterations; iter++) {
        for (let j = 0; j < this.n; j++) {
          let accum = 0;
          for (let i = 0; i < this.m; i++) {
            const Ai = A[i] as number[];
            const ui = u[i] ?? 0;
            accum += (Ai[j] ?? 0) * ui;
          }
          v[j] = accum;
        }
        const vNorm = Math.sqrt(v.reduce((sum, val) => sum + (val ?? 0) * (val ?? 0), 0));
        if (vNorm > 1e-10) {
          for (let j = 0; j < this.n; j++) v[j] = ((v[j] ?? 0) / vNorm);
        }

        for (let i = 0; i < this.m; i++) {
          let accum = 0;
          const Ai = A[i] as number[];
          for (let j = 0; j < this.n; j++) {
            const vj = v[j] ?? 0;
            accum += (Ai[j] ?? 0) * vj;
          }
          u[i] = accum;
        }
        const uNorm = Math.sqrt(u.reduce((sum, val) => sum + (val ?? 0) * (val ?? 0), 0));
        if (uNorm > 1e-10) {
          for (let i = 0; i < this.m; i++) u[i] = ((u[i] ?? 0) / uNorm);
        }

        sigma = 0;
        for (let i = 0; i < this.m; i++) {
          const Ai = A[i] as number[];
          const ui = u[i] ?? 0;
          for (let j = 0; j < this.n; j++) {
            const vj = v[j] ?? 0;
            sigma += (Ai[j] ?? 0) * ui * vj;
          }
        }

        if (Math.abs(sigma - prevSigma) < tolerance) break;
        prevSigma = sigma;
      }

      S[k] = Math.abs(sigma);
      for (let i = 0; i < this.m; i++) {
        const Ui = U[i] as number[];
        Ui[k] = (u[i] ?? 0);
      }
      const Vtk = Vt[k] as number[];
      for (let j = 0; j < this.n; j++) {
        Vtk[j] = (v[j] ?? 0);
      }

      for (let i = 0; i < this.m; i++) {
        const Ai = A[i] as number[];
        const ui = u[i] ?? 0;
        for (let j = 0; j < this.n; j++) {
          const vj = v[j] ?? 0;
          Ai[j] = (Ai[j] ?? 0) - sigma * ui * vj;
        }
      }
    }

    return { U, S, Vt };
  }

  private qrIteration(targetRank?: number): SVDRawResult {
    return this.powerIteration(100, 1e-8, targetRank);
  }

  private jacobiIteration(targetRank?: number): SVDRawResult {
    return this.powerIteration(75, 1e-7, targetRank);
  }

  public decompose(options: CoreOptions = {}): SVDRawResult {
    const algorithm = options.algorithm || 'power-iteration';
    const maxIterations = options.maxIterations || 50;
    const tolerance = options.errorThreshold || 1e-6;
    const targetRank = Math.min(this.minDim, Math.max(1, options.rank ?? this.minDim));

    switch (algorithm) {
      case 'qr-iteration':
        return this.qrIteration(targetRank);
      case 'jacobi':
        return this.jacobiIteration(targetRank);
      case 'power-iteration':
      default:
        return this.powerIteration(maxIterations, tolerance, targetRank);
    }
  }
}


