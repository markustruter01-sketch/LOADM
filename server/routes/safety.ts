import { Router } from "express";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { safetyRecords, insertSafetyRecordSchema, type SafetyRecord, type User } from "@shared/schema";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requireInstruct, currentUser } from "../middleware/persona";
import { aircraftCompact, parseAircraft, parseSquadron, personName } from "../lib/client-format";
import { getUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";

/** Mounted at /api/safety-records. Instructors and command (workforce analytics). */
export const safetyRouter = Router();
safetyRouter.use(requireInstruct);

/**
 * What workforce-analytics.tsx sends: `aircraftType` in any client spelling
 * ("C17A", "N/A" …) and `squadron` as "33SQN". Without a squadron the
 * record takes the subject's.
 */
const safetyBodySchema = insertSafetyRecordSchema.omit({ aircraft: true }).extend({
  aircraftType: z.string().optional(),
  squadron: z.string().optional(),
});
const safetyUpdateSchema = safetyBodySchema.partial();

/** The flat row the safety table and dialogs read. */
function toClientRecord({ aircraft, user, ...row }: SafetyRecord & { user: User }) {
  return { ...row, aircraftType: aircraftCompact(aircraft), userName: personName(user), userEmail: user.email };
}

async function getClientRecord(id: number) {
  const row = await db.query.safetyRecords.findFirst({ where: eq(safetyRecords.id, id), with: { user: true } });
  if (!row) throw new NotFound("Safety record");
  return toClientRecord(row);
}

safetyRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rows = await db.query.safetyRecords.findMany({
      with: { user: true },
      orderBy: [desc(safetyRecords.date), desc(safetyRecords.id)],
    });
    res.json(rows.map(toClientRecord));
  }),
);

safetyRouter.post(
  "/",
  validate(safetyBodySchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const { aircraftType, squadron, ...rest } = req.body as z.infer<typeof safetyBodySchema>;
    const [row] = await db
      .insert(safetyRecords)
      .values({
        ...rest,
        aircraft: parseAircraft(aircraftType),
        squadron: parseSquadron(squadron) ?? (await getUser(rest.userId)).squadron,
        reportedById: me.id,
      })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "SafetyRecord", resourceId: row.id, resourceName: `${row.recordType} (${row.squadron})` });
    res.status(201).json(await getClientRecord(row.id));
  }),
);

safetyRouter.put(
  "/:id",
  validate(safetyUpdateSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const { aircraftType, squadron, ...rest } = req.body as z.infer<typeof safetyUpdateSchema>;
    const newSquadron = parseSquadron(squadron) ?? (rest.userId ? (await getUser(rest.userId)).squadron : undefined);
    const [row] = await db
      .update(safetyRecords)
      .set({
        ...rest,
        ...(aircraftType === undefined ? {} : { aircraft: parseAircraft(aircraftType) }),
        ...(newSquadron ? { squadron: newSquadron } : {}),
      })
      .where(eq(safetyRecords.id, id))
      .returning();
    if (!row) throw new NotFound("Safety record");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "SafetyRecord", resourceId: row.id, resourceName: `${row.recordType} (${row.squadron})` });
    res.json(await getClientRecord(row.id));
  }),
);

safetyRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const [row] = await db.delete(safetyRecords).where(eq(safetyRecords.id, id)).returning();
    if (!row) throw new NotFound("Safety record");
    await logActivity({ actor: currentUser(req), action: "DELETE", resourceType: "SafetyRecord", resourceId: id, resourceName: `${row.recordType} (${row.squadron})` });
    res.json({ success: true });
  }),
);
