import { Router, type Request } from "express";
import { z } from "zod";
import { eq, desc, asc, and } from "drizzle-orm";
import { db } from "../db";
import { missions, missionDocuments, insertMissionSchema, insertMissionDocumentSchema, type Mission } from "@shared/schema";
import { roleHas } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId, queryFlag } from "../lib/ids";
import { Forbidden, NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requireOperate, currentUser, canActFor } from "../middleware/persona";
import { getUsersByIds, toPublicUser } from "../services/user-service";
import { logActivity } from "../services/activity-service";

/** Mission planning is for qualified aircrew and above; every route is requireOperate. */
export const missionsRouter = Router();
missionsRouter.use(requireOperate);

/** Load a mission the caller may act on (owner or instructor), or 404/403. */
async function requireOwnedMission(req: Request, id: number): Promise<Mission> {
  const me = currentUser(req);
  const [row] = await db.select().from(missions).where(eq(missions.id, id)).limit(1);
  if (!row) throw new NotFound("Mission");
  if (!canActFor(me, row.userId)) throw new Forbidden();
  return row;
}

// ---- Listing -------------------------------------------------------------

const listQuery = z.object({
  all: queryFlag,
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

/** Own missions; instructors may pass `?all=1` to see everyone's (with the owner attached). */
missionsRouter.get(
  "/",
  validate(listQuery, "query"),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const q = req.query as z.infer<typeof listQuery>;
    const seeAll = roleHas(me.role, "instruct") && !!q.all;
    const rows = await db
      .select()
      .from(missions)
      .where(seeAll ? undefined : eq(missions.userId, me.id))
      .orderBy(asc(missions.isCompleted), desc(missions.createdAt))
      .limit(q.limit ?? 500);
    const people = await getUsersByIds(rows.map((r) => r.userId));
    res.json(
      rows.map((r) => {
        const u = people.get(r.userId);
        return { ...r, user: u ? toPublicUser(u) : null };
      }),
    );
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

// ---- Single mission ------------------------------------------------------

/** Mission with its attached documents. */
missionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const row = await db.query.missions.findFirst({
      where: eq(missions.id, id),
      with: { documents: { orderBy: [asc(missionDocuments.addedAt), asc(missionDocuments.id)] } },
    });
    if (!row) throw new NotFound("Mission");
    if (!canActFor(me, row.userId)) throw new Forbidden();
    res.json(row);
  }),
);

const patchMissionSchema = insertMissionSchema.partial().extend({ isCompleted: z.boolean().optional() });

/** Partial update. Toggling `isCompleted` sets or clears `completedAt`. */
missionsRouter.patch(
  "/:id",
  validate(patchMissionSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const b = req.body as z.infer<typeof patchMissionSchema>;
    const existing = await requireOwnedMission(req, id);
    const { isCompleted, ...rest } = b;
    const completion =
      isCompleted === undefined
        ? {}
        : { isCompleted, completedAt: isCompleted ? (existing.completedAt ?? new Date()) : null };
    const values = { ...rest, ...completion };
    const [row] = Object.keys(values).length
      ? await db.update(missions).set(values).where(eq(missions.id, id)).returning()
      : [existing];
    if (!row) throw new NotFound("Mission");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Mission", resourceId: row.id, resourceName: row.missionName, details: isCompleted === undefined ? undefined : isCompleted ? "Marked complete" : "Reopened" });
    res.json(row);
  }),
);

/** Hard delete; attached documents cascade. */
missionsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const id = parseId(req.params.id);
    await requireOwnedMission(req, id);
    const [row] = await db.delete(missions).where(eq(missions.id, id)).returning({ id: missions.id, missionName: missions.missionName });
    if (!row) throw new NotFound("Mission");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Mission", resourceId: row.id, resourceName: row.missionName });
    res.json({ id: row.id });
  }),
);

// ---- Mission documents ---------------------------------------------------

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
    const me = currentUser(req);
    const id = parseId(req.params.id);
    const docId = parseId(req.params.docId, "docId");
    const mission = await requireOwnedMission(req, id);
    const [row] = await db
      .delete(missionDocuments)
      .where(and(eq(missionDocuments.id, docId), eq(missionDocuments.missionId, id)))
      .returning({ id: missionDocuments.id, documentTitle: missionDocuments.documentTitle });
    if (!row) throw new NotFound("Mission document");
    await logActivity({ actor: me, action: "DELETE", resourceType: "MissionDocument", resourceId: row.id, resourceName: row.documentTitle, details: `Mission: ${mission.missionName}` });
    res.json({ id: row.id });
  }),
);
