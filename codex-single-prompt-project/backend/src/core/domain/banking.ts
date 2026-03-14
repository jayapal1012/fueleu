export interface BankEntry {
  id: number;
  shipId: string;
  year: number;
  amountGco2eq: number;
  entryType: "BANK" | "APPLY";
  targetShipId: string | null;
  targetYear: number | null;
  createdAt: string;
}

export interface BankingResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

