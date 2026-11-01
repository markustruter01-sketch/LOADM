import { Router } from "express";
import { z } from "zod";
import { eq, desc, and, ne, isNull, gt, or } from "drizzle-orm";
import { db } from "../db";
import { quizzes, quizSubmissions, users, insertQuizSchema, type Quiz, type User } from "@shared/schema";
import { passMarkFor, roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { Conflict, Forbidden, NotFound } from "../lib/errors";
import { personName } from "../lib/client-format";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { getUsersByIds } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import {
  getQuiz, isQuizOpen, questionsForSitting, findOpenAttempt, submitAttempt, describeAnswers,
} from "../services/quiz-service";

export const quizzesRouter = Router();

/** A quiz in the shape the client reads: snake- and camel-case aliases side by side. */
function toClientQuiz(quiz: Quiz, creator: User | undefined) {
  return {
    ...quiz,
    is_active: quiz.isActive,
    question_count: quiz.questionCount,
    isExpired: !!quiz.expiresAt && quiz.expiresAt.getTime() < Date.now(),
    timeLimit: quiz.timeLimitMinutes,
    passingThreshold: passMarkFor(quiz),
    createdBy: { username: creator ? personName(creator) : "Unknown" },
  };
}

async function withCreators(rows: Quiz[]) {
  const creators = await getUsersByIds(rows.flatMap((q) => (q.createdById ? [q.createdById] : [])));
  return rows.map((q) => toClientQuiz(q, q.createdById ? creators.get(q.createdById) : undefined));
}

/**
 * Quizzes, newest first. `?activeOnly=true` (the student list) keeps active,
 * unexpired quizzes; otherwise instructors see every quiz and others the active ones.
 */
quizzesRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const where =
      req.query.activeOnly === "true"
        ? and(eq(quizzes.isActive, true), or(isNull(quizzes.expiresAt), gt(quizzes.expiresAt, new Date())))
        : roleHas(me.role, "instruct")
          ? undefined
          : eq(quizzes.isActive, true);
    const rows = await db.select().from(quizzes).where(where).orderBy(desc(quizzes.createdAt));
    res.json(await withCreators(rows));
  }),
);

quizzesRouter.post(
  "/",
  requireInstruct,
  validate(insertQuizSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertQuizSchema>;
    const [row] = await db.insert(quizzes).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Quiz", resourceId: row.id, resourceName: row.title });
    res.status(201).json(toClientQuiz(row, me));
  }),
);

quizzesRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const [quiz] = await withCreators([await getQuiz(parseId(req.params.id))]);
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
    const b = req.body as z.infer<typeof updateQuizBody>;
    const [row] = await db.update(quizzes).set(b).where(eq(quizzes.id, parseId(req.params.id))).returning();
    if (!row) throw new NotFound("Quiz");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Quiz", resourceId: row.id, resourceName: row.title });
    const [quiz] = await withCreators([row]);
    res.json(quiz);
  }),
);

/** Hard delete, as the instructor list expects: attempts and submissions go with the quiz. */
quizzesRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .delete(quizzes)
      .where(eq(quizzes.id, parseId(req.params.id)))
      .returning({ id: quizzes.id, title: quizzes.title });
    if (!row) throw new NotFound("Quiz");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Quiz", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

/** The questions of the caller's sitting (no answer key). 403 tells the page the quiz has closed. */
quizzesRouter.get(
  "/:id/questions",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const quiz = await getQuiz(parseId(req.params.id));
    if (!isQuizOpen(quiz)) throw new Forbidden("Quiz has expired");
    const questions = await questionsForSitting(quiz, me);
    res.json({
      questions: questions.map(({ id, questionText, options, category, difficulty }) => ({
        id, question: questionText, options, category, difficulty,
      })),
    });
  }),
);

/** The page keys answers by question id, so ids arrive as strings; NaN options arrive as null. */
const submitBody = z.object({
  answers: z.array(
    z.object({
      questionId: z.coerce.number().int(),
      answeredOption: z.number().int().nullable().transform((v) => v ?? -1),
    }),
  ),
});

/** Grade the caller's open attempt by question id. */
quizzesRouter.post(
  "/:id/submit",
  requirePersona,
  validate(submitBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const quiz = await getQuiz(parseId(req.params.id));
    const b = req.body as z.infer<typeof submitBody>;
    const attempt = await findOpenAttempt(quiz.id, me.id);
    if (!attempt) throw new Conflict("Open the quiz before submitting it");
    const { submission, results } = await submitAttempt({
      quiz,
      attempt,
      user: me,
      answers: b.answers.map((a) => ({ questionId: a.questionId, answeredIndex: a.answeredOption })),
    });
    await logActivity({
      actor: me,
      action: "CREATE",
      resourceType: "Quiz submission",
      resourceId: submission.id,
      resourceName: quiz.title,
      details: `${submission.score}% (${submission.passed ? "pass" : "fail"})`,
    });
    res.status(201).json({
      submissionId: submission.id,
      score: submission.score,
      passed: submission.passed,
      correctAnswers: submission.correctCount,
      totalQuestions: submission.totalQuestions,
      detailedResults: results.map((r) => ({
        questionId: r.questionId,
        questionText: r.questionText,
        userAnswer: r.options[r.answeredIndex] ?? "No answer",
        correctAnswer: r.options[r.correctIndex],
        isCorrect: r.correct,
      })),
    });
  }),
);

/** Every submission for a quiz, with the answers described for the difficulty hints. */
quizzesRouter.get(
  "/:id/submissions",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const quiz = await getQuiz(parseId(req.params.id));
    const rows = await db
      .select()
      .from(quizSubmissions)
      .where(eq(quizSubmissions.quizId, quiz.id))
      .orderBy(desc(quizSubmissions.submittedAt));
    const [people, describe] = await Promise.all([getUsersByIds(rows.map((r) => r.userId)), describeAnswers(rows)]);
    res.json(
      rows.map((r) => {
        const u = people.get(r.userId);
        return {
          ...r,
          submissionDate: r.submittedAt,
          answers: describe(r.answers),
          user: { username: u ? personName(u) : "Unknown" },
        };
      }),
    );
  }),
);

/** Cross-quiz submission list for the analytics and leadership screens. Command staff and AMG are excluded. */
export const instructorQuizSubmissionsRouter = Router();

instructorQuizSubmissionsRouter.get(
  "/",
  requireInstruct,
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ s: quizSubmissions, u: users, quizTitle: quizzes.title, quizDescription: quizzes.description })
      .from(quizSubmissions)
      .innerJoin(users, eq(users.id, quizSubmissions.userId))
      .innerJoin(quizzes, eq(quizzes.id, quizSubmissions.quizId))
      .where(and(ne(users.role, "command"), ne(quizSubmissions.squadron, "AMG")))
      .orderBy(desc(quizSubmissions.submittedAt));
    res.json(
      rows.map(({ s, u, quizTitle, quizDescription }) => ({
        id: s.id,
        quizId: s.quizId,
        userId: s.userId,
        submissionDate: s.submittedAt,
        answers: s.answers,
        score: s.score,
        squadron: s.squadron,
        status: "reviewed",
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        quizTitle,
        quizDescription,
      })),
    );
  }),
);
