import type { AdjustedComplianceSnapshot } from "../../domain/compliance.js";
import type { ComplianceRepository } from "../../ports/compliance-repository.js";
import type { RouteRepository } from "../../ports/route-repository.js";
import { GetComplianceBalanceUseCase } from "./get-compliance-balance.js";

export class GetAdjustedComplianceUseCase {
  constructor(
    private readonly getComplianceBalanceUseCase: GetComplianceBalanceUseCase,
    private readonly complianceRepository: ComplianceRepository,
    private readonly routeRepository: RouteRepository
  ) {}

  async execute(
    year: number,
    shipId?: string
  ): Promise<AdjustedComplianceSnapshot | AdjustedComplianceSnapshot[]> {
    if (shipId) {
      await this.getComplianceBalanceUseCase.execute(shipId, year);
      const snapshot = await this.complianceRepository.getAdjustedSnapshot(shipId, year);

      if (!snapshot) {
        throw new Error(`No adjusted compliance found for ship ${shipId} in ${year}.`);
      }

      return snapshot;
    }

    const routes = await this.routeRepository.list({ year });
    await Promise.all(
      routes.map((route) => this.getComplianceBalanceUseCase.execute(route.shipId, year))
    );

    return this.complianceRepository.listAdjustedByYear(year);
  }
}
