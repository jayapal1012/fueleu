import type { RouteFilters, RouteRecord } from "../domain/route.js";

export interface RouteRepository {
  list(filters?: RouteFilters): Promise<RouteRecord[]>;
  getByRouteId(routeId: string): Promise<RouteRecord | null>;
  getBaseline(): Promise<RouteRecord | null>;
  setBaseline(routeId: string): Promise<RouteRecord>;
}

