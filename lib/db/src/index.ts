import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

// IMPORTANT:
// Railway may boot the API container before a DB is provisioned or before env vars are wired.
// Do not hard-fail at module import time, otherwise the entire server crashes.
// Instead, create the DB objects lazily and throw only when used.
export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

export const db = pool ? drizzle(pool, { schema }) : null;

function assertDbAvailable() {
  if (!databaseUrl || !pool || !db) {
    throw new Error(
      "DATABASE_URL must be set (and DB must be reachable). Did you forget to provision a database?",
    );
  }
  return db;
}

export const getDb = () => assertDbAvailable();


export * from "./schema";
