import type { DashboardGateway } from "../../core/ports/dashboard-gateway";
import type {
  AdjustedComplianceSnapshot,
  BankEntry,
  BankingResult,
  ComparisonRecord,
  ComplianceSnapshot,
  PoolResult,
  RouteRecord
} from "../../core/domain/models";

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:4000");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...init
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({ message: "Request failed" }))) as {
      message?: string;
    };
    throw new Error(error.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export class HttpDashboardGateway implements DashboardGateway {
  getRoutes(filters?: { vesselType?: string; fuelType?: string; year?: number }) {
    const params = new URLSearchParams();

    if (filters?.vesselType) {
      params.set("vesselType", filters.vesselType);
    }

    if (filters?.fuelType) {
      params.set("fuelType", filters.fuelType);
    }

    if (filters?.year) {
      params.set("year", String(filters.year));
    }

    const query = params.toString();
    return request<RouteRecord[]>(`/routes${query ? `?${query}` : ""}`);
  }

  setBaseline(routeId: string) {
    return request<RouteRecord>(`/routes/${routeId}/baseline`, { method: "POST" });
  }

  getComparisons() {
    return request<ComparisonRecord[]>("/routes/comparison");
  }

  getComplianceBalance(shipId: string, year: number) {
    return request<ComplianceSnapshot>(`/compliance/cb?shipId=${shipId}&year=${year}`);
  }

  getAdjustedCompliance(year: number, shipId?: string) {
    const params = new URLSearchParams({ year: String(year) });

    if (shipId) {
      params.set("shipId", shipId);
    }

    return request<AdjustedComplianceSnapshot | AdjustedComplianceSnapshot[]>(
      `/compliance/adjusted-cb?${params.toString()}`
    );
  }

  getBankRecords(shipId?: string, year?: number) {
    const params = new URLSearchParams();

    if (shipId) {
      params.set("shipId", shipId);
    }

    if (year) {
      params.set("year", String(year));
    }

    const query = params.toString();
    return request<BankEntry[]>(`/banking/records${query ? `?${query}` : ""}`);
  }

  bankSurplus(input: { shipId: string; year: number; amountGco2eq: number }) {
    return request<BankingResult>("/banking/bank", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  applyBanked(input: {
    sourceShipId: string;
    sourceYear: number;
    targetShipId: string;
    targetYear: number;
    amountGco2eq: number;
  }) {
    return request<BankingResult>("/banking/apply", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  createPool(input: {
    year: number;
    members: Array<{ shipId: string; year: number; adjustedCb: number }>;
  }) {
    return request<PoolResult>("/pools", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }
}
