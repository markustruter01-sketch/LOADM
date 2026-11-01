import { sql, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { users, activityLog } from "@shared/schema";
import { runSeed, type SeedSummary } from "../seed";
import { invalidatePersonaCache } from "../middleware/persona";
import { env } from "../config";
import { logger } from "../lib/logger";
import { Conflict } from "../lib/errors";

/** Postgres advisory lock key so only one instance resets at a time. */
const RESET_LOCK_KEY = 7_340_191;

let lastReset: { at: Date; trigger: string; summary: SeedSummary } | null = null;

export async function resetDemoData(trigger: "boot" | "manual"): Promise<{ ok: true; summary: SeedSummary; at: string }> {
  const started = Date.now();
  const summary = await db.transaction(async (tx) => {
    const [{ locked }] = (await tx.execute(sql`SELECT pg_try_advisory_xact_lock(${RESET_LOCK_KEY}) AS locked`)).rows as { locked: boolean }[];
    if (!locked) throw new Conflict("A reset is already in progress");
    return runSeed(tx);
  });
  invalidatePersonaCache();
  lastReset = { at: new Date(), trigger, summary };
  logger.info({ trigger, ms: Date.now() - started, ...summary }, "demo data reset");
  return { ok: true, summary, at: lastReset.at.toISOString() };
}

/** Demo data older than this is reloaded on the next start-up. */
const MAX_DATA_AGE_MS = 24 * 60 * 60 * 1000;

async function lastResetAt(): Promise<Date | null> {
  if (lastReset) return lastReset.at;
  const [row] = await db
    .select({ at: activityLog.performedAt })
    .from(activityLog)
    .where(eq(activityLog.action, "RESET"))
    .orderBy(desc(activityLog.performedAt))
    .limit(1);
  return row?.at ?? null;
}

/**
 * Seed on start-up when the database is empty or the demo data is more than
 * a day old. Replit sleeps idle apps and starts them on the next visit, so
 * this keeps the data fresh without a background timer.
 */
export async function ensureSeeded(): Promise<void> {
  if (!env.SEED_ON_BOOT) return;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  const last = count > 0 ? await lastResetAt() : null;
  if (last && Date.now() - last.getTime() < MAX_DATA_AGE_MS) return;
  logger.info(count === 0 ? "empty database; seeding demo data" : "demo data older than a day; reloading");
  try {
    await resetDemoData("boot");
  } catch (err) {
    // Another instance is already reseeding; its transaction commits atomically.
    if (!(err instanceof Conflict)) throw err;
  }
}

