// Coordinator that spawns up to 3 workers (one per channel)
import { RobustSVD, SVDRawResult } from './svdCore';

export async function runChannelSVDs(
  channelMatrices: number[][][],
  options?: { rank?: number; algorithm?: 'power-iteration' | 'jacobi' | 'qr-iteration'; errorThreshold?: number; maxIterations?: number }
): Promise<SVDRawResult[]> {
  // Feature flag: disable workers by default until build pipeline serves worker modules
  const workersEnabled = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_WORKERS === '1';
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
          // Resolve worker module URL relative to this file
          const url = new URL('./svdWorker.ts', import.meta.url);
          worker = new Worker(url, { type: 'module' });
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
          reject(new Error(e.message));
          worker?.terminate();
        };
        worker.postMessage({ id, matrix, options });
      });
    });

    return await Promise.all(promises);
  } finally {
    workers.forEach((w) => {
      try { w.terminate(); } catch {}
    });
  }
}


