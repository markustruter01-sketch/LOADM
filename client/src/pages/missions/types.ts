import type { Mission, MissionDocument, PublicUser } from "@shared/schema";

/** GET /api/missions row (owner attached). */
export type MissionListItem = Mission & { user: PublicUser | null };

/** GET /api/missions/:id */
export type MissionDetail = Mission & { documents: MissionDocument[] };
