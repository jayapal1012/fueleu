import type { Pool } from "pg";
import type {
  AdjustedComplianceSnapshot,
  ComplianceSnapshot
} from "../../../core/domain/compliance.js";
import type { ComplianceRepository } from "../../../core/ports/compliance-repository.js";

const mapCompliance = (row: Record<string, unknown>): ComplianceSnapshot => ({
  shipId: String(row.ship_id),
  routeId: String(row.route_id),
  year: Number(row.year),
  cbGco2eq: Number(row.cb_gco2eq),
  ghgIntensity: Number(row.ghg_intensity),
  energyInScopeMj: Number(row.energy_in_scope_mj)
});

const mapAdjusted = (row: Record<string, unknown>): AdjustedComplianceSnapshot => ({
  shipId: String(row.ship_id),
  routeId: String(row.route_id),
  year: Number(row.year),
  cbGco2eq: Number(row.cb_gco2eq),
  ghgIntensity: Number(row.ghg_intensity),
  energyInScopeMj: Number(row.energy_in_scope_mj),
  bankedAvailable: Number(row.banked_available),
  applied: Number(row.applied),
  adjustedCb: Number(row.adjusted_cb)
});

export class PostgresComplianceRepository implements ComplianceRepository {
  constructor(private readonly pool: Pool) {}

  async upsert(snapshot: ComplianceSnapshot): Promise<ComplianceSnapshot> {
    const result = await this.pool.query(
      `
        INSERT INTO ship_compliance (ship_id, route_id, year, cb_gco2eq, ghg_intensity, energy_in_scope_mj)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (ship_id, year)
        DO UPDATE SET
          route_id = EXCLUDED.route_id,
          cb_gco2eq = EXCLUDED.cb_gco2eq,
          ghg_intensity = EXCLUDED.ghg_intensity,
          energy_in_scope_mj = EXCLUDED.energy_in_scope_mj,
          updated_at = NOW()
        RETURNING ship_id, route_id, year, cb_gco2eq, ghg_intensity, energy_in_scope_mj
      `,
      [
        snapshot.shipId,
        snapshot.routeId,
        snapshot.year,
        snapshot.cbGco2eq,
        snapshot.ghgIntensity,
        snapshot.energyInScopeMj
      ]
    );

    return mapCompliance(result.rows[0]);
  }

  async getSnapshot(shipId: string, year: number): Promise<ComplianceSnapshot | null> {
    const result = await this.pool.query(
      "SELECT ship_id, route_id, year, cb_gco2eq, ghg_intensity, energy_in_scope_mj FROM ship_compliance WHERE ship_id = $1 AND year = $2",
      [shipId, year]
    );

    return result.rowCount ? mapCompliance(result.rows[0]) : null;
  }

  async listSnapshotsByYear(year: number): Promise<ComplianceSnapshot[]> {
    const result = await this.pool.query(
      "SELECT ship_id, route_id, year, cb_gco2eq, ghg_intensity, energy_in_scope_mj FROM ship_compliance WHERE year = $1 ORDER BY ship_id",
      [year]
    );

    return result.rows.map(mapCompliance);
  }

  async getAdjustedSnapshot(
    shipId: string,
    year: number
  ): Promise<AdjustedComplianceSnapshot | null> {
    const result = await this.pool.query(
      `
        SELECT
          sc.ship_id,
          sc.route_id,
          sc.year,
          sc.cb_gco2eq,
          sc.ghg_intensity,
          sc.energy_in_scope_mj,
          COALESCE(SUM(CASE WHEN be.ship_id = sc.ship_id AND be.year = sc.year AND be.entry_type = 'BANK' THEN be.amount_gco2eq ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN be.ship_id = sc.ship_id AND be.year = sc.year AND be.entry_type = 'APPLY' THEN be.amount_gco2eq ELSE 0 END), 0) AS banked_available,
          COALESCE(SUM(CASE WHEN be.target_ship_id = sc.ship_id AND be.target_year = sc.year AND be.entry_type = 'APPLY' THEN be.amount_gco2eq ELSE 0 END), 0) AS applied,
          sc.cb_gco2eq +
          COALESCE(SUM(CASE WHEN be.target_ship_id = sc.ship_id AND be.target_year = sc.year AND be.entry_type = 'APPLY' THEN be.amount_gco2eq ELSE 0 END), 0) AS adjusted_cb
        FROM ship_compliance sc
        LEFT JOIN bank_entries be
          ON (be.ship_id = sc.ship_id AND be.year = sc.year)
          OR (be.target_ship_id = sc.ship_id AND be.target_year = sc.year)
        WHERE sc.ship_id = $1 AND sc.year = $2
        GROUP BY sc.ship_id, sc.route_id, sc.year, sc.cb_gco2eq, sc.ghg_intensity, sc.energy_in_scope_mj
      `,
      [shipId, year]
    );

    return result.rowCount ? mapAdjusted(result.rows[0]) : null;
  }

  async listAdjustedByYear(year: number): Promise<AdjustedComplianceSnapshot[]> {
    const result = await this.pool.query(
      `
        SELECT
          sc.ship_id,
          sc.route_id,
          sc.year,
          sc.cb_gco2eq,
          sc.ghg_intensity,
          sc.energy_in_scope_mj,
          COALESCE(SUM(CASE WHEN be.ship_id = sc.ship_id AND be.year = sc.year AND be.entry_type = 'BANK' THEN be.amount_gco2eq ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN be.ship_id = sc.ship_id AND be.year = sc.year AND be.entry_type = 'APPLY' THEN be.amount_gco2eq ELSE 0 END), 0) AS banked_available,
          COALESCE(SUM(CASE WHEN be.target_ship_id = sc.ship_id AND be.target_year = sc.year AND be.entry_type = 'APPLY' THEN be.amount_gco2eq ELSE 0 END), 0) AS applied,
          sc.cb_gco2eq +
          COALESCE(SUM(CASE WHEN be.target_ship_id = sc.ship_id AND be.target_year = sc.year AND be.entry_type = 'APPLY' THEN be.amount_gco2eq ELSE 0 END), 0) AS adjusted_cb
        FROM ship_compliance sc
        LEFT JOIN bank_entries be
          ON (be.ship_id = sc.ship_id AND be.year = sc.year)
          OR (be.target_ship_id = sc.ship_id AND be.target_year = sc.year)
        WHERE sc.year = $1
        GROUP BY sc.ship_id, sc.route_id, sc.year, sc.cb_gco2eq, sc.ghg_intensity, sc.energy_in_scope_mj
        ORDER BY sc.ship_id
      `,
      [year]
    );

    return result.rows.map(mapAdjusted);
  }
}

