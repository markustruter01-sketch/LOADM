import type { User } from "@shared/schema";
import {
  AIRCRAFT_TYPES,
  FLYING_SQUADRONS,
  type AircraftType,
  type FlyingSquadron,
  type Role,
} from "@shared/constants";

/**
 * The front end predates the four demo personas and speaks its own
 * vocabulary for roles, squadrons and aircraft. These helpers are the one
 * place that translates between the database values and the client's.
 */

/** Role string the client gates on (auth-routes.tsx, permissions.ts). */
export type ClientRole = "loadmaster" | "instructor" | "superadmin";

export function clientRole(role: Role): ClientRole {
  if (role === "command") return "superadmin";
  if (role === "instructor") return "instructor";
  return "loadmaster";
}

/** Inverse of clientRole, for screens that assign a licence type. */
export function roleFromClient(licenseType: string): Role {
  if (licenseType === "superadmin" || licenseType === "leadership") return "command";
  if (licenseType === "instructor") return "instructor";
  return "loadmaster";
}

/** Accepts "33", "33SQN" or "33 Squadron". Returns undefined for "", "ALL" or anything else. */
export function parseSquadron(value: unknown): FlyingSquadron | undefined {
  if (typeof value !== "string") return undefined;
  const digits = value.match(/\d{2}/)?.[0];
  const sqn = digits ? `${digits}SQN` : "";
  return (FLYING_SQUADRONS as readonly string[]).includes(sqn) ? (sqn as FlyingSquadron) : undefined;
}

/** Squadron without the suffix ("33SQN" → "33"), as some screens expect. */
export function squadronNumber(squadron: string): string {
  return squadron.replace("SQN", "");
}

/** Accepts any spelling the client uses (C-17A, C17A, c17, C-130, c130, KC30A …). Null for "all", "N/A", "". */
export function parseAircraft(value: unknown): AircraftType | null {
  if (typeof value !== "string") return null;
  const v = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (v.startsWith("C17")) return "C17";
  if (v.startsWith("C130")) return "C130J";
  if (v.startsWith("C27")) return "C27J";
  if (v.startsWith("KC30")) return "KC30A";
  return (AIRCRAFT_TYPES as readonly string[]).includes(v) ? (v as AircraftType) : null;
}

/** Lowercase slug used by the training screens: c17, c130, c27j, kc30a, or "all". */
export function aircraftSlug(a: AircraftType | null): string {
  if (!a) return "all";
  return { C17: "c17", C130J: "c130", C27J: "c27j", KC30A: "kc30a" }[a];
}

/** Code used by flight records and the profile: C-17A, C-130J, C-27J, KC30A. */
export function aircraftDashed(a: AircraftType | null): string {
  if (!a) return "N/A";
  return { C17: "C-17A", C130J: "C-130J", C27J: "C-27J", KC30A: "KC30A" }[a];
}

/** Code used by safety records and flight-hour analytics: C17A, C130J, C27J, KC30A. */
export function aircraftCompact(a: AircraftType | null): string {
  if (!a) return "N/A";
  return a === "C17" ? "C17A" : a;
}

export function personName(u: Pick<User, "firstName" | "lastName">): string {
  return `${u.firstName} ${u.lastName}`.trim();
}

/** "45 minutes" → 45; numbers pass through; anything unparsable → fallback. */
export function parseMinutes(value: unknown, fallback = 30): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value);
  const n = typeof value === "string" ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** The user object the client's auth context stores (auth-context.tsx). */
export function sessionUser(u: User) {
  const role = clientRole(u.role);
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    name: personName(u),
    rank: u.rank,
    role,
    userRole: role,
    licenseType: role,
    demoRole: u.role,
    squadron: u.squadron,
    category: u.category,
    isFirstLogin: false,
    hasCompletedOnboarding: true,
  };
}
