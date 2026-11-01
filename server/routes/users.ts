import { Router } from "express";
import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "../db";
import {
  users, updateUserProfileSchema, quizSubmissions, scenarioSubmissions, trainingModuleCompletions,
  quizzes, scenarios, trainingModules, flightRecords, userQualifications, documentSubmissions, documents,
} from "@shared/schema";
import { ROLES, SQUADRONS, NOT_READY_REASONS, THRESHOLDS } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, queryFlag } from "../lib/ids";
import { Forbidden, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser, canActFor, invalidatePersonaCache } from "../middleware/persona";
import { listUsers, getUser, toPublicUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";

export const usersRouter = Router();

const DAY_MS = 86_400_000;

// ---- Listing -------------------------------------------------------------

const listQuery = z.object({
  squadron: z.enum(SQUADRONS).optional(),
  role: z.enum(ROLES).optional(),
  includeInactive: queryFlag,
});

/** Personnel list. Instructors and command see everyone; others see their squadron. */
usersRouter.get(
  "/",
  requirePersona,
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof listQuery>;
    const canSeeAll = me.role === "instructor" || me.role === "command";
    const rows = await listUsers({
      squadron: canSeeAll ? q.squadron : me.squadron,
      role: q.role,
      activeOnly: !(canSeeAll && q.includeInactive),
    });
    res.json(rows.map(toPublicUser));
  }),
);

// ---- Me / profile --------------------------------------------------------

/** Full profile for the current persona: user, stats, recent activity, quals. */
usersRouter.get(
  "/me",
  requirePersona,
  asyncHandler(async (req, res) => {
    res.json(await buildProfile(currentUser(req).id));
  }),
);

usersRouter.get(
  "/:id/profile",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    if (!canActFor(me, id)) throw new Forbidden();
    res.json(await buildProfile(id));
  }),
);

usersRouter.patch(
  "/me",
  requirePersona,
  validate(updateUserProfileSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db.update(users).set(req.body).where(eq(users.id, me.id)).returning();
    invalidatePersonaCache();
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Profile", resourceId: me.id, resourceName: `${row.firstName} ${row.lastName}` });
    res.json(toPublicUser(row));
  }),
);

const readinessBody = z
  .object({ isFlightReady: z.boolean(), notReadyReason: z.enum(NOT_READY_REASONS).nullable().optional() })
  .refine((b) => b.isFlightReady || !!b.notReadyReason, { message: "A reason is required when not ready", path: ["notReadyReason"] });

usersRouter.put(
  "/me/readiness",
  requirePersona,
  validate(readinessBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof readinessBody>;
    const [row] = await db
      .update(users)
      .set({ isFlightReady: b.isFlightReady, notReadyReason: b.isFlightReady ? null : b.notReadyReason, readinessUpdatedAt: new Date() })
      .where(eq(users.id, me.id))
      .returning();
    invalidatePersonaCache();
    res.json(toPublicUser(row));
  }),
);

/** Instructors can set readiness for anyone (e.g. after a medical). */
usersRouter.put(
  "/:id/readiness",
  requireInstruct,
  validate(readinessBody),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof readinessBody>;
    const [row] = await db
      .update(users)
      .set({ isFlightReady: b.isFlightReady, notReadyReason: b.isFlightReady ? null : b.notReadyReason, readinessUpdatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (!row) throw new NotFound("User");
    invalidatePersonaCache();
    await logActivity({ actor: currentUser(req), action: "UPDATE", resourceType: "Readiness", resourceId: id, resourceName: `${row.firstName} ${row.lastName}`, details: b.isFlightReady ? "Ready" : `Not ready: ${b.notReadyReason}` });
    res.json(toPublicUser(row));
  }),
);

// ---- Profile builder -----------------------------------------------------

async function buildProfile(userId: number) {
  const user = await getUser(userId);
  const since = new Date(Date.now() - 180 * DAY_MS);

  const [quizRows, scenarioRows, moduleRows, docRows, quals, flights] = await Promise.all([
    db
      .select({ id: quizSubmissions.id, date: quizSubmissions.submittedAt, score: quizSubmissions.score, passed: quizSubmissions.passed, title: quizzes.title, quizId: quizzes.id })
      .from(quizSubmissions)
      .innerJoin(quizzes, eq(quizzes.id, quizSubmissions.quizId))
      .where(eq(quizSubmissions.userId, userId))
      .orderBy(desc(quizSubmissions.submittedAt)),
    db
      .select({ id: scenarioSubmissions.id, date: scenarioSubmissions.submittedAt, score: scenarioSubmissions.score, passed: scenarioSubmissions.passed, status: scenarioSubmissions.status, title: scenarios.title, scenarioId: scenarios.id, feedback: scenarioSubmissions.instructorFeedback })
      .from(scenarioSubmissions)
      .innerJoin(scenarios, eq(scenarios.id, scenarioSubmissions.scenarioId))
      .where(eq(scenarioSubmissions.userId, userId))
      .orderBy(desc(scenarioSubmissions.submittedAt)),
    db
      .select({ id: trainingModuleCompletions.id, date: trainingModuleCompletions.submittedAt, score: trainingModuleCompletions.score, passed: trainingModuleCompletions.passed, title: trainingModules.title, moduleId: trainingModules.id })
      .from(trainingModuleCompletions)
      .innerJoin(trainingModules, eq(trainingModules.id, trainingModuleCompletions.moduleId))
      .where(eq(trainingModuleCompletions.userId, userId))
      .orderBy(desc(trainingModuleCompletions.submittedAt)),
    db
      .select({ id: documentSubmissions.id, date: documentSubmissions.submittedAt, title: documents.title, documentId: documents.id })
      .from(documentSubmissions)
      .innerJoin(documents, eq(documents.id, documentSubmissions.documentId))
      .where(eq(documentSubmissions.userId, userId))
      .orderBy(desc(documentSubmissions.submittedAt)),
    db.select().from(userQualifications).where(eq(userQualifications.userId, userId)).orderBy(userQualifications.expiryDate),
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
  ]);

  const activity = [
    ...quizRows.map((r) => ({ type: "quiz" as const, ...r })),
    ...scenarioRows.map((r) => ({ type: "scenario" as const, ...r })),
    ...moduleRows.map((r) => ({ type: "module" as const, ...r })),
    ...docRows.map((r) => ({ type: "document" as const, ...r, score: null, passed: null })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const graded = activity.filter((a) => a.type !== "document" && a.passed !== null);
  const passedCount = graded.filter((a) => a.passed).length;
  const pendingGrading = scenarioRows.filter((s) => s.status === "submitted").length;

  // Weekly streak: consecutive weeks (ending this week) with any activity.
  const weekOf = (d: Date) => Math.floor(d.getTime() / (7 * DAY_MS));
  const weeks = new Set(activity.map((a) => weekOf(a.date)));
  const thisWeek = weekOf(new Date());
  let current = 0;
  while (weeks.has(thisWeek - current)) current++;
  let longest = 0, run = 0;
  for (let w = thisWeek - 52; w <= thisWeek; w++) {
    run = weeks.has(w) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  const lastActivity = activity[0]?.date ?? null;

  const now = Date.now();
  const warn = THRESHOLDS.QUALIFICATION_EXPIRY_WARNING_DAYS * DAY_MS;
  const qualifications = quals.map((q) => ({
    ...q,
    status: !q.expiryDate ? ("current" as const) : q.expiryDate.getTime() < now ? ("expired" as const) : q.expiryDate.getTime() - now <= warn ? ("expiring" as const) : ("current" as const),
    daysRemaining: q.expiryDate ? Math.ceil((q.expiryDate.getTime() - now) / DAY_MS) : null,
  }));

  const recent = graded.filter((a) => a.date >= since);
  return {
    user: toPublicUser(user),
    stats: {
      totalSubmissions: activity.length,
      graded: graded.length,
      passed: passedCount,
      failed: graded.length - passedCount,
      pendingGrading,
      passRate: graded.length ? Math.round((passedCount / graded.length) * 100) : 0,
      averageScore: recent.length ? Math.round(recent.reduce((s, a) => s + (a.score ?? 0), 0) / recent.length) : null,
      currentStreakWeeks: current,
      longestStreakWeeks: longest,
      weeksSinceLastActivity: lastActivity ? Math.floor((now - lastActivity.getTime()) / (7 * DAY_MS)) : null,
      flight: flights[0],
      qualifications: {
        current: qualifications.filter((q) => q.status === "current").length,
        expiring: qualifications.filter((q) => q.status === "expiring").length,
        expired: qualifications.filter((q) => q.status === "expired").length,
      },
    },
    activity: activity.slice(0, 50),
    qualifications,
  };
}

