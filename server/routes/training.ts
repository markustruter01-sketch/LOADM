import { Router } from "express";
import { z } from "zod";
import { eq, asc, and } from "drizzle-orm";
import { db } from "../db";
import {
  trainingModules, trainingModuleContent, trainingModuleCompletions,
  type TrainingModule, type User,
} from "@shared/schema";
import { DIFFICULTIES, MODULE_CONTENT_TYPES } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { aircraftSlug, parseAircraft, parseMinutes, personName } from "../lib/client-format";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { getUsersByIds } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import { parseContentRef, toClientContent, parseQuestionContent, regradeModuleAnswers } from "../services/training-service";

/** The module page tells the student they need 80% to pass its assessment. */
const MODULE_ASSESSMENT_PASS_MARK = 80;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** A module in the shape the training screens read (lowercase aircraft slug, "N minutes", names). */
function toClientModule(m: TrainingModule, creator: User | undefined) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    aircraft: aircraftSlug(m.aircraft),
    difficulty: m.difficulty,
    duration: `${m.durationMinutes} minutes`,
    topics: m.topics,
    objectives: m.objectives,
    isActive: m.isActive,
    createdBy: creator ? personName(creator) : "System",
    lastModified: isoDate(m.updatedAt),
    createdDate: isoDate(m.createdAt),
    content: "",
    videoUrl: "",
  };
}

async function getActiveModule(id: number): Promise<TrainingModule> {
  const [row] = await db
    .select()
    .from(trainingModules)
    .where(and(eq(trainingModules.id, id), eq(trainingModules.isActive, true)))
    .limit(1);
  if (!row) throw new NotFound("Training module");
  return row;
}

export const trainingModulesRouter = Router();

// ---- Videos (removed from this build; registered before /:id) -------------

trainingModulesRouter.get("/:id/videos", requirePersona, (_req, res) => {
  res.json([]);
});

trainingModulesRouter.post("/:id/videos", requireInstruct, (_req, res) => {
  res.status(410).json({ error: "Videos are not part of this build" });
});

trainingModulesRouter.delete("/videos/:videoId", requireInstruct, () => {
  throw new NotFound("Video");
});

trainingModulesRouter.get("/videos/stream/:videoId", requirePersona, () => {
  throw new NotFound("Video");
});

// ---- Modules --------------------------------------------------------------

/** Active modules. Deactivated or deleted modules disappear for every role. */
trainingModulesRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(trainingModules).where(eq(trainingModules.isActive, true)).orderBy(asc(trainingModules.id));
    const creators = await getUsersByIds(rows.flatMap((m) => (m.createdById ? [m.createdById] : [])));
    res.json(rows.map((m) => toClientModule(m, m.createdById ? creators.get(m.createdById) : undefined)));
  }),
);

/** The instructor form's body: lowercase aircraft ("all" = every aircraft) and a free-text duration. */
const moduleBody = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().default(""),
    aircraft: z.string().optional(),
    difficulty: z.enum(DIFFICULTIES).optional(),
    duration: z.union([z.string(), z.number()]).optional(),
    topics: z.array(z.string()).default([]),
    objectives: z.array(z.string()).default([]),
    isActive: z.boolean().optional(),
  })
  .transform(({ aircraft, duration, ...rest }) => ({
    ...rest,
    aircraft: parseAircraft(aircraft),
    durationMinutes: parseMinutes(duration),
  }));

type ModuleBody = z.infer<typeof moduleBody>;

trainingModulesRouter.post(
  "/",
  requireInstruct,
  validate(moduleBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db.insert(trainingModules).values({ ...(req.body as ModuleBody), createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "TrainingModule", resourceId: row.id, resourceName: row.title });
    res.status(201).json(toClientModule(row, me));
  }),
);

/** The module with its content flattened to one item per question (answer key included: the page grades locally). */
trainingModulesRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const mod = await getActiveModule(parseId(req.params.id));
    const [content, creators] = await Promise.all([
      db
        .select()
        .from(trainingModuleContent)
        .where(and(eq(trainingModuleContent.moduleId, mod.id), eq(trainingModuleContent.isActive, true)))
        .orderBy(asc(trainingModuleContent.orderIndex), asc(trainingModuleContent.id)),
      getUsersByIds(mod.createdById ? [mod.createdById] : []),
    ]);
    res.json({
      ...toClientModule(mod, mod.createdById ? creators.get(mod.createdById) : undefined),
      content: content.flatMap(toClientContent),
    });
  }),
);

trainingModulesRouter.put(
  "/:id",
  requireInstruct,
  validate(moduleBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .update(trainingModules)
      .set(req.body as ModuleBody)
      .where(eq(trainingModules.id, parseId(req.params.id)))
      .returning();
    if (!row) throw new NotFound("Training module");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "TrainingModule", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

/** Soft delete: the module is hidden but completions stay for analytics. */
trainingModulesRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .update(trainingModules)
      .set({ isActive: false })
      .where(eq(trainingModules.id, parseId(req.params.id)))
      .returning();
    if (!row) throw new NotFound("Training module");
    await logActivity({ actor: me, action: "DELETE", resourceType: "TrainingModule", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

// ---- Content: one question or one reading per item --------------------------

const contentBody = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(MODULE_CONTENT_TYPES),
  content: z.string().default(""),
  description: z.string().default(""),
  duration: z.union([z.string(), z.number()]).optional(),
  orderIndex: z.coerce.number().int().nonnegative().optional(),
});

type ContentBody = z.infer<typeof contentBody>;

trainingModulesRouter.post(
  "/:id/content",
  requireInstruct,
  validate(contentBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const mod = await getActiveModule(parseId(req.params.id));
    const b = req.body as ContentBody;
    const reading = b.type === "reading";
    const [row] = await db
      .insert(trainingModuleContent)
      .values({
        moduleId: mod.id,
        title: b.title,
        type: b.type,
        description: b.description,
        durationMinutes: parseMinutes(b.duration, 10),
        body: reading ? b.content : null,
        questions: reading ? null : [parseQuestionContent(b.content, "q1")],
        orderIndex: b.orderIndex,
      })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "TrainingModuleContent", resourceId: row.id, resourceName: row.title, details: `Module: ${mod.title}` });
    res.status(201).json(toClientContent(row)[0]);
  }),
);

/** Load the stored row behind a content item id and check the id's kind matches the row. */
async function findContent(moduleId: number, rawId: string) {
  const ref = parseContentRef(rawId);
  const [row] = await db
    .select()
    .from(trainingModuleContent)
    .where(and(eq(trainingModuleContent.id, ref.rowId), eq(trainingModuleContent.moduleId, moduleId)))
    .limit(1);
  if (!row) throw new NotFound("Module content");
  const questions = row.questions ?? [];
  if (ref.index === null ? row.type !== "reading" : ref.index >= questions.length) throw new NotFound("Module content");
  return { row, index: ref.index, questions };
}

/**
 * Edit one item. A reading updates its row; a question replaces its slot in
 * the row, and the row's title/description/duration follow only when the
 * row holds that one question.
 */
trainingModulesRouter.put(
  "/:id/content/:contentId",
  requireInstruct,
  validate(contentBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as ContentBody;
    const { row, index, questions } = await findContent(parseId(req.params.id), req.params.contentId);
    const rowFields = { title: b.title, description: b.description, durationMinutes: parseMinutes(b.duration, row.durationMinutes) };
    const next = index === null ? null : questions.map((q, i) => (i === index ? parseQuestionContent(b.content, q.id) : q));
    const changes = !next
      ? { ...rowFields, body: b.content }
      : questions.length === 1
        ? { ...rowFields, questions: next }
        : { questions: next };
    const [updated] = await db.update(trainingModuleContent).set(changes).where(eq(trainingModuleContent.id, row.id)).returning();
    await logActivity({ actor: me, action: "UPDATE", resourceType: "TrainingModuleContent", resourceId: updated.id, resourceName: updated.title });
    res.json(toClientContent(updated)[index ?? 0]);
  }),
);

/** Remove one item: a question leaves its row (the row goes with its last question); a reading deletes its row. */
trainingModulesRouter.delete(
  "/:id/content/:contentId",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const { row, index, questions } = await findContent(parseId(req.params.id), req.params.contentId);
    if (index !== null && questions.length > 1) {
      await db
        .update(trainingModuleContent)
        .set({ questions: questions.filter((_, i) => i !== index) })
        .where(eq(trainingModuleContent.id, row.id));
    } else {
      await db.delete(trainingModuleContent).where(eq(trainingModuleContent.id, row.id));
    }
    await logActivity({ actor: me, action: "DELETE", resourceType: "TrainingModuleContent", resourceId: row.id, resourceName: row.title });
    res.json({ id: req.params.contentId });
  }),
);

// ---- Assessments: /api/training-assessments -------------------------------

export const trainingAssessmentsRouter = Router();

const assessmentBody = z.object({
  moduleId: z.union([z.string(), z.number()]),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  totalQuestions: z.number().int().nonnegative().optional(),
  correctCount: z.number().int().nonnegative().optional(),
  answers: z.array(z.object({ questionId: z.string(), yourAnswer: z.string().optional() })).default([]),
});

/**
 * Record a module assessment the page has already scored. Answers to stored
 * questions are re-graded here; the page's built-in questions cannot be, so
 * its score is kept. Built-in modules (non-numeric ids) are not stored.
 */
trainingAssessmentsRouter.post(
  "/",
  requirePersona,
  validate(assessmentBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof assessmentBody>;
    const moduleId = Number(b.moduleId);
    if (!Number.isInteger(moduleId) || moduleId <= 0) {
      res.json({ success: true });
      return;
    }
    const mod = await getActiveModule(moduleId);
    const regraded = await regradeModuleAnswers(mod.id, b.answers);
    const result = regraded
      ? { ...regraded, passed: regraded.score >= MODULE_ASSESSMENT_PASS_MARK }
      : {
          score: Math.round(b.score),
          passed: b.passed,
          correctCount: b.correctCount ?? 0,
          totalQuestions: b.totalQuestions ?? b.answers.length,
          answers: {},
        };
    const [completion] = await db
      .insert(trainingModuleCompletions)
      .values({ moduleId: mod.id, userId: me.id, squadron: me.squadron, ...result })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "ModuleCompletion", resourceId: completion.id, resourceName: mod.title, details: `${result.score}% ${result.passed ? "pass" : "fail"}` });
    res.status(201).json({ success: true, id: completion.id, submittedAt: completion.submittedAt });
  }),
);

/** How many modules per aircraft the caller has passed (each counted once), keyed by the profile's slugs. */
trainingAssessmentsRouter.get(
  "/workbooks",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const rows = await db
      .selectDistinct({ moduleId: trainingModuleCompletions.moduleId, aircraft: trainingModules.aircraft })
      .from(trainingModuleCompletions)
      .innerJoin(trainingModules, eq(trainingModules.id, trainingModuleCompletions.moduleId))
      .where(and(eq(trainingModuleCompletions.userId, me.id), eq(trainingModuleCompletions.passed, true)));
    const counts: Record<string, number> = { c17: 0, c130: 0, kc30a: 0, c27j: 0 };
    for (const r of rows) {
      if (r.aircraft) counts[aircraftSlug(r.aircraft)] += 1;
    }
    res.json(counts);
  }),
);
