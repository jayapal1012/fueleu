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

