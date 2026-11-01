import { Router } from "express";
import type { z } from "zod";
import { eq, asc, and, ne } from "drizzle-orm";
import { db } from "../db";
import { phoneDirectory, insertPhoneDirectorySchema } from "@shared/schema";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { BadRequest, Conflict, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser } from "../middleware/persona";
import { logActivity } from "../services/activity-service";

export const directoryRouter = Router();

const updateDirectorySchema = insertPhoneDirectorySchema.partial();

/** Airbase phone directory, sorted by airbase name. */
directoryRouter.get(
  "/",
  requirePersona,
  asyncHandler(async (_req, res) => {
    res.json(await db.select().from(phoneDirectory).orderBy(asc(phoneDirectory.airbaseName)));
  }),
);

directoryRouter.post(
  "/",
  requireInstruct,
  validate(insertPhoneDirectorySchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertPhoneDirectorySchema>;
    const [existing] = await db
      .select({ id: phoneDirectory.id })
      .from(phoneDirectory)
      .where(eq(phoneDirectory.airbaseCode, b.airbaseCode))
      .limit(1);
    if (existing) throw new Conflict(`Airbase code ${b.airbaseCode} already exists`);
    const [row] = await db.insert(phoneDirectory).values(b).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Directory", resourceId: row.id, resourceName: `${row.airbaseCode} ${row.airbaseName}` });
    res.status(201).json(row);
  }),
);

directoryRouter.put(
  "/:id",
  requireInstruct,
  validate(updateDirectorySchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateDirectorySchema>;
    if (Object.keys(b).length === 0) throw new BadRequest("Nothing to update");
    if (b.airbaseCode !== undefined) {
      const [clash] = await db
        .select({ id: phoneDirectory.id })
        .from(phoneDirectory)
        .where(and(eq(phoneDirectory.airbaseCode, b.airbaseCode), ne(phoneDirectory.id, id)))
        .limit(1);
      if (clash) throw new Conflict(`Airbase code ${b.airbaseCode} already exists`);
    }
    const [row] = await db.update(phoneDirectory).set(b).where(eq(phoneDirectory.id, id)).returning();
    if (!row) throw new NotFound("Directory entry");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Directory", resourceId: row.id, resourceName: `${row.airbaseCode} ${row.airbaseName}` });
    res.json(row);
  }),
);

directoryRouter.delete(
  "/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.delete(phoneDirectory).where(eq(phoneDirectory.id, id)).returning();
    if (!row) throw new NotFound("Directory entry");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Directory", resourceId: id, resourceName: `${row.airbaseCode} ${row.airbaseName}` });
    res.json({ id });
  }),
);
