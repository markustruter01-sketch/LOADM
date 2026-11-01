import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import {
  userQualifications, flightRecords, quizSubmissions, scenarioSubmissions, trainingModuleCompletions,
  type User, type UserQualification, type PublicUser,
} from "@shared/schema";
import { THRESHOLDS, roleHas, type AircraftType, type Squadron } from "@shared/constants";
import { Forbidden } from "../lib/errors";
import { getUser, listReadinessPersonnel, toPublicUser } from "./user-service";

const DAY_MS = 86_400_000;

// ---- Qualification status --------------------------------------------------

export type QualificationStatus = "current" | "expiring" | "expired";

/**
 * The one rule for qualification status (identical to users.ts buildProfile
 * and readiness-service): expired when the expiry has passed, expiring when
 * it falls inside the warning window, otherwise current. No expiry = current.
 */
export function qualificationStatus(expiryDate: Date | null, now = Date.now()): QualificationStatus {
  if (!expiryDate) return "current";
  const e = expiryDate.getTime();
  if (e < now) return "expired";
  if (e - now <= THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS * DAY_MS) return "expiring";
  return "current";
}

export function daysRemaining(expiryDate: Date | null, now = Date.now()): number | null {
  return expiryDate ? Math.ceil((expiryDate.getTime() - now) / DAY_MS) : null;
}

export type QualificationWithStatus = UserQualification & { status: QualificationStatus; daysRemaining: number | null };

export function withQualificationStatus(q: UserQualification, now = Date.now()): QualificationWithStatus {
  return { ...q, status: qualificationStatus(q.expiryDate, now), daysRemaining: daysRemaining(q.expiryDate, now) };
}

// ---- Target user resolution ------------------------------------------------

/**
 * Who a personnel request is about. Instructors may name any user; everyone
 * else is limited to themselves. Throws 404 when the named user is missing.
 */
export async function resolveTargetUser(actor: User, requestedUserId: number | undefined): Promise<User> {
  if (requestedUserId === undefined || requestedUserId === actor.id) return actor;
  if (!roleHas(actor.role, "instruct")) throw new Forbidden();
  return getUser(requestedUserId);
}

// ---- Flight summary --------------------------------------------------------

export interface FlightSummary {
  sorties: number;
  dayHours: number;
  nightHours: number;
  totalHours: number;
  cargoKg: number;
  passengers: number;
  byAircraft: { aircraft: AircraftType; sorties: number; hours: number }[];
  last12Months: { month: string; hours: number; sorties: number }[];
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** The last N calendar months (UTC) ending with the current one, oldest first. */
export function recentMonthKeys(count: number, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))));
  }
  return keys;
}

export async function flightSummaryForUser(userId: number): Promise<FlightSummary> {
  const months = recentMonthKeys(12);
  const since = new Date(`${months[0]}-01T00:00:00Z`);

  const [[totals], byAircraftRows, recentRows] = await Promise.all([
    db
      .select({
        sorties: sql<number>`count(*)::int`,
        dayHours: sql<number>`coalesce(sum(${flightRecords.dayHours}),0)::float`,
        nightHours: sql<number>`coalesce(sum(${flightRecords.nightHours}),0)::float`,
        cargoKg: sql<number>`coalesce(sum(${flightRecords.cargoWeightKg}),0)::int`,
        passengers: sql<number>`coalesce(sum(${flightRecords.passengersCarried}),0)::int`,
      })
      .from(flightRecords)
      .where(eq(flightRecords.userId, userId)),
    db
      .select({
        aircraft: flightRecords.aircraft,
        sorties: sql<number>`count(*)::int`,
        hours: sql<number>`coalesce(sum(${flightRecords.dayHours} + ${flightRecords.nightHours}),0)::float`,
      })
      .from(flightRecords)
      .where(eq(flightRecords.userId, userId))
      .groupBy(flightRecords.aircraft)
      .orderBy(flightRecords.aircraft),
    db
      .select({ date: flightRecords.date, dayHours: flightRecords.dayHours, nightHours: flightRecords.nightHours })
      .from(flightRecords)
      .where(and(eq(flightRecords.userId, userId), gte(flightRecords.date, since))),
  ]);

  const perMonth = new Map<string, { hours: number; sorties: number }>(months.map((m) => [m, { hours: 0, sorties: 0 }]));
  for (const r of recentRows) {
    const bucket = perMonth.get(monthKey(r.date));
    if (!bucket) continue;
    bucket.hours += r.dayHours + r.nightHours;
    bucket.sorties += 1;
  }

  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    sorties: totals?.sorties ?? 0,
    dayHours: round1(totals?.dayHours ?? 0),
    nightHours: round1(totals?.nightHours ?? 0),
    totalHours: round1((totals?.dayHours ?? 0) + (totals?.nightHours ?? 0)),
    cargoKg: totals?.cargoKg ?? 0,
    passengers: totals?.passengers ?? 0,
    byAircraft: byAircraftRows.map((r) => ({ aircraft: r.aircraft, sorties: r.sorties, hours: round1(r.hours) })),
    last12Months: months.map((month) => {
      const b = perMonth.get(month) ?? { hours: 0, sorties: 0 };
      return { month, hours: round1(b.hours), sorties: b.sorties };
    }),
  };
}

// ---- Readiness roster ------------------------------------------------------

export type AtRiskFlag =
  | "not_flight_ready"
  | "expired_qualification"
  | "expiring_qualification"
  | "low_average_score"
  | "inactive";

export interface RosterEntry {
  user: PublicUser;
  isReady: boolean;
  expiredQuals: QualificationWithStatus[];
  expiringQuals: QualificationWithStatus[];
  lastActiveAt: Date | null;
  /** Mean of graded quiz, scenario and module scores in the last 90 days; null when none. */
  recentAverageScore: number | null;
  atRisk: AtRiskFlag[];
}

/**
 * Per-person readiness for every active aircrew member (optionally one
 * squadron). "Ready" = flight-ready flag set and no expired qualification,
 * the same rule readiness-service uses for squadron figures.
 */
export async function buildRoster(squadron?: Squadron): Promise<RosterEntry[]> {
  const personnel = await listReadinessPersonnel(squadron);
  if (personnel.length === 0) return [];
  const ids = personnel.map((p) => p.id);
  const now = Date.now();
  const since = new Date(now - 90 * DAY_MS);
  const inactiveBefore = new Date(now - THRESHOLDS.INACTIVE_AFTER_WEEKS * 7 * DAY_MS);

  const [quals, quizRows, scenarioRows, moduleRows] = await Promise.all([
    db.select().from(userQualifications).where(inArray(userQualifications.userId, ids)).orderBy(userQualifications.expiryDate),
    db
      .select({ userId: quizSubmissions.userId, score: quizSubmissions.score, date: quizSubmissions.submittedAt })
      .from(quizSubmissions)
      .where(inArray(quizSubmissions.userId, ids))
      .orderBy(desc(quizSubmissions.submittedAt)),
    db
      .select({ userId: scenarioSubmissions.userId, score: scenarioSubmissions.score, date: scenarioSubmissions.submittedAt })
      .from(scenarioSubmissions)
      .where(inArray(scenarioSubmissions.userId, ids))
      .orderBy(desc(scenarioSubmissions.submittedAt)),
    db
      .select({ userId: trainingModuleCompletions.userId, score: trainingModuleCompletions.score, date: trainingModuleCompletions.submittedAt })
      .from(trainingModuleCompletions)
      .where(inArray(trainingModuleCompletions.userId, ids))
      .orderBy(desc(trainingModuleCompletions.submittedAt)),
  ]);

  const qualsByUser = new Map<number, QualificationWithStatus[]>();
  for (const q of quals) {
    const list = qualsByUser.get(q.userId) ?? [];
    list.push(withQualificationStatus(q, now));
    qualsByUser.set(q.userId, list);
  }

  const activity = new Map<number, { lastAt: Date | null; recent: number[] }>();
  const record = (userId: number, score: number | null, date: Date) => {
    const a = activity.get(userId) ?? { lastAt: null, recent: [] };
    if (!a.lastAt || date > a.lastAt) a.lastAt = date;
    if (score !== null && date >= since) a.recent.push(score);
    activity.set(userId, a);
  };
  for (const r of quizRows) record(r.userId, r.score, r.date);
  for (const r of scenarioRows) record(r.userId, r.score, r.date);
  for (const r of moduleRows) record(r.userId, r.score, r.date);

  return personnel.map((u) => {
    const q = qualsByUser.get(u.id) ?? [];
    const expiredQuals = q.filter((x) => x.status === "expired");
    const expiringQuals = q.filter((x) => x.status === "expiring");
    const a = activity.get(u.id) ?? { lastAt: null, recent: [] };
    const lastActiveAt = [u.lastActiveAt, a.lastAt]
      .filter((d): d is Date => d !== null)
      .sort((x, y) => y.getTime() - x.getTime())[0] ?? null;
    const recentAverageScore = a.recent.length ? Math.round(a.recent.reduce((s, x) => s + x, 0) / a.recent.length) : null;
    const isReady = u.isFlightReady && expiredQuals.length === 0;

    const atRisk: AtRiskFlag[] = [];
    if (!u.isFlightReady) atRisk.push("not_flight_ready");
    if (expiredQuals.length) atRisk.push("expired_qualification");
    if (expiringQuals.length) atRisk.push("expiring_qualification");
    if (recentAverageScore !== null && recentAverageScore < THRESHOLDS.AT_RISK_AVERAGE_SCORE) atRisk.push("low_average_score");
    if (!lastActiveAt || lastActiveAt < inactiveBefore) atRisk.push("inactive");

    return { user: toPublicUser(u), isReady, expiredQuals, expiringQuals, lastActiveAt, recentAverageScore, atRisk };
  });
}

/** Squadron of a user, looked up by id (used to denormalise safety records). */
export async function squadronOfUser(userId: number): Promise<Squadron> {
  return (await getUser(userId)).squadron;
}
