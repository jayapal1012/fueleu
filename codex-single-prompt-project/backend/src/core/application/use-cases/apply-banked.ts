import type { BankingResult } from "../../domain/banking.js";
import type { BankRepository } from "../../ports/bank-repository.js";
import { GetComplianceBalanceUseCase } from "./get-compliance-balance.js";

export class ApplyBankedUseCase {
  constructor(
    private readonly getComplianceBalanceUseCase: GetComplianceBalanceUseCase,
    private readonly bankRepository: BankRepository
  ) {}

  async execute(input: {
    sourceShipId: string;
    sourceYear: number;
    targetShipId: string;
    targetYear: number;
    amountGco2eq: number;
  }): Promise<BankingResult> {
    const available = await this.bankRepository.getAvailable(
      input.sourceShipId,
      input.sourceYear
    );

    if (input.amountGco2eq <= 0 || input.amountGco2eq > available) {
      throw new Error("Requested apply amount exceeds available banked surplus.");
    }

    const targetSnapshot = await this.getComplianceBalanceUseCase.execute(
      input.targetShipId,
      input.targetYear
    );

    if (targetSnapshot.cbGco2eq >= 0) {
      throw new Error("Banked surplus can only be applied to a deficit ship.");
    }

    const applied = Math.min(Math.abs(targetSnapshot.cbGco2eq), input.amountGco2eq);

    await this.bankRepository.createBankEntry({
      shipId: input.sourceShipId,
      year: input.sourceYear,
      amountGco2eq: applied,
      entryType: "APPLY",
      targetShipId: input.targetShipId,
      targetYear: input.targetYear
    });

    return {
      cbBefore: targetSnapshot.cbGco2eq,
      applied,
      cbAfter: targetSnapshot.cbGco2eq + applied
    };
  }
}

