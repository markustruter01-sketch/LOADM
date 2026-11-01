import type { FormField } from "@shared/schema";

/** Human-readable rendering of one submitted form value. */
export function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

/** Pairs of (label, value) in template order; unknown keys are appended. */
export function labelledEntries(formData: Record<string, unknown>, fields?: FormField[]): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const seen = new Set<string>();
  for (const f of fields ?? []) {
    seen.add(f.id);
    out.push([f.label, formatFieldValue(formData[f.id])]);
  }
  for (const [k, v] of Object.entries(formData)) {
    if (!seen.has(k)) out.push([k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()), formatFieldValue(v)]);
  }
  return out;
}
