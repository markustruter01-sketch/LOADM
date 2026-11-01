import { Router } from "express";
import { z } from "zod";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "../db";
import { checklists, checklistItems, checklistCompletions, insertChecklistSchema, type ChecklistCompletion } from "@shared/schema";
import { CHECKLIST_CATEGORIES } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { getUsersByIds } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import {
  getActiveChecklist, itemsForChecklists, progressFor, toClientItems, toClientChecklist, toUserCompletion,
  itemRowsFromClient, saveChecklistProgress,
} from "../services/checklist-service";

/** Mounted at /api/checklists. */
export const checklistsRouter = Router();

/** What checklist-management.tsx sends on create and update (items carry `category`, not `section`). */
const checklistBodySchema = insertChecklistSchema.extend({
  category: z.enum(CHECKLIST_CATEGORIES),
  items: z
    .array(z.object({ itemText: z.string().min(1), isRequired: z.boolean().optional(), category: z.string().optional() }))
    .min(1),
});
type ChecklistBody = z.infer<typeof checklistBodySchema>;

const completionSchema = z.object({ completedItems: z.array(z.number().int().positive()) });

/** Active checklists, newest first, each with items, creator and the caller's progress. */
checklistsRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const rows = await db.select().from(checklists).where(eq(checklists.isActive, true)).orderBy(desc(checklists.createdAt));
    const ids = rows.map((c) => c.id);
    const [items, progress, creators] = await Promise.all([
      itemsForChecklists(ids),
      progressFor(me.id, ids),
      getUsersByIds(rows.flatMap((c) => (c.createdById ? [c.createdById] : []))),
    ]);
    res.json(
      rows.map((c) =>
        toClientChecklist(c, items.get(c.id) ?? [], c.createdById ? creators.get(c.createdById) : undefined, progress.get(c.id)),
      ),
    );
  }),
);

checklistsRouter.post(
  "/",
  requireInstruct,
  validate(checklistBodySchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const { items, ...rest } = req.body as ChecklistBody;
    const row = await db.transaction(async (tx) => {
      const [created] = await tx.insert(checklists).values({ ...rest, createdById: me.id }).returning();
      await tx.insert(checklistItems).values(itemRowsFromClient(created.id, items));
      return created;
    });
    await logActivity({ actor: me, action: "CREATE", resourceType: "Checklist", resourceId: row.id, resourceName: row.title, details: `${items.length} items` });
    res.status(201).json(row);
  }),
);

/** The caller's completion rows, most recently started first. Registered before /:id. */
checklistsRouter.get(
  "/completions",
  requirePersona,
  asyncHandler(async (req, res) => {
    const rows = await db
      .select()
      .from(checklistCompletions)
      .where(eq(checklistCompletions.userId, currentUser(req).id))
      .orderBy(desc(checklistCompletions.startedAt));
    const items = await itemsForChecklists(rows.map((r) => r.checklistId));
    res.json(rows.map((r) => toUserCompletion(r, items.get(r.checklistId) ?? [])));
  }),
);

checklistsRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const checklist = await getActiveChecklist(id);
    const [progress, creators] = await Promise.all([
      progressFor(me.id, [id]),
      getUsersByIds(checklist.createdById ? [checklist.createdById] : []),
    ]);
    const { items, ...row } = checklist;
    res.json(toClientChecklist(row, items, checklist.createdById ? creators.get(checklist.createdById) : undefined, progress.get(id)));
  }),
);

/** Full replace of the checklist and its items. */
checklistsRouter.put(
  "/:id",
  requireInstruct,
  validate(checklistBodySchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const { items, ...rest } = req.body as ChecklistBody;
    const row = await db.transaction(async (tx) => {
      const [updated] = await tx.update(checklists).set(rest).where(eq(checklists.id, id)).returning();
      if (!updated) throw new NotFound("Checklist");
      await tx.delete(checklistItems).where(eq(checklistItems.checklistId, id));
      await tx.insert(checklistItems).values(itemRowsFromClient(id, items));
      return updated;
    });
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Checklist", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

/** Hard delete (the management screen lists inactive checklists too); items and progress cascade. */
checklistsRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const [row] = await db.delete(checklists).where(eq(checklists.id, id)).returning();
    if (!row) throw new NotFound("Checklist");
    await logActivity({ actor: currentUser(req), action: "DELETE", resourceType: "Checklist", resourceId: id, resourceName: row.title });
    res.json({ message: "Checklist deleted successfully" });
  }),
);

/** Replace the caller's completed-item set; returns the completion in the client's shape. */
checklistsRouter.post(
  "/:id/completion",
  requirePersona,
  validate(completionSchema),
  asyncHandler(async (req, res) => {
    const checklist = await getActiveChecklist(parseId(req.params.id));
    const { completedItems } = req.body as z.infer<typeof completionSchema>;
    const row = await saveChecklistProgress(currentUser(req), checklist, completedItems);
    res.json(toUserCompletion(row, checklist.items));
  }),
);

/** Mounted at /api/instructor/checklists: every checklist (inactive too) with everyone's completions. */
export const instructorChecklistsRouter = Router();

instructorChecklistsRouter.get(
  "/",
  requireInstruct,
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(checklists).orderBy(desc(checklists.createdAt));
    const ids = rows.map((c) => c.id);
    const [items, completions] = await Promise.all([
      itemsForChecklists(ids),
      ids.length ? db.select().from(checklistCompletions).where(inArray(checklistCompletions.checklistId, ids)) : Promise.resolve([] as ChecklistCompletion[]),
    ]);
    const people = await getUsersByIds([
      ...rows.flatMap((c) => (c.createdById ? [c.createdById] : [])),
      ...completions.map((c) => c.userId),
    ]);
    const email = (userId: number | null) => (userId && people.get(userId)?.email) || "Unknown";
    res.json(
      rows.map((c) => {
        const checklistItemsInOrder = items.get(c.id) ?? [];
        return {
          ...c,
          items: toClientItems(checklistItemsInOrder),
          creator: { email: email(c.createdById) },
          completions: completions
            .filter((k) => k.checklistId === c.id)
            .map((k) => ({ ...toUserCompletion(k, checklistItemsInOrder)!, user: { email: email(k.userId) } })),
        };
      }),
    );
  }),
);
