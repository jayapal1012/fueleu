import type { ComparisonRecord } from "../../domain/route.js";
import type { RouteRepository } from "../../ports/route-repository.js";
import { TARGET_INTENSITY } from "../../../shared/constants.js";

export class GetRouteComparisonUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  async execute(): Promise<ComparisonRecord[]> {
    const baseline = await this.routeRepository.getBaseline();

    if (!baseline) {
      throw new Error("A baseline route must be defined before comparison.");
    }

    const routes = await this.routeRepository.list();

    return routes
      .filter((route) => route.routeId !== baseline.routeId)
      .map((route) => ({
        routeId: route.routeId,
        baselineRouteId: baseline.routeId,
        ghgIntensity: route.ghgIntensity,
        baselineIntensity: baseline.ghgIntensity,
        percentDiff: Number(
          ((((route.ghgIntensity / baseline.ghgIntensity) - 1) * 100).toFixed(2))
        ),
        compliant: route.ghgIntensity <= TARGET_INTENSITY
      }));
  }
}

