import type { Pool } from "pg";
import type { PoolMemberAllocation, PoolResult } from "../../../core/domain/pooling.js";
import type { PoolRepository } from "../../../core/ports/pool-repository.js";

export class PostgresPoolRepository implements PoolRepository {
  constructor(private readonly pool: Pool) {}

  async createPool(year: number, members: PoolMemberAllocation[]): Promise<PoolResult> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      const poolInsert = await client.query(
        "INSERT INTO pools (year) VALUES ($1) RETURNING id, year",
        [year]
      );
      const poolId = Number(poolInsert.rows[0].id);

      for (const member of members) {
        await client.query(
          `
            INSERT INTO pool_members (pool_id, ship_id, year, cb_before, cb_after)
            VALUES ($1, $2, $3, $4, $5)
          `,
          [poolId, member.shipId, member.year, member.cbBefore, member.cbAfter]
        );
      }

      await client.query("COMMIT");

      return {
        poolId,
        year,
        sumBefore: Number(members.reduce((sum, member) => sum + member.cbBefore, 0).toFixed(2)),
        sumAfter: Number(members.reduce((sum, member) => sum + member.cbAfter, 0).toFixed(2)),
        members
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
