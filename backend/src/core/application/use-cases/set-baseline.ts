import type { RouteRepository } from "../../ports/route-repository.js";

export class SetBaselineUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  execute(routeId: string) {
    return this.routeRepository.setBaseline(routeId);
  }
}

