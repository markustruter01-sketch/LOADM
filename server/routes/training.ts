import { Router } from "express";
import { z } from "zod";
import { eq, desc, asc, and, sql } from "drizzle-orm";
import multer from "multer";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { db } from "../db";
import {
  trainingModules, trainingModuleContent, trainingModuleCompletions, trainingModuleVideos,
  insertTrainingModuleSchema, insertTrainingModuleContentSchema,
} from "@shared/schema";
import { isPassing, roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt } from "../lib/ids";
import { BadRequest, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { logActivity } from "../services/activity-service";
import {
  stripAnswerKey, gradeModuleAssessment, findAssessmentContent,
  bestCompletionsFor, moduleCompletionRates, contentCountsFor,
} from "../services/training-service";
import { env } from "../config";

export const trainingRouter = Router();

const VIDEO_DIR = path.resolve(env.UPLOAD_DIR, "training-videos");

// ---- Module listing ------------------------------------------------------

const listQuery = z.object({
  includeInactive: z.coerce.boolean().optional(),
});

/** Modules with content count, the caller's best completion and the aircrew completion rate. */
trainingRouter.get(
  "/modules",
  requirePersona,
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof listQuery>;
    const showAll = roleHas(me.role, "instruct") && !!q.includeInactive;
    const rows = await db
      .select()
      .from(trainingModules)
      .where(showAll ? undefined : eq(trainingModules.isActive, true))
      .orderBy(asc(trainingModules.title));
    const ids = rows.map((m) => m.id);
    const [contentCounts, mine, rates] = await Promise.all([
      contentCountsFor(ids),
      bestCompletionsFor(me.id, ids),
      moduleCompletionRates(ids),
    ]);
    res.json(
      rows.map((m) => ({
        ...m,
        contentCount: contentCounts.get(m.id) ?? 0,
        myCompletion: mine.get(m.id) ?? null,
        completionRate: rates.get(m.id) ?? 0,
      })),
    );
  }),
);

trainingRouter.post(
  "/modules",
  requireInstruct,
  validate(insertTrainingModuleSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertTrainingModuleSchema>;
    const [row] = await db.insert(trainingModules).values({ ...b, createdById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "TrainingModule", resourceId: row.id, resourceName: row.title });
    res.status(201).json(row);
  }),
);

// ---- Completions (static path: before /modules/:id would not clash, but keep it ahead of any /:id) ----

/** The current user's module completions, newest first, with the module title. */
trainingRouter.get(
  "/completions/mine",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const limit = parseOptionalInt(req.query.limit, 200, { min: 1, max: 500 });
    const rows = await db
      .select({ completion: trainingModuleCompletions, module: { id: trainingModules.id, title: trainingModules.title, difficulty: trainingModules.difficulty, passingThreshold: trainingModules.passingThreshold } })
      .from(trainingModuleCompletions)
      .innerJoin(trainingModules, eq(trainingModules.id, trainingModuleCompletions.moduleId))
      .where(eq(trainingModuleCompletions.userId, me.id))
      .orderBy(desc(trainingModuleCompletions.submittedAt))
      .limit(limit);
    res.json(rows.map((r) => ({ ...r.completion, module: r.module })));
  }),
);

// ---- Single module -------------------------------------------------------

/** Module with ordered content and videos. Answer keys are stripped for non-instructors. */
trainingRouter.get(
  "/modules/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const instruct = roleHas(me.role, "instruct");
    const mod = await db.query.trainingModules.findFirst({
      where: eq(trainingModules.id, id),
      with: {
        content: {
          where: instruct ? undefined : eq(trainingModuleContent.isActive, true),
          orderBy: [asc(trainingModuleContent.orderIndex), asc(trainingModuleContent.id)],
        },
        videos: { orderBy: [asc(trainingModuleVideos.orderIndex), asc(trainingModuleVideos.id)] },
      },
    });
    if (!mod || (!instruct && !mod.isActive)) throw new NotFound("Training module");
    res.json({ ...mod, content: instruct ? mod.content : mod.content.map(stripAnswerKey) });
  }),
);

const updateModuleSchema = insertTrainingModuleSchema.partial();

trainingRouter.put(
  "/modules/:id",
  requireInstruct,
  validate(updateModuleSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateModuleSchema>;
    const [row] = await db.update(trainingModules).set(b).where(eq(trainingModules.id, id)).returning();
    if (!row) throw new NotFound("Training module");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "TrainingModule", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

/** Soft delete: the module is hidden but completions stay for analytics. */
trainingRouter.delete(
  "/modules/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.update(trainingModules).set({ isActive: false }).where(eq(trainingModules.id, id)).returning();
    if (!row) throw new NotFound("Training module");
    await logActivity({ actor: me, action: "DELETE", resourceType: "TrainingModule", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

// ---- Module content ------------------------------------------------------

async function requireModule(id: number) {
  const [row] = await db.select().from(trainingModules).where(eq(trainingModules.id, id)).limit(1);
  if (!row) throw new NotFound("Training module");
  return row;
}

trainingRouter.post(
  "/modules/:id/content",
  requireInstruct,
  validate(insertTrainingModuleContentSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof insertTrainingModuleContentSchema>;
    const mod = await requireModule(id);
    let orderIndex = b.orderIndex;
    if (orderIndex === undefined) {
      const [agg] = await db
        .select({ max: sql<number>`coalesce(max(${trainingModuleContent.orderIndex}),0)::int` })
        .from(trainingModuleContent)
        .where(eq(trainingModuleContent.moduleId, id));
      orderIndex = (agg?.max ?? 0) + 1;
    }
    const [row] = await db.insert(trainingModuleContent).values({ ...b, orderIndex, moduleId: id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "TrainingModuleContent", resourceId: row.id, resourceName: row.title, details: `Module: ${mod.title}` });
    res.status(201).json(row);
  }),
);

const updateContentSchema = insertTrainingModuleContentSchema.partial();

trainingRouter.put(
  "/modules/:id/content/:contentId",
  requireInstruct,
  validate(updateContentSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const contentId = parseId(req.params.contentId, "contentId");
    const b = req.body as z.infer<typeof updateContentSchema>;
    const [row] = await db
      .update(trainingModuleContent)
      .set(b)
      .where(and(eq(trainingModuleContent.id, contentId), eq(trainingModuleContent.moduleId, id)))
      .returning();
    if (!row) throw new NotFound("Module content");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "TrainingModuleContent", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

/** Hard delete: content rows carry no history of their own. */
trainingRouter.delete(
  "/modules/:id/content/:contentId",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const contentId = parseId(req.params.contentId, "contentId");
    const [row] = await db
      .delete(trainingModuleContent)
      .where(and(eq(trainingModuleContent.id, contentId), eq(trainingModuleContent.moduleId, id)))
      .returning({ id: trainingModuleContent.id, title: trainingModuleContent.title });
    if (!row) throw new NotFound("Module content");
    await logActivity({ actor: me, action: "DELETE", resourceType: "TrainingModuleContent", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

// ---- Assessment ----------------------------------------------------------

const assessmentBody = z.object({ answers: z.record(z.number().int().min(-1)) });

/** Grade the module's assessment and record a completion. Score/passed/squadron are derived server-side. */
trainingRouter.post(
  "/modules/:id/assessment",
  requirePersona,
  validate(assessmentBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof assessmentBody>;
    const mod = await requireModule(id);
    if (!mod.isActive && !roleHas(me.role, "instruct")) throw new NotFound("Training module");
    const content = await findAssessmentContent(id);
    if (!content || !content.questions) throw new BadRequest("This module has no assessment");
    const graded = gradeModuleAssessment(content.questions, b.answers);
    const passed = isPassing(graded.score, mod);
    const [completion] = await db
      .insert(trainingModuleCompletions)
      .values({
        moduleId: id,
        userId: me.id,
        squadron: me.squadron,
        score: graded.score,
        passed,
        correctCount: graded.correctCount,
        totalQuestions: graded.totalQuestions,
        answers: b.answers,
      })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "ModuleCompletion", resourceId: completion.id, resourceName: mod.title, details: `${graded.score}% ${passed ? "pass" : "fail"}` });
    res.status(201).json({ completion, results: graded.results });
  }),
);

// ---- Videos --------------------------------------------------------------

const VIDEO_EXT: Record<string, string> = { "video/mp4": ".mp4", "video/webm": ".webm" };

const videoUpload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, cb) => {
      await fs.mkdir(VIDEO_DIR, { recursive: true });
      cb(null, VIDEO_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${VIDEO_EXT[file.mimetype] ?? ".bin"}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in VIDEO_EXT) cb(null, true);
    else cb(new BadRequest("Only MP4 or WebM video is accepted"));
  },
});

const videoBody = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

/** Upload a video (multipart field `video`, plus `title`/`description`) for a module. */
trainingRouter.post(
  "/modules/:id/videos",
  requireInstruct,
  videoUpload.single("video"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const file = req.file;
    if (!file) throw new BadRequest("No file uploaded");
    const discard = () => fs.rm(file.path, { force: true });
    let id = 0;
    try {
      id = parseId(req.params.id);
    } catch (err) {
      await discard();
      throw err;
    }
    // Validate after multer has parsed the multipart text fields; drop the file on failure.
    const parsed = videoBody.safeParse(req.body);
    if (!parsed.success) {
      await discard();
      throw new BadRequest("Validation failed", parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })));
    }
    const [mod] = await db.select().from(trainingModules).where(eq(trainingModules.id, id)).limit(1);
    if (!mod) {
      await discard();
      throw new NotFound("Training module");
    }
    const [agg] = await db
      .select({ max: sql<number>`coalesce(max(${trainingModuleVideos.orderIndex}),0)::int` })
      .from(trainingModuleVideos)
      .where(eq(trainingModuleVideos.moduleId, id));
    const [row] = await db
      .insert(trainingModuleVideos)
      .values({
        moduleId: id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        fileName: file.originalname,
        storedName: file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
        orderIndex: (agg?.max ?? 0) + 1,
        uploadedById: me.id,
      })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "TrainingVideo", resourceId: row.id, resourceName: row.title, details: `Module: ${mod.title}` });
    res.status(201).json(row);
  }),
);

/** Delete the row, then the file on disk. */
trainingRouter.delete(
  "/videos/:videoId",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const videoId = parseId(req.params.videoId, "videoId");
    const [row] = await db
      .delete(trainingModuleVideos)
      .where(eq(trainingModuleVideos.id, videoId))
      .returning({ id: trainingModuleVideos.id, title: trainingModuleVideos.title, storedName: trainingModuleVideos.storedName });
    if (!row) throw new NotFound("Video");
    await fs.rm(path.resolve(VIDEO_DIR, row.storedName), { force: true });
    await logActivity({ actor: me, action: "DELETE", resourceType: "TrainingVideo", resourceId: row.id, resourceName: row.title });
    res.json({ id: row.id });
  }),
);

/** Stream a video. Express's sendFile honours Range requests. */
trainingRouter.get(
  "/videos/:videoId/stream",
  requirePersona,
  asyncHandler(async (req, res) => {
    const videoId = parseId(req.params.videoId, "videoId");
    const [row] = await db.select().from(trainingModuleVideos).where(eq(trainingModuleVideos.id, videoId)).limit(1);
    if (!row) throw new NotFound("Video");
    const absPath = path.resolve(VIDEO_DIR, row.storedName);
    try {
      await fs.access(absPath);
    } catch {
      throw new NotFound("Video file");
    }
    res.type(row.mimeType);
    await new Promise<void>((resolve, reject) => {
      res.sendFile(absPath, { acceptRanges: true }, (err) => (err ? reject(err) : resolve()));
    });
  }),
);
