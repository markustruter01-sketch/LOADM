import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  checklists, checklistItems, checklistCompletions, checklistStepAudit,
  type Checklist, type ChecklistItem, type ChecklistWithItems, type ChecklistCompletion, type User,
} from "@shared/schema";
import { BadRequest, NotFound } from "../lib/errors";

/** An active checklist with its items in order, or 404. */
export async function getActiveChecklist(id: number): Promise<ChecklistWithItems> {
  const [row] = await db.select().from(checklists).where(and(eq(checklists.id, id), eq(checklists.isActive, true))).limit(1);
  if (!row) throw new NotFound("Checklist");
  return { ...row, items: (await itemsForChecklists([id])).get(id) ?? [] };
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

/** The user's completion rows for many checklists, keyed by checklist id. */
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

/** Items as the client reads them: the item's section is its `category`. */
export function toClientItems(items: ChecklistItem[]) {
  return items.map(({ section, ...item }) => ({ ...item, category: section }));
}

/** Rows for checklist_items from the management form's items (order = position). */
export function itemRowsFromClient(checklistId: number, items: { itemText: string; isRequired?: boolean; category?: string }[]) {
  return items.map((it, idx) => ({
    checklistId,
    itemText: it.itemText,
    itemOrder: idx + 1,
    isRequired: it.isRequired ?? true,
    section: it.category || null,
  }));
}

/** Done when every item is checked (the original rule; "Complete" checks them all). */
function allDone(items: ChecklistItem[], doneIds: Set<number>): boolean {
  return items.length > 0 && items.every((i) => doneIds.has(i.id));
}

/**
 * A completion row in the client's shape. Counts are taken against the
 * checklist's current items, so ids left over from replaced items never count.
 */
export function toUserCompletion(c: ChecklistCompletion | undefined, items: ChecklistItem[]) {
  if (!c) return null;
  const done = new Set(c.completedItemIds);
  const completedItems = items.filter((i) => done.has(i.id)).map((i) => i.id);
  return {
    id: c.id,
    checklistId: c.checklistId,
    userId: c.userId,
    completedItems,
    completionStatus: allDone(items, done) ? ("completed" as const) : ("in_progress" as const),
    completedCount: completedItems.length,
    totalItems: items.length,
    startedAt: c.startedAt,
    completedAt: c.completedAt,
  };
}

/** A checklist in the client's shape, for the caller. */
export function toClientChecklist(c: Checklist, items: ChecklistItem[], creator: User | undefined, completion: ChecklistCompletion | undefined) {
  return {
    ...c,
    items: toClientItems(items),
    creator: { email: creator?.email ?? "Unknown" },
    userCompletion: toUserCompletion(completion, items),
  };
}

/**
 * Validate a progress update: ids must be items of this checklist, and with
 * linear progression they must be a prefix of the item order. Returns the ids
 * de-duplicated and in item order.
 */
function normaliseProgress(checklist: ChecklistWithItems, completedItemIds: number[]): number[] {
  const itemIds = new Set(checklist.items.map((i) => i.id));
  const requested = new Set(completedItemIds);
  for (const id of requested) {
    if (!itemIds.has(id)) throw new BadRequest(`Item ${id} does not belong to this checklist`);
  }
  const ordered = checklist.items.filter((i) => requested.has(i.id)).map((i) => i.id);
  if (checklist.enforceLinearProgression && ordered.some((id, i) => checklist.items[i].id !== id)) {
    throw new BadRequest("This checklist must be completed in order; items cannot be skipped");
  }
  return ordered;
}

/**
 * Upsert the user's progress on a checklist and write a step-audit row for
 * every item that changed state. One transaction.
 */
export async function saveChecklistProgress(user: User, checklist: ChecklistWithItems, completedItemIds: number[]): Promise<ChecklistCompletion> {
  const ids = normaliseProgress(checklist, completedItemIds);
  const isComplete = allDone(checklist.items, new Set(ids));
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

    const [row] = existing
      ? await tx
          .update(checklistCompletions)
          .set({ completedItemIds: ids, isComplete, completedAt, updatedAt: now })
          .where(eq(checklistCompletions.id, existing.id))
          .returning()
      : await tx
          .insert(checklistCompletions)
          .values({ checklistId: checklist.id, userId: user.id, completedItemIds: ids, isComplete, completedAt, startedAt: now, updatedAt: now })
          .returning();

    const audit = [
      ...ids.filter((id) => !before.has(id)).map((id) => ({ checklistItemId: id, action: "checked" })),
      // Only current items: ids left over from replaced items no longer exist to reference.
      ...checklist.items.filter((i) => before.has(i.id) && !after.has(i.id)).map((i) => ({ checklistItemId: i.id, action: "unchecked" })),
    ];
    if (audit.length) {
      await tx.insert(checklistStepAudit).values(audit.map((a) => ({ ...a, completionId: row.id, userId: user.id, at: now })));
    }
    return row;
  });
}
