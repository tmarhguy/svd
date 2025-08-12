import { SvdComputationManager, SvdInfo } from './svdComputationManager';

export interface RGB<T> {
  red: T;
  green: T;
  blue: T;
}

export interface RGBFloat64 extends RGB<Float64Array> {}

export function imageDataToRGBFloat64ColumnMajor(imageData: ImageData): { m: number; n: number; channels: RGBFloat64 } {
  const n = imageData.width;
  const m = imageData.height;
  const red = new Float64Array(m * n);
  const green = new Float64Array(m * n);
  const blue = new Float64Array(m * n);
  let i = 0;
  for (let y = 0; y < m; y++) {
    for (let x = 0; x < n; x++) {
      const q = x * m + y; // column-major
      red[q] = imageData.data[i] ?? 0;
      green[q] = imageData.data[i + 1] ?? 0;
      blue[q] = imageData.data[i + 2] ?? 0;
      i += 4; // skip alpha
    }
  }
  return { m, n, channels: { red, green, blue } };
}

export function rgbFloat64ColumnMajorToImageData(
  m: number,
  n: number,
  channels: RGBFloat64,
  colorMix: number = 1,
): ImageData {
  const data = new Uint8ClampedArray(m * n * 4);
  const mix = Math.max(0, Math.min(1, colorMix));
  for (let x = 0; x < n; x++) {
    for (let y = 0; y < m; y++) {
      const q = x * m + y;
      const idx = (y * n + x) * 4;
      const r = channels.red[q] ?? 0;
      const g = channels.green[q] ?? 0;
      const b = channels.blue[q] ?? 0;
      const yv = 0.299 * r + 0.587 * g + 0.114 * b;
      const rr = yv * (1 - mix) + r * mix;
      const gg = yv * (1 - mix) + g * mix;
      const bb = yv * (1 - mix) + b * mix;
      data[idx] = Math.max(0, Math.min(255, Math.round(rr)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(gg)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(bb)));
      data[idx + 3] = 255;
    }
  }
  return new ImageData(data, n, m);
}

export type SessionUpdate = {
  isApproximation: boolean;
  imageData: ImageData;
  singularValues: RGB<Float64Array>;
};

export class StatefulSvdSession {
  private manager: SvdComputationManager;
  private disposed = false;
  private isGrayscale: boolean;
  private colorMix = 1;
  private lastLR?: RGBFloat64;
  private lastSV?: RGB<Float64Array>;
  private lastApprox = false;

  constructor(
    private m: number,
    private n: number,
    private channels: RGBFloat64,
    private onUpdate: (update: SessionUpdate) => void,
    initialColorMix: number = 1,
  ) {
    this.manager = new SvdComputationManager((info) => this.handleUpdate(info));
    // Grayscale heuristic: channels nearly equal at sample points
    this.isGrayscale = this.detectGrayscale();
    this.colorMix = Math.max(0, Math.min(1, initialColorMix));
  }

  async start(initialRank: number): Promise<void> {
    if (this.disposed) return;
    await this.manager.compute(this.m, this.n, this.channels, initialRank);
  }

  setRank(rank: number): void {
    if (this.disposed) return;
    this.manager.setRank(rank);
  }

  setColorMix(colorMix: number): void {
    if (this.disposed) return;
    this.colorMix = Math.max(0, Math.min(1, colorMix));
    if (this.lastLR && this.lastSV) {
      const img = rgbFloat64ColumnMajorToImageData(this.m, this.n, this.lastLR, this.colorMix);
      this.onUpdate({ isApproximation: this.lastApprox, imageData: img, singularValues: this.lastSV });
    }
  }

  dispose(): void {
    this.disposed = true;
    try { this.manager.dispose(); } catch {}
  }

  private handleUpdate(info: SvdInfo): void {
    if (this.disposed) return;
    if (!info.lowRankApproximation) return;
    const r = info.lowRankApproximation.red;
    const g = info.lowRankApproximation.green;
    const b = info.lowRankApproximation.blue;
    this.lastLR = { red: r, green: g, blue: b };
    this.lastSV = info.singularValues;
    this.lastApprox = info.isApproximation;
    const img = rgbFloat64ColumnMajorToImageData(this.m, this.n, this.lastLR, this.colorMix);
    this.onUpdate({ isApproximation: info.isApproximation, imageData: img, singularValues: info.singularValues });
  }

  private detectGrayscale(): boolean {
    const m = this.m, n = this.n;
    const stepY = Math.max(1, Math.floor(m / 16));
    const stepX = Math.max(1, Math.floor(n / 16));
    let samples = 0, diffs = 0;
    for (let y = 0; y < m; y += stepY) {
      for (let x = 0; x < n; x += stepX) {
        const q = x * m + y;
        const rv = this.channels.red[q] ?? 0;
        const gv = this.channels.green[q] ?? 0;
        const bv = this.channels.blue[q] ?? 0;
        if (Math.abs(rv - gv) + Math.abs(rv - bv) + Math.abs(gv - bv) > 1) diffs++;
        samples++;
      }
    }
    return diffs / Math.max(1, samples) < 0.02;
  }
}

export async function createStatefulSvdSession(
  imageData: ImageData,
  initialRank: number,
  onUpdate: (update: SessionUpdate) => void,
  initialColorMix?: number,
): Promise<StatefulSvdSession> {
  const { m, n, channels } = imageDataToRGBFloat64ColumnMajor(imageData);
  const session = new StatefulSvdSession(m, n, channels, onUpdate, initialColorMix);
  await session.start(initialRank);
  return session;
}


