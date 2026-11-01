import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, type Tx, type Db } from "../db";
import { users, userQualifications, readinessSnapshots, type ReadinessSnapshot, type User } from "@shared/schema";
import { FLYING_SQUADRONS, THRESHOLDS, type FlyingSquadron } from "@shared/constants";

export type SnapshotSquadron = FlyingSquadron | "ALL";

export interface ReadinessFigures {
  squadron: SnapshotSquadron;
  totalPersonnel: number;
  readyCount: number;
  notReadyCount: number;
  readyPercent: number;
  currentQuals: number;
  expiringQuals: number;
  expiredQuals: number;
  personnelAtRisk: number;
}

export interface QualCounts {
  current: number;
  expiring: number;
  expired: number;
}

export interface PersonReadiness {
  user: User;
  ready: boolean;
  /** Why the person is not ready; null when ready. */
  reason: string | null;
  quals: QualCounts;
}

const DAY_MS = 86_400_000;

/**
 * The one definition of readiness, used by the live dashboard, the daily
 * snapshot and the seed. "Personnel" = active students and loadmasters in a
 * flying squadron. Ready = marked flight-ready and no expired qualification.
 * A not-ready person's reason is the recorded one, else "Currency Lapsed"
 * when a qualification has expired, else "Pending Review".
 */
export async function assessReadiness(conn: Db | Tx, asOf: Date, squadron?: FlyingSquadron): Promise<PersonReadiness[]> {
  const personnel = await conn
    .select()
    .from(users)
    .where(
      and(
        eq(users.isActive, true),
        inArray(users.role, ["student", "loadmaster"]),
        inArray(users.squadron, squadron ? [squadron] : [...FLYING_SQUADRONS]),
      ),
    )
    .orderBy(asc(users.squadron), asc(users.lastName), asc(users.firstName));
  const ids = personnel.map((p) => p.id);
  const quals = ids.length
    ? await conn
        .select({ userId: userQualifications.userId, expiryDate: userQualifications.expiryDate })
        .from(userQualifications)
        .where(inArray(userQualifications.userId, ids))
    : [];

  const warnMs = THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS * DAY_MS;
  const t = asOf.getTime();
  const perUser = new Map<number, QualCounts>();
  for (const q of quals) {
    const rec = perUser.get(q.userId) ?? { current: 0, expiring: 0, expired: 0 };
    const e = q.expiryDate?.getTime();
    if (e === undefined || e - t > warnMs) rec.current++;
    else if (e < t) rec.expired++;
    else rec.expiring++;
    perUser.set(q.userId, rec);
  }

  return personnel.map((user) => {
    const q = perUser.get(user.id) ?? { current: 0, expiring: 0, expired: 0 };
    const ready = user.isFlightReady && q.expired === 0;
    const reason = ready ? null : (!user.isFlightReady && user.notReadyReason) || (q.expired > 0 ? "Currency Lapsed" : "Pending Review");
    return { user, ready, reason, quals: q };
  });
}

/** "At risk" = ready now but with a qualification expiring inside the warning window. */
function figuresFor(squadron: SnapshotSquadron, people: PersonReadiness[]): ReadinessFigures {
  let ready = 0, current = 0, expiring = 0, expired = 0, atRisk = 0;
  for (const p of people) {
    current += p.quals.current; expiring += p.quals.expiring; expired += p.quals.expired;
    if (p.ready) ready++;
    if (p.ready && p.quals.expiring > 0) atRisk++;
  }
  const total = people.length;
  return {
    squadron,
    totalPersonnel: total,
    readyCount: ready,
    notReadyCount: total - ready,
    readyPercent: total ? Number(((ready / total) * 100).toFixed(1)) : 0,
    currentQuals: current,
    expiringQuals: expiring,
    expiredQuals: expired,
    personnelAtRisk: atRisk,
  };
}

export async function computeReadinessForDate(conn: Db | Tx, asOf: Date): Promise<ReadinessFigures[]> {
  const people = await assessReadiness(conn, asOf);
  return [figuresFor("ALL", people), ...FLYING_SQUADRONS.map((s) => figuresFor(s, people.filter((p) => p.user.squadron === s)))];
}

function startOfUtcDay(d = new Date()): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

/** Insert today's snapshot rows if missing. Safe to call from many instances. */
export async function captureSnapshot(): Promise<{ created: number }> {
  const date = startOfUtcDay();
  const figures = await computeReadinessForDate(db, new Date());
  const inserted = await db
    .insert(readinessSnapshots)
    .values(figures.map((f) => ({ ...f, snapshotDate: date })))
    .onConflictDoNothing({ target: [readinessSnapshots.snapshotDate, readinessSnapshots.squadron] })
    .returning({ id: readinessSnapshots.id });
  return { created: inserted.length };
}

/** The latest `limit` daily snapshots (oldest first) and the date collection began. */
export async function getSnapshotHistory(
  squadron: SnapshotSquadron,
  limit: number,
): Promise<{ points: ReadinessSnapshot[]; firstDate: Date | null }> {
  const [rows, first] = await Promise.all([
    db.select().from(readinessSnapshots).where(eq(readinessSnapshots.squadron, squadron)).orderBy(desc(readinessSnapshots.snapshotDate)).limit(limit),
    db
      .select({ date: readinessSnapshots.snapshotDate })
      .from(readinessSnapshots)
      .where(eq(readinessSnapshots.squadron, squadron))
      .orderBy(asc(readinessSnapshots.snapshotDate))
      .limit(1),
  ]);
  return { points: rows.reverse(), firstDate: first[0]?.date ?? null };
}
