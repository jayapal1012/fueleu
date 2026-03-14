import { Pool } from "pg";
import { dbConfig } from "./config.js";

export const pgPool = new Pool(dbConfig);

