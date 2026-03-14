import type { PoolMemberAllocation, PoolResult } from "../domain/pooling.js";

export interface PoolRepository {
  createPool(year: number, members: PoolMemberAllocation[]): Promise<PoolResult>;
}
