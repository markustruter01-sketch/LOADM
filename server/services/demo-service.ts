import { sql, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { users, activityLog } from "@shared/schema";
import { runSeed, SEED_VERSION } from "../seed";
import { invalidatePersonaCache } from "../middleware/persona";
import { env } from "../config";
import { logger } from "../lib/logger";
import { Conflict } from "../lib/errors";

/** Postgres advisory lock key so only one instance resets at a time. */
const RESET_LOCK_KEY = 7_340_191;

/** Seed the demo data inside one transaction; only one instance may run it. */
async function resetDemoData(): Promise<void> {
  const started = Date.now();
  const summary = await db.transaction(async (tx) => {
    const [{ locked }] = (await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${RESET_LOCK_KEY}) AS locked`)).rows as { locked: boolean }[];
    if (!locked) throw new Conflict("A reset is already in progress");
    return runSeed(tx);
  });
  invalidatePersonaCache();
  logger.info({ ms: Date.now() - started, ...summary }, "demo data seeded");
}

/** Demo data older than this is reloaded on the next start-up. */
const MAX_DATA_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Seed on start-up when the database is empty, the demo data is more than a
 * day old, or it was written by an older seed version. Replit sleeps idle
 * apps and starts them on the next visit, so this keeps the data fresh
 * without a background timer.
 */
export async function ensureSeeded(): Promise<void> {
  if (!env.SEED_ON_BOOT) return;
  const [last] = await db
    .select({ at: activityLog.performedAt, version: activityLog.resourceName })
    .from(activityLog)
    .where(eq(activityLog.action, "RESET"))
    .orderBy(desc(activityLog.performedAt))
    .limit(1);
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const fresh = count > 0 && last && last.version === SEED_VERSION && Date.now() - last.at.getTime() < MAX_DATA_AGE_MS;
  if (fresh) return;
  logger.info("seeding demo data");
  try {
    await resetDemoData();
  } catch (err) {
    // Another instance is already reseeding; its transaction commits atomically.
    if (!(err instanceof Conflict)) throw err;
  }
}
