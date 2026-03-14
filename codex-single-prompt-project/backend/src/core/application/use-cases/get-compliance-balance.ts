import type { ComplianceSnapshot } from "../../domain/compliance.js";
import type { ComplianceRepository } from "../../ports/compliance-repository.js";
import type { RouteRepository } from "../../ports/route-repository.js";
import {
  ENERGY_IN_SCOPE_PER_TONNE,
  TARGET_INTENSITY
} from "../../../shared/constants.js";

export class GetComplianceBalanceUseCase {
  constructor(
    private readonly routeRepository: RouteRepository,
    private readonly complianceRepository: ComplianceRepository
  ) {}

  async execute(shipId: string, year: number): Promise<ComplianceSnapshot> {
    const routes = await this.routeRepository.list({ year });
    const route = routes.find((item) => item.shipId === shipId);

    if (!route) {
      throw new Error(`No route found for ship ${shipId} in ${year}.`);
    }

    const energyInScopeMj = route.fuelConsumption * ENERGY_IN_SCOPE_PER_TONNE;
    const cbGco2eq = Number(
      ((TARGET_INTENSITY - route.ghgIntensity) * energyInScopeMj).toFixed(2)
    );

    return this.complianceRepository.upsert({
      shipId,
      routeId: route.routeId,
      year,
      cbGco2eq,
      ghgIntensity: route.ghgIntensity,
      energyInScopeMj
    });
  }
}

