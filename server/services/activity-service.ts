import { desc } from "drizzle-orm";
import { db } from "../db";
import { activityLog, type User } from "@shared/schema";
import { logger } from "../lib/logger";

/** Append an audit row. Never throws: an audit failure must not fail the request. */
export async function logActivity(params: {
  actor: User | undefined;
  action: "CREATE" | "UPDATE" | "DELETE" | "REVIEW" | "RESET";
  resourceType: string;
  resourceId?: number | null;
  resourceName: string;
  details?: string;
}): Promise<void> {
  try {
    await db.insert(activityLog).values({
      userId: params.actor?.id ?? null,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId ?? null,
      resourceName: params.resourceName,
      details: params.details ?? null,
    });
  } catch (err) {
    logger.error({ err }, "activity log write failed");
  }
}

export async function listActivity(limit = 200) {
  return db.query.activityLog.findMany({ orderBy: [desc(activityLog.performedAt)], limit });
}
