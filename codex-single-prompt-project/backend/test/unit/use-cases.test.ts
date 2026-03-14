import { describe, expect, it, vi } from "vitest";
import { GetRouteComparisonUseCase } from "../../src/core/application/use-cases/get-route-comparison.js";
import { GetComplianceBalanceUseCase } from "../../src/core/application/use-cases/get-compliance-balance.js";
import { BankSurplusUseCase } from "../../src/core/application/use-cases/bank-surplus.js";
import { ApplyBankedUseCase } from "../../src/core/application/use-cases/apply-banked.js";
import { CreatePoolUseCase } from "../../src/core/application/use-cases/create-pool.js";
import type { RouteRepository } from "../../src/core/ports/route-repository.js";
import type { ComplianceRepository } from "../../src/core/ports/compliance-repository.js";
import type { BankRepository } from "../../src/core/ports/bank-repository.js";
import type { PoolRepository } from "../../src/core/ports/pool-repository.js";
import type { ComplianceSnapshot } from "../../src/core/domain/compliance.js";

const routeRepository: RouteRepository = {
  list: vi.fn(async () => [
    {
      id: 1,
      routeId: "R001",
      shipId: "R001",
      vesselType: "Container",
      fuelType: "HFO",
      year: 2024,
      ghgIntensity: 91,
      fuelConsumption: 5000,
      distance: 12000,
      totalEmissions: 4500,
      isBaseline: true
    },
    {
      id: 2,
      routeId: "R002",
      shipId: "R002",
      vesselType: "BulkCarrier",
      fuelType: "LNG",
      year: 2024,
      ghgIntensity: 88,
      fuelConsumption: 4800,
      distance: 11500,
      totalEmissions: 4200,
      isBaseline: false
    },
    {
      id: 3,
      routeId: "R003",
      shipId: "R003",
      vesselType: "Tanker",
      fuelType: "MGO",
      year: 2024,
      ghgIntensity: 93.5,
      fuelConsumption: 5100,
      distance: 12500,
      totalEmissions: 4700,
      isBaseline: false
    }
  ]),
  getByRouteId: vi.fn(),
  getBaseline: vi.fn(async () => ({
    id: 1,
    routeId: "R001",
    shipId: "R001",
    vesselType: "Container",
    fuelType: "HFO",
    year: 2024,
    ghgIntensity: 91,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: true
  })),
  setBaseline: vi.fn()
};

const complianceRepository: ComplianceRepository = {
  upsert: vi.fn(async (snapshot: ComplianceSnapshot) => snapshot),
  getSnapshot: vi.fn(),
  listSnapshotsByYear: vi.fn(),
  getAdjustedSnapshot: vi.fn(),
  listAdjustedByYear: vi.fn()
};

const bankRepository: BankRepository = {
  listByShipYear: vi.fn(),
  getAvailable: vi.fn(async () => 1_000_000),
  createBankEntry: vi.fn(async () => ({
    id: 1,
    shipId: "R002",
    year: 2024,
    amountGco2eq: 1000,
    entryType: "BANK",
    targetShipId: null,
    targetYear: null,
    createdAt: new Date().toISOString()
  })),
  getAppliedToShipYear: vi.fn()
};

const poolRepository: PoolRepository = {
  createPool: vi.fn(async (year, members) => ({
    poolId: 1,
    year,
    sumBefore: members.reduce((sum, member) => sum + member.cbBefore, 0),
    sumAfter: members.reduce((sum, member) => sum + member.cbAfter, 0),
    members
  }))
};

describe("backend use cases", () => {
  it("computes comparison deltas and compliance flags", async () => {
    const result = await new GetRouteComparisonUseCase(routeRepository).execute();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      routeId: "R002",
      baselineRouteId: "R001",
      compliant: true
    });
    expect(result[1].percentDiff).toBeCloseTo(2.75, 2);
  });

  it("computes and stores compliance balance", async () => {
    const result = await new GetComplianceBalanceUseCase(
      routeRepository,
      complianceRepository
    ).execute("R002", 2024);
    expect(result.cbGco2eq).toBe(263082240);
  });

  it("banks only available surplus", async () => {
    const getComplianceBalanceUseCase = new GetComplianceBalanceUseCase(
      routeRepository,
      complianceRepository
    );
    const result = await new BankSurplusUseCase(
      getComplianceBalanceUseCase,
      bankRepository
    ).execute({
      shipId: "R002",
      year: 2024,
      amountGco2eq: 500000
    });

    expect(result.cbBefore).toBeGreaterThan(0);
    expect(result.cbAfter).toBe(result.cbBefore - 500000);
  });

  it("applies banked surplus to a deficit ship", async () => {
    const getComplianceBalanceUseCase = new GetComplianceBalanceUseCase(
      routeRepository,
      complianceRepository
    );
    const result = await new ApplyBankedUseCase(
      getComplianceBalanceUseCase,
      bankRepository
    ).execute({
      sourceShipId: "R002",
      sourceYear: 2024,
      targetShipId: "R003",
      targetYear: 2024,
      amountGco2eq: 500000
    });

    expect(result.cbBefore).toBeLessThan(0);
    expect(result.cbAfter).toBe(result.cbBefore + result.applied);
  });

  it("creates a valid pool with greedy allocation", async () => {
    const result = await new CreatePoolUseCase(poolRepository).execute({
      year: 2024,
      members: [
        { shipId: "R002", year: 2024, adjustedCb: 100 },
        { shipId: "R003", year: 2024, adjustedCb: -60 },
        { shipId: "R001", year: 2024, adjustedCb: 20 }
      ]
    });

    const deficitMember = result.members.find((member) => member.shipId === "R003");
    expect(deficitMember?.cbAfter).toBe(0);
    expect(result.sumAfter).toBe(60);
  });
});
