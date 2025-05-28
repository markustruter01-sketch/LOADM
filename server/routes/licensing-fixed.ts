import { Router } from 'express';
import { db } from '../db';
import { licenses, users } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Simple middleware for super admin check
function requireSuperAdmin(req: any, res: any, next: any) {
  console.log('Auth check - isAuthenticated:', req.isAuthenticated());
  console.log('Auth check - user:', req.user);
  
  if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
    return res.status(403).json({ message: "Access denied. Super admin required." });
  }
  next();
}

// Generate license key
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
}

// Get all licenses
router.get('/licenses', requireSuperAdmin, async (req, res) => {
  try {
    const allLicenses = await db.select().from(licenses);
    
    const enrichedLicenses = allLicenses.map(license => ({
      ...license,
      isExpired: new Date(license.expiryDate) < new Date(),
      daysUntilExpiry: Math.ceil((new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
      activeSessionCount: 0, // Could be calculated from sessions table
      totalSessionCount: 0   // Could be calculated from sessions table
    }));

    res.json(enrichedLicenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Create new license - completely rebuilt
router.post('/licenses', requireSuperAdmin, async (req, res) => {
  try {
    const { email, username, licenseType = 'loadmaster', expiryDate, maxConcurrentSessions = 1, maxDevices = 2, notes = '' } = req.body;
    
    // Simple validation
    if (!email || !username || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields: email, username, expiryDate' });
    }

    // Validate license type
    if (!['loadmaster', 'instructor', 'superadmin'].includes(licenseType)) {
      return res.status(400).json({ error: 'Invalid license type. Must be: loadmaster, instructor, or superadmin' });
    }

    // Validate email format
    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Generate license key
    const licenseKey = generateLicenseKey();
    
    // Parse and validate expiry date
    const parsedExpiryDate = new Date(expiryDate);
    if (isNaN(parsedExpiryDate.getTime())) {
      return res.status(400).json({ error: 'Invalid expiry date format' });
    }

    // Create license
    const newLicense = await db.insert(licenses).values({
      email,
      username,
      licenseKey,
      licenseType,
      expiryDate: parsedExpiryDate,
      maxConcurrentSessions: parseInt(maxConcurrentSessions.toString()),
      maxDevices: parseInt(maxDevices.toString()),
      createdByAdmin: req.user.id,
      notes: notes || '',
    }).returning();

    // Automatically create user account if it doesn't exist
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    
    if (existingUser.length === 0) {
      // Create user account with permissions based on license type
      const isAdmin = licenseType === 'instructor' || licenseType === 'superadmin';
      const isSuperAdmin = licenseType === 'superadmin';
      
      await db.insert(users).values({
        username,
        email,
        password: '$2b$10$defaulthashfortemporaryaccess', // User will need to set their password on first login
        isAdmin,
        isSuperAdmin,
        licenseId: newLicense[0].id,
      });
    } else {
      // Update existing user with the new license ID
      await db.update(users)
        .set({ licenseId: newLicense[0].id })
        .where(eq(users.email, email));
    }

    res.status(201).json(newLicense[0]);
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({ error: 'Failed to create license' });
  }
});

// Get dashboard stats
router.get('/dashboard-stats', requireSuperAdmin, async (req, res) => {
  try {
    const allLicenses = await db.select().from(licenses);
    
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      totalLicenses: allLicenses.length,
      activeLicenses: allLicenses.filter(l => l.status === 'active' && new Date(l.expiryDate) > now).length,
      expiredLicenses: allLicenses.filter(l => new Date(l.expiryDate) <= now).length,
      suspendedLicenses: allLicenses.filter(l => l.status === 'suspended').length,
      activeSessions: 0, // Could be calculated from sessions
      expiringLicenses: allLicenses.filter(l => new Date(l.expiryDate) <= sevenDaysFromNow && new Date(l.expiryDate) > now).length,
      utilizationRate: Math.round((allLicenses.filter(l => l.status === 'active').length / Math.max(allLicenses.length, 1)) * 100)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Suspend license
router.post('/licenses/:id/suspend', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);
    await db.update(licenses).set({ status: 'suspended' }).where(eq(licenses.id, licenseId));
    res.json({ success: true });
  } catch (error) {
    console.error('Error suspending license:', error);
    res.status(500).json({ error: 'Failed to suspend license' });
  }
});

// Reactivate license
router.post('/licenses/:id/reactivate', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);
    await db.update(licenses).set({ status: 'active' }).where(eq(licenses.id, licenseId));
    res.json({ success: true });
  } catch (error) {
    console.error('Error reactivating license:', error);
    res.status(500).json({ error: 'Failed to reactivate license' });
  }
});

// Delete license
router.delete('/licenses/:id', requireSuperAdmin, async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id);
    await db.delete(licenses).where(eq(licenses.id, licenseId));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting license:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

export default router;