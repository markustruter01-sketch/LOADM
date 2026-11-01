import { eq, and, asc, inArray } from "drizzle-orm";
import { db } from "../db";
import { users, type User, type PublicUser } from "@shared/schema";
import { isFlyingSquadron, type Squadron, type Role } from "@shared/constants";
import { NotFound } from "../lib/errors";

export function toPublicUser(u: User): PublicUser {
  const {
    id, email, firstName, lastName, rank, role, squadron, category,
    isActive, isFlightReady, notReadyReason, readinessUpdatedAt, lastActiveAt, createdAt,
  } = u;
  return {
    id, email, firstName, lastName, rank, role, squadron, category,
    isActive, isFlightReady, notReadyReason, readinessUpdatedAt, lastActiveAt, createdAt,
  };
}

export function fullName(u: Pick<User, "firstName" | "lastName" | "rank">): string {
  return `${u.rank} ${u.firstName} ${u.lastName}`.trim();
}

export async function getUser(id: number): Promise<User> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!row) throw new NotFound("User");
  return row;
}

export async function getUsersByIds(ids: number[]): Promise<Map<number, User>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select().from(users).where(inArray(users.id, Array.from(new Set(ids))));
  return new Map(rows.map((r) => [r.id, r]));
}

export interface ListUsersFilter {
  squadron?: Squadron;
  role?: Role;
  activeOnly?: boolean;
  /** Only personnel who fly (students + loadmasters in a flying squadron). */
  aircrewOnly?: boolean;
}

export async function listUsers(filter: ListUsersFilter = {}): Promise<User[]> {
  const conds = [];
  if (filter.squadron) conds.push(eq(users.squadron, filter.squadron));
  if (filter.role) conds.push(eq(users.role, filter.role));
  if (filter.activeOnly !== false) conds.push(eq(users.isActive, true));
  if (filter.aircrewOnly) conds.push(inArray(users.role, ["student", "loadmaster"]));
  const rows = await db
    .select()
    .from(users)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(asc(users.squadron), asc(users.lastName), asc(users.firstName));
  return filter.aircrewOnly ? rows.filter((r) => isFlyingSquadron(r.squadron)) : rows;
}

/** The single definition of "personnel counted in readiness metrics". */
export async function listReadinessPersonnel(squadron?: Squadron): Promise<User[]> {
  return listUsers({ squadron, aircrewOnly: true, activeOnly: true });
}

