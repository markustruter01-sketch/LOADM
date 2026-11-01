import { Router } from "express";
import { asyncHandler } from "../lib/async";
import { requireCommand } from "../middleware/persona";
import { listDeletions } from "../services/activity-service";

/** Mounted at /api/activity-log. Command only. */
export const activityRouter = Router();

activityRouter.get(
  "/",
  requireCommand,
  asyncHandler(async (_req, res) => {
    res.json(await listDeletions());
  }),
);
