import { z } from "zod";
import { BadRequest } from "./errors";

/** Parse a positive integer route/query parameter or throw 400. */
export function parseId(value: unknown, name = "id"): number {
  const n = typeof value === "string" ? Number(value) : NaN;
  if (!Number.isInteger(n) || n <= 0) throw new BadRequest(`Invalid ${name}`);
  return n;
}

export function parseOptionalInt(value: unknown, fallback: number, { min = 1, max = 10_000 } = {}): number {
  if (value === undefined || value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

/**
 * Zod schema for boolean query flags. `z.coerce.boolean()` treats any
 * non-empty string (including "false" and "0") as true, so parse explicitly.
 */
export const queryFlag = z
  .union([z.boolean(), z.string()])
  .transform((v) => v === true || v === "true" || v === "1")
  .optional();
