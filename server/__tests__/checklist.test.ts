import { describe, expect, it } from "vitest";
import { normaliseProgress, isChecklistComplete } from "../services/checklist-service";
import type { ChecklistWithItems } from "@shared/schema";

const base = {
  id: 1, title: "t", description: null, aircraftType: "C17", category: "startup" as const, isActive: true,
  createdById: null, createdAt: new Date(), updatedAt: new Date(),
};
const item = (id: number, order: number, required = true) => ({ id, checklistId: 1, itemText: `i${id}`, itemOrder: order, isRequired: required, section: null });

describe("checklist progress", () => {
  const linear: ChecklistWithItems = { ...base, enforceLinearProgression: true, items: [item(10, 1), item(11, 2), item(12, 3)] };
  const free: ChecklistWithItems = { ...base, enforceLinearProgression: false, items: [item(10, 1), item(11, 2, false)] };

  it("rejects ids from other checklists", () => {
    expect(() => normaliseProgress(free, [999])).toThrow();
  });
  it("enforces linear order when required", () => {
    expect(() => normaliseProgress(linear, [11])).toThrow();
    expect(normaliseProgress(linear, [11, 10])).toEqual([10, 11]);
  });
  it("is complete when all required items are done", () => {
    expect(isChecklistComplete(free.items, [10])).toBe(true);
    expect(isChecklistComplete(linear.items, [10, 11])).toBe(false);
  });
});
