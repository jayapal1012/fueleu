import type { Pool } from "pg";
import type { RouteFilters, RouteRecord } from "../../../core/domain/route.js";
import type { RouteRepository } from "../../../core/ports/route-repository.js";

const mapRoute = (row: Record<string, unknown>): RouteRecord => ({
  id: Number(row.id),
  routeId: String(row.route_id),
  shipId: String(row.ship_id),
  vesselType: String(row.vessel_type),
  fuelType: String(row.fuel_type),
  year: Number(row.year),
  ghgIntensity: Number(row.ghg_intensity),
  fuelConsumption: Number(row.fuel_consumption),
  distance: Number(row.distance),
  totalEmissions: Number(row.total_emissions),
  isBaseline: Boolean(row.is_baseline)
});

export class PostgresRouteRepository implements RouteRepository {
  constructor(private readonly pool: Pool) {}

  async list(filters?: RouteFilters): Promise<RouteRecord[]> {
    const values: Array<string | number> = [];
    const conditions: string[] = [];

    if (filters?.vesselType) {
      values.push(filters.vesselType);
      conditions.push(`vessel_type = $${values.length}`);
    }

    if (filters?.fuelType) {
      values.push(filters.fuelType);
      conditions.push(`fuel_type = $${values.length}`);
    }

    if (filters?.year) {
      values.push(filters.year);
      conditions.push(`year = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM routes ${whereClause} ORDER BY year, route_id`,
      values
    );

    return result.rows.map(mapRoute);
  }

  async getByRouteId(routeId: string): Promise<RouteRecord | null> {
    const result = await this.pool.query("SELECT * FROM routes WHERE route_id = $1", [routeId]);
    return result.rowCount ? mapRoute(result.rows[0]) : null;
  }

  async getBaseline(): Promise<RouteRecord | null> {
    const result = await this.pool.query("SELECT * FROM routes WHERE is_baseline = true LIMIT 1");
    return result.rowCount ? mapRoute(result.rows[0]) : null;
  }

  async setBaseline(routeId: string): Promise<RouteRecord> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("UPDATE routes SET is_baseline = false");
      const result = await client.query(
        "UPDATE routes SET is_baseline = true WHERE route_id = $1 RETURNING *",
        [routeId]
      );

      if (!result.rowCount) {
        throw new Error(`Route ${routeId} was not found.`);
      }

      await client.query("COMMIT");
      return mapRoute(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

