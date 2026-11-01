import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, type User } from "@shared/schema";
import { SQUADRONS } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { Conflict, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requireInstruct, requireCommand, currentUser } from "../middleware/persona";
import { clientRole, roleFromClient, personName } from "../lib/client-format";
import { getUser, listUsers } from "../services/user-service";
import { logActivity } from "../services/activity-service";

/**
 * The licensing screens. A licence is a user: id = user id, type = the
 * user's role, expiry = users.licenseExpiresAt, suspended = !isActive.
 */
export const licensingRouter = Router();

const DAY_MS = 86_400_000;
const SESSION_WINDOW_MS = 15 * 60_000;
const CLIENT_LICENSE_TYPES = ["loadmaster", "instructor", "leadership", "superadmin", "readonly"] as const;

/** Stable display key: LM-00042-7K (zero-padded id plus a two-character check). */
function licenseKey(id: number): string {
  const check = ((id * 7919) % 1296).toString(36).toUpperCase().padStart(2, "0");
  return `LM-${String(id).padStart(5, "0")}-${check}`;
}

function toLicense(u: User, now: number) {
  const expiry = u.licenseExpiresAt;
  const isExpired = !!expiry && expiry.getTime() < now;
  const activeSessionCount = u.lastActiveAt && now - u.lastActiveAt.getTime() <= SESSION_WINDOW_MS ? 1 : 0;
  return {
    id: u.id,
    userId: u.id,
    email: u.email,
    username: personName(u) || u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    squadron: u.squadron,
    category: u.category,
    licenseKey: licenseKey(u.id),
    licenseType: clientRole(u.role),
    isActive: u.isActive,
    status: isExpired ? "expired" : u.isActive ? "active" : "suspended",
    issuedDate: u.createdAt,
    expiryDate: expiry,
    isExpired,
    daysUntilExpiry: expiry ? Math.ceil((expiry.getTime() - now) / DAY_MS) : null,
    lastLogin: u.lastActiveAt,
    activeSessionCount,
    totalSessionCount: activeSessionCount,
    maxConcurrentSessions: 1,
    hasPassword: true,
    isFirstLogin: false,
    createdAt: u.createdAt,
  };
}

async function allLicenses() {
  const now = Date.now();
  return (await listUsers({ activeOnly: false })).map((u) => toLicense(u, now));
}

/** A user whose licence may be changed: demo personas are fixed. */
async function editableUser(id: string): Promise<User> {
  const user = await getUser(parseId(id));
  if (user.isDemoPersona) throw new Conflict("Demo personas cannot be changed or deleted");
  return user;
}

async function updateLicense(id: number, values: Partial<typeof users.$inferInsert>) {
  const [row] = await db.update(users).set(values).where(eq(users.id, id)).returning();
  if (!row) throw new NotFound("Licence");
  return toLicense(row, Date.now());
}

// Instructors read the list too (analytics "licensed students", /admin/users).
licensingRouter.get(
  "/licenses",
  requireInstruct,
  asyncHandler(async (_req, res) => {
    res.json(await allLicenses());
  }),
);

licensingRouter.get(
  "/dashboard-stats",
  requireCommand,
  asyncHandler(async (_req, res) => {
    const licenses = await allLicenses();
    const active = licenses.filter((l) => l.status === "active").length;
    res.json({
      totalLicenses: licenses.length,
      activeLicenses: active,
      expiredLicenses: licenses.filter((l) => l.status === "expired").length,
      suspendedLicenses: licenses.filter((l) => l.status === "suspended").length,
      expiringLicenses: licenses.filter((l) => l.daysUntilExpiry !== null && !l.isExpired && l.daysUntilExpiry <= 7).length,
      activeSessions: licenses.reduce((s, l) => s + l.activeSessionCount, 0),
      utilizationRate: licenses.length ? Math.round((active / licenses.length) * 100) : 0,
    });
  }),
);

const createBody = z.object({
  email: z.string().trim().email(),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).default(""),
  licenseType: z.enum(CLIENT_LICENSE_TYPES).default("loadmaster"),
  squadron: z.enum(SQUADRONS).default("AMG"),
  expiryDate: z.coerce.date(),
});

licensingRouter.post(
  "/licenses",
  requireCommand,
  validate(createBody),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof createBody>;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, b.email)).limit(1);
    if (existing) throw new Conflict("A user with this email address already exists");
    const [row] = await db
      .insert(users)
      .values({
        email: b.email,
        firstName: b.firstName,
        lastName: b.lastName,
        role: roleFromClient(b.licenseType),
        squadron: b.squadron,
        licenseExpiresAt: b.expiryDate,
      })
      .returning();
    await logActivity({ actor: currentUser(req), action: "CREATE", resourceType: "Licence", resourceId: row.id, resourceName: row.email });
    res.status(201).json(toLicense(row, Date.now()));
  }),
);

const renewBody = z.object({ expiryDate: z.coerce.date() });

licensingRouter.post(
  "/licenses/:id/renew",
  requireCommand,
  validate(renewBody),
  asyncHandler(async (req, res) => {
    const user = await editableUser(req.params.id);
    const { expiryDate } = req.body as z.infer<typeof renewBody>;
    const license = await updateLicense(user.id, { licenseExpiresAt: expiryDate, isActive: true });
    await logActivity({ actor: currentUser(req), action: "UPDATE", resourceType: "Licence", resourceId: user.id, resourceName: user.email, details: `Renewed to ${expiryDate.toISOString().slice(0, 10)}` });
    res.json(license);
  }),
);

const suspensionBody = z.object({ activate: z.boolean() });

licensingRouter.post(
  "/licenses/:id/toggle-suspension",
  requireCommand,
  validate(suspensionBody),
  asyncHandler(async (req, res) => {
    const user = await editableUser(req.params.id);
    const { activate } = req.body as z.infer<typeof suspensionBody>;
    const license = await updateLicense(user.id, { isActive: activate });
    await logActivity({ actor: currentUser(req), action: "UPDATE", resourceType: "Licence", resourceId: user.id, resourceName: user.email, details: activate ? "Activated" : "Suspended" });
    res.json(license);
  }),
);

const roleBody = z.object({ licenseType: z.enum(CLIENT_LICENSE_TYPES) });

licensingRouter.patch(
  "/licenses/:id/role",
  requireCommand,
  validate(roleBody),
  asyncHandler(async (req, res) => {
    const user = await editableUser(req.params.id);
    const { licenseType } = req.body as z.infer<typeof roleBody>;
    const license = await updateLicense(user.id, { role: roleFromClient(licenseType) });
    await logActivity({ actor: currentUser(req), action: "UPDATE", resourceType: "Licence", resourceId: user.id, resourceName: user.email, details: `Role: ${licenseType}` });
    res.json(license);
  }),
);

licensingRouter.delete(
  "/licenses/:id",
  requireCommand,
  asyncHandler(async (req, res) => {
    const user = await editableUser(req.params.id);
    await db.delete(users).where(eq(users.id, user.id));
    await logActivity({ actor: currentUser(req), action: "DELETE", resourceType: "Licence", resourceId: user.id, resourceName: user.email });
    res.json({ success: true, message: "User and licence deleted" });
  }),
);
