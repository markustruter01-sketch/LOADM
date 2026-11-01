import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  checklists, checklistItems, checklistCompletions, checklistStepAudit,
  type ChecklistItem, type ChecklistWithItems, type ChecklistCompletion, type User,
} from "@shared/schema";
import { BadRequest, NotFound } from "../lib/errors";

/** Load a checklist with its items in order, or 404. */
export async function getChecklistWithItems(id: number): Promise<ChecklistWithItems> {
  const [row] = await db.select().from(checklists).where(eq(checklists.id, id)).limit(1);
  if (!row) throw new NotFound("Checklist");
  const items = await db
    .select()
    .from(checklistItems)
    .where(eq(checklistItems.checklistId, id))
    .orderBy(asc(checklistItems.itemOrder), asc(checklistItems.id));
  return { ...row, items };
}

/** Items for many checklists, grouped by checklist id and in order. */
export async function itemsForChecklists(checklistIds: number[]): Promise<Map<number, ChecklistItem[]>> {
  const grouped = new Map<number, ChecklistItem[]>();
  if (checklistIds.length === 0) return grouped;
  const rows = await db
    .select()
    .from(checklistItems)
    .where(inArray(checklistItems.checklistId, checklistIds))
    .orderBy(asc(checklistItems.itemOrder), asc(checklistItems.id));
  for (const r of rows) grouped.set(r.checklistId, [...(grouped.get(r.checklistId) ?? []), r]);
  return grouped;
}

/** The shape of progress attached to checklist responses. */
export interface MyProgress {
  completedItemIds: number[];
  isComplete: boolean;
  updatedAt: Date;
}

export function toMyProgress(c: ChecklistCompletion | undefined): MyProgress | null {
  return c ? { completedItemIds: c.completedItemIds, isComplete: c.isComplete, updatedAt: c.updatedAt } : null;
}

/** The current user's completion rows for many checklists, keyed by checklist id. */
export async function progressFor(userId: number, checklistIds: number[]): Promise<Map<number, ChecklistCompletion>> {
  const map = new Map<number, ChecklistCompletion>();
  if (checklistIds.length === 0) return map;
  const rows = await db
    .select()
    .from(checklistCompletions)
    .where(and(eq(checklistCompletions.userId, userId), inArray(checklistCompletions.checklistId, checklistIds)));
  for (const r of rows) map.set(r.checklistId, r);
  return map;
}

/**
 * Validate a progress update against the checklist. Returns the completed
 * ids de-duplicated and in item order. Throws 400 when an id is not an item
 * of this checklist, or when linear progression is enforced and the
 * completed ids are not a prefix of the item order.
 */
export function normaliseProgress(checklist: ChecklistWithItems, completedItemIds: number[]): number[] {
  const itemIds = new Set(checklist.items.map((i) => i.id));
  const requested = new Set(completedItemIds);
  for (const id of requested) {
    if (!itemIds.has(id)) throw new BadRequest(`Item ${id} does not belong to this checklist`);
  }
  // Order by the checklist's own item order.
  const ordered = checklist.items.filter((i) => requested.has(i.id)).map((i) => i.id);
  if (checklist.enforceLinearProgression) {
    for (let i = 0; i < ordered.length; i++) {
      if (checklist.items[i].id !== ordered[i]) {
        throw new BadRequest("This checklist must be completed in order; items cannot be skipped");
      }
    }
  }
  return ordered;
}

/** Complete when every required item is done (or every item, if none is required). */
export function isChecklistComplete(items: ChecklistItem[], completedItemIds: number[]): boolean {
  const done = new Set(completedItemIds);
  const required = items.filter((i) => i.isRequired);
  if (required.length === 0) return items.length > 0 && items.every((i) => done.has(i.id));
  return required.every((i) => done.has(i.id));
}

/**
 * Upsert the user's progress on a checklist and write a step-audit row for
 * every item that changed state. One transaction.
 */
export async function saveChecklistProgress(user: User, checklist: ChecklistWithItems, completedItemIds: number[]): Promise<ChecklistCompletion> {
  const ids = normaliseProgress(checklist, completedItemIds);
  const isComplete = isChecklistComplete(checklist.items, ids);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(checklistCompletions)
      .where(and(eq(checklistCompletions.userId, user.id), eq(checklistCompletions.checklistId, checklist.id)))
      .limit(1);

    const before = new Set(existing?.completedItemIds ?? []);
    const after = new Set(ids);
    const completedAt = isComplete ? (existing?.isComplete && existing.completedAt ? existing.completedAt : now) : null;

    let row: ChecklistCompletion;
    if (existing) {
      [row] = await tx
        .update(checklistCompletions)
        .set({ completedItemIds: ids, isComplete, completedAt, updatedAt: now })
        .where(eq(checklistCompletions.id, existing.id))
        .returning();
    } else {
      [row] = await tx
        .insert(checklistCompletions)
        .values({ checklistId: checklist.id, userId: user.id, completedItemIds: ids, isComplete, completedAt, startedAt: now, updatedAt: now })
        .returning();
    }

    const audit = [
      ...ids.filter((id) => !before.has(id)).map((id) => ({ checklistItemId: id, action: "checked" })),
      ...Array.from(before).filter((id) => !after.has(id)).map((id) => ({ checklistItemId: id, action: "unchecked" })),
    ];
    if (audit.length) {
      await tx.insert(checklistStepAudit).values(audit.map((a) => ({ ...a, completionId: row.id, userId: user.id, at: now })));
    }
    return row;
  });
}
