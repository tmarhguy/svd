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
self.onmessage = (evt: MessageEvent<WorkPayload>) => {
  try {
    const { id, matrix, options } = evt.data;
    const svd = new RobustSVD(matrix);
    const { U, S, Vt } = svd.decompose(options);
    const res: WorkResult = { id, U, S, Vt };
    (self as unknown as Worker).postMessage(res);
  } catch (err) {
    (self as unknown as Worker).postMessage({ id: evt.data?.id, error: (err as Error).message });
  }
};


