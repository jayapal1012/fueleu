import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { readFile } from "node:fs/promises";
import { pgPool } from "../../src/infrastructure/db/pool.js";
import { seedRoutes } from "../../src/infrastructure/db/seed-data.js";
import { createApp } from "../../src/adapters/inbound/http/create-app.js";

const app = createApp();

async function resetDatabase() {
  const schemaSql = await readFile(
    new URL("../../src/infrastructure/db/schema.sql", import.meta.url),
    "utf8"
  );
  await pgPool.query(schemaSql);
  await pgPool.query(
    "TRUNCATE pool_members, pools, bank_entries, ship_compliance, routes RESTART IDENTITY CASCADE"
  );

  for (const route of seedRoutes) {
    await pgPool.query(
      `
        INSERT INTO routes (route_id, ship_id, vessel_type, fuel_type, year, ghg_intensity, fuel_consumption, distance, total_emissions, is_baseline)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        route.routeId,
        route.shipId,
        route.vesselType,
        route.fuelType,
        route.year,
        route.ghgIntensity,
        route.fuelConsumption,
        route.distance,
        route.totalEmissions,
        route.isBaseline
      ]
    );
  }
}

describe("HTTP API", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pgPool.end();
  });

  it("lists routes and updates baseline", async () => {
    const listResponse = await request(app).get("/routes");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(5);

    const baselineResponse = await request(app).post("/routes/R003/baseline");
    expect(baselineResponse.status).toBe(200);
    expect(baselineResponse.body.routeId).toBe("R003");
  });

  it("computes compliance, banking, and adjusted balances", async () => {
    const cbResponse = await request(app).get("/compliance/cb").query({
      shipId: "R002",
      year: 2024
    });
    expect(cbResponse.status).toBe(200);
    expect(cbResponse.body.cbGco2eq).toBeGreaterThan(0);

    const bankResponse = await request(app).post("/banking/bank").send({
      shipId: "R002",
      year: 2024,
      amountGco2eq: 100000
    });
    expect(bankResponse.status).toBe(201);

    const applyResponse = await request(app).post("/banking/apply").send({
      sourceShipId: "R002",
      sourceYear: 2024,
      targetShipId: "R003",
      targetYear: 2024,
      amountGco2eq: 50000
    });
    expect(applyResponse.status).toBe(201);
    expect(applyResponse.body.cbAfter).toBeGreaterThan(applyResponse.body.cbBefore);

    const adjustedResponse = await request(app)
      .get("/compliance/adjusted-cb")
      .query({ year: 2024 });
    expect(adjustedResponse.status).toBe(200);
    expect(adjustedResponse.body).toHaveLength(3);
  });

  it("creates a pool from adjusted balances", async () => {
    const poolResponse = await request(app).post("/pools").send({
      year: 2024,
      members: [
        {
          shipId: "R002",
          year: 2024,
          adjustedCb: 300
        },
        {
          shipId: "R003",
          year: 2024,
          adjustedCb: -100
        }
      ]
    });

    expect(poolResponse.status).toBe(201);
    expect(poolResponse.body.members).toHaveLength(2);
    expect(poolResponse.body.members[1].cbAfter).toBe(0);
  });
});
