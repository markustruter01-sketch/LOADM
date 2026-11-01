import { Router } from "express";
import { z } from "zod";
import { eq, and, asc, desc, gte, lte, isNotNull } from "drizzle-orm";
import { db } from "../db";
import {
  users, userQualifications, flightRecords, safetyRecords,
  insertUserQualificationSchema, insertFlightRecordSchema, insertSafetyRecordSchema,
} from "@shared/schema";
import { SQUADRONS, SAFETY_STATUSES, SAFETY_RECORD_TYPES } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, parseOptionalInt } from "../lib/ids";
import { BadRequest, Forbidden, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, requireOperate, currentUser, canActFor } from "../middleware/persona";
import { toPublicUser, fullName } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import {
  withQualificationStatus, qualificationStatus, daysRemaining, resolveTargetUser, flightSummaryForUser, buildRoster, squadronOfUser,
} from "../services/personnel-service";

export const personnelRouter = Router();

const DAY_MS = 86_400_000;

const userIdQuery = z.object({ userId: z.coerce.number().int().positive().optional() });
const optionalUserId = z.object({ userId: z.number().int().positive().optional() });

// =========================================================================
// Qualifications
// =========================================================================

const qualificationBody = insertUserQualificationSchema.merge(optionalUserId);
const updateQualificationSchema = insertUserQualificationSchema.partial();

/** Qualifications for the current user (instructors may pass `?userId=`), with status. */
personnelRouter.get(
  "/qualifications",
  requirePersona,
  validate(userIdQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof userIdQuery>;
    const target = await resolveTargetUser(me, q.userId);
    const rows = await db
      .select()
      .from(userQualifications)
      .where(eq(userQualifications.userId, target.id))
      .orderBy(asc(userQualifications.expiryDate), asc(userQualifications.name));
    const now = Date.now();
    res.json(rows.map((r) => withQualificationStatus(r, now)));
  }),
);

const expiringQuery = z.object({
  squadron: z.enum(SQUADRONS).optional(),
  days: z.coerce.number().int().min(1).max(3650).default(90),
});

/**
 * Qualifications that are expired or expire within `days` (default 90),
 * across active personnel. Sorted by expiry ascending, so expired first.
 * Registered before `/qualifications/:id` so it is not shadowed.
 */
personnelRouter.get(
  "/qualifications/expiring",
  requireInstruct,
  validate(expiringQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof expiringQuery>;
    const now = Date.now();
    const until = new Date(now + q.days * DAY_MS);
    const conds = [isNotNull(userQualifications.expiryDate), lte(userQualifications.expiryDate, until), eq(users.isActive, true)];
    if (q.squadron) conds.push(eq(users.squadron, q.squadron));
    const rows = await db
      .select({ qualification: userQualifications, user: users })
      .from(userQualifications)
      .innerJoin(users, eq(users.id, userQualifications.userId))
      .where(and(...conds))
      .orderBy(asc(userQualifications.expiryDate), asc(users.lastName));
    res.json(
      rows.map((r) => ({
        qualification: r.qualification,
        user: toPublicUser(r.user),
        daysRemaining: daysRemaining(r.qualification.expiryDate, now),
        status: qualificationStatus(r.qualification.expiryDate, now),
      })),
    );
  }),
);

/** Add a qualification for self; instructors may pass `userId` for anyone. */
personnelRouter.post(
  "/qualifications",
  requirePersona,
  validate(qualificationBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const { userId, ...b } = req.body as z.infer<typeof qualificationBody>;
    const target = await resolveTargetUser(me, userId);
    const [row] = await db
      .insert(userQualifications)
      .values({ userId: target.id, name: b.name, startDate: b.startDate, expiryDate: b.expiryDate ?? null })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Qualification", resourceId: row.id, resourceName: row.name, details: `For ${fullName(target)}` });
    res.status(201).json(withQualificationStatus(row));
  }),
);

personnelRouter.put(
  "/qualifications/:id",
  requirePersona,
  validate(updateQualificationSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateQualificationSchema>;
    if (Object.keys(b).length === 0) throw new BadRequest("Nothing to update");
    const [existing] = await db.select().from(userQualifications).where(eq(userQualifications.id, id)).limit(1);
    if (!existing) throw new NotFound("Qualification");
    if (!canActFor(me, existing.userId)) throw new Forbidden();
    const [row] = await db.update(userQualifications).set(b).where(eq(userQualifications.id, id)).returning();
    if (!row) throw new NotFound("Qualification");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Qualification", resourceId: row.id, resourceName: row.name });
    res.json(withQualificationStatus(row));
  }),
);

personnelRouter.delete(
  "/qualifications/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [existing] = await db.select().from(userQualifications).where(eq(userQualifications.id, id)).limit(1);
    if (!existing) throw new NotFound("Qualification");
    if (!canActFor(me, existing.userId)) throw new Forbidden();
    const deleted = await db.delete(userQualifications).where(eq(userQualifications.id, id)).returning({ id: userQualifications.id });
    if (deleted.length === 0) throw new NotFound("Qualification");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Qualification", resourceId: id, resourceName: existing.name });
    res.json({ id });
  }),
);

// =========================================================================
// Flight records
// =========================================================================

const flightListQuery = userIdQuery.extend({ limit: z.string().optional() });
const flightRecordBody = insertFlightRecordSchema.merge(optionalUserId);
const updateFlightRecordSchema = insertFlightRecordSchema.partial();

/** Flight records for the current user (instructors may pass `?userId=`), newest first. */
personnelRouter.get(
  "/flight-records",
  requirePersona,
  validate(flightListQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof flightListQuery>;
    const target = await resolveTargetUser(me, q.userId);
    const rows = await db
      .select()
      .from(flightRecords)
      .where(eq(flightRecords.userId, target.id))
      .orderBy(desc(flightRecords.date), desc(flightRecords.id))
      .limit(parseOptionalInt(q.limit, 500, { min: 1, max: 1000 }));
    res.json(rows);
  }),
);

/**
 * Totals, per-aircraft and last-12-month breakdown for one person.
 * Registered before `/flight-records/:id` so it is not shadowed.
 */
personnelRouter.get(
  "/flight-records/summary",
  requirePersona,
  validate(userIdQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof userIdQuery>;
    const target = await resolveTargetUser(me, q.userId);
    res.json(await flightSummaryForUser(target.id));
  }),
);

/** Log a sortie for self; instructors may pass `userId`. Loadmaster and above. */
personnelRouter.post(
  "/flight-records",
  requireOperate,
  validate(flightRecordBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const { userId, ...b } = req.body as z.infer<typeof flightRecordBody>;
    const target = await resolveTargetUser(me, userId);
    const [row] = await db
      .insert(flightRecords)
      .values({ ...b, userId: target.id })
      .returning();
    await logActivity({
      actor: me,
      action: "CREATE",
      resourceType: "FlightRecord",
      resourceId: row.id,
      resourceName: `${row.aircraft} ${row.departure}-${row.arrival}`,
      details: `For ${fullName(target)}`,
    });
    res.status(201).json(row);
  }),
);

personnelRouter.put(
  "/flight-records/:id",
  requirePersona,
  validate(updateFlightRecordSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof updateFlightRecordSchema>;
    if (Object.keys(b).length === 0) throw new BadRequest("Nothing to update");
    const [existing] = await db.select().from(flightRecords).where(eq(flightRecords.id, id)).limit(1);
    if (!existing) throw new NotFound("Flight record");
    if (!canActFor(me, existing.userId)) throw new Forbidden();
    const [row] = await db.update(flightRecords).set(b).where(eq(flightRecords.id, id)).returning();
    if (!row) throw new NotFound("Flight record");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "FlightRecord", resourceId: row.id, resourceName: `${row.aircraft} ${row.departure}-${row.arrival}` });
    res.json(row);
  }),
);

personnelRouter.delete(
  "/flight-records/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const [existing] = await db.select().from(flightRecords).where(eq(flightRecords.id, id)).limit(1);
    if (!existing) throw new NotFound("Flight record");
    if (!canActFor(me, existing.userId)) throw new Forbidden();
    const deleted = await db.delete(flightRecords).where(eq(flightRecords.id, id)).returning({ id: flightRecords.id });
    if (deleted.length === 0) throw new NotFound("Flight record");
    await logActivity({ actor: me, action: "DELETE", resourceType: "FlightRecord", resourceId: id, resourceName: `${existing.aircraft} ${existing.departure}-${existing.arrival}` });
    res.json({ id });
  }),
);

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

// =========================================================================
// Readiness roster
// =========================================================================

const rosterQuery = z.object({ squadron: z.enum(SQUADRONS).optional() });

/** Every active aircrew member with readiness, qualification and performance flags. */
personnelRouter.get(
  "/roster",
  requireInstruct,
  validate(rosterQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof rosterQuery>;
    res.json(await buildRoster(q.squadron));
  }),
);
