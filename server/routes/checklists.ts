import { Router } from "express";
import { z } from "zod";
import { eq, desc, asc } from "drizzle-orm";
import { db } from "../db";
import {
  checklists, checklistItems, checklistCompletions,
  insertChecklistSchema, updateChecklistProgressSchema,
} from "@shared/schema";
import { roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { getUsersByIds, toPublicUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import {
  getChecklistWithItems, itemsForChecklists, progressFor, toMyProgress, saveChecklistProgress,
} from "../services/checklist-service";

export const checklistsRouter = Router();

// ---- Listing -------------------------------------------------------------

const listQuery = z.object({
  includeInactive: z.coerce.boolean().optional(),
});

/** Active checklists with their items and the caller's progress. */
checklistsRouter.get(
  "/",
  requirePersona,
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof listQuery>;
    const showAll = roleHas(me.role, "instruct") && !!q.includeInactive;
    const rows = await db
      .select()
      .from(checklists)
      .where(showAll ? undefined : eq(checklists.isActive, true))
      .orderBy(asc(checklists.aircraftType), asc(checklists.category), asc(checklists.title));
    const ids = rows.map((c) => c.id);
    const [items, progress] = await Promise.all([itemsForChecklists(ids), progressFor(me.id, ids)]);
    res.json(rows.map((c) => ({ ...c, items: items.get(c.id) ?? [], myProgress: toMyProgress(progress.get(c.id)) })));
  }),
);

/** Create a checklist and its items in one transaction. */
checklistsRouter.post(
  "/",
  requireInstruct,
  validate(insertChecklistSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertChecklistSchema>;
    const { items, ...rest } = b;
    const created = await db.transaction(async (tx) => {
      const [row] = await tx.insert(checklists).values({ ...rest, createdById: me.id }).returning();
      const itemRows = await tx
        .insert(checklistItems)
        .values(items.map((it, idx) => ({ checklistId: row.id, itemText: it.itemText, itemOrder: idx + 1, isRequired: it.isRequired ?? true, section: it.section ?? null })))
        .returning();
      return { ...row, items: itemRows };
    });
    await logActivity({ actor: me, action: "CREATE", resourceType: "Checklist", resourceId: created.id, resourceName: created.title, details: `${created.items.length} items` });
    res.status(201).json({ ...created, myProgress: null });
  }),
);

// ---- Completions (static path registered BEFORE /:id so "completions" is never parsed as an id) ----

/** The current user's progress across checklists, most recently touched first. */
checklistsRouter.get(
  "/completions/mine",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const limit = parseOptionalInt(req.query.limit, 200, { min: 1, max: 500 });
    const rows = await db
      .select({
        completion: checklistCompletions,
        checklist: { id: checklists.id, title: checklists.title, aircraftType: checklists.aircraftType, category: checklists.category },
      })
      .from(checklistCompletions)
      .innerJoin(checklists, eq(checklists.id, checklistCompletions.checklistId))
      .where(eq(checklistCompletions.userId, me.id))
      .orderBy(desc(checklistCompletions.updatedAt))
      .limit(limit);
    res.json(rows.map((r) => ({ ...r.completion, checklist: r.checklist })));
  }),
);

// ---- Single checklist ----------------------------------------------------

checklistsRouter.get(
  "/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const checklist = await getChecklistWithItems(id);
    if (!checklist.isActive && !roleHas(me.role, "instruct")) throw new NotFound("Checklist");
    const progress = await progressFor(me.id, [id]);
    res.json({ ...checklist, myProgress: toMyProgress(progress.get(id)) });
  }),
);

const updateChecklistSchema = insertChecklistSchema.partial();

/** Update a checklist; when `items` is given, every item is replaced in one transaction. */
checklistsRouter.put(
  "/:id",
  requireInstruct,
  validate(updateChecklistSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateChecklistSchema>;
    const { items, ...rest } = b;
    const updated = await db.transaction(async (tx) => {
      // An items-only update has nothing to set on the parent row.
      const [row] = Object.keys(rest).length
        ? await tx.update(checklists).set(rest).where(eq(checklists.id, id)).returning()
        : await tx.select().from(checklists).where(eq(checklists.id, id)).limit(1);
      if (!row) throw new NotFound("Checklist");
      if (items) {
        await tx.delete(checklistItems).where(eq(checklistItems.checklistId, id));
        const itemRows = await tx
          .insert(checklistItems)
          .values(items.map((it, idx) => ({ checklistId: id, itemText: it.itemText, itemOrder: idx + 1, isRequired: it.isRequired ?? true, section: it.section ?? null })))
          .returning();
        return { ...row, items: itemRows };
      }
      const itemRows = await tx
        .select()
        .from(checklistItems)
        .where(eq(checklistItems.checklistId, id))
        .orderBy(asc(checklistItems.itemOrder), asc(checklistItems.id));
      return { ...row, items: itemRows };
    });
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Checklist", resourceId: updated.id, resourceName: updated.title, details: items ? "Items replaced" : undefined });
    res.json(updated);
  }),
);

/** Soft delete: progress and audit history are preserved. */
checklistsRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.update(checklists).set({ isActive: false }).where(eq(checklists.id, id)).returning();
    if (!row) throw new NotFound("Checklist");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Checklist", resourceId: row.id, resourceName: row.title });
    res.json(row);
  }),
);

// ---- Progress ------------------------------------------------------------

/** Replace the caller's completed-item set for a checklist. */
checklistsRouter.put(
  "/:id/progress",
  requirePersona,
  validate(updateChecklistProgressSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateChecklistProgressSchema>;
    const checklist = await getChecklistWithItems(id);
    if (!checklist.isActive && !roleHas(me.role, "instruct")) throw new NotFound("Checklist");
    const completion = await saveChecklistProgress(me, checklist, b.completedItemIds);
    res.json(completion);
  }),
);

/** Every user's progress on one checklist. */
checklistsRouter.get(
  "/:id/completions",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const [exists] = await db.select({ id: checklists.id }).from(checklists).where(eq(checklists.id, id)).limit(1);
    if (!exists) throw new NotFound("Checklist");
    const rows = await db
      .select()
      .from(checklistCompletions)
      .where(eq(checklistCompletions.checklistId, id))
      .orderBy(desc(checklistCompletions.updatedAt));
    const people = await getUsersByIds(rows.map((r) => r.userId));
    res.json(
      rows.map((r) => {
        const u = people.get(r.userId);
        return { ...r, user: u ? toPublicUser(u) : null };
      }),
    );
  }),
);
