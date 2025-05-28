import { Router } from "express";
import { db } from "../db";
import { licenses, users, licenseSessions, licenseAuditLog } from "@shared/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { 
  generateLicenseKey, 
  logLicenseAction, 
  suspendLicense, 
  reactivateLicense,
  expireLicense,
  validateLicense,
  checkSessionLimits,
  createSession,
  generateDeviceFingerprint,
  endSession
} from "../licensing";
import { insertLicenseSchema } from "@shared/schema";
import { z } from "zod";

const router = Router();

// Superadmin middleware
function requireSuperAdmin(req: any, res: any, next: any) {
  if (!req.user || !req.user.isSuperAdmin) {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
}

// Get all licenses with statistics
router.get('/licenses', requireSuperAdmin, async (req, res) => {
  try {
    const allLicenses = await db
      .select({
        id: licenses.id,
        email: licenses.email,
        username: licenses.username,
        licenseKey: licenses.licenseKey,
        issuedDate: licenses.issuedDate,
        expiryDate: licenses.expiryDate,
        status: licenses.status,
        maxConcurrentSessions: licenses.maxConcurrentSessions,
        maxDevices: licenses.maxDevices,
        notes: licenses.notes,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
      })
      .from(licenses)
      .orderBy(desc(licenses.createdAt));

    // Get session counts for each license
    const licensesWithStats = await Promise.all(
      allLicenses.map(async (license) => {
        const activeSessions = await db
          .select()
          .from(licenseSessions)
          .where(
            and(
              eq(licenseSessions.licenseId, license.id),
              eq(licenseSessions.status, 'active')
            )
          );

        const totalSessions = await db
          .select()
          .from(licenseSessions)
          .where(eq(licenseSessions.licenseId, license.id));

        return {
          ...license,
          activeSessionCount: activeSessions.length,
          totalSessionCount: totalSessions.length,
          isExpired: new Date(license.expiryDate) < new Date(),
          daysUntilExpiry: Math.ceil((new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        };
      })
    );

    res.json(licensesWithStats);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Create new license
router.post('/licenses', requireSuperAdmin, async (req, res) => {
  try {
    const createLicenseSchema = insertLicenseSchema.extend({
      expiryDate: z.string().transform((str) => new Date(str)),
      durationDays: z.number().optional(),
      durationWeeks: z.number().optional(),
      durationMonths: z.number().optional(),
    });

    const data = createLicenseSchema.parse(req.body);
    
    // Calculate expiry date
    let expiryDate = new Date(data.expiryDate);
    if (data.durationDays) {
      expiryDate = new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000);
    } else if (data.durationWeeks) {
      expiryDate = new Date(Date.now() + data.durationWeeks * 7 * 24 * 60 * 60 * 1000);
    } else if (data.durationMonths) {
      expiryDate = new Date(Date.now() + data.durationMonths * 30 * 24 * 60 * 60 * 1000);
    }

    const licenseKey = generateLicenseKey();

    const newLicense = await db.insert(licenses).values({
      email: data.email,
      username: data.username,
      licenseKey,
      expiryDate,
      maxConcurrentSessions: data.maxConcurrentSessions || 1,
      maxDevices: data.maxDevices || 2,
      notes: data.notes || '',
      createdByAdmin: req.user.id,
    }).returning();

    await logLicenseAction(newLicense[0].id, req.user.id, 'created', {
      email: data.email,
      username: data.username,
      expiryDate: expiryDate.toISOString()
    });

    res.status(201).json(newLicense[0]);
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({ error: 'Failed to create license' });
  }
});

// Update license
router.put('/licenses/:id', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);
    const updateData = req.body;

    const updatedLicense = await db
      .update(licenses)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(licenses.id, licenseId))
      .returning();

    if (!updatedLicense[0]) {
      return res.status(404).json({ error: 'License not found' });
    }

    await logLicenseAction(licenseId, req.user.id, 'modified', updateData);

    res.json(updatedLicense[0]);
  } catch (error) {
    console.error('Error updating license:', error);
    res.status(500).json({ error: 'Failed to update license' });
  }
});

// Suspend license
router.post('/licenses/:id/suspend', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);
    const { reason } = req.body;

    await suspendLicense(licenseId, req.user.id, reason);

    res.json({ success: true, message: 'License suspended successfully' });
  } catch (error) {
    console.error('Error suspending license:', error);
    res.status(500).json({ error: 'Failed to suspend license' });
  }
});

// Reactivate license
router.post('/licenses/:id/reactivate', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);

    await reactivateLicense(licenseId, req.user.id);

    res.json({ success: true, message: 'License reactivated successfully' });
  } catch (error) {
    console.error('Error reactivating license:', error);
    res.status(500).json({ error: 'Failed to reactivate license' });
  }
});

// Delete license
router.delete('/licenses/:id', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);

    // First end all sessions and delete associated users
    await db.delete(users).where(eq(users.licenseId, licenseId));
    
    await db.delete(licenses).where(eq(licenses.id, licenseId));

    await logLicenseAction(licenseId, req.user.id, 'deleted');

    res.json({ success: true, message: 'License deleted successfully' });
  } catch (error) {
    console.error('Error deleting license:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

// Get license sessions
router.get('/licenses/:id/sessions', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);

    const sessions = await db
      .select()
      .from(licenseSessions)
      .where(eq(licenseSessions.licenseId, licenseId))
      .orderBy(desc(licenseSessions.loginTime));

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get license audit log
router.get('/licenses/:id/audit', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);

    const auditLogs = await db
      .select()
      .from(licenseAuditLog)
      .where(eq(licenseAuditLog.licenseId, licenseId))
      .orderBy(desc(licenseAuditLog.timestamp));

    res.json(auditLogs);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Get licensing dashboard stats
router.get('/dashboard-stats', requireSuperAdmin, async (req, res) => {
  try {
    const totalLicenses = await db.select().from(licenses);
    const activeLicenses = totalLicenses.filter(l => l.status === 'active' && new Date(l.expiryDate) > new Date());
    const expiredLicenses = totalLicenses.filter(l => new Date(l.expiryDate) <= new Date());
    const suspendedLicenses = totalLicenses.filter(l => l.status === 'suspended');

    const activeSessions = await db
      .select()
      .from(licenseSessions)
      .where(eq(licenseSessions.status, 'active'));

    const expiringLicenses = totalLicenses.filter(l => {
      const daysUntilExpiry = Math.ceil((new Date(l.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });

    res.json({
      totalLicenses: totalLicenses.length,
      activeLicenses: activeLicenses.length,
      expiredLicenses: expiredLicenses.length,
      suspendedLicenses: suspendedLicenses.length,
      activeSessions: activeSessions.length,
      expiringLicenses: expiringLicenses.length,
      utilizationRate: totalLicenses.length > 0 ? Math.round((activeSessions.length / totalLicenses.length) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;