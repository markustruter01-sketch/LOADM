import { createRequire } from "node:module";
import { sql } from "drizzle-orm";
import type { PgDatabase } from "drizzle-orm/pg-core";
import * as schema from "@shared/schema";
import { DB_SCHEMA } from "@shared/schema";
import { db, pool } from "./db";
import { logger } from "./lib/logger";

/** Advisory lock key so concurrent instances don't run schema sync together. */
const SCHEMA_LOCK_KEY = 7_340_190;

/**
 * Bring the database in line with `shared/schema.ts` on every boot.
 *
 * Only the `showcase` Postgres schema is inspected and changed; legacy
 * tables in `public` are never touched. Because everything in `showcase` is
 * demo data that the seed can recreate, schema changes are applied directly
 * (drizzle-kit push) rather than through hand-written migrations, which
 * means a deploy is just "pull and publish".
 */
export async function ensureDatabaseSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [SCHEMA_LOCK_KEY]);
    await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS "${DB_SCHEMA}"`));

    // drizzle-kit's ESM build (api.mjs) fails with "Dynamic require of fs";
    // its CommonJS build loads fine.
    const { pushSchema } = createRequire(import.meta.url)("drizzle-kit/api") as typeof import("drizzle-kit/api");
    const result = await pushSchema(schema, db as unknown as PgDatabase<never>, [DB_SCHEMA]);
    if (result.statementsToExecute.length === 0) {
      logger.info("database schema up to date");
      return;
    }
    if (result.warnings.length) logger.warn({ warnings: result.warnings }, "schema sync warnings");
    await result.apply();
    logger.info({ statements: result.statementsToExecute.length }, "database schema synced");
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [SCHEMA_LOCK_KEY]).catch(() => undefined);
    client.release();
  }
}
