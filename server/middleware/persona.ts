import type { Request, Response, NextFunction, RequestHandler } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { users, type User } from "@shared/schema";
import { ROLES, roleHas, type Role, type Capability } from "@shared/constants";
import { Unauthorized, Forbidden } from "../lib/errors";

/**
 * There is no authentication in this showcase. A visitor chooses a role on
 * first load; the client stores it in the `demo_role` cookie and also sends
 * it as the `X-Demo-Role` header (the header wins, so a role can be switched
 * per request if needed). Each role maps to exactly one seeded persona user
 * (`users.isDemoPersona = true`), which becomes `req.user`.
 */

export const DEMO_ROLE_COOKIE = "demo_role";
export const DEMO_ROLE_HEADER = "x-demo-role";

declare module "express-serve-static-core" {
  interface Request {
    /** The persona the visitor is acting as. Undefined until a role is chosen. */
    user?: User;
    /** The role string that was requested, if any (even if no persona row exists yet). */
    requestedRole?: Role;
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

/** Attaches `req.user` when a valid role is presented. Never rejects. */
export const attachPersona: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.get(DEMO_ROLE_HEADER);
    const cookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[DEMO_ROLE_COOKIE];
    const role = isRole(header) ? header : isRole(cookie) ? cookie : undefined;
    if (!role) return next();
    req.requestedRole = role;
    req.user = await loadPersona(role);
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
