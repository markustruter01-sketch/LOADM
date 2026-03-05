import { db } from "../db";
import { users, licenses, userQualifications, readinessSnapshots } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const SQUADRONS = ["33", "35", "36", "37"];

interface SnapshotData {
  squadron: string;
  totalPersonnel: number;
  readyCount: number;
  notReadyCount: number;
  readyPercent: number;
  currentQuals: number;
  expiringQuals: number;
  expiredQuals: number;
  personnelAtRisk: number;
}

async function calculateSquadronSnapshot(squadron: string | null): Promise<SnapshotData> {
  const now = new Date();
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  let personnelQuery = db.select({
    userId: users.id,
    isFlightReady: licenses.isFlightReady,
    squadron: licenses.squadron,
  })
  .from(users)
  .leftJoin(licenses, eq(users.licenseId, licenses.id))
  .where(eq(licenses.isActive, true));
  // Note: leadership and superadmin (squadron = 'AMG') are excluded automatically
  // because SQUADRONS only contains numbered squadrons — AMG is never iterated

  const allPersonnel = await personnelQuery;
  
  const filteredPersonnel = squadron 
    ? allPersonnel.filter(p => p.squadron === squadron)
    : allPersonnel;

  const totalPersonnel = filteredPersonnel.length;
  const readyCount = filteredPersonnel.filter(p => p.isFlightReady).length;
  const notReadyCount = totalPersonnel - readyCount;
  const readyPercent = totalPersonnel > 0 ? Math.round((readyCount / totalPersonnel) * 100) : 0;

  const userIds = filteredPersonnel.map(p => p.userId);
  
  if (userIds.length === 0) {
    return {
      squadron: squadron || "ALL",
      totalPersonnel: 0,
      readyCount: 0,
      notReadyCount: 0,
      readyPercent: 0,
      currentQuals: 0,
      expiringQuals: 0,
      expiredQuals: 0,
      personnelAtRisk: 0,
    };
  }

  const qualifications = await db.select({
    id: userQualifications.id,
    userId: userQualifications.userId,
    expiryDate: userQualifications.expiryDate,
  })
  .from(userQualifications)
  .where(sql`${userQualifications.userId} = ANY(ARRAY[${sql.raw(userIds.join(','))}]::int[])`);

  let currentQuals = 0;
  let expiringQuals = 0;
  let expiredQuals = 0;
  const personnelWithExpiringQuals = new Set<number>();

  qualifications.forEach(qual => {
    if (!qual.expiryDate) {
      currentQuals++;
    } else {
      const expiry = new Date(qual.expiryDate);
      if (expiry < now) {
        expiredQuals++;
      } else if (expiry <= ninetyDays) {
        expiringQuals++;
        personnelWithExpiringQuals.add(qual.userId);
      } else {
        currentQuals++;
      }
    }
  });

  return {
    squadron: squadron || "ALL",
    totalPersonnel,
    readyCount,
    notReadyCount,
    readyPercent,
    currentQuals,
    expiringQuals,
    expiredQuals,
    personnelAtRisk: personnelWithExpiringQuals.size,
  };
}

export async function captureReadinessSnapshot(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingSnapshot = await db.select()
    .from(readinessSnapshots)
    .where(sql`DATE(${readinessSnapshots.snapshotDate}) = DATE(${today})`);

  if (existingSnapshot.length > 0) {
    console.log(`[Snapshot Service] Snapshot already exists for ${today.toISOString().split('T')[0]}`);
    return;
  }

  console.log(`[Snapshot Service] Capturing readiness snapshot for ${today.toISOString().split('T')[0]}`);

  const allSnapshot = await calculateSquadronSnapshot(null);
  await db.insert(readinessSnapshots).values({
    snapshotDate: today,
    ...allSnapshot,
  });

  for (const squadron of SQUADRONS) {
    const squadronSnapshot = await calculateSquadronSnapshot(squadron);
    await db.insert(readinessSnapshots).values({
      snapshotDate: today,
      ...squadronSnapshot,
    });
  }

  console.log(`[Snapshot Service] Successfully captured ${SQUADRONS.length + 1} snapshots`);
}

export async function checkAndCaptureSnapshot(): Promise<void> {
  try {
    await captureReadinessSnapshot();
  } catch (error) {
    console.error("[Snapshot Service] Error capturing snapshot:", error);
  }
}

export async function getSnapshotHistory(options: {
  squadron?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<typeof readinessSnapshots.$inferSelect[]> {
  const { squadron = "ALL", startDate, endDate, limit = 90 } = options;

  let query = db.select()
    .from(readinessSnapshots)
    .where(eq(readinessSnapshots.squadron, squadron))
    .orderBy(sql`${readinessSnapshots.snapshotDate} DESC`)
    .limit(limit);

  const results = await query;

  let filtered = results;
  if (startDate) {
    filtered = filtered.filter(r => new Date(r.snapshotDate) >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(r => new Date(r.snapshotDate) <= endDate);
  }

  return filtered.reverse();
}
