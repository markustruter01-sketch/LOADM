import { Router } from "express";
import { z } from "zod";
import { eq, desc, and, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  scenarios, scenarioSubmissions, insertScenarioSchema, insertScenarioSubmissionSchema, reviewScenarioSubmissionSchema,
} from "@shared/schema";
import { SQUADRONS, SUBMISSION_STATUSES, passMarkFor, roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt } from "../lib/ids";
import { BadRequest, Conflict, Forbidden, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser, canActFor } from "../middleware/persona";
import { toPublicUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import { getScenario, scenarioForViewer, gradeReview } from "../services/scenario-service";

export const scenariosRouter = Router();

// ---- Listing -------------------------------------------------------------

/** Scenarios. Students see active ones without the answer key; instructors see all. */
scenariosRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const instruct = roleHas(me.role, "instruct");
    const rows = await db
      .select()
      .from(scenarios)
      .where(instruct ? undefined : eq(scenarios.isActive, true))
      .orderBy(desc(scenarios.createdAt))
      .limit(500);
    if (rows.length === 0) {
      res.json([]);
      return;
    }
    const ids = rows.map((r) => r.id);
    const [counts, mine] = await Promise.all([
      db
        .select({ scenarioId: scenarioSubmissions.scenarioId, count: sql<number>`count(*)::int` })
        .from(scenarioSubmissions)
        .where(inArray(scenarioSubmissions.scenarioId, ids))
        .groupBy(scenarioSubmissions.scenarioId),
      db
        .select({
          id: scenarioSubmissions.id,
          scenarioId: scenarioSubmissions.scenarioId,
          status: scenarioSubmissions.status,
          score: scenarioSubmissions.score,
          passed: scenarioSubmissions.passed,
          submittedAt: scenarioSubmissions.submittedAt,
        })
        .from(scenarioSubmissions)
        .where(and(eq(scenarioSubmissions.userId, me.id), inArray(scenarioSubmissions.scenarioId, ids)))
        .orderBy(desc(scenarioSubmissions.submittedAt)),
    ]);
    const countBy = new Map(counts.map((c) => [c.scenarioId, c.count]));
    const latest = new Map<number, { id: number; status: string; score: number | null; passed: boolean | null; submittedAt: Date }>();
    for (const m of mine) {
      if (!latest.has(m.scenarioId)) latest.set(m.scenarioId, { id: m.id, status: m.status, score: m.score, passed: m.passed, submittedAt: m.submittedAt });
    }
    res.json(
      rows.map((s) => ({
        ...scenarioForViewer(s, me),
        submissionCount: countBy.get(s.id) ?? 0,
        mySubmission: latest.get(s.id) ?? null,
      })),
    );
  }),
);

// ---- Submissions + notifications (registered before /:id) ----------------

const submissionsQuery = z.object({
  status: z.enum(SUBMISSION_STATUSES).optional(),
  squadron: z.enum(SQUADRONS).optional(),
  scenarioId: z.coerce.number().int().positive().optional(),
});

/** Instructors see every submission (filterable); others see their own. */
scenariosRouter.get(
  "/submissions",
  requirePersona,
  validate(submissionsQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof submissionsQuery>;
    const limit = parseOptionalInt(req.query.limit, 500, { max: 2000 });
    const conds: SQL[] = [];
    if (!roleHas(me.role, "instruct")) conds.push(eq(scenarioSubmissions.userId, me.id));
    if (q.status) conds.push(eq(scenarioSubmissions.status, q.status));
    if (q.squadron) conds.push(eq(scenarioSubmissions.squadron, q.squadron));
    if (q.scenarioId) conds.push(eq(scenarioSubmissions.scenarioId, q.scenarioId));
    const rows = await db.query.scenarioSubmissions.findMany({
      where: conds.length ? and(...conds) : undefined,
      with: { user: true, scenario: { columns: { title: true } } },
      orderBy: [desc(scenarioSubmissions.submittedAt)],
      limit,
    });
    res.json(
      rows.map(({ user, scenario, ...submission }) => ({
        ...submission,
        user: user ? toPublicUser(user) : null,
        scenarioTitle: scenario ? scenario.title : null,
      })),
    );
  }),
);

/** One submission with its scenario and reviewer. Owner or instructor. */
scenariosRouter.get(
  "/submissions/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const row = await db.query.scenarioSubmissions.findFirst({
      where: eq(scenarioSubmissions.id, id),
      with: { user: true, scenario: true, reviewer: true },
    });
    if (!row) throw new NotFound("Submission");
    if (!canActFor(me, row.userId)) throw new Forbidden();
    const { user, scenario, reviewer, ...submission } = row;
    if (!scenario) throw new NotFound("Scenario");
    res.json({
      ...submission,
      user: user ? toPublicUser(user) : null,
      reviewer: reviewer ? toPublicUser(reviewer) : null,
      // The answer key is revealed to the student only once the review is in.
      scenario: scenarioForViewer(scenario, me, submission.status === "reviewed"),
    });
  }),
);

/** Instructor marking. Score, pass/fail and reviewer are derived server-side. */
scenariosRouter.patch(
  "/submissions/:id/review",
  requireInstruct,
  validate(reviewScenarioSubmissionSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof reviewScenarioSubmissionSchema>;
    const [existing] = await db.select().from(scenarioSubmissions).where(eq(scenarioSubmissions.id, id)).limit(1);
    if (!existing) throw new NotFound("Submission");
    const scenario = await getScenario(existing.scenarioId);
    const graded = gradeReview(scenario, b.markedAnswers);
    const [row] = await db
      .update(scenarioSubmissions)
      .set({
        status: "reviewed",
        score: graded.score,
        passed: graded.passed,
        markedAnswers: graded.markedAnswers,
        questionFeedback: b.questionFeedback ?? existing.questionFeedback,
        instructorFeedback: b.instructorFeedback ?? existing.instructorFeedback,
        reviewedById: me.id,
        reviewedAt: new Date(),
        notificationSeen: false,
      })
      .where(eq(scenarioSubmissions.id, id))
      .returning();
    if (!row) throw new NotFound("Submission");
    await logActivity({
      actor: me,
      action: "REVIEW",
      resourceType: "Scenario submission",
      resourceId: row.id,
      resourceName: scenario.title,
      details: `${graded.score}% (${graded.passed ? "pass" : "fail"})`,
    });
    res.json(row);
  }),
);

/** The current user's reviewed submissions they have not yet acknowledged. */
scenariosRouter.get(
  "/notifications",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const rows = await db
      .select({ submission: scenarioSubmissions, scenarioTitle: scenarios.title, passingThreshold: scenarios.passingThreshold })
      .from(scenarioSubmissions)
      .innerJoin(scenarios, eq(scenarios.id, scenarioSubmissions.scenarioId))
      .where(
        and(
          eq(scenarioSubmissions.userId, me.id),
          eq(scenarioSubmissions.status, "reviewed"),
          eq(scenarioSubmissions.notificationSeen, false),
        ),
      )
      .orderBy(desc(scenarioSubmissions.reviewedAt));
    res.json(rows.map((r) => ({ ...r.submission, scenarioTitle: r.scenarioTitle, passMark: passMarkFor({ passingThreshold: r.passingThreshold }) })));
  }),
);

const dismissBody = z.object({ ids: z.array(z.number().int().positive()).optional() });

/** Dismiss the given notifications, or all of the current user's when `ids` is omitted. */
scenariosRouter.post(
  "/notifications/dismiss",
  requirePersona,
  validate(dismissBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof dismissBody>;
    if (b.ids && b.ids.length === 0) {
      res.json({ dismissed: [] });
      return;
    }
    const conds: SQL[] = [eq(scenarioSubmissions.userId, me.id), eq(scenarioSubmissions.notificationSeen, false)];
    if (b.ids) conds.push(inArray(scenarioSubmissions.id, b.ids));
    const rows = await db
      .update(scenarioSubmissions)
      .set({ notificationSeen: true })
      .where(and(...conds))
      .returning({ id: scenarioSubmissions.id });
    res.json({ dismissed: rows.map((r) => r.id) });
  }),
);

// ---- CRUD ----------------------------------------------------------------

scenariosRouter.post(
  "/",
  requireInstruct,
  validate(insertScenarioSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertScenarioSchema>;
    const [row] = await db.insert(scenarios).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Scenario", resourceId: row.id, resourceName: row.title });
    res.status(201).json(row);
  }),
);

scenariosRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const scenario = await getScenario(parseId(req.params.id));
    if (!scenario.isActive && !roleHas(me.role, "instruct")) throw new NotFound("Scenario");
    res.json(scenarioForViewer(scenario, me));
  }),
);

const updateScenarioBody = insertScenarioSchema.partial();

scenariosRouter.put(
  "/:id",
  requireInstruct,
  validate(updateScenarioBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateScenarioBody>;
    if (Object.keys(b).length === 0) throw new BadRequest("Nothing to update");
    const [row] = await db.update(scenarios).set(b).where(eq(scenarios.id, id)).returning();
    if (!row) throw new NotFound("Scenario");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Scenario", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

/** Soft delete: submissions keep referencing the scenario. */
scenariosRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.update(scenarios).set({ isActive: false }).where(eq(scenarios.id, id)).returning();
    if (!row) throw new NotFound("Scenario");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Scenario", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

// ---- Submitting a scenario -----------------------------------------------

/** `scenarioId` comes from the URL; a body value is accepted but ignored. */
const submitScenarioBody = insertScenarioSubmissionSchema.extend({ scenarioId: z.number().int().positive().optional() });

scenariosRouter.post(
  "/:id/submissions",
  requirePersona,
  validate(submitScenarioBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const scenario = await getScenario(parseId(req.params.id));
    if (!scenario.isActive) throw new Conflict("This scenario is no longer available");
    const b = req.body as z.infer<typeof submitScenarioBody>;
    const known = new Set(scenario.questions.map((q) => q.id));
    const unknown = b.answers.filter((a) => !known.has(a.questionId)).map((a) => a.questionId);
    if (unknown.length) throw new BadRequest("Answers reference unknown questions", { questionIds: unknown });
    const [row] = await db
      .insert(scenarioSubmissions)
      .values({
        scenarioId: scenario.id,
        userId: me.id,
        squadron: me.squadron,
        answers: b.answers,
        submissionType: b.submissionType,
        timeSpentSeconds: b.timeSpentSeconds ?? null,
        notes: b.notes ?? null,
        status: "submitted",
      })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Scenario submission", resourceId: row.id, resourceName: scenario.title });
    res.status(201).json(row);
  }),
);
