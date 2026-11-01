import { Router } from "express";
import { z } from "zod";
import { eq, asc, desc } from "drizzle-orm";
import { db } from "../db";
import { quizQuestions, insertQuizQuestionSchema, type QuizQuestion } from "@shared/schema";
import { QUESTION_CATEGORIES, QUESTION_DIFFICULTIES } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requireInstruct, currentUser } from "../middleware/persona";
import { logActivity } from "../services/activity-service";

/** The question bank in the client's vocabulary (`question`, `correctAnswer`, string ids). */
export const quizQuestionsRouter = Router();

function toClientQuestion(q: QuizQuestion) {
  return {
    id: String(q.id),
    question: q.questionText,
    options: q.options,
    correctAnswer: q.correctIndex,
    category: q.category,
    difficulty: q.difficulty,
  };
}

const questionBody = z
  .object({
    question: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.coerce.number().int(),
    category: z.enum(QUESTION_CATEGORIES),
    difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
  })
  .transform(({ question, correctAnswer, ...rest }) => ({ ...rest, questionText: question, correctIndex: correctAnswer }))
  .pipe(insertQuizQuestionSchema);

type QuestionBody = z.infer<typeof questionBody>;

/** Every active question with its answer key. */
quizQuestionsRouter.get(
  "/",
  requireInstruct,
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.isActive, true))
      .orderBy(asc(quizQuestions.category), desc(quizQuestions.createdAt));
    res.json(rows.map(toClientQuestion));
  }),
);

quizQuestionsRouter.post(
  "/",
  requireInstruct,
  validate(questionBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as QuestionBody;
    const [row] = await db.insert(quizQuestions).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Quiz question", resourceId: row.id, resourceName: row.questionText.slice(0, 120), details: row.category });
    res.status(201).json(toClientQuestion(row));
  }),
);

quizQuestionsRouter.put(
  "/:id",
  requireInstruct,
  validate(questionBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as QuestionBody;
    const [row] = await db.update(quizQuestions).set(b).where(eq(quizQuestions.id, parseId(req.params.id))).returning();
    if (!row) throw new NotFound("Question");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Quiz question", resourceId: row.id, resourceName: row.questionText.slice(0, 120), details: row.category });
    res.json(toClientQuestion(row));
  }),
);

/** Soft delete: attempts reference questions by id, so rows are never removed. */
quizQuestionsRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .update(quizQuestions)
      .set({ isActive: false })
      .where(eq(quizQuestions.id, parseId(req.params.id)))
      .returning();
    if (!row) throw new NotFound("Question");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Quiz question", resourceId: row.id, resourceName: row.questionText.slice(0, 120), details: row.category });
    res.json({ id: String(row.id) });
  }),
);
