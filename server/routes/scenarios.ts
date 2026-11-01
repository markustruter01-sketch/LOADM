import { Router } from "express";
import { z } from "zod";
import { eq, desc, and, type SQL } from "drizzle-orm";
import { db } from "../db";
import {
  scenarios, scenarioSubmissions, insertScenarioSchema,
  type Scenario, type ScenarioSubmission, type User,
} from "@shared/schema";
import { SUBMISSION_TYPES, passMarkFor, roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { BadRequest, Conflict, Forbidden, NotFound } from "../lib/errors";
import { personName } from "../lib/client-format";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser, canActFor } from "../middleware/persona";
import { logActivity } from "../services/activity-service";
import { getScenario, gradeReview } from "../services/scenario-service";

/**
 * The scenario screens grade multiple-choice answers in the browser, so the
 * answer key (`correctAnswer`) is served to every role, as it always was.
 */
function toClientScenario(s: Scenario) {
  return { ...s, numberOfQuestions: s.questions.length, passingThreshold: passMarkFor(s) };
}

export const scenariosRouter = Router();

/** Active scenarios, newest first. Deleted (inactive) ones are hidden from every role. */
scenariosRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(scenarios).where(eq(scenarios.isActive, true)).orderBy(desc(scenarios.createdAt));
    res.json(rows.map(toClientScenario));
  }),
);

scenariosRouter.post(
  "/",
  requireInstruct,
  validate(insertScenarioSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertScenarioSchema>;
    const [row] = await db.insert(scenarios).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Scenario", resourceId: row.id, resourceName: row.title });
    res.status(201).json(toClientScenario(row));
  }),
);

scenariosRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const scenario = await getScenario(parseId(req.params.id));
    if (!scenario.isActive && !roleHas(me.role, "instruct")) throw new NotFound("Scenario");
    res.json(toClientScenario(scenario));
  }),
);

const updateScenarioBody = insertScenarioSchema.partial();

scenariosRouter.put(
  "/:id",
  requireInstruct,
  validate(updateScenarioBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof updateScenarioBody>;
    const [row] = await db.update(scenarios).set(b).where(eq(scenarios.id, parseId(req.params.id))).returning();
    if (!row) throw new NotFound("Scenario");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Scenario", resourceId: row.id, resourceName: row.title });
    res.json(toClientScenario(row));
  }),
);

/** Soft delete: submissions keep referencing the scenario. */
scenariosRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .update(scenarios)
      .set({ isActive: false })
      .where(eq(scenarios.id, parseId(req.params.id)))
      .returning();
    if (!row) throw new NotFound("Scenario");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Scenario", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

// ---- Submissions: /api/scenario-submissions --------------------------------

export const scenarioSubmissionsRouter = Router();

/** A submission with the flat names the review screens read. */
function toClientSubmission({ user, reviewer, ...s }: ScenarioSubmission & { user: User | null; reviewer: User | null }) {
  return {
    ...s,
    submissionDate: s.submittedAt,
    timeSpent: s.timeSpentSeconds,
    studentName: user ? personName(user) : null,
    studentId: String(s.userId),
    reviewedBy: reviewer ? personName(reviewer) : null,
  };
}

const listQuery = z.object({
  scenarioId: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
});

/** Newest first. Instructors see everyone's (optionally filtered); others their own. */
scenarioSubmissionsRouter.get(
  "/",
  requirePersona,
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof listQuery>;
    const conds: SQL[] = [];
    if (!roleHas(me.role, "instruct")) conds.push(eq(scenarioSubmissions.userId, me.id));
    else if (q.userId) conds.push(eq(scenarioSubmissions.userId, q.userId));
    if (q.scenarioId) conds.push(eq(scenarioSubmissions.scenarioId, q.scenarioId));
    const rows = await db.query.scenarioSubmissions.findMany({
      where: conds.length ? and(...conds) : undefined,
      with: { user: true, reviewer: true, scenario: { columns: { title: true } } },
      orderBy: [desc(scenarioSubmissions.submittedAt)],
    });
    res.json(rows.map(({ scenario, ...row }) => ({ ...toClientSubmission(row), scenarioTitle: scenario?.title ?? null })));
  }),
);

const submitBody = z.object({
  scenarioId: z.coerce.number().int().positive(),
  answers: z.array(z.object({ questionId: z.string(), answer: z.string(), notes: z.string().optional() })),
  submissionType: z.enum(SUBMISSION_TYPES).optional(),
  timeSpent: z.number().int().nonnegative().optional(),
  notes: z.string().max(5000).optional(),
});

/** A student's answers. Name, id and squadron come from the persona, not the form. */
scenarioSubmissionsRouter.post(
  "/",
  requirePersona,
  validate(submitBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof submitBody>;
    const scenario = await getScenario(b.scenarioId);
    if (!scenario.isActive) throw new Conflict("This scenario is no longer available");
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
        timeSpentSeconds: b.timeSpent ?? null,
        notes: b.notes ?? null,
        status: "submitted",
      })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Scenario submission", resourceId: row.id, resourceName: scenario.title });
    res.status(201).json(toClientSubmission({ ...row, user: me, reviewer: null }));
  }),
);

/** One submission with the scenario's questions flattened in. Owner or instructor. */
scenarioSubmissionsRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const row = await db.query.scenarioSubmissions.findFirst({
      where: eq(scenarioSubmissions.id, parseId(req.params.id)),
      with: { user: true, reviewer: true, scenario: true },
    });
    if (!row) throw new NotFound("Submission");
    if (!canActFor(me, row.userId)) throw new Forbidden();
    const { scenario, ...submission } = row;
    res.json({
      ...toClientSubmission(submission),
      scenarioTitle: scenario?.title ?? null,
      scenarioQuestions: scenario?.questions ?? [],
    });
  }),
);

/** The instructor's score and Pass/Fail switch are kept as given; missing values fall back to the marking. */
const reviewBody = z.object({
  markedAnswers: z.record(z.boolean()).default({}),
  questionFeedback: z.record(z.string()).optional(),
  instructorFeedback: z.string().max(10000).optional(),
  score: z.number().min(0).max(100).optional(),
  passed: z.boolean().optional(),
});

scenarioSubmissionsRouter.patch(
  "/:id",
  requireInstruct,
  validate(reviewBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof reviewBody>;
    const [existing] = await db.select().from(scenarioSubmissions).where(eq(scenarioSubmissions.id, id)).limit(1);
    if (!existing) throw new NotFound("Submission");
    const scenario = await getScenario(existing.scenarioId);
    const graded = gradeReview(scenario, b.markedAnswers);
    const score = b.score === undefined ? graded.score : Math.round(b.score);
    const passed = b.passed ?? graded.passed;
    const [row] = await db
      .update(scenarioSubmissions)
      .set({
        status: "reviewed",
        score,
        passed,
        markedAnswers: graded.markedAnswers,
        questionFeedback: b.questionFeedback ?? existing.questionFeedback,
        instructorFeedback: b.instructorFeedback ?? existing.instructorFeedback,
        reviewedById: me.id,
        reviewedAt: new Date(),
        notificationSeen: false,
      })
      .where(eq(scenarioSubmissions.id, id))
      .returning();
    await logActivity({
      actor: me,
      action: "REVIEW",
      resourceType: "Scenario submission",
      resourceId: row.id,
      resourceName: scenario.title,
      details: `${score}% (${passed ? "pass" : "fail"})`,
    });
    res.json(row);
  }),
);
