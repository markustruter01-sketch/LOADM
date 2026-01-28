import type { Express } from "express";
import { db } from "../db";
import { licenses, users } from "@shared/schema";
import { eq, and, ne } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

export function registerLicensingRoutes(app: Express) {
  // Get all licenses with user information
  // Query param: excludeLeadership=true will filter out leadership accounts (for instructor views)
  app.get("/api/licensing/licenses", async (req, res) => {
    try {
      const excludeLeadership = req.query.excludeLeadership === 'true';
      const callerRole = req.query.callerRole as string;
      
      // Build query
      let query = db.select({
        id: licenses.id,
        licenseKey: licenses.licenseKey,
        email: licenses.email,
        firstName: licenses.firstName,
        lastName: licenses.lastName,
        licenseType: licenses.licenseType,
        isActive: licenses.isActive,
        expiryDate: licenses.expiryDate,
        createdAt: licenses.createdAt,
        userId: users.id,
        userEmail: users.email,
        isFirstLogin: users.isFirstLogin,
        hasPassword: users.hashedPassword
      })
      .from(licenses)
      .leftJoin(users, eq(licenses.id, users.licenseId))
      .orderBy(licenses.createdAt);
      
      let allLicenses = await query;
      
      // Filter out leadership users unless caller is superadmin
      if (excludeLeadership || (callerRole && callerRole !== 'superadmin')) {
        allLicenses = allLicenses.filter(l => l.licenseType !== 'leadership');
      }

      res.json(allLicenses);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  // Create new license and user account
  app.post("/api/licensing/licenses", async (req, res) => {
    try {
      const { email, firstName, lastName, licenseType, expiryDate } = req.body;

      // Validate required fields
      if (!email || !firstName || !licenseType || !expiryDate) {
        return res.status(400).json({ message: "Email, first name, license type, and expiry date are required" });
      }

      // Check if email already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Generate unique license key
      const licenseKey = `LIC-${firstName.toUpperCase()}-${Date.now()}`;

      // Create license
      const newLicense = await db.insert(licenses).values({
        licenseKey,
        email,
        firstName,
        lastName: lastName || '',
        licenseType,
        isActive: true,
        expiryDate: new Date(expiryDate),
        maxConcurrentSessions: 3,
        maxDevices: 2,
        createdByAdmin: req.user?.id || 9,
        notes: ''
      }).returning();

      // Create user account with temporary password
      const defaultPassword = 'Password1!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const newUser = await db.insert(users).values({
        email,
        hashedPassword,
        isFirstLogin: true,
        licenseId: newLicense[0].id,
        createdBy: req.user?.id || 9,
        userRole: licenseType === 'instructor' ? 'instructor' : 'loadmaster',
        isAdmin: licenseType === 'instructor',
        isSuperAdmin: false
      }).returning();

      res.status(201).json({
        license: newLicense[0],
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          isFirstLogin: true,
          licenseId: newUser[0].licenseId
        }
      });
    } catch (error) {
      console.error('Error creating license:', error);
      res.status(500).json({ message: "Failed to create license" });
    }
  });

  // License dashboard stats
  app.get("/api/licensing/dashboard-stats", async (req, res) => {
    try {
      const allLicenses = await db.select().from(licenses);
      const activeCount = allLicenses.filter(l => l.isActive).length;
      const expiredCount = allLicenses.filter(l => new Date(l.expiryDate) < new Date()).length;

      res.json({
        totalLicenses: allLicenses.length,
        activeLicenses: activeCount,
        expiredLicenses: expiredCount,
        pendingRenewal: expiredCount
      });
    } catch (error) {
      console.error('Error fetching license stats:', error);
      res.status(500).json({ message: "Failed to fetch license stats" });
    }
  });

  // Update user password (for first login)
  app.post("/api/auth/set-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await db.update(users)
        .set({ 
          hashedPassword,
          isFirstLogin: false
        })
        .where(eq(users.email, email));

      res.json({ success: true });
    } catch (error) {
      console.error('Error setting password:', error);
      res.status(500).json({ message: "Failed to set password" });
    }
  });

  // Update license role/type
  app.patch("/api/licensing/licenses/:id/role", async (req, res) => {
    try {
      const licenseId = parseInt(req.params.id);
      const { licenseType } = req.body;

      if (!licenseType) {
        return res.status(400).json({ message: "License type is required" });
      }

      // Validate license type
      const validTypes = ['loadmaster', 'instructor', 'superadmin', 'readonly', 'leadership'];
      if (!validTypes.includes(licenseType)) {
        return res.status(400).json({ message: "Invalid license type" });
      }

      // Update the license
      await db.update(licenses)
        .set({ 
          licenseType,
          updatedAt: new Date()
        })
        .where(eq(licenses.id, licenseId));

      // Also update the associated user's role flags
      const license = await db.select().from(licenses).where(eq(licenses.id, licenseId)).limit(1);
      if (license.length > 0) {
        await db.update(users)
          .set({
            userRole: licenseType,
            isAdmin: licenseType === 'instructor' || licenseType === 'superadmin' || licenseType === 'leadership',
            isSuperAdmin: licenseType === 'superadmin'
          })
          .where(eq(users.email, license[0].email));
      }

      res.json({ success: true, licenseType });
    } catch (error) {
      console.error('Error updating license role:', error);
      res.status(500).json({ message: "Failed to update license role" });
    }
  });
}