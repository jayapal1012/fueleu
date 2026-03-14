import type { Pool } from "pg";
import type { BankEntry } from "../../../core/domain/banking.js";
import type { BankRepository } from "../../../core/ports/bank-repository.js";

const mapBankEntry = (row: Record<string, unknown>): BankEntry => ({
  id: Number(row.id),
  shipId: String(row.ship_id),
  year: Number(row.year),
  amountGco2eq: Number(row.amount_gco2eq),
  entryType: row.entry_type === "APPLY" ? "APPLY" : "BANK",
  targetShipId: row.target_ship_id ? String(row.target_ship_id) : null,
  targetYear: row.target_year ? Number(row.target_year) : null,
  createdAt: new Date(String(row.created_at)).toISOString()
});

export class PostgresBankRepository implements BankRepository {
  constructor(private readonly pool: Pool) {}

  async listByShipYear(shipId?: string, year?: number): Promise<BankEntry[]> {
    const values: Array<string | number> = [];
    const conditions: string[] = [];

    if (shipId) {
      values.push(shipId);
      conditions.push(`ship_id = $${values.length}`);
    }

    if (year) {
      values.push(year);
      conditions.push(`year = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM bank_entries ${whereClause} ORDER BY created_at ASC`,
      values
    );

    return result.rows.map(mapBankEntry);
  }

  async getAvailable(shipId: string, year: number): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT
          COALESCE(SUM(CASE WHEN entry_type = 'BANK' THEN amount_gco2eq ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN entry_type = 'APPLY' THEN amount_gco2eq ELSE 0 END), 0) AS available
        FROM bank_entries
        WHERE ship_id = $1 AND year = $2
      `,
      [shipId, year]
    );

    return Number(result.rows[0]?.available ?? 0);
  }

  async createBankEntry(entry: {
    shipId: string;
    year: number;
    amountGco2eq: number;
    entryType: "BANK" | "APPLY";
    targetShipId?: string | null;
    targetYear?: number | null;
  }): Promise<BankEntry> {
    const result = await this.pool.query(
      `
        INSERT INTO bank_entries (ship_id, year, amount_gco2eq, entry_type, target_ship_id, target_year)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [
        entry.shipId,
        entry.year,
        entry.amountGco2eq,
        entry.entryType,
        entry.targetShipId ?? null,
        entry.targetYear ?? null
      ]
    );

    return mapBankEntry(result.rows[0]);
  }

  async getAppliedToShipYear(shipId: string, year: number): Promise<number> {
    const result = await this.pool.query(
      `
        SELECT COALESCE(SUM(amount_gco2eq), 0) AS applied
        FROM bank_entries
        WHERE target_ship_id = $1 AND target_year = $2 AND entry_type = 'APPLY'
      `,
      [shipId, year]
    );

    return Number(result.rows[0]?.applied ?? 0);
  }
}

