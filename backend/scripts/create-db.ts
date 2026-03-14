import { Client } from "pg";
import { dbConfig } from "../src/infrastructure/db/config.js";

const createDatabase = async () => {
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: "postgres"
  });

  await client.connect();
  const result = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbConfig.database]
  );

  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbConfig.database}`);
    console.log(`Created database ${dbConfig.database}`);
  } else {
    console.log(`Database ${dbConfig.database} already exists`);
  }

  await client.end();
};

createDatabase().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

