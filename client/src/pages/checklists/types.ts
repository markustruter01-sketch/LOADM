import type { ChecklistWithItems } from "@shared/schema";

export type ChecklistProgress = { completedItemIds: number[]; isComplete: boolean; updatedAt: string };

/** GET /api/checklists row and GET /api/checklists/:id. */
export type ChecklistListItem = ChecklistWithItems & { myProgress: ChecklistProgress | null };
