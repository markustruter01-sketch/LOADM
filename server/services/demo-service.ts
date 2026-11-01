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

export async function resetDemoData(trigger: "boot" | "manual" | "schedule"): Promise<{ ok: true; summary: SeedSummary; at: string }> {
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

/** Seed on boot only when the users table is empty. */
export async function ensureSeeded(): Promise<void> {
  if (!env.SEED_ON_BOOT) return;
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  if (count > 0) return;
  logger.info("empty database; seeding demo data");
  await resetDemoData("boot");
}

export async function getDemoStatus(): Promise<{ lastResetAt: string | null; nextResetAt: string | null; resetHourUtc: number | null }> {
  let lastResetAt = lastReset?.at.toISOString() ?? null;
  if (!lastResetAt) {
    const [row] = await db.select({ at: activityLog.performedAt }).from(activityLog).where(eq(activityLog.action, "RESET")).orderBy(desc(activityLog.performedAt)).limit(1);
    lastResetAt = row?.at.toISOString() ?? null;
  }
  const hour = env.DEMO_RESET_HOUR_UTC === "" ? null : env.DEMO_RESET_HOUR_UTC;
  return { lastResetAt, nextResetAt: hour === null ? null : nextRunAt(hour).toISOString(), resetHourUtc: hour };
}

function nextRunAt(hourUtc: number): Date {
  const next = new Date();
  next.setUTCHours(hourUtc, 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/** Daily reset at the configured UTC hour. Instances race on the advisory lock; losers skip. */
export function startDemoResetSchedule(): () => void {
  if (env.DEMO_RESET_HOUR_UTC === "") return () => undefined;
  const hour = env.DEMO_RESET_HOUR_UTC;
  let timer: NodeJS.Timeout | undefined;
  const schedule = () => {
    const delay = nextRunAt(hour).getTime() - Date.now();
    timer = setTimeout(async () => {
      try {
        await resetDemoData("schedule");
      } catch (err) {
        if (!(err instanceof Conflict)) logger.error({ err }, "scheduled reset failed");
      }
      schedule();
    }, delay);
  };
  schedule();
  return () => timer && clearTimeout(timer);
}
