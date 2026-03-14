export interface RouteRecord {
  id: number;
  routeId: string;
  shipId: string;
  vesselType: string;
  fuelType: string;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface ComparisonRecord {
  routeId: string;
  baselineRouteId: string;
  ghgIntensity: number;
  baselineIntensity: number;
  percentDiff: number;
  compliant: boolean;
}

export interface ComplianceSnapshot {
  shipId: string;
  routeId: string;
  year: number;
  cbGco2eq: number;
  ghgIntensity: number;
  energyInScopeMj: number;
}

export interface AdjustedComplianceSnapshot extends ComplianceSnapshot {
  bankedAvailable: number;
  applied: number;
  adjustedCb: number;
}

export interface BankingResult {
  cbBefore: number;
  applied: number;
  cbAfter: number;
}

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

