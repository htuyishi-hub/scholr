import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

// IMPORTANT:
// Railway may boot the API container before a DB is provisioned or before env vars are wired.
// Avoid hard-failing at module import time (otherwise the whole server crashes).
// But keep `db` typed as non-null so `tsc --noEmit` continues to pass.
// If DB is missing, accessing DB must throw with a clear runtime error.

export const pool: pg.Pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : (null as any);

export const db = databaseUrl ? drizzle(pool, { schema }) : (null as any);

export function getDb() {
  if (!databaseUrl || !pool || !db) {
    throw new Error(
      "DATABASE_URL must be set (and DB must be reachable). Did you forget to provision a database?",
    );
  }
  return db;
}



export * from "./schema";
