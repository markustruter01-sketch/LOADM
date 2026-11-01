import { Router } from "express";
import { asyncHandler } from "../lib/async";
import { requireCommand } from "../middleware/persona";
import { listActivity } from "../services/activity-service";
import { getUsersByIds, toPublicUser } from "../services/user-service";
import { parseOptionalInt } from "../lib/ids";

export const activityRouter = Router();

/** Audit trail of create/update/delete actions. Command only. */
activityRouter.get(
  "/",
  requireCommand,
  asyncHandler(async (req, res) => {
    const rows = await listActivity(parseOptionalInt(req.query.limit, 200, { min: 1, max: 1000 }));
    const people = await getUsersByIds(rows.map((r) => r.userId).filter((id): id is number => id !== null));
    res.json(
      rows.map((r) => ({
        ...r,
        actor: r.userId && people.get(r.userId) ? toPublicUser(people.get(r.userId)!) : null,
      })),
    );
  }),
);
