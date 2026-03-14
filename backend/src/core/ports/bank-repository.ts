import type { BankEntry } from "../domain/banking.js";

export interface BankRepository {
  listByShipYear(shipId?: string, year?: number): Promise<BankEntry[]>;
  getAvailable(shipId: string, year: number): Promise<number>;
  createBankEntry(entry: {
    shipId: string;
    year: number;
    amountGco2eq: number;
    entryType: "BANK" | "APPLY";
    targetShipId?: string | null;
    targetYear?: number | null;
  }): Promise<BankEntry>;
  getAppliedToShipYear(shipId: string, year: number): Promise<number>;
}

