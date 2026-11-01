import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import { activityLog, users, type User } from "@shared/schema";
import { logger } from "../lib/logger";
import { personName } from "../lib/client-format";

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

/**
 * The deletion log the command dashboard shows (it words every entry as
 * "X deleted Y"): the 500 newest DELETE rows with the actor's name and email.
 */
export async function listDeletions() {
  const rows = await db
    .select({ row: activityLog, user: users })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.userId))
    .where(eq(activityLog.action, "DELETE"))
    .orderBy(desc(activityLog.performedAt))
    .limit(500);
  return rows.map(({ row, user }) => ({
    ...row,
    userName: user ? personName(user) : "System",
    userEmail: user?.email ?? "",
  }));
}
