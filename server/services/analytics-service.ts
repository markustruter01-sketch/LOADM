import { and, eq, gte, lte, inArray, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  quizSubmissions, quizAttempts, quizQuestions, quizzes, scenarios, scenarioSubmissions, trainingModules,
  trainingModuleCompletions, documentSubmissions, documents, checklists, flightRecords, userQualifications,
  safetyRecords, type User, type PublicUser, type ReadinessSnapshot,
} from "@shared/schema";
import {
  FLYING_SQUADRONS, QUESTION_CATEGORY_LABELS, SAFETY_RECORD_TYPES, SAFETY_SEVERITIES, SAFETY_STATUSES, THRESHOLDS,
  isFlyingSquadron, type FlyingSquadron, type Squadron, type QuestionCategory, type QuestionDifficulty,
  type SafetyRecordType, type SafetySeverity, type SafetyStatus, type AircraftType,
} from "@shared/constants";
import { listUsers, listReadinessPersonnel, getUser, toPublicUser } from "./user-service";
import {
  computeReadinessForDate, captureSnapshot, getSnapshotHistory, type ReadinessFigures, type SnapshotSquadron,
} from "./readiness-service";

/**
 * Every analytics figure is computed here, from the tables, at request time.
 * Nothing is estimated or synthesised: when there is no data a count is 0,
 * a list is [] and a per-person average is null.
 *
 * Conventions shared by every endpoint:
 *  - "aircrew" / "personnel" = `listReadinessPersonnel(squadron)` (active
 *    students and loadmasters in a flying squadron).
 *  - "graded submission" = quiz_submissions ∪ scenario_submissions with
 *    status 'reviewed' and a score ∪ training_module_completions.
 *  - percentages are integers 0..100; averages are integer scores.
 *  - months are UTC 'YYYY-MM' keys.
 */
export interface AnalyticsFilter {
  squadron?: FlyingSquadron;
  from?: Date;
  to?: Date;
}

const DAY_MS = 86_400_000;
const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY_MS);

// ---- Small helpers --------------------------------------------------------

function conds(...parts: Array<SQL | undefined>): SQL | undefined {
  const present = parts.filter((p): p is SQL => p !== undefined);
  return present.length ? and(...present) : undefined;
}

function average(values: number[]): number {
  return values.length ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
}

function averageOrNull(values: number[]): number | null {
  return values.length ? average(values) : null;
}

function percent(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Start (UTC) of the month `offset` months from the current one. */
function monthStart(offset: number, base = new Date()): Date {
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, 1));
}

/** `count` month keys starting `startOffset` months from the current month. */
function monthKeys(count: number, startOffset: number): string[] {
  return Array.from({ length: count }, (_, i) => monthKey(monthStart(startOffset + i)));
}

function monthKeysBetween(from: Date, to: Date): string[] {
  const keys: string[] = [];
  let cursor = monthStart(0, from);
  while (cursor.getTime() <= to.getTime() && keys.length < 120) {
    keys.push(monthKey(cursor));
    cursor = monthStart(1, cursor);
  }
  return keys;
}

type QualStatus = "current" | "expiring" | "expired";

function qualStatus(expiryDate: Date | null, now: number): QualStatus {
  if (!expiryDate) return "current";
  const e = expiryDate.getTime();
  if (e < now) return "expired";
  if (e - now <= THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS * DAY_MS) return "expiring";
  return "current";
}

function daysRemaining(expiryDate: Date | null, now: number): number | null {
  return expiryDate ? Math.ceil((expiryDate.getTime() - now) / DAY_MS) : null;
}

function emptyFigures(squadron: SnapshotSquadron): ReadinessFigures {
  return {
    squadron, totalPersonnel: 0, readyCount: 0, notReadyCount: 0, readyPercent: 0,
    currentQuals: 0, expiringQuals: 0, expiredQuals: 0, personnelAtRisk: 0,
  };
}

// ---- Graded submissions ---------------------------------------------------

export type GradedType = "quiz" | "scenario" | "module";

export interface GradedSubmission {
  type: GradedType;
  id: number;
  /** quizId / scenarioId / moduleId */
  itemId: number;
  userId: number;
  squadron: Squadron;
  score: number;
  passed: boolean;
  submittedAt: Date;
}

interface GradedQuery extends AnalyticsFilter {
  userIds?: number[];
}

/** One wide select per table over the window, merged and sorted newest first. */
async function loadGraded(q: GradedQuery): Promise<GradedSubmission[]> {
  if (q.userIds && q.userIds.length === 0) return [];
  const [quizRows, scenarioRows, moduleRows] = await Promise.all([
    db
      .select({
        id: quizSubmissions.id, itemId: quizSubmissions.quizId, userId: quizSubmissions.userId, squadron: quizSubmissions.squadron,
        score: quizSubmissions.score, passed: quizSubmissions.passed, submittedAt: quizSubmissions.submittedAt,
      })
      .from(quizSubmissions)
      .where(
        conds(
          q.squadron ? eq(quizSubmissions.squadron, q.squadron) : undefined,
          q.from ? gte(quizSubmissions.submittedAt, q.from) : undefined,
          q.to ? lte(quizSubmissions.submittedAt, q.to) : undefined,
          q.userIds ? inArray(quizSubmissions.userId, q.userIds) : undefined,
        ),
      ),
    db
      .select({
        id: scenarioSubmissions.id, itemId: scenarioSubmissions.scenarioId, userId: scenarioSubmissions.userId, squadron: scenarioSubmissions.squadron,
        score: scenarioSubmissions.score, passed: scenarioSubmissions.passed, submittedAt: scenarioSubmissions.submittedAt,
      })
      .from(scenarioSubmissions)
      .where(
        conds(
          eq(scenarioSubmissions.status, "reviewed"),
          isNotNull(scenarioSubmissions.score),
          q.squadron ? eq(scenarioSubmissions.squadron, q.squadron) : undefined,
          q.from ? gte(scenarioSubmissions.submittedAt, q.from) : undefined,
          q.to ? lte(scenarioSubmissions.submittedAt, q.to) : undefined,
          q.userIds ? inArray(scenarioSubmissions.userId, q.userIds) : undefined,
        ),
      ),
    db
      .select({
        id: trainingModuleCompletions.id, itemId: trainingModuleCompletions.moduleId, userId: trainingModuleCompletions.userId, squadron: trainingModuleCompletions.squadron,
        score: trainingModuleCompletions.score, passed: trainingModuleCompletions.passed, submittedAt: trainingModuleCompletions.submittedAt,
      })
      .from(trainingModuleCompletions)
      .where(
        conds(
          q.squadron ? eq(trainingModuleCompletions.squadron, q.squadron) : undefined,
          q.from ? gte(trainingModuleCompletions.submittedAt, q.from) : undefined,
          q.to ? lte(trainingModuleCompletions.submittedAt, q.to) : undefined,
          q.userIds ? inArray(trainingModuleCompletions.userId, q.userIds) : undefined,
        ),
      ),
  ]);

  const merged: GradedSubmission[] = [
    ...quizRows.map((r) => ({ type: "quiz" as const, ...r })),
    ...scenarioRows.flatMap((r): GradedSubmission[] =>
      r.score === null ? [] : [{ type: "scenario", id: r.id, itemId: r.itemId, userId: r.userId, squadron: r.squadron, score: r.score, passed: r.passed ?? false, submittedAt: r.submittedAt }],
    ),
    ...moduleRows.map((r) => ({ type: "module" as const, ...r })),
  ];
  return merged.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
}

function groupByUser(rows: GradedSubmission[]): Map<number, GradedSubmission[]> {
  const m = new Map<number, GradedSubmission[]>();
  for (const r of rows) m.set(r.userId, [...(m.get(r.userId) ?? []), r]);
  return m;
}

function monthlyTrend(rows: GradedSubmission[], keys: string[]) {
  return keys.map((month) => {
    const inMonth = rows.filter((r) => monthKey(r.submittedAt) === month);
    return {
      month,
      averageScore: average(inMonth.map((r) => r.score)),
      passRate: percent(inMonth.filter((r) => r.passed).length, inMonth.length),
      submissions: inMonth.length,
    };
  });
}

/** Latest submission date of any kind (graded or not) per user. */
async function loadLastActivity(userIds: number[]): Promise<Map<number, Date>> {
  const latest = new Map<number, Date>();
  if (userIds.length === 0) return latest;
  const [a, b, c, d] = await Promise.all([
    db.select({ userId: quizSubmissions.userId, at: quizSubmissions.submittedAt }).from(quizSubmissions).where(inArray(quizSubmissions.userId, userIds)),
    db.select({ userId: scenarioSubmissions.userId, at: scenarioSubmissions.submittedAt }).from(scenarioSubmissions).where(inArray(scenarioSubmissions.userId, userIds)),
    db.select({ userId: trainingModuleCompletions.userId, at: trainingModuleCompletions.submittedAt }).from(trainingModuleCompletions).where(inArray(trainingModuleCompletions.userId, userIds)),
    db.select({ userId: documentSubmissions.userId, at: documentSubmissions.submittedAt }).from(documentSubmissions).where(inArray(documentSubmissions.userId, userIds)),
  ]);
  for (const row of [...a, ...b, ...c, ...d]) {
    const prev = latest.get(row.userId);
    if (!prev || row.at.getTime() > prev.getTime()) latest.set(row.userId, row.at);
  }
  return latest;
}

// ---- Overview -------------------------------------------------------------

export async function getOverview(f: AnalyticsFilter) {
  const now = new Date();
  const since30 = daysAgo(30);
  const since90 = daysAgo(90);
  const scope = f.squadron;

  const [personnel, instructors, graded, quizCounts, scenarioCounts, moduleCounts, pendingRows, readiness, safetyRows] = await Promise.all([
    listReadinessPersonnel(scope),
    listUsers({ role: "instructor", squadron: scope, activeOnly: true }),
    loadGraded({ squadron: scope, from: daysAgo(180) }),
    db
      .select({ total: sql<number>`count(*)::int`, recent: sql<number>`count(*) filter (where ${quizSubmissions.submittedAt} >= ${since30})::int` })
      .from(quizSubmissions)
      .where(scope ? eq(quizSubmissions.squadron, scope) : undefined),
    db
      .select({ total: sql<number>`count(*)::int`, recent: sql<number>`count(*) filter (where ${scenarioSubmissions.submittedAt} >= ${since30})::int` })
      .from(scenarioSubmissions)
      .where(scope ? eq(scenarioSubmissions.squadron, scope) : undefined),
    db
      .select({ total: sql<number>`count(*)::int`, recent: sql<number>`count(*) filter (where ${trainingModuleCompletions.submittedAt} >= ${since30})::int` })
      .from(trainingModuleCompletions)
      .where(scope ? eq(trainingModuleCompletions.squadron, scope) : undefined),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(scenarioSubmissions)
      .where(conds(eq(scenarioSubmissions.status, "submitted"), scope ? eq(scenarioSubmissions.squadron, scope) : undefined)),
    computeReadinessForDate(db, now),
    db
      .select({
        open: sql<number>`count(*) filter (where ${safetyRecords.status} = 'open')::int`,
        last90d: sql<number>`count(*) filter (where ${safetyRecords.date} >= ${since90})::int`,
        incidents: sql<number>`count(*) filter (where ${safetyRecords.recordType} = 'incident')::int`,
      })
      .from(safetyRecords)
      .where(scope ? eq(safetyRecords.squadron, scope) : undefined),
  ]);

  const counts = [quizCounts[0], scenarioCounts[0], moduleCounts[0]];
  const passedCount = graded.filter((g) => g.passed).length;
  const readinessKey: SnapshotSquadron = scope ?? "ALL";

  return {
    personnel: {
      total: personnel.length,
      students: personnel.filter((p) => p.role === "student").length,
      loadmasters: personnel.filter((p) => p.role === "loadmaster").length,
      instructors: instructors.length,
    },
    submissions: {
      total: counts.reduce((s, c) => s + (c?.total ?? 0), 0),
      last30d: counts.reduce((s, c) => s + (c?.recent ?? 0), 0),
    },
    passRate: percent(passedCount, graded.length),
    averageScore: average(graded.map((g) => g.score)),
    gradedCount: graded.length,
    pendingReviews: pendingRows[0]?.n ?? 0,
    readiness: readiness.find((r) => r.squadron === readinessKey) ?? emptyFigures(readinessKey),
    safety: {
      open: safetyRows[0]?.open ?? 0,
      last90d: safetyRows[0]?.last90d ?? 0,
      incidents: safetyRows[0]?.incidents ?? 0,
    },
  };
}

// ---- Readiness pass-throughs ---------------------------------------------

export async function getSquadronReadiness(f: AnalyticsFilter): Promise<ReadinessFigures[]> {
  const figures = await computeReadinessForDate(db, new Date());
  return f.squadron ? figures.filter((r) => r.squadron === f.squadron) : figures;
}

/** History up to today; today's snapshot is captured on first read (idempotent). */
export async function getReadinessHistory(squadron: SnapshotSquadron, days: number): Promise<ReadinessSnapshot[]> {
  await captureSnapshot();
  const rows = await getSnapshotHistory(squadron, days);
  return [...rows].sort((a, b) => a.snapshotDate.getTime() - b.snapshotDate.getTime());
}

export async function captureReadinessSnapshot(): Promise<{ created: number }> {
  return captureSnapshot();
}

// ---- Squadron performance -------------------------------------------------

const TREND_MONTHS = 6;

export async function getSquadronPerformance(f: AnalyticsFilter) {
  const from = monthStart(-(TREND_MONTHS - 1));
  const keys = monthKeys(TREND_MONTHS, -(TREND_MONTHS - 1));
  const [personnel, graded] = await Promise.all([listReadinessPersonnel(f.squadron), loadGraded({ squadron: f.squadron, from })]);
  const squadrons: FlyingSquadron[] = f.squadron ? [f.squadron] : [...FLYING_SQUADRONS];

  return squadrons.map((squadron) => {
    const rows = graded.filter((g) => g.squadron === squadron);
    const ofType = (t: GradedType) => rows.filter((r) => r.type === t).map((r) => r.score);
    return {
      squadron,
      personnel: personnel.filter((p) => p.squadron === squadron).length,
      submissions: rows.length,
      passRate: percent(rows.filter((r) => r.passed).length, rows.length),
      averageScore: average(rows.map((r) => r.score)),
      quizAvg: average(ofType("quiz")),
      scenarioAvg: average(ofType("scenario")),
      moduleAvg: average(ofType("module")),
      trend: monthlyTrend(rows, keys).map(({ month, averageScore, submissions }) => ({ month, averageScore, submissions })),
    };
  });
}

// ---- Score distribution ---------------------------------------------------

const SCORE_BUCKETS = [
  { label: "0-49", min: 0, max: 49 },
  { label: "50-59", min: 50, max: 59 },
  { label: "60-69", min: 60, max: 69 },
  { label: "70-79", min: 70, max: 79 },
  { label: "80-89", min: 80, max: 89 },
  { label: "90-100", min: 90, max: 100 },
] as const;

export async function getScoreDistribution(f: AnalyticsFilter) {
  const graded = await loadGraded({ squadron: f.squadron, from: f.from ?? daysAgo(180), to: f.to });
  const buckets = SCORE_BUCKETS.map((b) => {
    const inBucket = graded.filter((g) => g.score >= b.min && g.score <= b.max);
    return {
      label: b.label,
      min: b.min,
      max: b.max,
      total: inBucket.length,
      quiz: inBucket.filter((g) => g.type === "quiz").length,
      scenario: inBucket.filter((g) => g.type === "scenario").length,
      module: inBucket.filter((g) => g.type === "module").length,
    };
  });
  return { buckets, total: graded.length };
}

// ---- Performance trend ----------------------------------------------------

export async function getPerformanceTrend(f: AnalyticsFilter, months: number) {
  const graded = await loadGraded({ squadron: f.squadron, from: monthStart(-(months - 1)) });
  return monthlyTrend(graded, monthKeys(months, -(months - 1)));
}

// ---- Question difficulty --------------------------------------------------

export interface QuestionDifficultyRow {
  questionId: number;
  questionText: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  attempts: number;
  correct: number;
  /** Percent 0..100 of attempts answered correctly. */
  correctRate: number;
}

export async function getQuestionDifficulty(f: AnalyticsFilter) {
  const [sittings, questions] = await Promise.all([
    db
      .select({ answers: quizSubmissions.answers, questionIds: quizAttempts.questionIds })
      .from(quizSubmissions)
      .innerJoin(quizAttempts, eq(quizAttempts.id, quizSubmissions.attemptId))
      .where(
        conds(
          f.squadron ? eq(quizSubmissions.squadron, f.squadron) : undefined,
          f.from ? gte(quizSubmissions.submittedAt, f.from) : undefined,
          f.to ? lte(quizSubmissions.submittedAt, f.to) : undefined,
        ),
      ),
    db
      .select({ id: quizQuestions.id, questionText: quizQuestions.questionText, category: quizQuestions.category, difficulty: quizQuestions.difficulty, correctIndex: quizQuestions.correctIndex })
      .from(quizQuestions),
  ]);

  const byId = new Map(questions.map((q) => [q.id, q]));
  const tally = new Map<number, { attempts: number; correct: number }>();
  for (const s of sittings) {
    const answered = new Map(s.answers.map((a) => [a.questionId, a.answeredIndex]));
    // Every question served in the attempt counts as an attempt; unanswered counts as wrong.
    for (const qid of s.questionIds) {
      const q = byId.get(qid);
      if (!q) continue;
      const t = tally.get(qid) ?? { attempts: 0, correct: 0 };
      t.attempts++;
      if (answered.get(qid) === q.correctIndex) t.correct++;
      tally.set(qid, t);
    }
  }

  const rows: QuestionDifficultyRow[] = [];
  for (const [qid, t] of tally) {
    const q = byId.get(qid);
    if (!q || t.attempts === 0) continue;
    rows.push({ questionId: qid, questionText: q.questionText, category: q.category, difficulty: q.difficulty, attempts: t.attempts, correct: t.correct, correctRate: percent(t.correct, t.attempts) });
  }
  rows.sort((a, b) => a.correctRate - b.correctRate || b.attempts - a.attempts);

  const categoryMap = new Map<QuestionCategory, { questions: number; attempts: number; correct: number }>();
  for (const r of rows) {
    const c = categoryMap.get(r.category) ?? { questions: 0, attempts: 0, correct: 0 };
    c.questions++;
    c.attempts += r.attempts;
    c.correct += r.correct;
    categoryMap.set(r.category, c);
  }
  const categories = [...categoryMap.entries()]
    .map(([category, c]) => ({ category, label: QUESTION_CATEGORY_LABELS[category], questions: c.questions, attempts: c.attempts, correctRate: percent(c.correct, c.attempts) }))
    .sort((a, b) => a.correctRate - b.correctRate);

  return { questions: rows, categories };
}

// ---- At-risk students -----------------------------------------------------

export type AtRiskFlag = "low_average" | "inactive" | "consecutive_fails";

export interface AtRiskStudent {
  user: PublicUser;
  averageScore: number | null;
  gradedCount: number;
  consecutiveFails: number;
  lastActivityAt: Date | null;
  weeksSinceLastActivity: number | null;
  flags: AtRiskFlag[];
  reasons: string[];
}

const RECENT_WINDOW_DAYS = 90;

export async function getAtRiskStudents(f: AnalyticsFilter): Promise<AtRiskStudent[]> {
  const personnel = await listReadinessPersonnel(f.squadron);
  const ids = personnel.map((p) => p.id);
  const [graded, lastActivity] = await Promise.all([loadGraded({ userIds: ids, from: daysAgo(RECENT_WINDOW_DAYS) }), loadLastActivity(ids)]);
  const perUser = groupByUser(graded);
  const now = Date.now();
  const inactiveMs = THRESHOLDS.INACTIVE_AFTER_WEEKS * 7 * DAY_MS;

  const out: AtRiskStudent[] = [];
  for (const u of personnel) {
    const rows = perUser.get(u.id) ?? []; // newest first
    const averageScore = averageOrNull(rows.map((r) => r.score));
    let consecutiveFails = 0;
    for (const r of rows) {
      if (r.passed) break;
      consecutiveFails++;
    }
    const last = lastActivity.get(u.id) ?? null;
    const weeksSince = last ? Math.floor((now - last.getTime()) / (7 * DAY_MS)) : null;

    const flags: AtRiskFlag[] = [];
    const reasons: string[] = [];
    if (averageScore !== null && averageScore < THRESHOLDS.AT_RISK_AVERAGE_SCORE) {
      flags.push("low_average");
      reasons.push(`Average score ${averageScore}% over the last ${RECENT_WINDOW_DAYS} days is below ${THRESHOLDS.AT_RISK_AVERAGE_SCORE}%`);
    }
    if (!last || now - last.getTime() > inactiveMs) {
      flags.push("inactive");
      reasons.push(last ? `No training activity for ${weeksSince} weeks` : "No training activity recorded");
    }
    if (consecutiveFails >= 2) {
      flags.push("consecutive_fails");
      reasons.push(`${consecutiveFails} consecutive failed assessments`);
    }
    if (flags.length) {
      out.push({ user: toPublicUser(u), averageScore, gradedCount: rows.length, consecutiveFails, lastActivityAt: last, weeksSinceLastActivity: weeksSince, flags, reasons });
    }
  }
  return out.sort((a, b) => b.flags.length - a.flags.length || (a.averageScore ?? 101) - (b.averageScore ?? 101));
}

// ---- Certification readiness ---------------------------------------------

export async function getCertificationReadiness(f: AnalyticsFilter) {
  const personnel = await listReadinessPersonnel(f.squadron);
  const ids = personnel.map((p) => p.id);
  const [graded, quals] = await Promise.all([
    loadGraded({ userIds: ids, from: daysAgo(RECENT_WINDOW_DAYS) }),
    ids.length
      ? db.select({ userId: userQualifications.userId, expiryDate: userQualifications.expiryDate }).from(userQualifications).where(inArray(userQualifications.userId, ids))
      : Promise.resolve<{ userId: number; expiryDate: Date | null }[]>([]),
  ]);
  const perUser = groupByUser(graded);
  const now = Date.now();
  const qualsByUser = new Map<number, { current: number; expiring: number; expired: number }>();
  for (const q of quals) {
    const rec = qualsByUser.get(q.userId) ?? { current: 0, expiring: 0, expired: 0 };
    rec[qualStatus(q.expiryDate, now)]++;
    qualsByUser.set(q.userId, rec);
  }

  const ready: Array<{ user: PublicUser; averageScore: number; submissions: number; passRate: number; qualifications: { current: number; expiring: number; expired: number } }> = [];
  for (const u of personnel) {
    const rows = perUser.get(u.id) ?? [];
    if (rows.length === 0) continue;
    const averageScore = average(rows.map((r) => r.score));
    const qualifications = qualsByUser.get(u.id) ?? { current: 0, expiring: 0, expired: 0 };
    if (averageScore < THRESHOLDS.CERTIFICATION_READY_SCORE || qualifications.expired > 0) continue;
    ready.push({
      user: toPublicUser(u),
      averageScore,
      submissions: rows.length,
      passRate: percent(rows.filter((r) => r.passed).length, rows.length),
      qualifications,
    });
  }
  return ready.sort((a, b) => b.averageScore - a.averageScore);
}

// ---- Module completion ----------------------------------------------------

export async function getModuleCompletion(f: AnalyticsFilter) {
  const [modules, completions, personnel] = await Promise.all([
    db
      .select({ id: trainingModules.id, title: trainingModules.title, aircraft: trainingModules.aircraft, difficulty: trainingModules.difficulty, passingThreshold: trainingModules.passingThreshold })
      .from(trainingModules)
      .where(eq(trainingModules.isActive, true))
      .orderBy(trainingModules.title),
    db
      .select({ moduleId: trainingModuleCompletions.moduleId, userId: trainingModuleCompletions.userId, score: trainingModuleCompletions.score, passed: trainingModuleCompletions.passed })
      .from(trainingModuleCompletions)
      .where(f.squadron ? eq(trainingModuleCompletions.squadron, f.squadron) : undefined),
    listReadinessPersonnel(f.squadron),
  ]);

  return modules.map((module) => {
    const rows = completions.filter((c) => c.moduleId === module.id);
    const passedUsers = new Set(rows.filter((r) => r.passed).map((r) => r.userId));
    return {
      module,
      attempts: rows.length,
      passes: rows.filter((r) => r.passed).length,
      uniqueUsers: new Set(rows.map((r) => r.userId)).size,
      completionRate: percent(passedUsers.size, personnel.length),
      averageScore: average(rows.map((r) => r.score)),
    };
  });
}

// ---- Flight hours ---------------------------------------------------------

const round1 = (n: number): number => Number(n.toFixed(1));

export async function getFlightHours(f: AnalyticsFilter) {
  const personnel = await listReadinessPersonnel(f.squadron);
  const ids = personnel.map((p) => p.id);
  const rows = ids.length
    ? await db
        .select({
          userId: flightRecords.userId, date: flightRecords.date, aircraft: flightRecords.aircraft,
          dayHours: flightRecords.dayHours, nightHours: flightRecords.nightHours, cargoKg: flightRecords.cargoWeightKg, passengers: flightRecords.passengersCarried,
        })
        .from(flightRecords)
        .where(conds(inArray(flightRecords.userId, ids), f.from ? gte(flightRecords.date, f.from) : undefined, f.to ? lte(flightRecords.date, f.to) : undefined))
    : [];

  let dayHours = 0, nightHours = 0, cargoKg = 0, passengers = 0;
  const byAircraft = new Map<AircraftType, { hours: number; sorties: number }>();
  const byMonth = new Map<string, { hours: number; sorties: number }>();
  const byUser = new Map<number, { hours: number; sorties: number }>();
  for (const r of rows) {
    const hours = r.dayHours + r.nightHours;
    dayHours += r.dayHours; nightHours += r.nightHours; cargoKg += r.cargoKg; passengers += r.passengers;
    const a = byAircraft.get(r.aircraft) ?? { hours: 0, sorties: 0 };
    a.hours += hours; a.sorties++; byAircraft.set(r.aircraft, a);
    const m = byMonth.get(monthKey(r.date)) ?? { hours: 0, sorties: 0 };
    m.hours += hours; m.sorties++; byMonth.set(monthKey(r.date), m);
    const u = byUser.get(r.userId) ?? { hours: 0, sorties: 0 };
    u.hours += hours; u.sorties++; byUser.set(r.userId, u);
  }
  const people = new Map(personnel.map((p) => [p.id, p]));

  return {
    totalHours: round1(dayHours + nightHours),
    dayHours: round1(dayHours),
    nightHours: round1(nightHours),
    sorties: rows.length,
    cargoKg,
    passengers,
    byAircraft: [...byAircraft.entries()]
      .map(([aircraft, v]) => ({ aircraft, hours: round1(v.hours), sorties: v.sorties }))
      .sort((a, b) => b.hours - a.hours),
    byMonth: monthKeys(12, -11).map((month) => {
      const v = byMonth.get(month) ?? { hours: 0, sorties: 0 };
      return { month, hours: round1(v.hours), sorties: v.sorties };
    }),
    topPersonnel: [...byUser.entries()]
      .sort((a, b) => b[1].hours - a[1].hours)
      .slice(0, 5)
      .flatMap(([userId, v]) => {
        const u = people.get(userId);
        return u ? [{ user: toPublicUser(u), hours: round1(v.hours), sorties: v.sorties }] : [];
      }),
  };
}

// ---- Currency status ------------------------------------------------------

export async function getCurrencyStatus(f: AnalyticsFilter) {
  const personnel = await listReadinessPersonnel(f.squadron);
  const ids = personnel.map((p) => p.id);
  const quals = ids.length
    ? await db
        .select({ id: userQualifications.id, userId: userQualifications.userId, name: userQualifications.name, expiryDate: userQualifications.expiryDate })
        .from(userQualifications)
        .where(inArray(userQualifications.userId, ids))
        .orderBy(userQualifications.expiryDate)
    : [];
  const now = Date.now();

  const totals = { current: 0, expiring: 0, expired: 0 };
  const byName = new Map<string, { current: number; expiring: number; expired: number }>();
  type QualItem = { id: number; name: string; expiryDate: Date | null; daysRemaining: number | null };
  const byUser = new Map<number, { current: number; expiring: QualItem[]; expired: QualItem[] }>();
  for (const q of quals) {
    const status = qualStatus(q.expiryDate, now);
    totals[status]++;
    const n = byName.get(q.name) ?? { current: 0, expiring: 0, expired: 0 };
    n[status]++;
    byName.set(q.name, n);
    const u = byUser.get(q.userId) ?? { current: 0, expiring: [], expired: [] };
    if (status === "current") u.current++;
    else u[status].push({ id: q.id, name: q.name, expiryDate: q.expiryDate, daysRemaining: daysRemaining(q.expiryDate, now) });
    byUser.set(q.userId, u);
  }

  return {
    ...totals,
    byQualification: [...byName.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.expired - a.expired || b.expiring - a.expiring || a.name.localeCompare(b.name)),
    personnel: personnel
      .flatMap((p) => {
        const v = byUser.get(p.id);
        return v && (v.expiring.length || v.expired.length) ? [{ user: toPublicUser(p), current: v.current, expiring: v.expiring, expired: v.expired }] : [];
      })
      .sort((a, b) => b.expired.length - a.expired.length || b.expiring.length - a.expiring.length),
  };
}

// ---- Qualification forecast ----------------------------------------------

export async function getQualificationForecast(f: AnalyticsFilter, months: number) {
  const personnel = await listReadinessPersonnel(f.squadron);
  const ids = personnel.map((p) => p.id);
  const now = new Date();
  const end = monthStart(months);
  const quals = ids.length
    ? await db
        .select({ userId: userQualifications.userId, name: userQualifications.name, expiryDate: userQualifications.expiryDate })
        .from(userQualifications)
        .where(and(inArray(userQualifications.userId, ids), gte(userQualifications.expiryDate, now), lte(userQualifications.expiryDate, end)))
    : [];

  return monthKeys(months, 0).map((month) => {
    const inMonth = quals.filter((q) => q.expiryDate && monthKey(q.expiryDate) === month);
    return {
      month,
      expiring: inMonth.length,
      personnel: new Set(inMonth.map((q) => q.userId)).size,
      names: [...new Set(inMonth.map((q) => q.name))].sort(),
    };
  });
}

// ---- Safety summary -------------------------------------------------------

function zeroRecord<K extends string>(keys: readonly K[]): Record<K, number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
}

/**
 * Compliance score = 100 − (open incidents × 5 + major × 10 + moderate × 5 + minor × 2),
 * clamped to 0..100. "Open incidents" are records of type 'incident' with
 * status 'open'; severity counts cover every record in the window that has a
 * severity, whatever its status.
 */
export function complianceScore(c: { openIncidents: number; major: number; moderate: number; minor: number }): number {
  const penalty = c.openIncidents * 5 + c.major * 10 + c.moderate * 5 + c.minor * 2;
  return Math.max(0, Math.min(100, 100 - penalty));
}

export async function getSafetySummary(f: AnalyticsFilter) {
  const to = f.to ?? new Date();
  const from = f.from ?? monthStart(-11);
  const rows = await db
    .select({ recordType: safetyRecords.recordType, severity: safetyRecords.severity, status: safetyRecords.status, date: safetyRecords.date })
    .from(safetyRecords)
    .where(conds(f.squadron ? eq(safetyRecords.squadron, f.squadron) : undefined, gte(safetyRecords.date, from), lte(safetyRecords.date, to)));

  const byType = zeroRecord<SafetyRecordType>(SAFETY_RECORD_TYPES);
  const bySeverity = zeroRecord<SafetySeverity>(SAFETY_SEVERITIES);
  const byStatus = zeroRecord<SafetyStatus>(SAFETY_STATUSES);
  let openIncidents = 0;
  for (const r of rows) {
    byType[r.recordType]++;
    byStatus[r.status]++;
    if (r.severity) bySeverity[r.severity]++;
    if (r.recordType === "incident" && r.status === "open") openIncidents++;
  }
  const byMonth = monthKeysBetween(from, to).map((month) => {
    const inMonth = rows.filter((r) => monthKey(r.date) === month);
    return {
      month,
      total: inMonth.length,
      incidents: inMonth.filter((r) => r.recordType === "incident").length,
      open: inMonth.filter((r) => r.status === "open").length,
    };
  });

  return {
    total: rows.length,
    byType,
    bySeverity,
    byStatus,
    byMonth,
    open: byStatus.open,
    openIncidents,
    complianceScore: complianceScore({ openIncidents, major: bySeverity.major, moderate: bySeverity.moderate, minor: bySeverity.minor }),
    window: { from, to },
  };
}

// ---- Student summary ------------------------------------------------------

export async function getStudentSummary(userId: number) {
  const user = await getUser(userId);
  const since180 = daysAgo(180);
  const squadron: FlyingSquadron | null = isFlyingSquadron(user.squadron) ? user.squadron : null;

  const [graded, pendingRows, quals, flightRows, squadronGraded, personnel] = await Promise.all([
    loadGraded({ userIds: [userId] }),
    db.select({ n: sql<number>`count(*)::int` }).from(scenarioSubmissions).where(and(eq(scenarioSubmissions.userId, userId), eq(scenarioSubmissions.status, "submitted"))),
    db.select({ expiryDate: userQualifications.expiryDate }).from(userQualifications).where(eq(userQualifications.userId, userId)),
    db
      .select({
        sorties: sql<number>`count(*)::int`,
        dayHours: sql<number>`coalesce(sum(${flightRecords.dayHours}),0)::float`,
        nightHours: sql<number>`coalesce(sum(${flightRecords.nightHours}),0)::float`,
      })
      .from(flightRecords)
      .where(eq(flightRecords.userId, userId)),
    squadron ? loadGraded({ squadron, from: since180 }) : Promise.resolve<GradedSubmission[]>([]),
    squadron ? listReadinessPersonnel(squadron) : Promise.resolve<User[]>([]),
  ]);

  const idsOf = (t: GradedType) => [...new Set(graded.filter((g) => g.type === t).map((g) => g.itemId))];
  const none = Promise.resolve<{ id: number; title: string }[]>([]);
  const [quizTitles, scenarioTitles, moduleTitles] = await Promise.all([
    idsOf("quiz").length ? db.select({ id: quizzes.id, title: quizzes.title }).from(quizzes).where(inArray(quizzes.id, idsOf("quiz"))) : none,
    idsOf("scenario").length ? db.select({ id: scenarios.id, title: scenarios.title }).from(scenarios).where(inArray(scenarios.id, idsOf("scenario"))) : none,
    idsOf("module").length ? db.select({ id: trainingModules.id, title: trainingModules.title }).from(trainingModules).where(inArray(trainingModules.id, idsOf("module"))) : none,
  ]);
  const titles: Record<GradedType, Map<number, string>> = {
    quiz: new Map(quizTitles.map((r) => [r.id, r.title])),
    scenario: new Map(scenarioTitles.map((r) => [r.id, r.title])),
    module: new Map(moduleTitles.map((r) => [r.id, r.title])),
  };

  const now = Date.now();
  const recent = graded.filter((g) => g.submittedAt >= since180);
  const passedCount = graded.filter((g) => g.passed).length;
  const ofType = (t: GradedType) => recent.filter((r) => r.type === t).map((r) => r.score);
  const lastActivityAt = graded[0]?.submittedAt ?? null;
  const qualCounts = { current: 0, expiring: 0, expired: 0 };
  for (const q of quals) qualCounts[qualStatus(q.expiryDate, now)]++;
  const flight = flightRows[0] ?? { sorties: 0, dayHours: 0, nightHours: 0 };

  const studentAverage = averageOrNull(recent.map((r) => r.score));
  const studentPassRate = percent(recent.filter((r) => r.passed).length, recent.length);
  const squadronAverage = average(squadronGraded.map((r) => r.score));
  const squadronPassRate = percent(squadronGraded.filter((r) => r.passed).length, squadronGraded.length);
  const rankings = [...groupByUser(squadronGraded).entries()]
    .map(([id, rows]) => ({ id, avg: average(rows.map((r) => r.score)) }))
    .sort((a, b) => b.avg - a.avg);
  const position = rankings.findIndex((r) => r.id === userId);

  return {
    user: toPublicUser(user),
    stats: {
      totalSubmissions: graded.length + (pendingRows[0]?.n ?? 0),
      graded: graded.length,
      passed: passedCount,
      failed: graded.length - passedCount,
      pendingGrading: pendingRows[0]?.n ?? 0,
      passRate: percent(passedCount, graded.length),
      averageScore: studentAverage,
      quizAvg: averageOrNull(ofType("quiz")),
      scenarioAvg: averageOrNull(ofType("scenario")),
      moduleAvg: averageOrNull(ofType("module")),
      lastActivityAt,
      weeksSinceLastActivity: lastActivityAt ? Math.floor((now - lastActivityAt.getTime()) / (7 * DAY_MS)) : null,
      qualifications: qualCounts,
      flight: { sorties: flight.sorties, dayHours: round1(flight.dayHours), nightHours: round1(flight.nightHours), totalHours: round1(flight.dayHours + flight.nightHours) },
    },
    recent: graded.slice(0, 20).map((g) => ({ type: g.type, id: g.id, itemId: g.itemId, title: titles[g.type].get(g.itemId) ?? "", score: g.score, passed: g.passed, submittedAt: g.submittedAt })),
    trend: monthlyTrend(graded, monthKeys(TREND_MONTHS, -(TREND_MONTHS - 1))),
    comparison: squadron
      ? {
          squadron,
          averageScore: { student: studentAverage, squadron: squadronAverage, delta: studentAverage === null ? null : studentAverage - squadronAverage },
          passRate: { student: studentPassRate, squadron: squadronPassRate, delta: studentPassRate - squadronPassRate },
          submissions: { student: recent.length, squadronPerMember: personnel.length ? round1(squadronGraded.length / personnel.length) : 0 },
          rank: { position: position === -1 ? null : position + 1, of: rankings.length },
        }
      : null,
  };
}

// ---- Instructor workload --------------------------------------------------

export async function getInstructorWorkload(f: AnalyticsFilter) {
  const since30 = daysAgo(30);
  const countBy = <T extends { createdById: number | null }>(rows: T[]): Map<number, number> => {
    const m = new Map<number, number>();
    for (const r of rows) if (r.createdById !== null) m.set(r.createdById, (m.get(r.createdById) ?? 0) + 1);
    return m;
  };

  const [instructors, reviews, pending, quizRows, scenarioRows, moduleRows, checklistRows, questionRows, documentRows] = await Promise.all([
    listUsers({ role: "instructor", squadron: f.squadron, activeOnly: true }),
    db
      .select({
        reviewerId: scenarioSubmissions.reviewedById,
        total: sql<number>`count(*)::int`,
        last30d: sql<number>`count(*) filter (where ${scenarioSubmissions.reviewedAt} >= ${since30})::int`,
      })
      .from(scenarioSubmissions)
      .where(and(eq(scenarioSubmissions.status, "reviewed"), isNotNull(scenarioSubmissions.reviewedById)))
      .groupBy(scenarioSubmissions.reviewedById),
    db
      .select({ squadron: scenarioSubmissions.squadron, n: sql<number>`count(*)::int` })
      .from(scenarioSubmissions)
      .where(eq(scenarioSubmissions.status, "submitted"))
      .groupBy(scenarioSubmissions.squadron),
    db.select({ createdById: quizzes.createdById }).from(quizzes),
    db.select({ createdById: scenarios.createdById }).from(scenarios),
    db.select({ createdById: trainingModules.createdById }).from(trainingModules),
    db.select({ createdById: checklists.createdById }).from(checklists),
    db.select({ createdById: quizQuestions.createdById }).from(quizQuestions),
    db.select({ createdById: documents.createdById }).from(documents),
  ]);

  const reviewsBy = new Map(reviews.flatMap((r) => (r.reviewerId === null ? [] : [[r.reviewerId, r] as const])));
  const pendingBySquadron = new Map(pending.map((p) => [p.squadron, p.n]));
  const pendingAll = pending.reduce((s, p) => s + p.n, 0);
  const authored = {
    quizzes: countBy(quizRows), scenarios: countBy(scenarioRows), modules: countBy(moduleRows),
    checklists: countBy(checklistRows), questions: countBy(questionRows), documents: countBy(documentRows),
  };

  return instructors.map((u) => {
    const r = reviewsBy.get(u.id);
    const content = {
      quizzes: authored.quizzes.get(u.id) ?? 0,
      scenarios: authored.scenarios.get(u.id) ?? 0,
      modules: authored.modules.get(u.id) ?? 0,
      checklists: authored.checklists.get(u.id) ?? 0,
      questions: authored.questions.get(u.id) ?? 0,
      documents: authored.documents.get(u.id) ?? 0,
    };
    return {
      user: toPublicUser(u),
      reviewsLast30d: r?.last30d ?? 0,
      reviewsTotal: r?.total ?? 0,
      // Embedded instructors see their squadron's queue; AMG staff see the whole queue.
      pendingInSquadron: isFlyingSquadron(u.squadron) ? (pendingBySquadron.get(u.squadron) ?? 0) : pendingAll,
      contentAuthored: { ...content, total: Object.values(content).reduce((s, n) => s + n, 0) },
    };
  });
}

// ---- Recommendations (rule engine) ---------------------------------------

export type RecommendationSeverity = "info" | "warning" | "critical";

export interface Recommendation {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  detail: string;
  metric: string;
  value: number;
  threshold: number;
  link: string;
  squadron: FlyingSquadron | null;
}

interface RuleContext {
  squadron: FlyingSquadron | null;
  readiness: ReadinessFigures[];
  pendingReviews: number;
  qualsExpiring30d: number;
  complianceScore: number;
  atRisk: AtRiskStudent[];
  hardQuestions: QuestionDifficultyRow[];
}

type Rule = (ctx: RuleContext) => Recommendation | null;

const PENDING_REVIEWS_MAX = 10;
const EXPIRING_30D_MAX = 5;
const HARD_QUESTION_RATE = 40;
/** A question needs this many sittings before its correct rate is trusted. */
const HARD_QUESTION_MIN_ATTEMPTS = 5;

function readinessRule(fig: ReadinessFigures): Rule {
  return () => {
    if (fig.squadron === "ALL" || fig.totalPersonnel === 0) return null;
    const squadron = fig.squadron;
    if (fig.readyPercent < THRESHOLDS.READINESS_CRITICAL_PERCENT) {
      return {
        id: `readiness-critical-${squadron}`, severity: "critical", squadron,
        title: `${squadron} readiness is critical`,
        detail: `${fig.readyCount} of ${fig.totalPersonnel} aircrew are ready (${fig.readyPercent}%), below the ${THRESHOLDS.READINESS_CRITICAL_PERCENT}% critical line.`,
        metric: "readyPercent", value: fig.readyPercent, threshold: THRESHOLDS.READINESS_CRITICAL_PERCENT, link: "/command",
      };
    }
    if (fig.readyPercent < THRESHOLDS.READINESS_TARGET_PERCENT) {
      return {
        id: `readiness-target-${squadron}`, severity: "warning", squadron,
        title: `${squadron} readiness is below target`,
        detail: `${fig.readyCount} of ${fig.totalPersonnel} aircrew are ready (${fig.readyPercent}%), below the ${THRESHOLDS.READINESS_TARGET_PERCENT}% target.`,
        metric: "readyPercent", value: fig.readyPercent, threshold: THRESHOLDS.READINESS_TARGET_PERCENT, link: "/command",
      };
    }
    return null;
  };
}

const pendingReviewsRule: Rule = (ctx) =>
  ctx.pendingReviews > PENDING_REVIEWS_MAX
    ? {
        id: "pending-reviews", severity: "warning", squadron: ctx.squadron,
        title: "Scenario review backlog",
        detail: `${ctx.pendingReviews} scenario submissions are waiting for instructor review.`,
        metric: "pendingReviews", value: ctx.pendingReviews, threshold: PENDING_REVIEWS_MAX, link: "/instructor/reviews",
      }
    : null;

const expiringQualsRule: Rule = (ctx) =>
  ctx.qualsExpiring30d > EXPIRING_30D_MAX
    ? {
        id: "quals-expiring-30d", severity: "warning", squadron: ctx.squadron,
        title: "Qualifications expiring within 30 days",
        detail: `${ctx.qualsExpiring30d} aircrew qualifications expire in the next 30 days.`,
        metric: "qualsExpiring30d", value: ctx.qualsExpiring30d, threshold: EXPIRING_30D_MAX, link: "/command",
      }
    : null;

const safetyComplianceRule: Rule = (ctx) =>
  ctx.complianceScore < THRESHOLDS.SAFETY_SCORE_MIN
    ? {
        id: "safety-compliance", severity: ctx.complianceScore < THRESHOLDS.SAFETY_SCORE_MIN / 2 ? "critical" : "warning", squadron: ctx.squadron,
        title: "Safety compliance score below minimum",
        detail: `The 12-month safety compliance score is ${ctx.complianceScore}, below the ${THRESHOLDS.SAFETY_SCORE_MIN} minimum.`,
        metric: "complianceScore", value: ctx.complianceScore, threshold: THRESHOLDS.SAFETY_SCORE_MIN, link: "/command/safety",
      }
    : null;

const atRiskStudentsRule: Rule = (ctx) => {
  const n = ctx.atRisk.filter((s) => s.flags.includes("low_average") || s.flags.includes("consecutive_fails")).length;
  return n > 0
    ? {
        id: "at-risk-students", severity: "warning", squadron: ctx.squadron,
        title: "Aircrew at risk",
        detail: `${n} aircrew have a recent average below ${THRESHOLDS.AT_RISK_AVERAGE_SCORE}% or consecutive failed assessments.`,
        metric: "atRiskStudents", value: n, threshold: 0, link: "/command",
      }
    : null;
};

const inactiveStudentsRule: Rule = (ctx) => {
  const n = ctx.atRisk.filter((s) => s.flags.includes("inactive")).length;
  return n > 0
    ? {
        id: "inactive-students", severity: "info", squadron: ctx.squadron,
        title: "Inactive aircrew",
        detail: `${n} aircrew have had no training activity for ${THRESHOLDS.INACTIVE_AFTER_WEEKS} weeks or more.`,
        metric: "inactiveStudents", value: n, threshold: 0, link: "/command",
      }
    : null;
};

const hardQuestionsRule: Rule = (ctx) => {
  const hard = ctx.hardQuestions.filter((q) => q.attempts >= HARD_QUESTION_MIN_ATTEMPTS && q.correctRate < HARD_QUESTION_RATE);
  return hard.length > 0
    ? {
        id: "hard-questions", severity: "info", squadron: ctx.squadron,
        title: "Questions with a low correct rate",
        detail: `${hard.length} question bank items are answered correctly less than ${HARD_QUESTION_RATE}% of the time (${HARD_QUESTION_MIN_ATTEMPTS}+ sittings). Review the wording or the teaching.`,
        metric: "hardQuestions", value: hard.length, threshold: HARD_QUESTION_RATE, link: "/instructor/question-bank",
      }
    : null;
};

const SEVERITY_ORDER: Record<RecommendationSeverity, number> = { critical: 0, warning: 1, info: 2 };

export async function getRecommendations(f: AnalyticsFilter): Promise<Recommendation[]> {
  const now = new Date();
  const personnel = await listReadinessPersonnel(f.squadron);
  const ids = personnel.map((p) => p.id);
  const [readiness, pendingRows, expiringRows, safety, atRisk, difficulty] = await Promise.all([
    computeReadinessForDate(db, now),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(scenarioSubmissions)
      .where(conds(eq(scenarioSubmissions.status, "submitted"), f.squadron ? eq(scenarioSubmissions.squadron, f.squadron) : undefined)),
    ids.length
      ? db
          .select({ n: sql<number>`count(*)::int` })
          .from(userQualifications)
          .where(and(inArray(userQualifications.userId, ids), gte(userQualifications.expiryDate, now), lte(userQualifications.expiryDate, new Date(now.getTime() + 30 * DAY_MS))))
      : Promise.resolve([{ n: 0 }]),
    getSafetySummary({ squadron: f.squadron }),
    getAtRiskStudents({ squadron: f.squadron }),
    getQuestionDifficulty({ squadron: f.squadron }),
  ]);

  const ctx: RuleContext = {
    squadron: f.squadron ?? null,
    readiness: f.squadron ? readiness.filter((r) => r.squadron === f.squadron) : readiness,
    pendingReviews: pendingRows[0]?.n ?? 0,
    qualsExpiring30d: expiringRows[0]?.n ?? 0,
    complianceScore: safety.complianceScore,
    atRisk,
    hardQuestions: difficulty.questions,
  };

  const rules: Rule[] = [
    ...ctx.readiness.map(readinessRule),
    pendingReviewsRule,
    expiringQualsRule,
    safetyComplianceRule,
    atRiskStudentsRule,
    inactiveStudentsRule,
    hardQuestionsRule,
  ];
  return rules
    .map((rule) => rule(ctx))
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.id.localeCompare(b.id));
}

