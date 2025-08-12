// Manages three stateful workers (R, G, B) and supports approximate-first, then exact, with incremental updates.

import {
  makeComputeLowRankApproximationReq,
  makeComputeSvdReq,
  WorkerRes,
  WorkerResType,
} from './workerProtocol';

export interface RGB<T> {
  red: T;
  green: T;
  blue: T;
}

function createRGB<T>(factory: () => T): RGB<T> {
  return { red: factory(), green: factory(), blue: factory() };
}

function rgbMap<X, Y>(xs: RGB<X>, fn: (x: X) => Y): RGB<Y> {
  return { red: fn(xs.red), green: fn(xs.green), blue: fn(xs.blue) };
}

async function rgbAll<T>(promises: RGB<Promise<T>>): Promise<RGB<T>> {
  const [r, g, b] = await Promise.all([promises.red, promises.green, promises.blue]);
  return { red: r, green: g, blue: b };
}

class StatefulSvdWorkerClient {
  private worker: Worker;
  private nextHandlers: Array<(res: WorkerRes) => void> = [];

  constructor() {
    this.worker = this.create();
  }

  private create(): Worker {
    // Use module worker via URL resolution
    const w = new Worker(new URL('./statefulSvdWorker', import.meta.url), { type: 'module' });
    w.onmessage = (evt) => this.onMessage(evt);
    return w;
  }

  private onMessage(evt: MessageEvent): void {
    const res = evt.data as WorkerRes;
    // Ignore auxiliary frame messages for now
    if ((res as any)?.msg === WorkerResType.LOW_RANK_FRAME) return;
    const handler = this.nextHandlers.shift();
    if (handler) handler(res);
  }

  private reset(): void {
    try { this.worker.terminate(); } catch {}
    this.worker = this.create();
    this.nextHandlers = [];
  }

  dispose(): void {
    try { this.worker.terminate(); } catch {}
    this.nextHandlers = [];
  }

  async computeSvd(m: number, n: number, channel: Float64Array, approx: boolean, maxRank?: number): Promise<Float64Array> {
    // Ensure exclusive request
    if (this.nextHandlers.length > 0) this.reset();
    const buffer = channel.buffer;
    this.worker.postMessage(makeComputeSvdReq({ a: buffer, m, n, approx, maxRank }), [buffer]);
    return new Promise((resolve, reject) => {
      this.nextHandlers.push((res) => {
        if (res.msg !== WorkerResType.SINGULAR_VALUES) return reject(new Error('Unexpected response'));
        resolve((res as any).singularValues as Float64Array);
      });
    });
  }

  async computeLowRankApproximation(rank: number): Promise<Float64Array> {
    return new Promise((resolve, reject) => {
      this.nextHandlers.push((res) => {
        if (res.msg !== WorkerResType.LOW_RANK_APPROXIMATION) return reject(new Error('Unexpected response'));
        resolve((res as any).lowRankApproximation as Float64Array);
      });
      this.worker.postMessage(makeComputeLowRankApproximationReq(rank));
    });
  }
}

export interface SvdInfo {
  isApproximation: boolean;
  singularValues: RGB<Float64Array>;
  lowRankApproximation?: RGB<Float64Array>;
}

export class SvdComputationManager {
  private approx: RGB<StatefulSvdWorkerClient>;
  private exact: RGB<StatefulSvdWorkerClient>;
  private approxSV?: RGB<Float64Array>;
  private exactSV?: RGB<Float64Array>;
  private requestedRank = 0;
  private computingExactLR = false;

  constructor(private onUpdate: (info: SvdInfo) => void) {
    this.approx = createRGB(() => new StatefulSvdWorkerClient());
    this.exact = createRGB(() => new StatefulSvdWorkerClient());
  }

  async compute(m: number, n: number, channels: RGB<Float64Array>, initialRank: number): Promise<void> {
    this.requestedRank = initialRank;
    this.approxSV = undefined;
    this.exactSV = undefined;

    // Kick off approximate SVDs (using small rank cap)
    const approxRed = this.approx.red.computeSvd(m, n, Float64Array.from(channels.red), true, Math.min(Math.min(m, n), 50));
    const approxGreen = this.approx.green.computeSvd(m, n, Float64Array.from(channels.green), true, Math.min(Math.min(m, n), 50));
    const approxBlue = this.approx.blue.computeSvd(m, n, Float64Array.from(channels.blue), true, Math.min(Math.min(m, n), 50));
    rgbAll({ red: approxRed, green: approxGreen, blue: approxBlue }).then((sv) => {
      this.approxSV = sv;
      this.setRank(this.requestedRank);
    }).catch(() => { /* ignore approx failures */ });

    // Kick off exact SVDs
    const exactRed = this.exact.red.computeSvd(m, n, Float64Array.from(channels.red), false);
    const exactGreen = this.exact.green.computeSvd(m, n, Float64Array.from(channels.green), false);
    const exactBlue = this.exact.blue.computeSvd(m, n, Float64Array.from(channels.blue), false);
    rgbAll({ red: exactRed, green: exactGreen, blue: exactBlue }).then((sv) => {
      this.exactSV = sv;
      this.setRank(this.requestedRank);
    }).catch(() => { /* exact errors will bubble only when requested */ });
  }

  private computeLowRankApproximation(clients: RGB<StatefulSvdWorkerClient>, rank: number): Promise<RGB<Float64Array>> {
    return rgbAll({
      red: clients.red.computeLowRankApproximation(rank),
      green: clients.green.computeLowRankApproximation(rank),
      blue: clients.blue.computeLowRankApproximation(rank),
    });
  }

  setRank(rank: number): void {
    this.requestedRank = rank;
    if (this.exactSV) {
      if (this.computingExactLR) return;
      this.computingExactLR = true;
      this.computeLowRankApproximation(this.exact, rank).then((lowRankApproximation) => {
        this.computingExactLR = false;
        this.onUpdate({ isApproximation: false, lowRankApproximation, singularValues: this.exactSV! });
        if (this.requestedRank !== rank) this.setRank(this.requestedRank);
      }).catch(() => { this.computingExactLR = false; });
    } else if (this.approxSV) {
      this.computeLowRankApproximation(this.approx, rank).then((lowRankApproximation) => {
        // Only update if exact result not yet computed
        if (!this.exactSV) {
          this.onUpdate({ isApproximation: true, lowRankApproximation, singularValues: this.approxSV! });
        }
      }).catch(() => {});
    }
  }

  dispose(): void {
    this.approx.red.dispose();
    this.approx.green.dispose();
    this.approx.blue.dispose();
    this.exact.red.dispose();
    this.exact.green.dispose();
    this.exact.blue.dispose();
  }
}


