import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { parseIntoClientConfig } from "pg-connection-string";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local, set DATABASE_URL, then restart the dev server (see README)."
  );
}

const config = parseIntoClientConfig(databaseUrl);
const pool = new Pool({
  ...config,
  // SCRAM auth requires a string; undefined breaks with "client password must be a string"
  password: config.password ?? "",
});

export const db = drizzle(pool, { schema: { ...schema } });

export type Db = typeof db;
