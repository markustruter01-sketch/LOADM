import { Request, Response, NextFunction } from "express";
import { 
  validateLicense, 
  checkSessionLimits, 
  createSession, 
  updateSessionActivity,
  generateDeviceFingerprint,
  cleanupExpiredSessions,
  detectSuspiciousActivity,
  suspendLicense
} from "./licensing";
import { db } from "./db";
import { users, licenseSessions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Enhanced authentication middleware with licensing
export async function licenseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Skip licensing for superadmin
    if (req.user && req.user.isSuperAdmin) {
      return next();
    }

    // Skip licensing for auth routes
    if (req.path.includes('/api/login') || req.path.includes('/api/register') || req.path.includes('/api/user')) {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's license
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user[0] || !user[0].licenseId) {
      return res.status(403).json({ error: 'No valid license found' });
    }

    // Validate license
    const license = await validateLicense(user[0].email, user[0].username);
    if (!license) {
      return res.status(403).json({ error: 'License expired or invalid' });
    }

    // Check for suspicious activity
    const suspicious = await detectSuspiciousActivity(license.id);
    if (suspicious) {
      await suspendLicense(license.id, 1, 'Suspicious activity detected');
      return res.status(403).json({ error: 'License suspended due to suspicious activity' });
    }

    // Update session activity
    const deviceFingerprint = generateDeviceFingerprint(req);
    const session = await db
      .select()
      .from(licenseSessions)
      .where(
        and(
          eq(licenseSessions.licenseId, license.id),
          eq(licenseSessions.userId, req.user.id),
          eq(licenseSessions.deviceFingerprint, deviceFingerprint),
          eq(licenseSessions.status, 'active')
        )
      )
      .limit(1);

    if (session[0]) {
      await updateSessionActivity(session[0].id);
    }

    next();
  } catch (error) {
    console.error('License middleware error:', error);
    res.status(500).json({ error: 'License validation failed' });
  }
}

// Cleanup expired sessions periodically
export function startSessionCleanup() {
  setInterval(async () => {
    try {
      await cleanupExpiredSessions();
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}