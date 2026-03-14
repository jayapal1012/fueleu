import type { BankingResult } from "../../domain/banking.js";
import type { BankRepository } from "../../ports/bank-repository.js";
import { GetComplianceBalanceUseCase } from "./get-compliance-balance.js";

export class BankSurplusUseCase {
  constructor(
    private readonly getComplianceBalanceUseCase: GetComplianceBalanceUseCase,
    private readonly bankRepository: BankRepository
  ) {}

  async execute(input: {
    shipId: string;
    year: number;
    amountGco2eq: number;
  }): Promise<BankingResult> {
    const snapshot = await this.getComplianceBalanceUseCase.execute(
      input.shipId,
      input.year
    );

    if (snapshot.cbGco2eq <= 0) {
      throw new Error("Only positive compliance balance can be banked.");
    }

    const alreadyBanked = await this.bankRepository.getAvailable(input.shipId, input.year);

    if (input.amountGco2eq <= 0 || input.amountGco2eq > snapshot.cbGco2eq - alreadyBanked) {
      throw new Error("Requested bank amount exceeds available surplus.");
    }

    await this.bankRepository.createBankEntry({
      shipId: input.shipId,
      year: input.year,
      amountGco2eq: input.amountGco2eq,
      entryType: "BANK"
    });

    return {
      cbBefore: snapshot.cbGco2eq,
      applied: input.amountGco2eq,
      cbAfter: snapshot.cbGco2eq - input.amountGco2eq
    };
  }
}

