import type {
  AdjustedComplianceSnapshot,
  BankEntry,
  BankingResult,
  ComparisonRecord,
  ComplianceSnapshot,
  PoolResult,
  RouteRecord
} from "../domain/models";

export interface DashboardGateway {
  getRoutes(filters?: {
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }): Promise<RouteRecord[]>;
  setBaseline(routeId: string): Promise<RouteRecord>;
  getComparisons(): Promise<ComparisonRecord[]>;
  getComplianceBalance(shipId: string, year: number): Promise<ComplianceSnapshot>;
  getAdjustedCompliance(
    year: number,
    shipId?: string
  ): Promise<AdjustedComplianceSnapshot | AdjustedComplianceSnapshot[]>;
  getBankRecords(shipId?: string, year?: number): Promise<BankEntry[]>;
  bankSurplus(input: {
    shipId: string;
    year: number;
    amountGco2eq: number;
  }): Promise<BankingResult>;
  applyBanked(input: {
    sourceShipId: string;
    sourceYear: number;
    targetShipId: string;
    targetYear: number;
    amountGco2eq: number;
  }): Promise<BankingResult>;
  createPool(input: {
    year: number;
    members: Array<{
      shipId: string;
      year: number;
      adjustedCb: number;
    }>;
  }): Promise<PoolResult>;
}

