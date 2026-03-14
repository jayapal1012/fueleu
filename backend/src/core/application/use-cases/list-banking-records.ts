import type { BankRepository } from "../../ports/bank-repository.js";

export class ListBankingRecordsUseCase {
  constructor(private readonly bankRepository: BankRepository) {}

  execute(shipId?: string, year?: number) {
    return this.bankRepository.listByShipYear(shipId, year);
  }
}

