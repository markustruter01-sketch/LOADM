import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { db, type Tx, type Db } from "../db";
import { users, userQualifications, readinessSnapshots, type ReadinessSnapshot } from "@shared/schema";
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

const DAY_MS = 86_400_000;

/**
 * The one definition of squadron readiness, used by the live dashboard, the
 * daily snapshot and the seed. "Personnel" = active students and loadmasters
 * in a flying squadron. "At risk" = ready now but with a qualification
 * expiring inside the warning window.
 */
export async function computeReadinessForDate(conn: Db | Tx, asOf: Date): Promise<ReadinessFigures[]> {
  const personnel = await conn
    .select({ id: users.id, squadron: users.squadron, isFlightReady: users.isFlightReady })
    .from(users)
    .where(and(eq(users.isActive, true), inArray(users.role, ["student", "loadmaster"]), inArray(users.squadron, [...FLYING_SQUADRONS])));
  const ids = personnel.map((p) => p.id);
  const quals = ids.length
    ? await conn
        .select({ userId: userQualifications.userId, expiryDate: userQualifications.expiryDate })
        .from(userQualifications)
        .where(inArray(userQualifications.userId, ids))
    : [];

  const warnMs = THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS * DAY_MS;
  const t = asOf.getTime();
  const perUser = new Map<number, { expired: number; expiring: number; current: number }>();
  for (const q of quals) {
    const rec = perUser.get(q.userId) ?? { expired: 0, expiring: 0, current: 0 };
    if (!q.expiryDate) rec.current++;
    else {
      const e = q.expiryDate.getTime();
      if (e < t) rec.expired++;
      else if (e - t <= warnMs) rec.expiring++;
      else rec.current++;
    }
    perUser.set(q.userId, rec);
  }

  const figuresFor = (squadron: SnapshotSquadron, members: typeof personnel): ReadinessFigures => {
    let ready = 0, current = 0, expiring = 0, expired = 0, atRisk = 0;
    for (const m of members) {
      const q = perUser.get(m.id) ?? { expired: 0, expiring: 0, current: 0 };
      current += q.current; expiring += q.expiring; expired += q.expired;
      const isReady = m.isFlightReady && q.expired === 0;
      if (isReady) ready++;
      if (isReady && q.expiring > 0) atRisk++;
    }
    const total = members.length;
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
  };

  return [
    figuresFor("ALL", personnel),
    ...FLYING_SQUADRONS.map((s) => figuresFor(s, personnel.filter((p) => p.squadron === s))),
  ];
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

export async function getSnapshotHistory(squadron: SnapshotSquadron, days: number): Promise<ReadinessSnapshot[]> {
  const since = new Date(Date.now() - days * DAY_MS);
  return db
    .select()
    .from(readinessSnapshots)
    .where(and(eq(readinessSnapshots.squadron, squadron), gte(readinessSnapshots.snapshotDate, since)))
    .orderBy(desc(readinessSnapshots.snapshotDate));
}
