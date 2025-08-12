/// <reference lib="webworker" />

// Stateful SVD worker using JS fallback (RobustSVD) with typed arrays and incremental reconstruction.
// Later, this can be swapped to WASM-backed routines.

import { makeErrorRes, makeLowRankApproximationRes, makeLowRankFrameRes, makeSingularValuesRes, WorkerReq, WorkerReqType } from './workerProtocol';
import { RobustSVD as JSSVD } from './svdCore';

type NumericArray = Float32Array | Float64Array;

type FloatMatrix = {
  rows: number;
  cols: number;
  data: NumericArray; // column-major length rows*cols
};

function multiplyColumnByScalar(matrix: FloatMatrix, columnIndex: number, scalar: number, out?: NumericArray): void {
  const { rows, data } = matrix;
  const base = columnIndex * rows;
  for (let i = 0; i < rows; i++) {
    const v = data[base + i] ?? 0;
    if (out) out[base + i] = v * scalar; else data[base + i] = v * scalar;
  }
}

function multiplyAndAccumulate(
  lhs: FloatMatrix,
  rhs: FloatMatrix,
  out: FloatMatrix,
  startCol: number,
  count: number,
  mode: 'assign' | 'add' | 'sub',
): void {
  // out = (mode) lhs[:, start:start+count] * rhs[start:start+count, :]
  const m = lhs.rows;
  const k = count;
  const n = rhs.cols;
  const blockM = 32, blockN = 32, blockK = 32;
  for (let jb = 0; jb < n; jb += blockN) {
    const jMax = Math.min(n, jb + blockN);
    for (let ib = 0; ib < m; ib += blockM) {
      const iMax = Math.min(m, ib + blockM);
      for (let kb = 0; kb < k; kb += blockK) {
        const kMax = Math.min(k, kb + blockK);
        for (let j = jb; j < jMax; j++) {
          for (let i = ib; i < iMax; i++) {
            let sum = mode === 'add' || mode === 'sub' ? 0 : 0;
            for (let t = kb; t < kMax; t++) {
              const lhsIdx = (startCol + t) * m + i; // column-major
              const rhsIdx = j * rhs.rows + (startCol + t);
              sum += (lhs.data[lhsIdx] ?? 0) * (rhs.data[rhsIdx] ?? 0);
            }
            const outIdx = j * out.rows + i;
            if (mode === 'assign') out.data[outIdx] = (kb === 0 ? sum : (out.data[outIdx] ?? 0) + sum);
            else if (mode === 'add') out.data[outIdx] = (out.data[outIdx] ?? 0) + sum;
            else out.data[outIdx] = (out.data[outIdx] ?? 0) - sum;
          }
        }
      }
    }
  }
}

class StatefulSvdStore {
  private uTimesSigma: Float32Array | null = null; // m x r, col-major
  private vT: Float32Array | null = null; // r x n, col-major (as (n x r) row-major)
  private singularValues: Float32Array | null = null; // length r
  private m = 0;
  private n = 0;
  private r = 0;
  private currentRank = 0;
  private lowRankApprox: Float32Array | null = null; // m x n, col-major
  // Scratch buffers reused across calls
  private rhsPackedK: Float32Array | null = null;
  private rhsPackedDelta: Float32Array | null = null;

  reset(): void {
    this.uTimesSigma = null;
    this.vT = null;
    this.singularValues = null;
    this.m = this.n = this.r = 0;
    this.currentRank = 0;
    this.lowRankApprox = null;
    this.rhsPackedK = null;
    this.rhsPackedDelta = null;
  }

  initializeFromUSV(U: number[][], S: number[], Vt: number[][]): void {
    const m = U.length;
    const r = (U[0] as number[] | undefined)?.length ?? 0;
    const n = (Vt[0] as number[] | undefined)?.length ?? 0;
    this.m = m;
    this.n = n;
    this.r = r;
    this.currentRank = 0;
    this.singularValues = new Float32Array(r);
    this.uTimesSigma = new Float32Array(m * r);
    this.vT = new Float32Array(r * n);
    this.lowRankApprox = new Float32Array(m * n);

    for (let k = 0; k < r; k++) {
      this.singularValues[k] = S[k] ?? 0;
      // U column k scaled by S[k]
      for (let i = 0; i < m; i++) {
        const uik = (U[i] as number[] | undefined)?.[k] ?? 0;
        this.uTimesSigma[k * m + i] = uik * (S[k] ?? 0);
      }
      // Vt row k -> as column-major in vT with column k
      for (let j = 0; j < n; j++) {
        const vkj = (Vt[k] as number[] | undefined)?.[j] ?? 0;
        this.vT[j * r + k] = vkj; // store transposed for col-major (r x n)
      }
    }
  }

  getSingularValues(): Float64Array {
    return new Float64Array(this.singularValues ?? []);
  }

  computeLowRankApproximationFromScratch(rank: number): Float64Array {
    const k = Math.min(rank, this.r);
    const out = this.lowRankApprox!;
    out.fill(0);
    const lhs: FloatMatrix = { rows: this.m, cols: k, data: this.uTimesSigma!.subarray(0, this.m * k) };
    // Build top-k rows of Vt into packed scratch
    if (!this.rhsPackedK || this.rhsPackedK.length < k * this.n) {
      this.rhsPackedK = new Float32Array(k * this.n);
    }
    for (let j = 0; j < this.n; j++) {
      for (let t = 0; t < k; t++) {
        this.rhsPackedK[j * k + t] = this.vT![j * this.r + t];
      }
    }
    const rhs: FloatMatrix = { rows: k, cols: this.n, data: this.rhsPackedK.subarray(0, k * this.n) };
    const outMat: FloatMatrix = { rows: this.m, cols: this.n, data: out };
    multiplyAndAccumulate(lhs, rhs, outMat, 0, k, 'assign');
    this.currentRank = k;
    return new Float64Array(out);
  }

  updateLowRankApproximation(newRank: number): Float64Array {
    const oldRank = this.currentRank;
    const rank = Math.min(newRank, this.r);
    if (oldRank === 0) return this.computeLowRankApproximationFromScratch(rank);
    if (!this.lowRankApprox) this.lowRankApprox = new Float32Array(this.m * this.n);
    const out = this.lowRankApprox;
    const minRank = Math.min(oldRank, rank);
    const deltaCount = Math.abs(rank - oldRank);
    if (deltaCount === 0) return new Float64Array(out);

    const startCol = minRank;
    const lhs: FloatMatrix = { rows: this.m, cols: deltaCount, data: this.uTimesSigma!.subarray(startCol * this.m, (startCol + deltaCount) * this.m) };
    // Build contiguous (deltaCount x n) slice of Vt rows using scratch buffer
    if (!this.rhsPackedDelta || this.rhsPackedDelta.length < deltaCount * this.n) {
      this.rhsPackedDelta = new Float32Array(deltaCount * this.n);
    }
    for (let j = 0; j < this.n; j++) {
      for (let t = 0; t < deltaCount; t++) {
        this.rhsPackedDelta[j * deltaCount + t] = this.vT![j * this.r + (startCol + t)];
      }
    }
    const rhsSlice: FloatMatrix = { rows: deltaCount, cols: this.n, data: this.rhsPackedDelta.subarray(0, deltaCount * this.n) };
    const outMat: FloatMatrix = { rows: this.m, cols: this.n, data: out };
    // add or subtract delta block
    multiplyAndAccumulate(lhs, rhsSlice, outMat, 0, deltaCount, rank > oldRank ? 'add' : 'sub');
    this.currentRank = rank;
    return new Float64Array(out);
  }

  toRGBAFrame(): { width: number; height: number; rgba: Uint8ClampedArray } {
    const w = this.n;
    const h = this.m;
    const rgba = new Uint8ClampedArray(w * h * 4);
    const buf = this.lowRankApprox ?? new Float32Array(w * h);
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        const q = x * h + y; // column-major
        const idx = (y * w + x) * 4;
        const v = Math.max(0, Math.min(255, Math.round(buf[q] ?? 0)));
        // replicate into RGB; alpha 255
        rgba[idx] = v;
        rgba[idx + 1] = v;
        rgba[idx + 2] = v;
        rgba[idx + 3] = 255;
      }
    }
    return { width: w, height: h, rgba };
  }
}

const store = new StatefulSvdStore();

async function computeSvdJS(aBuf: ArrayBuffer, m: number, n: number, approx?: boolean, maxRank?: number): Promise<Float64Array> {
  // Convert to 2D array for JS SVD implementation, then store factors
  const a = new Float64Array(aBuf);
  const matrix: number[][] = Array.from({ length: m }, () => Array(n).fill(0));
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < m; i++) {
      matrix[i][j] = a[j * m + i] ?? 0;
    }
  }
  const base = Math.min(m, n);
  const approxRank = Math.min(base, Math.max(16, Math.floor(base * 0.15)));
  const rank = Math.min(base, maxRank ?? (approx ? approxRank : base));
  const svd = new JSSVD(matrix);
  const { U, S, Vt } = svd.decompose({ rank, maxIterations: approx ? 20 : 50, errorThreshold: approx ? 1e-5 : 1e-6, algorithm: 'power-iteration' });
  store.reset();
  store.initializeFromUSV(U, S, Vt);
  return store.getSingularValues();
}

self.onmessage = (evt: MessageEvent) => {
  const data = evt.data as WorkerReq;
  try {
    switch (data.msg) {
      case WorkerReqType.COMPUTE_SVD: {
        const { a, m, n, approx, maxRank } = data;
        // Note: transfer not needed on receive side; responded buffers will be copies
        computeSvdJS(a, m, n, approx, maxRank).then((singularValues) => {
          // Copy to avoid non-detachable errors in some browsers
          const copy = new Float64Array(singularValues);
          (self as unknown as Worker).postMessage(makeSingularValuesRes(copy));
        }, (err) => {
          (self as unknown as Worker).postMessage(makeErrorRes(err));
        });
        break;
      }
      case WorkerReqType.COMPUTE_LOW_RANK_APPROXIMATION: {
        const { rank } = data;
        const approx = store.updateLowRankApproximation(rank);
        // Also send ready-to-draw RGBA frame for zero-copy putImageData path
        const frame = store.toRGBAFrame();
        (self as unknown as Worker).postMessage(makeLowRankApproximationRes(new Float64Array(approx)));
        (self as unknown as Worker).postMessage(makeLowRankFrameRes(frame.width, frame.height, frame.rgba), [frame.rgba.buffer]);
        break;
      }
      default:
        (self as unknown as Worker).postMessage(makeErrorRes(new Error('Unknown worker message')));
        break;
    }
  } catch (err) {
    (self as unknown as Worker).postMessage(makeErrorRes(err));
  }
};


