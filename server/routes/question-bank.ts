import { Router } from "express";
import { z } from "zod";
import { eq, desc, asc, and, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { quizQuestions, insertQuizQuestionSchema } from "@shared/schema";
import { QUESTION_CATEGORIES, QUESTION_CATEGORY_LABELS, QUESTION_DIFFICULTIES, type QuestionCategory } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt, queryFlag } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { logActivity } from "../services/activity-service";

export const questionBankRouter = Router();

function emptyCounts(): Record<QuestionCategory, number> {
  const counts = {} as Record<QuestionCategory, number>;
  for (const c of QUESTION_CATEGORIES) counts[c] = 0;
  return counts;
}

// ---- Categories (registered before /:id) ---------------------------------

/** Every category with its label and number of active questions. */
questionBankRouter.get(
  "/categories",
  requirePersona,
  asyncHandler(async (_req, res) => {
    const rows = await db
      .select({ category: quizQuestions.category, count: sql<number>`count(*)::int` })
      .from(quizQuestions)
      .where(eq(quizQuestions.isActive, true))
      .groupBy(quizQuestions.category);
    const counts = emptyCounts();
    for (const r of rows) counts[r.category] = r.count;
    res.json(QUESTION_CATEGORIES.map((category) => ({ category, label: QUESTION_CATEGORY_LABELS[category], activeCount: counts[category] })));
  }),
);

// ---- Listing -------------------------------------------------------------

const listQuery = z.object({
  category: z.enum(QUESTION_CATEGORIES).optional(),
  difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
  includeInactive: queryFlag,
});

/**
 * Question bank with the answer key (instructors only). `counts` is per
 * category over the same difficulty/active filter, ignoring `category`, so
 * the category sidebar stays stable while filtering.
 */
questionBankRouter.get(
  "/",
  requireInstruct,
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof listQuery>;
    const limit = parseOptionalInt(req.query.limit, 500, { max: 5000 });
    const base: SQL[] = [];
    if (!q.includeInactive) base.push(eq(quizQuestions.isActive, true));
    if (q.difficulty) base.push(eq(quizQuestions.difficulty, q.difficulty));
    const baseWhere = base.length ? and(...base) : undefined;

    const [questions, countRows] = await Promise.all([
      db
        .select()
        .from(quizQuestions)
        .where(q.category ? and(baseWhere, eq(quizQuestions.category, q.category)) : baseWhere)
        .orderBy(asc(quizQuestions.category), desc(quizQuestions.createdAt))
        .limit(limit),
      db
        .select({ category: quizQuestions.category, count: sql<number>`count(*)::int` })
        .from(quizQuestions)
        .where(baseWhere)
        .groupBy(quizQuestions.category),
    ]);
    const counts = emptyCounts();
    for (const r of countRows) counts[r.category] = r.count;
    res.json({ questions, counts });
  }),
);

// ---- CRUD ----------------------------------------------------------------

questionBankRouter.post(
  "/",
  requireInstruct,
  validate(insertQuizQuestionSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertQuizQuestionSchema>;
    const [row] = await db.insert(quizQuestions).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Quiz question", resourceId: row.id, resourceName: row.questionText.slice(0, 120), details: row.category });
    res.status(201).json(row);
  }),
);

/** Full replace: the insert schema's refine (correctIndex < options.length) needs the whole object. */
questionBankRouter.put(
  "/:id",
  requireInstruct,
  validate(insertQuizQuestionSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof insertQuizQuestionSchema>;
    const [row] = await db.update(quizQuestions).set(b).where(eq(quizQuestions.id, id)).returning();
    if (!row) throw new NotFound("Question");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Quiz question", resourceId: row.id, resourceName: row.questionText.slice(0, 120), details: row.category });
    res.json(row);
  }),
);

/** Soft delete: attempts reference questions by id, so rows are never removed. */
questionBankRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.update(quizQuestions).set({ isActive: false }).where(eq(quizQuestions.id, id)).returning();
    if (!row) throw new NotFound("Question");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Quiz question", resourceId: row.id, resourceName: row.questionText.slice(0, 120), details: row.category });
    res.json(row);
  }),
);
