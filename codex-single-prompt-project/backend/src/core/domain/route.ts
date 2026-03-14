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

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

export interface ComparisonRecord {
  routeId: string;
  baselineRouteId: string;
  ghgIntensity: number;
  baselineIntensity: number;
  percentDiff: number;
  compliant: boolean;
}

