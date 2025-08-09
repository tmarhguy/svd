// Coordinator that spawns up to 3 workers (one per channel)
import { RobustSVD, SVDRawResult } from './svdCore';

export async function runChannelSVDs(
  channelMatrices: number[][][],
  options?: { rank?: number; algorithm?: 'power-iteration' | 'jacobi' | 'qr-iteration'; errorThreshold?: number; maxIterations?: number }
): Promise<SVDRawResult[]> {
  // Feature flag: enable workers by default for better performance
  const workersEnabled = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_WORKERS !== '0';
  const canUseWorker = typeof Worker !== 'undefined' && workersEnabled;
  if (!canUseWorker) {
    return channelMatrices.map((m) => new RobustSVD(m).decompose(options));
  }

  const workers: Worker[] = [];
  try {
    const promises = channelMatrices.map((matrix, idx) => {
      return new Promise<SVDRawResult>((resolve, reject) => {
        let worker: Worker | null = null;
        try {
          // Use a direct import path for the worker, which bundlers like Webpack can handle.
          // This is more robust than resolving relative URLs.
          worker = new Worker(new URL('./svdWorker', import.meta.url), { type: 'module' });
        } catch (err) {
          // Fallback: compute on main thread
          try {
            const res = new RobustSVD(matrix).decompose(options);
            resolve(res);
          } catch (e) {
            reject(e);
          }
          return;
        }
        workers.push(worker);
        const id = `job-${Date.now()}-${idx}`;
        worker.onmessage = (evt: MessageEvent<any>) => {
          const data = evt.data;
          if (data?.error) {
            reject(new Error(data.error));
          } else {
            resolve({ U: data.U, S: data.S, Vt: data.Vt });
          }
          worker?.terminate();
        };
        worker.onerror = (e) => {
          // Provide a more descriptive error message
          const errorMessage = `Worker error for channel ${idx}: ${e.message}`;
          console.error(errorMessage, e);
          reject(new Error(errorMessage));
          worker?.terminate();
        };
        worker.postMessage({ id, task: 'svd', matrix, options });
      });
    });

    return await Promise.all(promises);
  } finally {
    workers.forEach((w) => {
      try { w.terminate(); } catch {}
    });
  }
}

export async function runChannelReconstruct(
  factors: SVDRawResult[],
  k: number
): Promise<number[][][]> {
  const workersEnabled = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_WORKERS !== '0';
  const canUseWorker = typeof Worker !== 'undefined' && workersEnabled;
  if (!canUseWorker) {
    // Fallback: reconstruct on main thread
    return factors.map(({ U, S, Vt }) => {
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
      return out;
    });
  }

  const workers: Worker[] = [];
  try {
    const promises = factors.map((factor, idx) => {
      return new Promise<number[][]>((resolve, reject) => {
        let worker: Worker | null = null;
        try {
          worker = new Worker(new URL('./svdWorker', import.meta.url), { type: 'module' });
        } catch (err) {
          try {
            // Fallback main-thread reconstruction
            const { U, S, Vt } = factor;
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
            resolve(out);
          } catch (e) {
            reject(e);
          }
          return;
        }
        workers.push(worker);
        const id = `recon-${Date.now()}-${idx}`;
        worker.onmessage = (evt: MessageEvent<any>) => {
          const data = evt.data;
          if (data?.error) {
            reject(new Error(data.error));
          } else {
            resolve(data.matrix as number[][]);
          }
          worker?.terminate();
        };
        worker.onerror = (e) => {
          const errorMessage = `Worker error (recon) for channel ${idx}: ${e.message}`;
          console.error(errorMessage, e);
          reject(new Error(errorMessage));
          worker?.terminate();
        };
        worker.postMessage({ id, task: 'reconstruct', factor, k });
      });
    });

    return await Promise.all(promises);
  } finally {
    workers.forEach((w) => {
      try { w.terminate(); } catch {}
    });
  }
}


