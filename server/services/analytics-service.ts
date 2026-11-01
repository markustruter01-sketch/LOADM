import { and, desc, eq, gt, gte, inArray, isNotNull, isNull, lt, lte, or, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  quizSubmissions, quizAttempts, quizQuestions, scenarioSubmissions, trainingModules, trainingModuleCompletions,
  documentSubmissions, flightRecords, userQualifications, safetyRecords, type User,
} from "@shared/schema";
import {
  FLYING_SQUADRONS, QUESTION_CATEGORY_LABELS, THRESHOLDS,
  type FlyingSquadron, type QuestionCategory, type SafetyRecordType,
} from "@shared/constants";
import { aircraftCompact, personName, squadronNumber } from "../lib/client-format";
import { listReadinessPersonnel } from "./user-service";
import { assessReadiness, captureSnapshot, getSnapshotHistory, type PersonReadiness, type SnapshotSquadron } from "./readiness-service";

/**
 * Every figure behind the analytics screens, computed from the tables at
 * request time in the shapes the screens read. Nothing is estimated.
 *
 * Conventions:
 *  - "personnel" = `listReadinessPersonnel` (active students and loadmasters
 *    in a flying squadron); AMG staff never appear in these figures.
 *  - "graded submission" = quiz submissions, reviewed scenario submissions
 *    with a score, and training module completions.
 *  - squadron-level breakdowns (`bySquadron`) of readiness, currency and
 *    safety carry the bare number ("33"): the leadership screens append "SQN".
 *  - percentages are integers 0..100.
 */

const DAY_MS = 86_400_000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ---- Small helpers --------------------------------------------------------

function conds(...parts: Array<SQL | undefined>): SQL | undefined {
  const present = parts.filter((p): p is SQL => p !== undefined);
  return present.length ? and(...present) : undefined;
}

function mean(values: number[]): number {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
}

const average = (values: number[]): number => Math.round(mean(values));
const percent = (part: number, whole: number): number => (whole ? Math.round((part / whole) * 100) : 0);
const round1 = (n: number): number => Math.round(n * 10) / 10;
const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY_MS);

/** Start (UTC) of the month `offset` months from the current one. */
function monthStart(offset: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
}

const scopeOf = (squadron?: FlyingSquadron): FlyingSquadron[] => (squadron ? [squadron] : [...FLYING_SQUADRONS]);

function countBy<T>(rows: T[], key: (row: T) => string): Array<{ key: string; count: number }> {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

// ---- Graded submissions ---------------------------------------------------

interface GradedSubmission {
  type: "quiz" | "scenario" | "module";
  userId: number;
  score: number;
  passed: boolean;
  submittedAt: Date;
}

async function loadGraded(userIds: number[], from?: Date): Promise<GradedSubmission[]> {
  if (userIds.length === 0) return [];
  const [quizRows, scenarioRows, moduleRows] = await Promise.all([
    db
      .select({ userId: quizSubmissions.userId, score: quizSubmissions.score, passed: quizSubmissions.passed, submittedAt: quizSubmissions.submittedAt })
      .from(quizSubmissions)
      .where(conds(inArray(quizSubmissions.userId, userIds), from ? gte(quizSubmissions.submittedAt, from) : undefined)),
    db
      .select({ userId: scenarioSubmissions.userId, score: scenarioSubmissions.score, passed: scenarioSubmissions.passed, submittedAt: scenarioSubmissions.submittedAt })
      .from(scenarioSubmissions)
      .where(
        conds(
          inArray(scenarioSubmissions.userId, userIds),
          eq(scenarioSubmissions.status, "reviewed"),
          isNotNull(scenarioSubmissions.score),
          from ? gte(scenarioSubmissions.submittedAt, from) : undefined,
        ),
      ),
    db
      .select({ userId: trainingModuleCompletions.userId, score: trainingModuleCompletions.score, passed: trainingModuleCompletions.passed, submittedAt: trainingModuleCompletions.submittedAt })
      .from(trainingModuleCompletions)
      .where(conds(inArray(trainingModuleCompletions.userId, userIds), from ? gte(trainingModuleCompletions.submittedAt, from) : undefined)),
  ]);
  return [
    ...quizRows.map((r) => ({ type: "quiz" as const, ...r })),
    ...scenarioRows.flatMap((r): GradedSubmission[] =>
      r.score === null ? [] : [{ type: "scenario", userId: r.userId, score: r.score, passed: r.passed ?? false, submittedAt: r.submittedAt }],
    ),
    ...moduleRows.map((r) => ({ type: "module" as const, ...r })),
  ];
}

function groupByUser(rows: GradedSubmission[]): Map<number, GradedSubmission[]> {
  const m = new Map<number, GradedSubmission[]>();
  for (const r of rows) m.set(r.userId, [...(m.get(r.userId) ?? []), r]);
  return m;
}

/** Latest submission of any kind (graded or not) per user. */
async function loadLastActivity(userIds: number[]): Promise<Map<number, Date>> {
  const latest = new Map<number, Date>();
  if (userIds.length === 0) return latest;
  const results = await Promise.all([
    db.select({ userId: quizSubmissions.userId, at: quizSubmissions.submittedAt }).from(quizSubmissions).where(inArray(quizSubmissions.userId, userIds)),
    db.select({ userId: scenarioSubmissions.userId, at: scenarioSubmissions.submittedAt }).from(scenarioSubmissions).where(inArray(scenarioSubmissions.userId, userIds)),
    db.select({ userId: trainingModuleCompletions.userId, at: trainingModuleCompletions.submittedAt }).from(trainingModuleCompletions).where(inArray(trainingModuleCompletions.userId, userIds)),
    db.select({ userId: documentSubmissions.userId, at: documentSubmissions.submittedAt }).from(documentSubmissions).where(inArray(documentSubmissions.userId, userIds)),
  ]);
  for (const row of results.flat()) {
    const prev = latest.get(row.userId);
    if (!prev || row.at.getTime() > prev.getTime()) latest.set(row.userId, row.at);
  }
  return latest;
}

// ---- Squadron readiness ---------------------------------------------------

export async function getSquadronReadiness(squadron?: FlyingSquadron) {
  const people = await assessReadiness(db, new Date(), squadron);
  const notReady = people.filter((p) => !p.ready);
  const counts = (rows: PersonReadiness[]) => {
    const ready = rows.filter((p) => p.ready).length;
    return { total: rows.length, ready, notReady: rows.length - ready, readyPercent: percent(ready, rows.length) };
  };
  const reasons = (rows: PersonReadiness[]) =>
    countBy(rows.filter((p) => !p.ready), (p) => p.reason ?? "").map(({ key, count }) => ({ reason: key, count }));

  return {
    summary: counts(people),
    reasonBreakdown: reasons(people).map((r) => ({ ...r, percent: percent(r.count, notReady.length) })),
    bySquadron: scopeOf(squadron).map((s) => {
      const rows = people.filter((p) => p.user.squadron === s);
      return { squadron: squadronNumber(s), ...counts(rows), reasonBreakdown: reasons(rows) };
    }),
    notReadyMembers: notReady.map((p) => ({
      userId: p.user.id,
      name: personName(p.user),
      email: p.user.email,
      squadron: p.user.squadron,
      reason: p.reason,
      updatedAt: p.user.readinessUpdatedAt,
    })),
  };
}

// ---- Readiness history ----------------------------------------------------

/** The latest `limit` daily snapshots; today's is captured first (idempotent). */
export async function getReadinessHistory(squadron: SnapshotSquadron, limit: number) {
  await captureSnapshot();
  const { points, firstDate } = await getSnapshotHistory(squadron, limit);
  const first = points[0];
  const last = points.at(-1);
  return {
    dataPoints: points,
    summary: {
      totalSnapshots: points.length,
      latestReadiness: last?.readyPercent ?? 0,
      averageReadiness: average(points.map((p) => p.readyPercent)),
      readinessTrend: first && last ? round1(last.readyPercent - first.readyPercent) : 0,
    },
    collectionStartDate: firstDate,
  };
}

// ---- Qualification currency -----------------------------------------------

type CurrencyBand = "expired" | "expiring30Days" | "expiring60Days" | "expiring90Days" | "current";

function currencyBand(daysLeft: number | null): CurrencyBand {
  if (daysLeft === null || daysLeft > 90) return "current";
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring30Days";
  if (daysLeft <= 60) return "expiring60Days";
  return "expiring90Days";
}

/** A qualification without an expiry date counts as current. "Expiring" = within 90 days. */
export async function getCurrencyStatus(squadron?: FlyingSquadron) {
  const personnel = await listReadinessPersonnel(squadron);
  const people = new Map(personnel.map((p) => [p.id, p]));
  const quals = people.size
    ? await db
        .select({ id: userQualifications.id, userId: userQualifications.userId, name: userQualifications.name, expiryDate: userQualifications.expiryDate })
        .from(userQualifications)
        .where(inArray(userQualifications.userId, [...people.keys()]))
        .orderBy(userQualifications.expiryDate)
    : [];
  const now = Date.now();

  type Counts = { current: number; expiring: number; expired: number };
  type QualItem = { id: number; userId: number; name: string; userName: string; userEmail: string; squadron: string; expiryDate: Date | null };
  const summary = { total: quals.length, current: 0, expired: 0, expiring30Days: 0, expiring60Days: 0, expiring90Days: 0, personnelAtRisk: 0, personnelWithExpiredQuals: 0 };
  const byType = new Map<string, Counts & { name: string }>();
  const bySquadron = new Map(
    scopeOf(squadron).map((s) => [s as string, { squadron: squadronNumber(s), current: 0, expiring: 0, expired: 0, total: 0, expiring30Days: 0 }]),
  );
  const atRisk = new Set<number>();
  const lapsed = new Set<number>();
  const expired: Array<QualItem & { daysOverdue: number }> = [];
  const expiring30: Array<QualItem & { daysRemaining: number }> = [];

  for (const q of quals) {
    const u = people.get(q.userId);
    if (!u) continue;
    const daysLeft = q.expiryDate ? (q.expiryDate.getTime() - now) / DAY_MS : null;
    const band = currencyBand(daysLeft);
    const status: keyof Counts = band === "current" || band === "expired" ? band : "expiring";
    summary[band]++;
    const t = byType.get(q.name) ?? { name: q.name, current: 0, expiring: 0, expired: 0 };
    t[status]++;
    byType.set(q.name, t);
    const sq = bySquadron.get(u.squadron);
    if (sq) {
      sq[status]++;
      sq.total++;
      if (band === "expiring30Days") sq.expiring30Days++;
    }
    if (status === "expiring") atRisk.add(u.id);
    if (daysLeft === null) continue;
    const item: QualItem = { id: q.id, userId: u.id, name: q.name, userName: personName(u), userEmail: u.email, squadron: squadronNumber(u.squadron), expiryDate: q.expiryDate };
    if (band === "expired") {
      lapsed.add(u.id);
      expired.push({ ...item, daysOverdue: Math.floor(-daysLeft) });
    } else if (band === "expiring30Days") {
      expiring30.push({ ...item, daysRemaining: Math.floor(daysLeft) });
    }
  }
  summary.personnelAtRisk = atRisk.size;
  summary.personnelWithExpiredQuals = lapsed.size;

  return {
    summary,
    byType: [...byType.values()].sort((a, b) => b.expired - a.expired || b.expiring - a.expiring || a.name.localeCompare(b.name)),
    bySquadron: [...bySquadron.values()],
    expired,
    expiring30,
  };
}

// ---- Upcoming expiries: forecast and detail list --------------------------

const monthLabel = (d: Date): string => `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

/** Qualifications expiring from now to the end of the month `months - 1` ahead, soonest first. */
async function loadUpcomingExpiries(squadron: FlyingSquadron | undefined, months: number) {
  const personnel = await listReadinessPersonnel(squadron);
  const people = new Map(personnel.map((p) => [p.id, p]));
  const rows = people.size
    ? await db
        .select({ id: userQualifications.id, userId: userQualifications.userId, name: userQualifications.name, expiryDate: userQualifications.expiryDate })
        .from(userQualifications)
        .where(and(inArray(userQualifications.userId, [...people.keys()]), gte(userQualifications.expiryDate, new Date()), lt(userQualifications.expiryDate, monthStart(months))))
        .orderBy(userQualifications.expiryDate)
    : [];
  return rows.flatMap((q) => {
    const user = people.get(q.userId);
    return user && q.expiryDate ? [{ id: q.id, user, name: q.name, expiryDate: q.expiryDate }] : [];
  });
}

type UpcomingExpiry = Awaited<ReturnType<typeof loadUpcomingExpiries>>[number];

/** Months with more than this many expiries are flagged as high training demand. */
const HEAVY_MONTH_EXPIRIES = 5;
/** A qualification type with this many renewals in one month gets its own alert. */
const TYPE_SPIKE_EXPIRIES = 3;

export async function getQualificationForecast(squadron: FlyingSquadron | undefined, months: number) {
  const upcoming = await loadUpcomingExpiries(squadron, months);
  const toPersonnel = (list: UpcomingExpiry[]) =>
    list.map((q) => ({ name: personName(q.user), squadron: q.user.squadron, qualification: q.name, expiryDate: q.expiryDate.toLocaleDateString("en-AU") }));

  const criticalAlerts: Array<{ month: string; alert: string; personnel: ReturnType<typeof toPersonnel> }> = [];
  const forecast = Array.from({ length: months }, (_, i) => {
    const start = monthStart(i);
    const end = monthStart(i + 1);
    const label = monthLabel(start);
    const inMonth = upcoming.filter((q) => q.expiryDate >= start && q.expiryDate < end);
    if (inMonth.length > HEAVY_MONTH_EXPIRIES) {
      criticalAlerts.push({ month: label, alert: `${inMonth.length} qualifications expiring - high training demand expected`, personnel: toPersonnel(inMonth) });
    }
    for (const { key } of countBy(inMonth, (q) => q.name)) {
      const ofType = inMonth.filter((q) => q.name === key);
      if (ofType.length >= TYPE_SPIKE_EXPIRIES) {
        criticalAlerts.push({ month: label, alert: `${ofType.length} ${key} renewals needed`, personnel: toPersonnel(ofType) });
      }
    }
    return {
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`,
      monthLabel: label,
      expiringThisMonth: inMonth.length,
      personnelAffected: new Set(inMonth.map((q) => q.user.id)).size,
    };
  });

  const byType = countBy(upcoming, (q) => q.name);
  const heavy = forecast.filter((f) => f.expiringThisMonth > HEAVY_MONTH_EXPIRIES);
  const recommendations: string[] = [];
  if (heavy.length) {
    recommendations.push(`High renewal volume expected in ${heavy.map((m) => m.monthLabel).join(", ")} - plan training capacity accordingly`);
  }
  if (byType.length) {
    recommendations.push(`${byType[0].key} has ${byType[0].count} renewals in next ${months} months - consider batch training sessions`);
  }

  return {
    forecast,
    summary: {
      totalExpiringQuals: upcoming.length,
      totalPersonnelAffected: new Set(upcoming.map((q) => q.user.id)).size,
      averagePerMonth: round1(upcoming.length / months),
      peakMonth: forecast.reduce((max, f) => (f.expiringThisMonth > max.expiringThisMonth ? f : max), forecast[0]),
    },
    criticalAlerts: criticalAlerts.slice(0, 5),
    recommendations,
    qualificationTypeSummary: byType.slice(0, 10).map(({ key, count }) => ({ name: key, totalExpiring: count })),
  };
}

export async function getExpiringQualifications(squadron: FlyingSquadron | undefined, months: number) {
  const now = Date.now();
  return (await loadUpcomingExpiries(squadron, months)).map((q) => {
    const daysUntilExpiry = Math.ceil((q.expiryDate.getTime() - now) / DAY_MS);
    return {
      userId: q.user.id,
      qualId: q.id,
      qualName: q.name,
      expiryDate: q.expiryDate,
      daysUntilExpiry,
      squadron: q.user.squadron,
      firstName: q.user.firstName,
      lastName: q.user.lastName,
      userName: personName(q.user),
      rank: q.user.rank,
      profilePhotoUrl: null,
      urgency: daysUntilExpiry <= 30 ? "critical" : daysUntilExpiry <= 60 ? "high" : daysUntilExpiry <= 90 ? "medium" : "low",
    };
  });
}

// ---- Flight hours ---------------------------------------------------------

export async function getFlightHours(f: { squadron?: FlyingSquadron; from?: Date; to?: Date }) {
  const personnel = await listReadinessPersonnel(f.squadron);
  const ids = personnel.map((p) => p.id);
  const rows = ids.length
    ? await db
        .select({ userId: flightRecords.userId, aircraft: flightRecords.aircraft, dayHours: flightRecords.dayHours, nightHours: flightRecords.nightHours })
        .from(flightRecords)
        .where(conds(inArray(flightRecords.userId, ids), f.from ? gte(flightRecords.date, f.from) : undefined, f.to ? lte(flightRecords.date, f.to) : undefined))
    : [];

  let dayHours = 0, nightHours = 0;
  const hoursByUser = new Map<number, number>();
  const byAircraft = new Map<string, { aircraftType: string; totalHours: number; flightCount: number }>();
  for (const r of rows) {
    const hours = r.dayHours + r.nightHours;
    dayHours += r.dayHours;
    nightHours += r.nightHours;
    hoursByUser.set(r.userId, (hoursByUser.get(r.userId) ?? 0) + hours);
    const code = aircraftCompact(r.aircraft);
    const a = byAircraft.get(code) ?? { aircraftType: code, totalHours: 0, flightCount: 0 };
    a.totalHours += hours;
    a.flightCount++;
    byAircraft.set(code, a);
  }
  const uniqueUsers = hoursByUser.size;

  return {
    summary: {
      totalDayHours: round1(dayHours),
      totalNightHours: round1(nightHours),
      totalFlights: rows.length,
      uniqueUsers,
      avgHoursPerPerson: uniqueUsers ? round1((dayHours + nightHours) / uniqueUsers) : 0,
    },
    byAircraftType: [...byAircraft.values()].map((a) => ({ ...a, totalHours: round1(a.totalHours) })).sort((a, b) => b.totalHours - a.totalHours),
    bySquadron: scopeOf(f.squadron).map((s) => {
      const members = personnel.filter((p) => p.squadron === s);
      const hours = members.reduce((sum, m) => sum + (hoursByUser.get(m.id) ?? 0), 0);
      return { squadron: s, totalHours: round1(hours), avgHoursPerMember: members.length ? round1(hours / members.length) : 0 };
    }),
  };
}

// ---- Safety summary -------------------------------------------------------

const SAFETY_TYPE_KEY = {
  incident: "incidents",
  observation: "observations",
  commendation: "commendations",
  training_failure: "trainingFailures",
} as const satisfies Record<SafetyRecordType, string>;

/**
 * Safety score = 100 − (0.5 × minor + 2 × moderate + 4.5 × major incidents)
 * + min(0.5 × commendations, 20) + min(0.3 × observations, 10), clamped to
 * 0..100. Label is N/A when the window holds no records.
 */
function safetyScoreLabel(score: number, records: number): string {
  if (records === 0) return "N/A";
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Satisfactory";
  if (score >= 40) return "Needs Improvement";
  return "Critical";
}

export async function getSafetySummary(f: { squadron?: FlyingSquadron; from?: Date; to?: Date }) {
  const records = await db
    .select()
    .from(safetyRecords)
    .where(
      conds(
        inArray(safetyRecords.squadron, scopeOf(f.squadron)),
        f.from ? gte(safetyRecords.date, f.from) : undefined,
        f.to ? lte(safetyRecords.date, f.to) : undefined,
      ),
    )
    .orderBy(desc(safetyRecords.date));

  const byType: Record<SafetyRecordType, number> = { incident: 0, observation: 0, commendation: 0, training_failure: 0 };
  const bySeverity = { minor: 0, moderate: 0, major: 0 };
  const byStatus = { open: 0, reviewed: 0, closed: 0 };
  const bySquadron = new Map(
    scopeOf(f.squadron).map((s) => [s as string, { squadron: squadronNumber(s), incidents: 0, observations: 0, commendations: 0, trainingFailures: 0 }]),
  );
  const factors = new Map<string, { factor: string; incidents: number; observations: number; trainingFailures: number; total: number }>();
  for (const r of records) {
    byType[r.recordType]++;
    byStatus[r.status]++;
    if (r.recordType === "incident" && r.severity) bySeverity[r.severity]++;
    const sq = bySquadron.get(r.squadron);
    if (sq) sq[SAFETY_TYPE_KEY[r.recordType]]++;
    const factor = r.contributingFactors?.split(" - ")[0].split(",")[0].trim();
    if (factor) {
      const fc = factors.get(factor) ?? { factor, incidents: 0, observations: 0, trainingFailures: 0, total: 0 };
      if (r.recordType !== "commendation") fc[SAFETY_TYPE_KEY[r.recordType]]++;
      fc.total++;
      factors.set(factor, fc);
    }
  }

  const deduction = bySeverity.minor * 0.5 + bySeverity.moderate * 2 + bySeverity.major * 4.5;
  const bonus = Math.min(byType.commendation * 0.5, 20) + Math.min(byType.observation * 0.3, 10);
  const safetyScore = Math.round(Math.max(0, Math.min(100, 100 - deduction + bonus)));

  return {
    summary: { total: records.length, ...byType },
    byType,
    bySeverity,
    byStatus,
    bySquadron: [...bySquadron.values()],
    monthlyTrend: Array.from({ length: 12 }, (_, i) => {
      const start = monthStart(i - 11);
      const end = monthStart(i - 10);
      const inMonth = records.filter((r) => r.date >= start && r.date < end);
      const ofType = (t: SafetyRecordType) => inMonth.filter((r) => r.recordType === t).length;
      return {
        month: `${MONTH_NAMES[start.getUTCMonth()]} ${String(start.getUTCFullYear()).slice(-2)}`,
        incidents: ofType("incident"),
        observations: ofType("observation"),
        commendations: ofType("commendation"),
      };
    }),
    openItems: records.filter((r) => r.status === "open").map(({ aircraft, ...r }) => ({ ...r, aircraftType: aircraftCompact(aircraft) })),
    safetyScore,
    safetyScoreLabel: safetyScoreLabel(safetyScore, records.length),
    topContributingFactors: [...factors.values()].sort((a, b) => b.total - a.total).slice(0, 8),
  };
}

// ---- Students: risk, certification, comparison ----------------------------

const AT_RISK_WINDOW_DAYS = 30;
const INACTIVE_AFTER_DAYS = 14;
const MIN_RECENT_SUBMISSIONS = 3;
const MAX_FAILED_SCENARIOS = 2;

/**
 * Risk factors over the last 30 days; 3+ factors = high, 2 = medium, 1 = low.
 * Days since activity counts from the latest submission of any kind, or from
 * account creation when there is none.
 */
export async function getAtRiskStudents(squadron?: FlyingSquadron) {
  const personnel = await listReadinessPersonnel(squadron);
  const ids = personnel.map((p) => p.id);
  const [graded, lastActivity] = await Promise.all([loadGraded(ids, daysAgo(AT_RISK_WINDOW_DAYS)), loadLastActivity(ids)]);
  const perUser = groupByUser(graded);
  const now = Date.now();

  return personnel
    .flatMap((u) => {
      const rows = perUser.get(u.id) ?? [];
      const quiz = rows.filter((r) => r.type === "quiz");
      const scenario = rows.filter((r) => r.type === "scenario");
      const avgQuizScore = average(quiz.map((r) => r.score));
      const avgScenarioScore = average(scenario.map((r) => r.score));
      const failedScenarios = scenario.filter((r) => !r.passed).length;
      const daysSinceActivity = Math.floor((now - (lastActivity.get(u.id) ?? u.createdAt).getTime()) / DAY_MS);

      const riskFactors: string[] = [];
      if (quiz.length && avgQuizScore < THRESHOLDS.AT_RISK_AVERAGE_SCORE) riskFactors.push("Low quiz scores");
      if (scenario.length && avgScenarioScore < THRESHOLDS.AT_RISK_AVERAGE_SCORE) riskFactors.push("Low scenario scores");
      if (failedScenarios > MAX_FAILED_SCENARIOS) riskFactors.push("Multiple failed scenarios");
      if (rows.length < MIN_RECENT_SUBMISSIONS) riskFactors.push("Low engagement");
      if (daysSinceActivity > INACTIVE_AFTER_DAYS) riskFactors.push("Inactive for 2+ weeks");
      if (riskFactors.length === 0) return [];

      return [{
        userId: u.id,
        name: personName(u),
        email: u.email,
        squadron: u.squadron,
        riskLevel: riskFactors.length >= 3 ? "high" : riskFactors.length === 2 ? "medium" : "low",
        riskFactors,
        topRiskFactor: riskFactors[0],
        reasons: riskFactors,
        totalSubmissions: rows.length,
        avgQuizScore,
        avgScenarioScore,
        failedScenarios,
        daysSinceActivity,
      }];
    })
    .sort((a, b) => b.riskFactors.length - a.riskFactors.length || b.daysSinceActivity - a.daysSinceActivity);
}

/**
 * Readiness score = weighted mean of quiz average (0.3), scenario average
 * (0.4) and scenario pass rate (0.3), over the components the person has
 * results for. 85+ = ready, 70+ = near-ready, else needs-training.
 */
export async function getCertificationReadiness() {
  const personnel = await listReadinessPersonnel();
  const perUser = groupByUser(await loadGraded(personnel.map((p) => p.id)));

  return personnel
    .flatMap((u) => {
      const rows = perUser.get(u.id) ?? [];
      const quiz = rows.filter((r) => r.type === "quiz");
      const scenario = rows.filter((r) => r.type === "scenario");
      if (quiz.length === 0 && scenario.length === 0) return [];
      const avgQuizScore = average(quiz.map((r) => r.score));
      const avgScenarioScore = average(scenario.map((r) => r.score));
      const scenarioPassRate = percent(scenario.filter((r) => r.passed).length, scenario.length);
      const parts: Array<[number, number]> = [
        ...(quiz.length ? [[avgQuizScore, 0.3] as [number, number]] : []),
        ...(scenario.length ? [[avgScenarioScore, 0.4], [scenarioPassRate, 0.3]] as Array<[number, number]> : []),
      ];
      const readinessScore = Math.round(parts.reduce((s, [v, w]) => s + v * w, 0) / parts.reduce((s, [, w]) => s + w, 0));
      return [{
        userId: u.id,
        name: personName(u),
        email: u.email,
        squadron: u.squadron,
        readinessScore,
        status: readinessScore >= THRESHOLDS.CERTIFICATION_READY_SCORE ? "ready" : readinessScore >= THRESHOLDS.AT_RISK_AVERAGE_SCORE ? "near-ready" : "needs-training",
        quizCount: quiz.length,
        scenarioCount: scenario.length,
        avgQuizScore,
        avgScenarioScore,
        scenarioPassRate,
      }];
    })
    .sort((a, b) => b.readinessScore - a.readinessScore);
}

/** Each person's average graded score against the average of every graded submission in their squadron. */
export async function getStudentVsSquadron() {
  const personnel = await listReadinessPersonnel();
  const perUser = groupByUser(await loadGraded(personnel.map((p) => p.id)));
  const squadronScores = new Map<string, number[]>();
  for (const u of personnel) {
    const scores = (perUser.get(u.id) ?? []).map((r) => r.score);
    squadronScores.set(u.squadron, [...(squadronScores.get(u.squadron) ?? []), ...scores]);
  }

  return personnel
    .flatMap((u) => {
      const rows = perUser.get(u.id);
      if (!rows) return [];
      const studentMean = mean(rows.map((r) => r.score));
      const squadronMean = mean(squadronScores.get(u.squadron) ?? []);
      return [{
        userId: u.id,
        name: personName(u),
        email: u.email,
        squadron: u.squadron,
        studentAverage: Math.round(studentMean),
        squadronAverage: Math.round(squadronMean),
        difference: Math.round(studentMean - squadronMean),
        submissionCount: rows.length,
      }];
    })
    .sort((a, b) => b.studentAverage - a.studentAverage);
}

// ---- Training modules -----------------------------------------------------

/** Completion rate = people who passed ÷ people who attempted the module. */
export async function getModuleCompletion() {
  const [modules, completions] = await Promise.all([
    db.select({ id: trainingModules.id, title: trainingModules.title }).from(trainingModules).where(eq(trainingModules.isActive, true)).orderBy(trainingModules.title),
    db.select({ moduleId: trainingModuleCompletions.moduleId, userId: trainingModuleCompletions.userId, passed: trainingModuleCompletions.passed }).from(trainingModuleCompletions),
  ]);
  return modules.map((m) => {
    const rows = completions.filter((c) => c.moduleId === m.id);
    const started = new Set(rows.map((r) => r.userId)).size;
    const completed = new Set(rows.filter((r) => r.passed).map((r) => r.userId)).size;
    return { moduleId: m.id, moduleName: m.title, completionRate: percent(completed, started), studentsStarted: started, studentsCompleted: completed };
  });
}

// ---- Question bank performance --------------------------------------------

/** Every question served in a submitted quiz counts as an attempt; unanswered counts as wrong. */
async function tallyQuestions() {
  const [sittings, questions] = await Promise.all([
    db
      .select({ answers: quizSubmissions.answers, questionIds: quizAttempts.questionIds })
      .from(quizSubmissions)
      .innerJoin(quizAttempts, eq(quizAttempts.id, quizSubmissions.attemptId)),
    db
      .select({ id: quizQuestions.id, questionText: quizQuestions.questionText, category: quizQuestions.category, difficulty: quizQuestions.difficulty, correctIndex: quizQuestions.correctIndex })
      .from(quizQuestions),
  ]);
  const byId = new Map(questions.map((q) => [q.id, { ...q, attempts: 0, correct: 0 }]));
  for (const s of sittings) {
    const answered = new Map(s.answers.map((a) => [a.questionId, a.answeredIndex]));
    for (const qid of s.questionIds) {
      const q = byId.get(qid);
      if (!q) continue;
      q.attempts++;
      if (answered.get(qid) === q.correctIndex) q.correct++;
    }
  }
  return [...byId.values()].filter((q) => q.attempts > 0);
}

/** A question needs this many attempts before its success rate is listed. */
const MIN_QUESTION_ATTEMPTS = 3;

/** The ten questions with the lowest success rate. */
export async function getQuestionDifficulty() {
  return (await tallyQuestions())
    .filter((q) => q.attempts >= MIN_QUESTION_ATTEMPTS)
    .map((q) => ({
      questionId: q.id,
      questionText: q.questionText,
      category: QUESTION_CATEGORY_LABELS[q.category],
      difficulty: q.difficulty,
      attempts: q.attempts,
      totalAttempts: q.attempts,
      successRate: percent(q.correct, q.attempts),
    }))
    .sort((a, b) => a.successRate - b.successRate || b.attempts - a.attempts)
    .slice(0, 10);
}

/**
 * Correct-answer rate per question category, weakest first. `topic` and
 * `masteryLevel` repeat `category` and `masteryPercentage` for the client's
 * recommendation helper, which reads those names.
 */
export async function getTopicMastery() {
  const byCategory = new Map<QuestionCategory, { questions: number; attempts: number; correct: number }>();
  for (const q of await tallyQuestions()) {
    const c = byCategory.get(q.category) ?? { questions: 0, attempts: 0, correct: 0 };
    c.questions++;
    c.attempts += q.attempts;
    c.correct += q.correct;
    byCategory.set(q.category, c);
  }
  return [...byCategory.entries()]
    .map(([category, c]) => {
      const label = QUESTION_CATEGORY_LABELS[category];
      const masteryPercentage = percent(c.correct, c.attempts);
      return { category: label, masteryPercentage, totalQuestions: c.questions, correctAnswers: c.correct, totalAttempts: c.attempts, topic: label, masteryLevel: masteryPercentage };
    })
    .sort((a, b) => a.masteryPercentage - b.masteryPercentage);
}

// ---- Performance by time in role (ICC chart) ------------------------------

export const ICC_METRICS = ["assessmentsPassed", "totalFlightHours", "activeQualifications", "averageScore", "cargoWeight"] as const;
export type IccMetric = (typeof ICC_METRICS)[number];

const ICC_LABELS: Record<IccMetric, string> = {
  assessmentsPassed: "Assessments Passed",
  totalFlightHours: "Total Flight Hours",
  activeQualifications: "Active Qualifications",
  averageScore: "Average Assessment Score",
  cargoWeight: "Cargo Weight Handled (kg)",
};

const SQUADRON_COLORS: Record<FlyingSquadron, string> = { "33SQN": "#FF9500", "35SQN": "#10B981", "36SQN": "#3B82F6", "37SQN": "#8B5CF6" };

const MAX_TENURE_YEAR = 12;
const YEAR_MS = 365.25 * DAY_MS;
const MONTH_MS = YEAR_MS / 12;

/** The metric per person. Counts and sums default to 0; averageScore only covers people with graded work. */
async function metricByUser(metric: IccMetric, ids: number[]): Promise<Map<number, number>> {
  if (metric === "averageScore") {
    return new Map([...groupByUser(await loadGraded(ids))].map(([id, rows]): [number, number] => [id, mean(rows.map((r) => r.score))]));
  }
  const totals = new Map(ids.map((id) => [id, 0]));
  if (ids.length === 0) return totals;
  const add = (id: number, n: number) => totals.set(id, (totals.get(id) ?? 0) + n);
  if (metric === "assessmentsPassed") {
    for (const r of await loadGraded(ids)) if (r.passed) add(r.userId, 1);
  } else if (metric === "activeQualifications") {
    const rows = await db
      .select({ userId: userQualifications.userId })
      .from(userQualifications)
      .where(and(inArray(userQualifications.userId, ids), or(isNull(userQualifications.expiryDate), gt(userQualifications.expiryDate, new Date()))));
    for (const r of rows) add(r.userId, 1);
  } else {
    const rows = await db
      .select({ userId: flightRecords.userId, dayHours: flightRecords.dayHours, nightHours: flightRecords.nightHours, cargoKg: flightRecords.cargoWeightKg })
      .from(flightRecords)
      .where(inArray(flightRecords.userId, ids));
    for (const r of rows) add(r.userId, metric === "cargoWeight" ? r.cargoKg : r.dayHours + r.nightHours);
  }
  return totals;
}

/**
 * One curve per flying squadron: personnel are binned by completed years of
 * service (from their account's creation date, 12+ pooled), each point is the
 * bin's mean metric (`rawValue`), and `normalizedValue` is that mean as a
 * fraction (0..1) of the squadron's highest bin, which the chart shows as
 * 0–100%. Bins without data are left out rather than invented.
 */
export async function getIccPowerLaw(metric: IccMetric) {
  const personnel = await listReadinessPersonnel();
  const values = await metricByUser(metric, personnel.map((p) => p.id));
  const now = Date.now();
  const tenureMs = (u: User) => Math.max(0, now - u.createdAt.getTime());
  const yearOf = (u: User) => Math.min(MAX_TENURE_YEAR, Math.floor(tenureMs(u) / YEAR_MS));
  const valuesOf = (members: User[]) => members.flatMap((u) => (values.has(u.id) ? [values.get(u.id) ?? 0] : []));
  const topYear = Math.max(0, ...personnel.map(yearOf));
  const label = ICC_LABELS[metric];
  const fmt = (n: number) => round1(n).toLocaleString("en-AU");

  const curves = FLYING_SQUADRONS.map((squadron) => {
    const members = personnel.filter((u) => u.squadron === squadron);
    let cumulativeUsers = 0;
    const bins: Array<{ year: number; yearLabel: string; rawValue: number; usersInBin: number; cumulativeUsers: number }> = [];
    for (let year = 0; year <= topYear; year++) {
      const inBin = members.filter((u) => yearOf(u) === year);
      cumulativeUsers += inBin.length;
      const vals = valuesOf(inBin);
      if (vals.length === 0) continue;
      bins.push({
        year,
        yearLabel: year === MAX_TENURE_YEAR ? `${MAX_TENURE_YEAR}+` : `${year}-${year + 1}`,
        rawValue: Math.round(mean(vals) * 100) / 100,
        usersInBin: inBin.length,
        cumulativeUsers,
      });
    }
    const peak = Math.max(0, ...bins.map((b) => b.rawValue));
    return {
      squadron,
      color: SQUADRON_COLORS[squadron],
      dataPoints: bins.map((b) => ({ ...b, normalizedValue: peak ? Math.round((b.rawValue / peak) * 1000) / 1000 : 0 })),
    };
  });

  const insights: Array<{ type: "strength" | "challenge" | "observation"; title: string; description: string }> = [];
  const ranked = FLYING_SQUADRONS.flatMap((squadron) => {
    const vals = valuesOf(personnel.filter((u) => u.squadron === squadron));
    return vals.length ? [{ squadron, value: mean(vals) }] : [];
  }).sort((a, b) => b.value - a.value);
  if (ranked.length > 1) {
    const best = ranked[0];
    const worst = ranked[ranked.length - 1];
    insights.push({ type: "strength", title: `${best.squadron} leads in ${label.toLowerCase()}`, description: `Average of ${fmt(best.value)} per member, the highest of any squadron` });
    insights.push({ type: "challenge", title: `${worst.squadron} trails in ${label.toLowerCase()}`, description: `Average of ${fmt(worst.value)} per member, the lowest of any squadron` });
  }
  for (const c of curves) {
    let steepest: { from: (typeof c.dataPoints)[number]; to: (typeof c.dataPoints)[number] } | null = null;
    for (let i = 1; i < c.dataPoints.length; i++) {
      const from = c.dataPoints[i - 1];
      const to = c.dataPoints[i];
      if (to.rawValue > from.rawValue && (!steepest || to.rawValue - from.rawValue > steepest.to.rawValue - steepest.from.rawValue)) steepest = { from, to };
    }
    if (steepest) {
      insights.push({
        type: "observation",
        title: `${c.squadron}: steepest gain at year ${steepest.to.year}`,
        description: `Average rises from ${fmt(steepest.from.rawValue)} to ${fmt(steepest.to.rawValue)} between years ${steepest.from.year} and ${steepest.to.year} of service`,
      });
    }
  }

  const tenureMonths = personnel.map((u) => Math.floor(tenureMs(u) / MONTH_MS));
  return {
    metric,
    metricLabel: label,
    curves,
    insights: insights.slice(0, 5),
    summary: {
      totalUsers: personnel.length,
      squadronsIncluded: curves.length,
      tenureRange: { min: tenureMonths.length ? Math.min(...tenureMonths) : 0, max: tenureMonths.length ? Math.max(...tenureMonths) : 0 },
    },
  };
}
