import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  flightRecords, userQualifications, safetyRecords, scenarioSubmissions, scenarios, quizSubmissions, quizzes,
  documentSubmissions, documents, type FlightRecord,
} from "@shared/schema";
import { THRESHOLDS } from "@shared/constants";
import { aircraftDashed, clientRole, personName } from "../lib/client-format";
import { getUser } from "./user-service";

const DAY_MS = 86_400_000;

// ---- Qualification status --------------------------------------------------

type QualificationStatus = "current" | "expiring" | "expired";

/**
 * The one rule for qualification status: expired when the expiry has passed,
 * expiring when it falls inside the warning window, otherwise current.
 * No expiry = current.
 */
function qualificationStatus(expiryDate: Date | null, now = Date.now()): QualificationStatus {
  if (!expiryDate) return "current";
  const e = expiryDate.getTime();
  if (e < now) return "expired";
  if (e - now <= THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS * DAY_MS) return "expiring";
  return "current";
}

// ---- Flight records --------------------------------------------------------

export function listFlightRecords(userId: number): Promise<FlightRecord[]> {
  return db
    .select()
    .from(flightRecords)
    .where(eq(flightRecords.userId, userId))
    .orderBy(desc(flightRecords.date), desc(flightRecords.id));
}

/** A flight record in the client's vocabulary (cargoWeight, aircraftType "C-17A"). */
export function toClientFlight(r: FlightRecord) {
  return {
    id: r.id,
    date: r.date,
    callsign: r.callsign,
    departure: r.departure,
    arrival: r.arrival,
    captain: r.captain,
    passengersCarried: r.passengersCarried,
    cargoWeight: r.cargoWeightKg,
    dayHours: r.dayHours,
    nightHours: r.nightHours,
    aircraftType: aircraftDashed(r.aircraft),
  };
}

export function flightTotals(rows: FlightRecord[]) {
  let dayHours = 0, nightHours = 0, cargoKg = 0, passengers = 0;
  for (const r of rows) {
    dayHours += r.dayHours;
    nightHours += r.nightHours;
    cargoKg += r.cargoWeightKg;
    passengers += r.passengersCarried;
  }
  return { sorties: rows.length, dayHours, nightHours, totalHours: dayHours + nightHours, cargoKg, passengers };
}

// ---- Submissions -----------------------------------------------------------

/** Every scenario, quiz and document submission of one user, newest first. */
export async function userSubmissions(userId: number) {
  const [scenarioRows, quizRows, documentRows] = await Promise.all([
    db
      .select({
        id: scenarioSubmissions.id,
        date: scenarioSubmissions.submittedAt,
        score: scenarioSubmissions.score,
        passed: scenarioSubmissions.passed,
        status: scenarioSubmissions.status,
        instructorFeedback: scenarioSubmissions.instructorFeedback,
        title: scenarios.title,
      })
      .from(scenarioSubmissions)
      .innerJoin(scenarios, eq(scenarios.id, scenarioSubmissions.scenarioId))
      .where(eq(scenarioSubmissions.userId, userId))
      .orderBy(desc(scenarioSubmissions.submittedAt)),
    db
      .select({
        id: quizSubmissions.id,
        date: quizSubmissions.submittedAt,
        score: quizSubmissions.score,
        passed: quizSubmissions.passed,
        title: quizzes.title,
      })
      .from(quizSubmissions)
      .innerJoin(quizzes, eq(quizzes.id, quizSubmissions.quizId))
      .where(eq(quizSubmissions.userId, userId))
      .orderBy(desc(quizSubmissions.submittedAt)),
    db
      .select({ id: documentSubmissions.id, date: documentSubmissions.submittedAt, title: documents.title })
      .from(documentSubmissions)
      .innerJoin(documents, eq(documents.id, documentSubmissions.documentId))
      .where(eq(documentSubmissions.userId, userId))
      .orderBy(desc(documentSubmissions.submittedAt)),
  ]);
  return { scenarios: scenarioRows, quizzes: quizRows, documents: documentRows };
}

// ---- Instructor user report (UserReportModal) ------------------------------

function average(scores: number[]): number {
  return scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0;
}

export async function buildUserReport(userId: number) {
  const [user, quals, flights, subs, safety] = await Promise.all([
    getUser(userId),
    db.select().from(userQualifications).where(eq(userQualifications.userId, userId)).orderBy(desc(userQualifications.expiryDate)),
    listFlightRecords(userId),
    userSubmissions(userId),
    db.select({ recordType: safetyRecords.recordType }).from(safetyRecords).where(eq(safetyRecords.userId, userId)),
  ]);
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * DAY_MS;
  const sixtyDaysAgo = now - 60 * DAY_MS;

  // Qualifications
  const expiringQuals: { name: string; expiryDate: Date; daysRemaining: number }[] = [];
  const expiredQuals: { name: string; expiryDate: Date; daysOverdue: number }[] = [];
  for (const q of quals) {
    if (!q.expiryDate) continue;
    const status = qualificationStatus(q.expiryDate, now);
    const delta = q.expiryDate.getTime() - now;
    if (status === "expired") expiredQuals.push({ name: q.name, expiryDate: q.expiryDate, daysOverdue: Math.floor(-delta / DAY_MS) });
    if (status === "expiring") expiringQuals.push({ name: q.name, expiryDate: q.expiryDate, daysRemaining: Math.floor(delta / DAY_MS) });
  }

  // Flights
  const totals = flightTotals(flights);
  const last30 = flights.filter((f) => f.date.getTime() >= thirtyDaysAgo);

  // Scenarios
  const sc = subs.scenarios;
  const scored = sc.flatMap((s) => (s.score === null ? [] : [{ score: s.score, at: s.date.getTime() }]));
  const passed = sc.filter((s) => s.passed === true).length;
  const failed = sc.filter((s) => s.passed === false).length;
  const scenarioAverage = average(scored.map((s) => s.score));
  const recentScores = scored.filter((s) => s.at >= thirtyDaysAgo).map((s) => s.score);
  const previousScores = scored.filter((s) => s.at >= sixtyDaysAgo && s.at < thirtyDaysAgo).map((s) => s.score);

  let trend: "improving" | "declining" | "stable" = "stable";
  if (recentScores.length && previousScores.length) {
    const diff = average(recentScores) - average(previousScores);
    if (diff > 5) trend = "improving";
    else if (diff < -5) trend = "declining";
  }

  // Risk (0-100, higher = more at risk)
  const activeLast30 = [...sc, ...subs.quizzes].some((s) => s.date.getTime() >= thirtyDaysAgo);
  let riskScore = Math.min(40, expiredQuals.length * 30) + Math.min(30, expiringQuals.length * 15);
  if (!user.isFlightReady) riskScore += 20;
  if (scored.length && scenarioAverage < THRESHOLDS.AT_RISK_AVERAGE_SCORE) riskScore += 10;
  if (!activeLast30 && sc.length) riskScore += 10;
  const level = riskScore >= 60 ? "critical" : riskScore >= 40 ? "high" : riskScore >= 20 ? "medium" : "low";

  const tenureMonths = Math.floor((now - user.createdAt.getTime()) / (30 * DAY_MS));
  const countSafety = (type: string) => safety.filter((r) => r.recordType === type).length;

  return {
    profile: {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: personName(user) || user.email,
      squadron: user.squadron,
      category: user.category,
      licenseType: clientRole(user.role),
      isFlightReady: user.isFlightReady,
      notReadyReason: user.notReadyReason,
      profilePhotoUrl: null,
      tenureMonths,
      tenureYears: Math.floor(tenureMonths / 12),
    },
    riskAssessment: { score: riskScore, level, trend },
    qualifications: {
      stats: {
        total: quals.length,
        current: quals.length - expiringQuals.length - expiredQuals.length,
        expiringSoon: expiringQuals.length,
        expired: expiredQuals.length,
      },
      expiringQuals,
      expiredQuals,
      all: quals,
    },
    flightRecords: {
      stats: {
        totalFlights: totals.sorties,
        totalDayHours: totals.dayHours,
        totalNightHours: totals.nightHours,
        totalHours: totals.totalHours,
        totalCargoWeight: totals.cargoKg,
        totalPassengers: totals.passengers,
        aircraftTypes: Array.from(new Set(flights.map((f) => aircraftDashed(f.aircraft)))),
        last30Days: { flights: last30.length, hours: flightTotals(last30).totalHours },
      },
      recent: flights.slice(0, 20).map(toClientFlight),
    },
    scenarios: {
      stats: {
        total: sc.length,
        passed,
        failed,
        pending: sc.filter((s) => s.status === "submitted").length,
        averageScore: scenarioAverage,
        passRate: passed + failed ? Math.round((passed / (passed + failed)) * 100) : 0,
      },
      recent: sc.slice(0, 10).map((s) => ({
        id: s.id, scenarioTitle: s.title, score: s.score, passed: s.passed, status: s.status, submissionDate: s.date,
      })),
    },
    quizzes: {
      stats: { total: subs.quizzes.length, averageScore: average(subs.quizzes.map((q) => q.score)) },
      recent: subs.quizzes.slice(0, 10).map((q) => ({ id: q.id, quizTitle: q.title, score: q.score, submissionDate: q.date })),
    },
    safety: {
      incidents: countSafety("incident"),
      observations: countSafety("observation"),
      commendations: countSafety("commendation"),
    },
  };
}
