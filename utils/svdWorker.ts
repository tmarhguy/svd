/// <reference lib="webworker" />
import { RobustSVD } from './svdCore';

export interface WorkPayload {
  id: string;
  matrix: number[][];
  options?: {
    rank?: number;
    algorithm?: 'power-iteration' | 'jacobi' | 'qr-iteration';
    errorThreshold?: number;
    maxIterations?: number;
  };
}

export interface WorkResult {
  id: string;
  U: number[][];
  S: number[];
  Vt: number[][];
  error?: string;
}

// Worker message handler
self.onmessage = (evt: MessageEvent<any>) => {
  try {
    const data = evt.data;
    const { id, task } = data;
    if (task === 'svd') {
      const { matrix, options } = data as WorkPayload & { task: 'svd' };
      const svd = new RobustSVD(matrix);
      const { U, S, Vt } = svd.decompose(options);
      const res: WorkResult = { id, U, S, Vt };
      (self as unknown as Worker).postMessage(res);
    } else if (task === 'reconstruct') {
      const { factor, k } = data as { id: string; task: 'reconstruct'; factor: { U: number[][]; S: number[]; Vt: number[][] }; k: number };
      const U = factor.U;
      const S = factor.S;
      const Vt = factor.Vt;
      const kk = Math.min(k, S.length);
      const rows = U.length;
      const cols = (Vt[0] as number[] | undefined)?.length ?? 0;
      const out: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
      for (let i = 0; i < rows; i++) {
        const Ui = U[i] as number[];
        const outRow = out[i] as number[];
        for (let j = 0; j < cols; j++) {
          let sum = 0;
          for (let t = 0; t < kk; t++) {
            sum += (Ui[t] ?? 0) * (S[t] ?? 0) * ((Vt[t] as number[] | undefined)?.[j] ?? 0);
          }
          outRow[j] = sum;
        }
      }
      (self as unknown as Worker).postMessage({ id, matrix: out });
    } else {
      (self as unknown as Worker).postMessage({ id, error: 'Unknown task' });
    }
  } catch (err) {
    (self as unknown as Worker).postMessage({ id: evt.data?.id, error: (err as Error).message });
    self.close();
  }
};


