import { Router, type Request } from "express";
import { z } from "zod";
import { eq, asc, and } from "drizzle-orm";
import { db } from "../db";
import { missions, missionDocuments, insertMissionSchema, insertMissionDocumentSchema, type Mission } from "@shared/schema";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { Forbidden, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, currentUser, canActFor } from "../middleware/persona";
import { logActivity } from "../services/activity-service";

/**
 * Mounted at /api/missions. Every persona sees every mission (as the original
 * did); only the owner or an instructor/command may change one.
 */
export const missionsRouter = Router();
missionsRouter.use(requirePersona);

/** Load a mission the caller may act on (owner or instructor), or 404/403. */
async function requireOwnedMission(req: Request, id: number): Promise<Mission> {
  const [row] = await db.select().from(missions).where(eq(missions.id, id)).limit(1);
  if (!row) throw new NotFound("Mission");
  if (!canActFor(currentUser(req), row.userId)) throw new Forbidden();
  return row;
}

missionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await db.select().from(missions).orderBy(asc(missions.createdAt), asc(missions.id)));
  }),
);

missionsRouter.post(
  "/",
  validate(insertMissionSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertMissionSchema>;
    const [row] = await db.insert(missions).values({ ...b, userId: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Mission", resourceId: row.id, resourceName: row.missionName });
    res.status(201).json(row);
  }),
);

const patchMissionSchema = insertMissionSchema.partial().extend({ isCompleted: z.boolean().optional() });

/** Edit or mark done. Marking done stamps `completedAt`; an edit without `isCompleted` keeps the status. */
missionsRouter.patch(
  "/:id",
  validate(patchMissionSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const { isCompleted, ...rest } = req.body as z.infer<typeof patchMissionSchema>;
    const existing = await requireOwnedMission(req, id);
    const completion =
      isCompleted === undefined ? {} : { isCompleted, completedAt: isCompleted ? (existing.completedAt ?? new Date()) : null };
    const [row] = await db.update(missions).set({ ...rest, ...completion }).where(eq(missions.id, id)).returning();
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Mission", resourceId: row.id, resourceName: row.missionName, details: isCompleted ? "Marked complete" : undefined });
    res.json(row);
  }),
);

/** Hard delete; attached documents cascade. */
missionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const mission = await requireOwnedMission(req, id);
    await db.delete(missions).where(eq(missions.id, id));
    await logActivity({ actor: currentUser(req), action: "DELETE", resourceType: "Mission", resourceId: id, resourceName: mission.missionName, details: `Aircraft: ${mission.aircraftCallSign}` });
    res.status(204).end();
  }),
);

// ---- Mission documents ---------------------------------------------------

missionsRouter.get(
  "/:id/documents",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    res.json(
      await db
        .select()
        .from(missionDocuments)
        .where(eq(missionDocuments.missionId, id))
        .orderBy(asc(missionDocuments.addedAt), asc(missionDocuments.id)),
    );
  }),
);

missionsRouter.post(
  "/:id/documents",
  validate(insertMissionDocumentSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof insertMissionDocumentSchema>;
    const mission = await requireOwnedMission(req, id);
    const [row] = await db.insert(missionDocuments).values({ ...b, missionId: id, addedById: me.id }).returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "MissionDocument", resourceId: row.id, resourceName: row.documentTitle, details: `Mission: ${mission.missionName}` });
    res.status(201).json(row);
  }),
);

missionsRouter.delete(
  "/:id/documents/:docId",
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const docId = parseId(req.params.docId, "docId");
    const mission = await requireOwnedMission(req, id);
    const [row] = await db
      .delete(missionDocuments)
      .where(and(eq(missionDocuments.id, docId), eq(missionDocuments.missionId, id)))
      .returning({ id: missionDocuments.id, documentTitle: missionDocuments.documentTitle });
    if (!row) throw new NotFound("Mission document");
    await logActivity({ actor: currentUser(req), action: "DELETE", resourceType: "MissionDocument", resourceId: row.id, resourceName: row.documentTitle, details: `Mission: ${mission.missionName}` });
    res.json({ id: row.id });
  }),
);
