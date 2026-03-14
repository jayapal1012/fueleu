export interface PoolCandidate {
  shipId: string;
  year: number;
  adjustedCb: number;
}

export interface PoolMemberAllocation {
  shipId: string;
  year: number;
  cbBefore: number;
  cbAfter: number;
}

export interface PoolResult {
  poolId: number;
  year: number;
  sumBefore: number;
  sumAfter: number;
  members: PoolMemberAllocation[];
}
