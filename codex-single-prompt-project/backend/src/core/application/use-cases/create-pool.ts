import type { PoolCandidate, PoolMemberAllocation, PoolResult } from "../../domain/pooling.js";
import type { PoolRepository } from "../../ports/pool-repository.js";

export class CreatePoolUseCase {
  constructor(private readonly poolRepository: PoolRepository) {}

  async execute(input: { year: number; members: PoolCandidate[] }): Promise<PoolResult> {
    const total = input.members.reduce((sum, member) => sum + member.adjustedCb, 0);

    if (total < 0) {
      throw new Error("Pool sum must be non-negative.");
    }

    const allocations = input.members.map<PoolMemberAllocation>((member) => ({
      shipId: member.shipId,
      year: member.year,
      cbBefore: member.adjustedCb,
      cbAfter: member.adjustedCb
    }));

    const donors = allocations
      .filter((member) => member.cbAfter > 0)
      .sort((left, right) => right.cbAfter - left.cbAfter);
    const deficits = allocations
      .filter((member) => member.cbAfter < 0)
      .sort((left, right) => left.cbAfter - right.cbAfter);

    for (const deficit of deficits) {
      let remainingDeficit = Math.abs(deficit.cbAfter);

      for (const donor of donors) {
        if (remainingDeficit === 0) {
          break;
        }

        if (donor.cbAfter <= 0) {
          continue;
        }

        const transfer = Math.min(donor.cbAfter, remainingDeficit);
        donor.cbAfter -= transfer;
        deficit.cbAfter += transfer;
        remainingDeficit -= transfer;
      }
    }

    for (const member of allocations) {
      if (member.cbBefore < 0 && member.cbAfter < member.cbBefore) {
        throw new Error("Deficit ship cannot exit the pool worse than before.");
      }

      if (member.cbBefore > 0 && member.cbAfter < 0) {
        throw new Error("Surplus ship cannot exit the pool with a negative balance.");
      }
    }

    return this.poolRepository.createPool(input.year, allocations);
  }
}
