import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

// Validate DATABASE_URL at startup — catch broken hostnames early so every
// request doesn't fail with a cryptic ENOTFOUND error.
if (databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname;
    // Reject single-word hostnames that are clearly placeholder/misconfigured
    // values (e.g. "base", "localhost" in production, "db", "host").
    const suspicious = ["base", "db", "host", "database", "postgres", "pg"];
    if (suspicious.includes(host) && process.env.NODE_ENV === "production") {
      console.error(
        `[db] DATABASE_URL has suspicious hostname "${host}". ` +
          "This looks like a misconfigured environment variable. " +
          "On Render: link a PostgreSQL database to this service so DATABASE_URL is injected automatically. " +
          "On Railway: attach a Railway Postgres plugin. " +
          "Connection attempts will fail until this is corrected.",
      );
    }
  } catch {
    console.error("[db] DATABASE_URL is not a valid URL — database queries will fail.");
  }
}

// IMPORTANT:
// Render/Railway may boot the API container before a DB is provisioned or before env vars are wired.
// Avoid hard-failing at module import time (otherwise the whole server crashes on first deploy).
// But keep `db` typed as non-null so `tsc --noEmit` continues to pass.
// If DB is missing, accessing DB must throw with a clear runtime error.

export const pool: pg.Pool = databaseUrl
  ? new Pool({ connectionString: databaseUrl })
  : (null as any);

// Keep `db` typed as non-null at compile time.
// Runtime will still throw a clear error via `getDb()` if DATABASE_URL is missing.
export const db = databaseUrl
  ? drizzle(pool, { schema })
  : (drizzle(pool as any, { schema }) as any);

export function getDb() {
  // Re-read env at call time so container boot order / secret injection works.
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL must be set. " +
        "On Render: link a PostgreSQL database to this service (render.yaml handles this automatically). " +
        "On Railway: attach a Railway Postgres plugin.",
    );
  }

  if (!pool || !db) {
    throw new Error(
      "Database pool is not initialized. Ensure DATABASE_URL was set before the server started.",
    );
  }

  return db;
}

export * from "./schema";
