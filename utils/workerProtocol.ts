// Message protocol for stateful SVD worker

export enum WorkerReqType {
  COMPUTE_SVD = 'compute-svd',
  COMPUTE_LOW_RANK_APPROXIMATION = 'compute-low-rank-approximation',
}

export interface BaseReq<T extends WorkerReqType> {
  msg: T;
}

export interface ComputeSvdArgs {
  m: number; // rows
  n: number; // cols
  a: ArrayBuffer; // column-major Float64Array buffer of length m*n
  approx?: boolean; // if true, compute a quick approximate SVD (lower rank / iterations)
  maxRank?: number; // optional cap
}

export type ComputeSvdReq = BaseReq<WorkerReqType.COMPUTE_SVD> & ComputeSvdArgs;

export function makeComputeSvdReq(args: ComputeSvdArgs): ComputeSvdReq {
  return { msg: WorkerReqType.COMPUTE_SVD, ...args };
}

export interface ComputeLowRankApproximationArgs {
  rank: number; // requested rank k
}

export type ComputeLowRankApproximationReq =
  BaseReq<WorkerReqType.COMPUTE_LOW_RANK_APPROXIMATION> & ComputeLowRankApproximationArgs;

export function makeComputeLowRankApproximationReq(rank: number): ComputeLowRankApproximationReq {
  return { msg: WorkerReqType.COMPUTE_LOW_RANK_APPROXIMATION, rank };
}

export type WorkerReq = ComputeSvdReq | ComputeLowRankApproximationReq;

export enum WorkerResType {
  SINGULAR_VALUES = 'SINGULAR-VALUES',
  LOW_RANK_APPROXIMATION = 'LOW-RANK-APPROXIMATION',
  LOW_RANK_FRAME = 'LOW-RANK-FRAME',
  ERROR = 'ERROR',
}

export interface BaseRes<T extends WorkerResType> {
  msg: T;
}

export interface SingularValuesRes extends BaseRes<WorkerResType.SINGULAR_VALUES> {
  singularValues: Float64Array;
}

export function makeSingularValuesRes(singularValues: Float64Array): SingularValuesRes {
  return { msg: WorkerResType.SINGULAR_VALUES, singularValues };
}

export interface LowRankApproximationRes extends BaseRes<WorkerResType.LOW_RANK_APPROXIMATION> {
  lowRankApproximation: Float64Array; // flattened column-major m*n
}

export function makeLowRankApproximationRes(lowRankApproximation: Float64Array): LowRankApproximationRes {
  return { msg: WorkerResType.LOW_RANK_APPROXIMATION, lowRankApproximation };
}

export interface LowRankFrameRes extends BaseRes<WorkerResType.LOW_RANK_FRAME> {
  width: number;
  height: number;
  frame: Uint8ClampedArray; // RGBA
}

export function makeLowRankFrameRes(width: number, height: number, frame: Uint8ClampedArray): LowRankFrameRes {
  return { msg: WorkerResType.LOW_RANK_FRAME, width, height, frame };
}

export interface ErrorRes extends BaseRes<WorkerResType.ERROR> {
  error: string;
}

export function makeErrorRes(error: unknown): ErrorRes {
  const message = error instanceof Error ? error.message : String(error);
  return { msg: WorkerResType.ERROR, error: message };
}

// Union type for all worker responses
export type WorkerRes = SingularValuesRes | LowRankApproximationRes | LowRankFrameRes | ErrorRes;


