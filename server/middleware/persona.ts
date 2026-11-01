import type { Request, Response, NextFunction, RequestHandler } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { users, type User } from "@shared/schema";
import { ROLES, roleHas, type Role, type Capability } from "@shared/constants";
import { Unauthorized, Forbidden } from "../lib/errors";

/**
 * There is no authentication in this showcase. The visitor picks a role on
 * the sign-in screen and the choice is kept in the `demo_role` cookie. Each
 * role maps to exactly one seeded persona user (`users.isDemoPersona`),
 * which becomes `req.user`.
 */

export const DEMO_ROLE_COOKIE = "demo_role";

declare module "express-serve-static-core" {
  interface Request {
    /** The persona the visitor is acting as. Undefined until a role is chosen. */
    user?: User;
  }
}

const personaCache = new Map<Role, { user: User; at: number }>();
const CACHE_TTL_MS = 30_000;

export function invalidatePersonaCache(): void {
  personaCache.clear();
}

export async function loadPersona(role: Role): Promise<User | undefined> {
  const cached = personaCache.get(role);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.user;
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.role, role), eq(users.isDemoPersona, true)))
    .limit(1);
  if (row) personaCache.set(role, { user: row, at: Date.now() });
  return row;
}

function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

/** Attaches `req.user` when the cookie holds a valid role. Never rejects. */
export const attachPersona: RequestHandler = async (req, _res, next) => {
  try {
    const role = (req.cookies as Record<string, string> | undefined)?.[DEMO_ROLE_COOKIE];
    if (!isRole(role)) return next();
    req.user = await loadPersona(role);
    // Keep "last active" current (at most one write a minute) so activity figures are real.
    if (req.user && (!req.user.lastActiveAt || Date.now() - req.user.lastActiveAt.getTime() > 60_000)) {
      const now = new Date();
      await db.update(users).set({ lastActiveAt: now }).where(eq(users.id, req.user.id));
      req.user.lastActiveAt = now;
    }
    next();
  } catch (err) {
    next(err);
  }
};

/** Require a persona. */
export function requirePersona(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(new Unauthorized());
  next();
}

/** Require a persona whose role has the given capability. */
export function requireCapability(capability: Capability): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new Unauthorized());
    if (!roleHas(req.user.role, capability)) return next(new Forbidden());
    next();
  };
}

/** Shorthands used by the routers. */
export const requireInstruct = requireCapability("instruct");
export const requireCommand = requireCapability("command");
export const requireOperate = requireCapability("operate");

/** Current persona or throw; for use inside handlers after requirePersona. */
export function currentUser(req: Request): User {
  if (!req.user) throw new Unauthorized();
  return req.user;
}

/** Can this persona act on behalf of another user's records? */
export function canActFor(actor: User, targetUserId: number): boolean {
  return actor.id === targetUserId || roleHas(actor.role, "instruct");
}
