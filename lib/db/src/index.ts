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

// Keep `db` typed as non-null at compile time.
// Runtime will still throw a clear error via `getDb()` if DATABASE_URL is missing.
export const db = databaseUrl ? drizzle(pool, { schema }) : (drizzle((pool as any), { schema }) as any);





export function getDb() {
  // Re-read env at call time so container boot order / secret injection works.
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set (and DB must be reachable). Did you forget to provision a database?",
    );
  }

  // If pool/db were created with a missing env var at module init time,
  // accessing them would still be broken. Throw a clear error instead.
  if (!pool || !db) {
    throw new Error(
      "Database is not initialized. Did you provision DATABASE_URL before starting the server?",
    );
  }

  return db;
}

export * from "./schema";

