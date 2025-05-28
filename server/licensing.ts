import { randomBytes, createHash } from "crypto";
import { Request } from "express";
import { db } from "./db";
import { licenses, users, licenseSessions, licenseAuditLog } from "@shared/schema";
import { eq, and, gt, lt } from "drizzle-orm";

// Generate unique license key
export function generateLicenseKey(): string {
  return randomBytes(16).toString('hex').toUpperCase();
}

// Generate device fingerprint from request
export function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return createHash('sha256').update(fingerprint).digest('hex');
}

// Check if license is valid and active
export async function validateLicense(email: string, username: string) {
  const license = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.email, email),
        eq(licenses.username, username),
        eq(licenses.status, 'active'),
        gt(licenses.expiryDate, new Date())
      )
    )
    .limit(1);

  return license[0] || null;
}

// Check concurrent session limits
export async function checkSessionLimits(licenseId: number): Promise<boolean> {
  const license = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, licenseId))
    .limit(1);

  if (!license[0]) return false;

  const activeSessions = await db
    .select()
    .from(licenseSessions)
    .where(
      and(
        eq(licenseSessions.licenseId, licenseId),
        eq(licenseSessions.status, 'active')
      )
    );

  return activeSessions.length < license[0].maxConcurrentSessions;
}

// Create new session
export async function createSession(
  licenseId: number,
  userId: number,
  deviceFingerprint: string,
  ipAddress: string,
  userAgent: string
) {
  return await db.insert(licenseSessions).values({
    licenseId,
    userId,
    deviceFingerprint,
    ipAddress,
    userAgent,
    status: 'active'
  }).returning();
}

// Update session activity
export async function updateSessionActivity(sessionId: number) {
  return await db
    .update(licenseSessions)
    .set({ lastActivity: new Date() })
    .where(eq(licenseSessions.id, sessionId));
}

// End session
export async function endSession(sessionId: number) {
  return await db
    .update(licenseSessions)
    .set({ 
      status: 'inactive',
      logoutTime: new Date()
    })
    .where(eq(licenseSessions.id, sessionId));
}

// Clean up expired sessions
export async function cleanupExpiredSessions() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  return await db
    .update(licenseSessions)
    .set({ status: 'expired' })
    .where(
      and(
        eq(licenseSessions.status, 'active'),
        lt(licenseSessions.lastActivity, thirtyMinutesAgo)
      )
    );
}

// Log license action for audit
export async function logLicenseAction(
  licenseId: number | null,
  adminId: number,
  action: string,
  details: any = {}
) {
  return await db.insert(licenseAuditLog).values({
    licenseId,
    adminId,
    action,
    details,
  });
}

// Check for suspicious activity (same license, different locations)
export async function detectSuspiciousActivity(licenseId: number): Promise<boolean> {
  const sessions = await db
    .select()
    .from(licenseSessions)
    .where(
      and(
        eq(licenseSessions.licenseId, licenseId),
        eq(licenseSessions.status, 'active')
      )
    );

  if (sessions.length <= 1) return false;

  // Check for different IP ranges (simple check)
  const ipRanges = new Set();
  sessions.forEach(session => {
    const ipParts = session.ipAddress.split('.');
    ipRanges.add(`${ipParts[0]}.${ipParts[1]}`);
  });

  return ipRanges.size > 1;
}

// Expire license
export async function expireLicense(licenseId: number, adminId: number) {
  await db
    .update(licenses)
    .set({ 
      status: 'expired',
      updatedAt: new Date()
    })
    .where(eq(licenses.id, licenseId));

  // End all active sessions
  await db
    .update(licenseSessions)
    .set({ 
      status: 'expired',
      logoutTime: new Date()
    })
    .where(
      and(
        eq(licenseSessions.licenseId, licenseId),
        eq(licenseSessions.status, 'active')
      )
    );

  await logLicenseAction(licenseId, adminId, 'expired');
}

// Suspend license
export async function suspendLicense(licenseId: number, adminId: number, reason: string = '') {
  await db
    .update(licenses)
    .set({ 
      status: 'suspended',
      updatedAt: new Date()
    })
    .where(eq(licenses.id, licenseId));

  // End all active sessions
  await db
    .update(licenseSessions)
    .set({ 
      status: 'suspended',
      logoutTime: new Date()
    })
    .where(
      and(
        eq(licenseSessions.licenseId, licenseId),
        eq(licenseSessions.status, 'active')
      )
    );

  await logLicenseAction(licenseId, adminId, 'suspended', { reason });
}

// Reactivate license
export async function reactivateLicense(licenseId: number, adminId: number) {
  await db
    .update(licenses)
    .set({ 
      status: 'active',
      updatedAt: new Date()
    })
    .where(eq(licenses.id, licenseId));

  await logLicenseAction(licenseId, adminId, 'reactivated');
}