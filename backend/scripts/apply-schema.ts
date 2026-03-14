import { readFile } from "node:fs/promises";
import { pgPool } from "../src/infrastructure/db/pool.js";

const applySchema = async () => {
  const schemaSql = await readFile(
    new URL("../src/infrastructure/db/schema.sql", import.meta.url),
    "utf8"
  );

  await pgPool.query(schemaSql);
  await pgPool.end();
  console.log("Schema applied");
};

applySchema().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

