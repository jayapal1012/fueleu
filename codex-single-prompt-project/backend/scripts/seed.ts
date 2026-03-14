import { pgPool } from "../src/infrastructure/db/pool.js";
import { seedRoutes } from "../src/infrastructure/db/seed-data.js";

const seed = async () => {
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

  await pgPool.end();
  console.log("Seeded routes");
};

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
