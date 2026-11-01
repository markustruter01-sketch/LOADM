import { Router } from "express";
import type { z } from "zod";
import { eq, asc, and, ne } from "drizzle-orm";
import { db } from "../db";
import { phoneDirectory, insertPhoneDirectorySchema } from "@shared/schema";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { Conflict, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, currentUser } from "../middleware/persona";
import { logActivity } from "../services/activity-service";

/**
 * Mounted at /api/phone-directory. The documents page offers add/edit/delete
 * to every visitor, so every route only needs a persona.
 */
export const directoryRouter = Router();
directoryRouter.use(requirePersona);

/** New airbases arrive without contacts; they are added later through PATCH. */
const createDirectorySchema = insertPhoneDirectorySchema.extend({
  contacts: insertPhoneDirectorySchema.shape.contacts.default([]),
});
/** The client PATCHes the whole entry (id and timestamps are stripped). */
const updateDirectorySchema = insertPhoneDirectorySchema.partial();

async function assertCodeFree(airbaseCode: string, exceptId?: number): Promise<void> {
  const [clash] = await db
    .select({ id: phoneDirectory.id })
    .from(phoneDirectory)
    .where(exceptId ? and(eq(phoneDirectory.airbaseCode, airbaseCode), ne(phoneDirectory.id, exceptId)) : eq(phoneDirectory.airbaseCode, airbaseCode))
    .limit(1);
  if (clash) throw new Conflict(`Airbase code ${airbaseCode} already exists`);
}

directoryRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await db.select().from(phoneDirectory).orderBy(asc(phoneDirectory.airbaseName)));
  }),
);

directoryRouter.post(
  "/",
  validate(createDirectorySchema),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof createDirectorySchema>;
    await assertCodeFree(b.airbaseCode);
    const [row] = await db.insert(phoneDirectory).values(b).returning();
    await logActivity({ actor: currentUser(req), action: "CREATE", resourceType: "Directory", resourceId: row.id, resourceName: `${row.airbaseCode} ${row.airbaseName}` });
    res.status(201).json(row);
  }),
);

directoryRouter.patch(
  "/:id",
  validate(updateDirectorySchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateDirectorySchema>;
    if (b.airbaseCode !== undefined) await assertCodeFree(b.airbaseCode, id);
    const [row] = await db.update(phoneDirectory).set(b).where(eq(phoneDirectory.id, id)).returning();
    if (!row) throw new NotFound("Directory entry");
    await logActivity({ actor: currentUser(req), action: "UPDATE", resourceType: "Directory", resourceId: row.id, resourceName: `${row.airbaseCode} ${row.airbaseName}` });
    res.json(row);
  }),
);

directoryRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const [row] = await db.delete(phoneDirectory).where(eq(phoneDirectory.id, id)).returning();
    if (!row) throw new NotFound("Directory entry");
    await logActivity({ actor: currentUser(req), action: "DELETE", resourceType: "Directory", resourceId: id, resourceName: `${row.airbaseCode} ${row.airbaseName}` });
    res.json({ id });
  }),
);
