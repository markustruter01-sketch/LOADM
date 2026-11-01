import { Router } from "express";
import { z } from "zod";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { db } from "../db";
import { quizzes, quizAttempts, quizSubmissions, insertQuizSchema, submitQuizSchema } from "@shared/schema";
import { roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt, queryFlag } from "../lib/ids";
import { BadRequest, Conflict, Forbidden, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser, canActFor } from "../middleware/persona";
import { getUsersByIds, toPublicUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import {
  getQuiz, drawQuestions, toStudentQuestion, submitAttempt, buildSubmissionResults,
} from "../services/quiz-service";

export const quizzesRouter = Router();

// ---- Listing -------------------------------------------------------------

const listQuery = z.object({
  includeInactive: queryFlag,
});

/** Quizzes. Students see active ones; instructors may include inactive. */
quizzesRouter.get(
  "/",
  requirePersona,
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof listQuery>;
    const showAll = roleHas(me.role, "instruct") && !!q.includeInactive;
    const rows = await db
      .select()
      .from(quizzes)
      .where(showAll ? undefined : eq(quizzes.isActive, true))
      .orderBy(desc(quizzes.createdAt))
      .limit(500);
    if (rows.length === 0) {
      res.json([]);
      return;
    }
    const ids = rows.map((r) => r.id);
    const [counts, best] = await Promise.all([
      db
        .select({ quizId: quizSubmissions.quizId, count: sql<number>`count(*)::int` })
        .from(quizSubmissions)
        .where(inArray(quizSubmissions.quizId, ids))
        .groupBy(quizSubmissions.quizId),
      db
        .select({ quizId: quizSubmissions.quizId, best: sql<number>`max(${quizSubmissions.score})::int` })
        .from(quizSubmissions)
        .where(and(inArray(quizSubmissions.quizId, ids), eq(quizSubmissions.userId, me.id)))
        .groupBy(quizSubmissions.quizId),
    ]);
    const countBy = new Map(counts.map((c) => [c.quizId, c.count]));
    const bestBy = new Map(best.map((b) => [b.quizId, b.best]));
    res.json(rows.map((quiz) => ({ ...quiz, attemptCount: countBy.get(quiz.id) ?? 0, myBest: bestBy.get(quiz.id) ?? null })));
  }),
);

// ---- Submissions (registered before /:id so they are not shadowed) --------

/** Current user's submissions, newest first, with the quiz title attached. */
quizzesRouter.get(
  "/submissions/mine",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const limit = parseOptionalInt(req.query.limit, 500, { max: 2000 });
    const rows = await db
      .select({ submission: quizSubmissions, quizTitle: quizzes.title })
      .from(quizSubmissions)
      .innerJoin(quizzes, eq(quizzes.id, quizSubmissions.quizId))
      .where(eq(quizSubmissions.userId, me.id))
      .orderBy(desc(quizSubmissions.submittedAt))
      .limit(limit);
    res.json(rows.map((r) => ({ ...r.submission, quizTitle: r.quizTitle })));
  }),
);

/** One submission with its per-question results. Owner or instructor. */
quizzesRouter.get(
  "/submissions/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [submission] = await db.select().from(quizSubmissions).where(eq(quizSubmissions.id, id)).limit(1);
    if (!submission) throw new NotFound("Submission");
    if (!canActFor(me, submission.userId)) throw new Forbidden();
    const [quiz, results] = await Promise.all([getQuiz(submission.quizId), buildSubmissionResults(submission)]);
    res.json({ submission, quiz, results });
  }),
);

// ---- CRUD ----------------------------------------------------------------

quizzesRouter.post(
  "/",
  requireInstruct,
  validate(insertQuizSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertQuizSchema>;
    const [row] = await db.insert(quizzes).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Quiz", resourceId: row.id, resourceName: row.title });
    res.status(201).json(row);
  }),
);

quizzesRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const quiz = await getQuiz(parseId(req.params.id));
    if (!quiz.isActive && !roleHas(me.role, "instruct")) throw new NotFound("Quiz");
    res.json(quiz);
  }),
);

const updateQuizBody = insertQuizSchema.partial();

quizzesRouter.put(
  "/:id",
  requireInstruct,
  validate(updateQuizBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateQuizBody>;
    if (Object.keys(b).length === 0) throw new BadRequest("Nothing to update");
    const [row] = await db.update(quizzes).set(b).where(eq(quizzes.id, id)).returning();
    if (!row) throw new NotFound("Quiz");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Quiz", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

/** Soft delete: attempts and submissions keep referencing the quiz. */
quizzesRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.update(quizzes).set({ isActive: false }).where(eq(quizzes.id, id)).returning();
    if (!row) throw new NotFound("Quiz");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Quiz", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

// ---- Sitting a quiz ------------------------------------------------------

/** Start an attempt: draw the questions and record exactly which were served. */
quizzesRouter.post(
  "/:id/attempts",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const quiz = await getQuiz(parseId(req.params.id));
    if (!quiz.isActive || (quiz.expiresAt && quiz.expiresAt.getTime() < Date.now())) {
      throw new Conflict("This quiz is no longer available");
    }
    const drawn = await drawQuestions(quiz);
    if (drawn.length === 0) throw new Conflict("This quiz has no active questions");
    const [attempt] = await db
      .insert(quizAttempts)
      .values({ quizId: quiz.id, userId: me.id, questionIds: drawn.map((q) => q.id) })
      .returning();
    res.status(201).json({ attempt, questions: drawn.map(toStudentQuestion), quiz });
  }),
);

/** Submit an attempt. Graded by question id against the stored attempt. */
quizzesRouter.post(
  "/:id/submit",
  requirePersona,
  validate(submitQuizSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const quiz = await getQuiz(parseId(req.params.id));
    const b = req.body as z.infer<typeof submitQuizSchema>;
    const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, b.attemptId)).limit(1);
    if (!attempt) throw new NotFound("Quiz attempt");
    if (attempt.userId !== me.id) throw new Conflict("This attempt belongs to another user");
    if (attempt.quizId !== quiz.id) throw new Conflict("This attempt is for a different quiz");
    if (attempt.submittedAt) throw new Conflict("This attempt has already been submitted");

    const result = await submitAttempt({ quiz, attempt, user: me, answers: b.answers, timeSpentSeconds: b.timeSpentSeconds });
    await logActivity({
      actor: me,
      action: "CREATE",
      resourceType: "Quiz submission",
      resourceId: result.submission.id,
      resourceName: quiz.title,
      details: `${result.submission.score}% (${result.submission.passed ? "pass" : "fail"})`,
    });
    res.status(201).json(result);
  }),
);

/** Every submission for a quiz, with the person attached. */
quizzesRouter.get(
  "/:id/submissions",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const quiz = await getQuiz(parseId(req.params.id));
    const limit = parseOptionalInt(req.query.limit, 500, { max: 2000 });
    const rows = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.quizId, quiz.id))
      .orderBy(desc(quizSubmissions.submittedAt))
      .limit(limit);
    const people = await getUsersByIds(rows.map((r) => r.userId));
    res.json(
      rows.map((r) => {
        const u = people.get(r.userId);
        return { ...r, user: u ? toPublicUser(u) : null };
      }),
    );
  }),
);
