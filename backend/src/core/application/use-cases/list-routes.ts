import type { RouteFilters } from "../../domain/route.js";
import type { RouteRepository } from "../../ports/route-repository.js";

export class ListRoutesUseCase {
  constructor(private readonly routeRepository: RouteRepository) {}

  execute(filters?: RouteFilters) {
    return this.routeRepository.list(filters);
  }
}

