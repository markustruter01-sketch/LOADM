import { Router } from "express";
import { z } from "zod";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { safetyRecords, insertSafetyRecordSchema } from "@shared/schema";
import { SQUADRONS, SAFETY_STATUSES, SAFETY_RECORD_TYPES } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt } from "../lib/ids";
import { BadRequest, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requireInstruct, currentUser } from "../middleware/persona";
import { toPublicUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import { squadronOfUser } from "../services/personnel-service";

/** Safety records only; the ops area replaces these with /api/safety-records. */
export const personnelRouter = Router();

// =========================================================================
// Safety records (instructors and command only)
// =========================================================================

const safetyListQuery = z.object({
  squadron: z.enum(SQUADRONS).optional(),
  status: z.enum(SAFETY_STATUSES).optional(),
  recordType: z.enum(SAFETY_RECORD_TYPES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.string().optional(),
});
const updateSafetyRecordSchema = insertSafetyRecordSchema.partial();

/** One safety record with its subject and reporter attached. */
async function getSafetyRecordWithPeople(id: number) {
  const row = await db.query.safetyRecords.findFirst({
    where: eq(safetyRecords.id, id),
    with: { user: true, reportedBy: true },
  });
  if (!row) throw new NotFound("Safety record");
  return { ...row, user: toPublicUser(row.user), reportedBy: row.reportedBy ? toPublicUser(row.reportedBy) : null };
}

personnelRouter.get(
  "/safety-records",
  requireInstruct,
  validate(safetyListQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof safetyListQuery>;
    const conds = [];
    if (q.squadron) conds.push(eq(safetyRecords.squadron, q.squadron));
    if (q.status) conds.push(eq(safetyRecords.status, q.status));
    if (q.recordType) conds.push(eq(safetyRecords.recordType, q.recordType));
    if (q.from) conds.push(gte(safetyRecords.date, q.from));
    if (q.to) conds.push(lte(safetyRecords.date, q.to));
    const rows = await db.query.safetyRecords.findMany({
      where: conds.length ? and(...conds) : undefined,
      with: { user: true, reportedBy: true },
      orderBy: [desc(safetyRecords.date), desc(safetyRecords.id)],
      limit: parseOptionalInt(q.limit, 500, { min: 1, max: 1000 }),
    });
    res.json(rows.map((r) => ({ ...r, user: toPublicUser(r.user), reportedBy: r.reportedBy ? toPublicUser(r.reportedBy) : null })));
  }),
);

/** File a safety record. Squadron comes from the subject; reporter is the current persona. */
personnelRouter.post(
  "/safety-records",
  requireInstruct,
  validate(insertSafetyRecordSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertSafetyRecordSchema>;
    const squadron = await squadronOfUser(b.userId);
    const [row] = await db
      .insert(safetyRecords)
      .values({ ...b, squadron, reportedById: me.id })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "SafetyRecord", resourceId: row.id, resourceName: `${row.recordType} (${row.squadron})` });
    res.status(201).json(await getSafetyRecordWithPeople(row.id));
  }),
);

personnelRouter.get(
  "/safety-records/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    res.json(await getSafetyRecordWithPeople(parseId(req.params.id)));
  }),
);

personnelRouter.put(
  "/safety-records/:id",
  requireInstruct,
  validate(updateSafetyRecordSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateSafetyRecordSchema>;
    if (Object.keys(b).length === 0) throw new BadRequest("Nothing to update");
    // A new subject moves the record to that person's squadron.
    const squadron = b.userId !== undefined ? await squadronOfUser(b.userId) : undefined;
    const [row] = await db
      .update(safetyRecords)
      .set(squadron ? { ...b, squadron } : b)
      .where(eq(safetyRecords.id, id))
      .returning();
    if (!row) throw new NotFound("Safety record");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "SafetyRecord", resourceId: row.id, resourceName: `${row.recordType} (${row.squadron})` });
    res.json(await getSafetyRecordWithPeople(row.id));
  }),
);

personnelRouter.delete(
  "/safety-records/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [row] = await db.delete(safetyRecords).where(eq(safetyRecords.id, id)).returning();
    if (!row) throw new NotFound("Safety record");
    await logActivity({ actor: me, action: "DELETE", resourceType: "SafetyRecord", resourceId: id, resourceName: `${row.recordType} (${row.squadron})` });
    res.json({ id });
  }),
);
