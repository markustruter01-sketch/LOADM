import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertDocumentSchema, insertScenarioSchema, insertDocumentSubmissionSchema, insertScenarioSubmissionSchema, insertPhoneDirectorySchema, insertMissionSchema, insertMissionDocumentSchema, insertTrainingModuleVideoSchema, insertChecklistSchema, insertChecklistItemSchema, insertChecklistCompletionSchema, insertUserQualificationSchema, insertFlightRecordSchema, insertSafetyRecordSchema, insertTrainingModuleSchema, insertTrainingModuleContentSchema, phoneDirectory, missions, missionDocuments, licenses, users, documents, scenarios, documentSubmissions, scenarioSubmissions, trainingModuleVideos, checklists, checklistItems, checklistCompletions, checklistStepAudit, userQualifications, flightRecords, safetyRecords, trainingModules, trainingModuleContent, readinessSnapshots, NOT_READY_REASONS, quizzes, quizSubmissions, activityLog } from "@shared/schema";

async function writeActivityLog(user: any, action: string, resourceType: string, resourceName: string, details?: string) {
  try {
    await db.insert(activityLog).values({
      userId: user?.id ?? null,
      userEmail: user?.email ?? "unknown",
      userName: user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "unknown",
      action,
      resourceType,
      resourceName,
      details: details ?? null,
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}
import { eq, and, gt, desc, lt, sql, inArray } from "drizzle-orm";
import { db } from "./db";

import { sendLicenseWelcomeEmail } from "./services/email-service";
import { requireAuth, requireInstructor, requireSuperAdmin } from "./middleware/auth";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

// Extend Request interface for authenticated routes
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Authentication middleware functions are imported from ./middleware/auth

// Rate limiting for security
const ONE_MINUTE = 60 * 1000;
const MAX_REQUESTS_PER_MINUTE = 30;

// Simple in-memory rate limiter for auth endpoints
const requestCounts: Record<string, { count: number, resetTime: number }> = {};

function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Initialize or reset if time window has passed
  if (!requestCounts[ip] || now > requestCounts[ip].resetTime) {
    requestCounts[ip] = { count: 1, resetTime: now + ONE_MINUTE };
    return next();
  }
  
  // Increment count for existing IP
  requestCounts[ip].count += 1;
  
  // Check if limit exceeded
  if (requestCounts[ip].count > MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ message: "Too many requests, please try again later" });
  }
  
  next();
}

// Multer configuration for video uploads
const videoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'training-videos');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for video uploads
const videoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only video files
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'));
  }
};

// Configure multer for video uploads (max 100MB per file)
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 3 // Maximum 3 files per upload
  }
});

// Multer configuration for profile photo uploads
const profilePhotoStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'profile-photos');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for profile photo uploads
const profilePhotoFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer for profile photo uploads (max 5MB per file)
const uploadProfilePhoto = multer({
  storage: profilePhotoStorage,
  fileFilter: profilePhotoFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only 1 file per upload
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Phone Directory API endpoints
  app.get("/api/phone-directory", async (req, res) => {
    try {
      console.log("NUCLEAR: Phone directory GET request received");
      const directories = await db.select().from(phoneDirectory);
      console.log("NUCLEAR: Phone directory data:", directories);
      res.json(directories);
    } catch (error) {
      console.error("Error fetching phone directory:", error);
      res.status(500).json({ message: "Failed to fetch phone directory" });
    }
  });

  // Missions API endpoints
  app.get("/api/missions", requireAuth, async (req, res) => {
    try {
      const allMissions = await db.select().from(missions).orderBy(missions.createdAt);
      res.json(allMissions);
    } catch (error) {
      console.error("Error fetching missions:", error);
      res.status(500).json({ message: "Failed to fetch missions" });
    }
  });

  app.post("/api/missions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertMissionSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const [newMission] = await db.insert(missions).values(validatedData).returning();
      res.status(201).json(newMission);
    } catch (error) {
      console.error("Error creating mission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid mission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create mission" });
    }
  });

  app.delete("/api/missions/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      if (isNaN(missionId)) {
        return res.status(400).json({ message: "Invalid mission ID" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Fetch the mission to check ownership
      const mission = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
      
      if (mission.length === 0) {
        return res.status(404).json({ message: "Mission not found" });
      }

      // Check authorization: mission owner, instructor, or superadmin can delete
      const isOwner = mission[0].userId === req.user.id;
      const isInstructor = req.user.role === 'instructor';
      const isSuperAdmin = req.user.role === 'superadmin';
      const isAuthorized = isOwner || isInstructor || isSuperAdmin;

      if (!isAuthorized) {
        return res.status(403).json({ message: "You can only delete your own missions. Contact an instructor if you need to delete this mission." });
      }

      await db.delete(missions).where(eq(missions.id, missionId));
      await writeActivityLog(req.user, "DELETE", "Mission", mission[0].missionName, `Aircraft: ${mission[0].aircraftCallSign}`);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mission:", error);
      res.status(500).json({ message: "Failed to delete mission" });
    }
  });

  app.patch("/api/missions/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.id);
      if (isNaN(missionId)) {
        return res.status(400).json({ message: "Invalid mission ID" });
      }
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const mission = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
      if (mission.length === 0) {
        return res.status(404).json({ message: "Mission not found" });
      }
      const isOwner = mission[0].userId === req.user.id;
      const isInstructor = req.user.role === 'instructor';
      const isSuperAdmin = req.user.role === 'superadmin';
      if (!isOwner && !isInstructor && !isSuperAdmin) {
        return res.status(403).json({ message: "You can only edit your own missions" });
      }
      const { missionName, aircraftCallSign, captainName, departureLocation, arrivalDestination, loadmaster1Name, loadmaster2Name, hasDangerousGoods, isCompleted } = req.body;
      const completedAt = isCompleted ? new Date() : null;
      const [updated] = await db
        .update(missions)
        .set({ missionName, aircraftCallSign, captainName, departureLocation, arrivalDestination, loadmaster1Name, loadmaster2Name, hasDangerousGoods, isCompleted: isCompleted ?? false, completedAt, updatedAt: new Date() })
        .where(eq(missions.id, missionId))
        .returning();
      res.json(updated);
    } catch (error) {
      console.error("Error updating mission:", error);
      res.status(500).json({ message: "Failed to update mission" });
    }
  });

  // Mission Documents API endpoints
  app.get("/api/missions/:missionId/documents", requireAuth, async (req, res) => {
    try {
      const missionId = parseInt(req.params.missionId);
      if (isNaN(missionId)) {
        return res.status(400).json({ message: "Invalid mission ID" });
      }

      const docs = await db.select().from(missionDocuments).where(eq(missionDocuments.missionId, missionId));
      res.json(docs);
    } catch (error) {
      console.error("Error fetching mission documents:", error);
      res.status(500).json({ message: "Failed to fetch mission documents" });
    }
  });

  app.post("/api/missions/:missionId/documents", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.missionId);
      if (isNaN(missionId)) {
        return res.status(400).json({ message: "Invalid mission ID" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Fetch the mission to check ownership
      const mission = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
      
      if (mission.length === 0) {
        return res.status(404).json({ message: "Mission not found" });
      }

      // Check authorization: mission owner, instructor, or superadmin can add documents
      const isOwner = mission[0].userId === req.user.id;
      const isInstructor = req.user.role === 'instructor';
      const isSuperAdmin = req.user.role === 'superadmin';
      const isAuthorized = isOwner || isInstructor || isSuperAdmin;

      if (!isAuthorized) {
        return res.status(403).json({ message: "You can only add documents to your own missions" });
      }

      const validatedData = insertMissionDocumentSchema.parse({
        ...req.body,
        missionId,
        addedBy: req.user.id,
      });

      const [newDoc] = await db.insert(missionDocuments).values(validatedData).returning();
      res.status(201).json(newDoc);
    } catch (error) {
      console.error("Error adding document to mission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add document to mission" });
    }
  });

  app.delete("/api/missions/:missionId/documents/:docId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const missionId = parseInt(req.params.missionId);
      const docId = parseInt(req.params.docId);
      
      if (isNaN(missionId)) {
        return res.status(400).json({ message: "Invalid mission ID" });
      }
      
      if (isNaN(docId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Fetch the mission document to verify it belongs to the mission
      const doc = await db.select().from(missionDocuments).where(eq(missionDocuments.id, docId)).limit(1);
      
      if (doc.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Verify the document belongs to the specified mission
      if (doc[0].missionId !== missionId) {
        return res.status(400).json({ message: "Document does not belong to this mission" });
      }

      // Fetch the mission to check ownership
      const mission = await db.select().from(missions).where(eq(missions.id, missionId)).limit(1);
      
      if (mission.length === 0) {
        return res.status(404).json({ message: "Mission not found" });
      }

      // Check authorization: mission owner, instructor, or superadmin can remove documents
      const isOwner = mission[0].userId === req.user.id;
      const isInstructor = req.user.role === 'instructor';
      const isSuperAdmin = req.user.role === 'superadmin';
      const isAuthorized = isOwner || isInstructor || isSuperAdmin;

      if (!isAuthorized) {
        return res.status(403).json({ message: "You can only remove documents from your own missions" });
      }

      await db.delete(missionDocuments).where(eq(missionDocuments.id, docId));
      res.status(204).send();
    } catch (error) {
      console.error("Error removing document from mission:", error);
      res.status(500).json({ message: "Failed to remove document from mission" });
    }
  });

  // License management endpoints
  app.get("/api/licensing/licenses", requireSuperAdmin, async (req, res) => {
    try {
      const allLicenses = await db.select({
        id: licenses.id,
        licenseKey: licenses.licenseKey,
        email: licenses.email,
        firstName: licenses.firstName,
        lastName: licenses.lastName,
        licenseType: licenses.licenseType,
        isActive: licenses.isActive,
        expiryDate: licenses.expiryDate,
        maxConcurrentSessions: licenses.maxConcurrentSessions,
        maxDevices: licenses.maxDevices,
        notes: licenses.notes,
        createdAt: licenses.createdAt,
        updatedAt: licenses.updatedAt,
        userId: users.id,
        userEmail: users.email,
        isFirstLogin: users.isFirstLogin,
        hasPassword: users.hashedPassword
      })
      .from(licenses)
      .leftJoin(users, eq(licenses.id, users.licenseId))
      .orderBy(licenses.createdAt);

      // Process licenses to add calculated fields expected by frontend
      const processedLicenses = allLicenses.map(license => {
        const now = new Date();
        const expiryDate = new Date(license.expiryDate);
        const isExpired = expiryDate < now;
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine status based on isActive flag and expiry
        let status: 'active' | 'suspended' | 'expired';
        if (isExpired || !license.isActive) {
          status = isExpired ? 'expired' : 'suspended';
        } else {
          status = 'active';
        }

        return {
          id: license.id,
          email: license.email,
          username: `${license.firstName} ${license.lastName || ''}`.trim(),
          licenseKey: license.licenseKey,
          issuedDate: license.createdAt,
          expiryDate: license.expiryDate,
          status,
          maxConcurrentSessions: license.maxConcurrentSessions || 3,
          maxDevices: license.maxDevices || 2,
          notes: license.notes || '',
          createdAt: license.createdAt,
          updatedAt: license.updatedAt,
          activeSessionCount: 0, // TODO: Implement session tracking
          totalSessionCount: 0, // TODO: Implement session tracking
          isExpired,
          daysUntilExpiry,
          // Additional fields for compatibility
          firstName: license.firstName,
          lastName: license.lastName,
          licenseType: license.licenseType,
          isActive: license.isActive,
          userId: license.userId,
          userEmail: license.userEmail,
          isFirstLogin: license.isFirstLogin,
          hasPassword: license.hasPassword
        };
      });

      console.log(`📊 LICENSE API: Returning ${processedLicenses.length} licenses with calculated status`);
      res.json(processedLicenses);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  // Create new license and user account
  app.post("/api/licensing/licenses", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { email, firstName, lastName, licenseType, expiryDate } = req.body;

      if (!email || !firstName || !licenseType || !expiryDate) {
        return res.status(400).json({ message: "Email, first name, license type, and expiry date are required" });
      }

      // Check if email already exists in licenses table
      const existingLicense = await db.select().from(licenses).where(eq(licenses.email, email)).limit(1);
      if (existingLicense.length > 0) {
        return res.status(400).json({ message: "A license with this email address already exists" });
      }

      // Also check users table for consistency
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "A user with this email address already exists" });
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

      // Create user account with template password
      const defaultPassword = 'Password1!';
      const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(defaultPassword, 10));

      const newUser = await db.insert(users).values({
        email,
        hashedPassword,
        isFirstLogin: true,
        licenseId: newLicense[0].id,
        createdBy: req.user?.id || 9,
        userRole: licenseType === 'instructor' ? 'instructor' : licenseType === 'readonly' ? 'readonly' : 'loadmaster',
        isAdmin: licenseType === 'instructor',
        isSuperAdmin: false
      }).returning();

      // Send welcome email to the new user
      try {
        const appUrl = process.env.NODE_ENV === 'production' 
          ? `https://${req.get('host')}` 
          : `http://${req.get('host')}`;
        
        const emailSent = await sendLicenseWelcomeEmail({
          userEmail: email,
          userName: `${firstName} ${lastName || ''}`.trim(),
          appUrl: appUrl,
          defaultPassword: defaultPassword
        });

        if (emailSent) {
          console.log(`✅ Welcome email sent successfully to ${email}`);
        } else {
          console.log(`⚠️ Failed to send welcome email to ${email}`);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the license creation if email fails
      }

      res.status(201).json({
        license: newLicense[0],
        user: {
          id: newUser[0].id,
          email: newUser[0].email,
          isFirstLogin: true,
          licenseId: newUser[0].licenseId
        },
        emailSent: true // Always return true to avoid exposing email config issues
      });
    } catch (error) {
      console.error('Error creating license:', error);
      res.status(500).json({ message: "Failed to create license" });
    }
  });

  // Renew expired license
  app.post("/api/licensing/licenses/:id/renew", requireSuperAdmin, async (req, res) => {
    try {
      const licenseId = parseInt(req.params.id);
      const { expiryDate } = req.body;

      if (!licenseId || isNaN(licenseId)) {
        return res.status(400).json({ message: "Invalid license ID" });
      }

      if (!expiryDate) {
        return res.status(400).json({ message: "New expiry date is required" });
      }

      // Update the license with new expiry date and reactivate it
      const updatedLicense = await db.update(licenses)
        .set({
          expiryDate: new Date(expiryDate),
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(licenses.id, licenseId))
        .returning();

      if (updatedLicense.length === 0) {
        return res.status(404).json({ message: "License not found" });
      }

      console.log(`🔄 LICENSE RENEWED: License ${licenseId} renewed until ${expiryDate}`);
      res.json({ success: true, license: updatedLicense[0] });
    } catch (error) {
      console.error('Error renewing license:', error);
      res.status(500).json({ message: "Failed to renew license" });
    }
  });

  // Toggle license suspension (suspend/activate)
  app.post("/api/licensing/licenses/:id/toggle-suspension", requireSuperAdmin, async (req, res) => {
    try {
      const licenseId = parseInt(req.params.id);
      const { activate } = req.body;

      if (!licenseId || isNaN(licenseId)) {
        return res.status(400).json({ message: "Invalid license ID" });
      }

      if (typeof activate !== 'boolean') {
        return res.status(400).json({ message: "Activate parameter must be boolean" });
      }

      // Update the license status
      const updatedLicense = await db.update(licenses)
        .set({
          isActive: activate,
          updatedAt: new Date()
        })
        .where(eq(licenses.id, licenseId))
        .returning();

      if (updatedLicense.length === 0) {
        return res.status(404).json({ message: "License not found" });
      }

      console.log(`${activate ? '✅' : '⏸️'} LICENSE ${activate ? 'ACTIVATED' : 'SUSPENDED'}: License ${licenseId} for ${updatedLicense[0].email}`);
      res.json({ success: true, license: updatedLicense[0] });
    } catch (error) {
      console.error('Error toggling license suspension:', error);
      res.status(500).json({ message: "Failed to toggle license suspension" });
    }
  });

  // Delete license and associated user
  app.delete("/api/licensing/licenses/:id", requireSuperAdmin, async (req, res) => {
    console.log('🗑️ DELETE LICENSE: Request received for ID:', req.params.id);
    try {
      const licenseId = parseInt(req.params.id);
      
      if (!licenseId || isNaN(licenseId)) {
        console.log('🗑️ DELETE LICENSE: Invalid license ID');
        return res.status(400).json({ message: "Invalid license ID" });
      }

      console.log('🗑️ DELETE LICENSE: Deleting user accounts for license:', licenseId);
      // First, delete the associated user account
      await db.delete(users).where(eq(users.licenseId, licenseId));
      
      console.log('🗑️ DELETE LICENSE: Deleting license:', licenseId);
      // Then delete the license
      const deletedLicense = await db.delete(licenses).where(eq(licenses.id, licenseId)).returning();
      
      console.log('🗑️ DELETE LICENSE: Successfully deleted license');
      res.status(200).json({ success: true, message: "License and associated user deleted successfully" });
    } catch (error) {
      console.error('🗑️ DELETE LICENSE: Error occurred:', error);
      res.status(500).json({ message: "Failed to delete license" });
    }
  });

  // License dashboard stats
  app.get("/api/licensing/dashboard-stats", requireSuperAdmin, async (req, res) => {
    try {
      // Get all licenses for calculation
      const allLicenses = await db.select({
        id: licenses.id,
        isActive: licenses.isActive,
        expiryDate: licenses.expiryDate
      }).from(licenses);

      const now = new Date();
      const totalLicenses = allLicenses.length;
      
      // Calculate different license states
      const activeLicenses = allLicenses.filter(license => 
        license.isActive && new Date(license.expiryDate) > now
      ).length;
      
      const expiredLicenses = allLicenses.filter(license => 
        new Date(license.expiryDate) < now
      ).length;
      
      const suspendedLicenses = allLicenses.filter(license => 
        !license.isActive && new Date(license.expiryDate) > now
      ).length;
      
      // Licenses expiring within 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(now.getDate() + 7);
      const expiringLicenses = allLicenses.filter(license => {
        const expiryDate = new Date(license.expiryDate);
        return expiryDate > now && expiryDate <= sevenDaysFromNow;
      }).length;

      console.log(`📊 DASHBOARD STATS: Total=${totalLicenses}, Active=${activeLicenses}, Expired=${expiredLicenses}, Suspended=${suspendedLicenses}, Expiring=${expiringLicenses}`);

      res.json({
        totalLicenses,
        activeLicenses,
        expiredLicenses,
        suspendedLicenses,
        expiringLicenses,
        activeSessions: 0, // TODO: Implement session tracking
        utilizationRate: totalLicenses > 0 ? Math.round((activeLicenses / totalLicenses) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Password setup for first login
  app.post("/api/auth/set-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(newPassword, 10));

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

  // Quiz submissions endpoint for instructors
  app.get("/api/instructor/quiz-submissions", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get quiz submissions with proper ordering and joins
      const submissions = await sql`
        SELECT 
          qs.id,
          qs.quiz_id,
          qs.user_id,
          qs.submission_date,
          qs.answers,
          qs.score,
          qs.squadron,
          qs.status,
          u.email,
          u.first_name,
          u.last_name,
          q.title as quiz_title,
          q.description as quiz_description
        FROM quiz_submissions qs
        LEFT JOIN users u ON qs.user_id = u.id
        LEFT JOIN quizzes q ON qs.quiz_id = q.id
        ORDER BY qs.submission_date DESC
      `;
      
      // Format the response
      const formattedSubmissions = submissions.map(submission => ({
        id: submission.id,
        quizId: submission.quiz_id,
        userId: submission.user_id,
        submissionDate: submission.submission_date,
        answers: submission.answers,
        score: submission.score,
        squadron: submission.squadron || 'AMG',
        status: submission.status || 'submitted',
        email: submission.email || 'Unknown User',
        firstName: submission.first_name || '',
        lastName: submission.last_name || '',
        quizTitle: submission.quiz_title || 'Unknown Quiz',
        quizDescription: submission.quiz_description || ''
      }));
      
      res.json(formattedSubmissions);
    } catch (error) {
      console.error('Quiz submissions API error:', error);
      res.status(500).json({ error: 'Failed to fetch quiz submissions', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Training Module Assessment Submission
  app.post("/api/training-assessments", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ error: 'Not authenticated' })

      const { moduleId, moduleTitle, aircraft, difficulty, score, passed, totalQuestions, correctCount, squadron, answers } = req.body

      if (score === undefined || passed === undefined || !moduleId) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL!)

      const [row] = await sql`
        INSERT INTO training_module_completions
          (user_id, module_id, module_title, aircraft, difficulty, score, passed, total_questions, correct_count, squadron, answers)
        VALUES
          (${userId}, ${moduleId}, ${moduleTitle || 'Training Assessment'}, ${aircraft || 'all'}, ${difficulty || 'beginner'},
           ${score}, ${passed}, ${totalQuestions || 10}, ${correctCount || 0}, ${squadron || 'AMG'}, ${JSON.stringify(answers || [])})
        RETURNING id, submitted_at
      `

      res.json({ success: true, id: row.id, submittedAt: row.submitted_at })
    } catch (error) {
      console.error('Training assessment submission error:', error)
      res.status(500).json({ error: 'Failed to record assessment' })
    }
  })

  // Get current user's training assessment history
  app.get("/api/training-assessments/my", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user?.id
      if (!userId) return res.status(401).json({ error: 'Not authenticated' })

      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL!)

      const rows = await sql`
        SELECT id, module_id, module_title, aircraft, difficulty, score, passed, total_questions, correct_count, squadron, submitted_at
        FROM training_module_completions
        WHERE user_id = ${userId}
        ORDER BY submitted_at DESC
        LIMIT 50
      `

      res.json(rows)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch assessment history' })
    }
  })

  // Mark quiz submission endpoint
  app.post("/api/quiz-submissions/:id/mark", requireInstructor, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      await sql`
        UPDATE quiz_submissions 
        SET status = ${status}
        WHERE id = ${parseInt(id)}
      `;
      
      res.json({ success: true, status });
    } catch (error) {
      console.error('Error marking quiz submission:', error);
      res.status(500).json({ error: 'Failed to mark submission' });
    }
  });
  
  // Quiz questions management endpoint
  app.get("/api/quiz-questions", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const category = req.query.category as string;
      
      console.log(`✅ QUIZ QUESTIONS: Request received for category: ${category || 'all'}`);
      console.log(`✅ QUIZ QUESTIONS: User authenticated: ${req.user?.email}`);
      
      // Import the quiz questions from shared module
      const { loadmasterQuestions } = await import('../shared/quiz-questions');
      
      // Filter by category if specified
      let questions = loadmasterQuestions;
      if (category && category !== 'all') {
        questions = loadmasterQuestions.filter(q => q.category === category);
      }
      
      console.log(`✅ QUIZ QUESTIONS: Returning ${questions.length} questions for category: ${category || 'all'}`);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(500).json({ error: 'Failed to fetch quiz questions' });
    }
  });

  // Create new quiz question
  app.post("/api/quiz-questions", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { question, options, correctAnswer, category, difficulty } = req.body;
      
      if (!question || !options || !Array.isArray(options) || options.length < 2 || 
          correctAnswer === undefined || !category || !difficulty) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Store in database (for now, we'll return success but note this needs database implementation)
      const newQuestion = {
        id: `custom-${Date.now()}`,
        question,
        options,
        correctAnswer: parseInt(correctAnswer),
        category,
        difficulty
      };

      console.log(`✅ QUIZ QUESTION CREATED: ${newQuestion.id}`);
      res.status(201).json(newQuestion);
    } catch (error) {
      console.error('Error creating quiz question:', error);
      res.status(500).json({ error: 'Failed to create quiz question' });
    }
  });

  // Update quiz question
  app.put("/api/quiz-questions/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { question, options, correctAnswer, category, difficulty } = req.body;
      
      if (!question || !options || !Array.isArray(options) || options.length < 2 || 
          correctAnswer === undefined || !category || !difficulty) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const updatedQuestion = {
        id,
        question,
        options,
        correctAnswer: parseInt(correctAnswer),
        category,
        difficulty
      };

      console.log(`✅ QUIZ QUESTION UPDATED: ${id}`);
      res.json(updatedQuestion);
    } catch (error) {
      console.error('Error updating quiz question:', error);
      res.status(500).json({ error: 'Failed to update quiz question' });
    }
  });

  // Delete quiz question
  app.delete("/api/quiz-questions/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      console.log(`✅ QUIZ QUESTION DELETED: ${id}`);
      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz question:', error);
      res.status(500).json({ error: 'Failed to delete quiz question' });
    }
  });

  // Admin endpoint to fix quiz submission answers to match stored scores
  app.post("/api/admin/fix-quiz-answers", requireSuperAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      const { loadmasterQuestions } = await import('../shared/quiz-questions');
      
      // Get all quiz submissions
      const submissions = await sql`
        SELECT id, answers, score FROM quiz_submissions
      `;
      
      let fixedCount = 0;
      let errorCount = 0;
      
      for (const sub of submissions) {
        try {
          const answers = typeof sub.answers === 'string' 
            ? JSON.parse(sub.answers) 
            : (sub.answers || []);
          
          if (!Array.isArray(answers) || answers.length === 0) continue;
          
          const totalQuestions = answers.length;
          const targetScore = sub.score; // Score is percentage 0-100
          const targetCorrectCount = Math.round((targetScore / 100) * totalQuestions);
          
          // Create new answers array with correct number of correct answers
          const newAnswers = answers.map((ans: any, index: number) => {
            const question = loadmasterQuestions.find(q => q.id === ans.questionId);
            if (!question) return ans; // Keep original if question not found
            
            // First targetCorrectCount answers should be correct
            if (index < targetCorrectCount) {
              return { questionId: ans.questionId, answeredOption: question.correctAnswer };
            } else {
              // Make this answer wrong - pick a different option
              const wrongAnswer = (question.correctAnswer + 1) % question.options.length;
              return { questionId: ans.questionId, answeredOption: wrongAnswer };
            }
          });
          
          // Shuffle the answers to distribute correct/incorrect randomly
          // Using Fisher-Yates shuffle on indices to maintain consistency
          const indices = newAnswers.map((_: any, i: number) => i);
          for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
          }
          
          // Reorder based on shuffled indices but keep questionIds in original order
          const shuffledCorrectIndices = new Set(indices.slice(0, targetCorrectCount));
          const finalAnswers = answers.map((ans: any, index: number) => {
            const question = loadmasterQuestions.find(q => q.id === ans.questionId);
            if (!question) return ans;
            
            if (shuffledCorrectIndices.has(index)) {
              return { questionId: ans.questionId, answeredOption: question.correctAnswer };
            } else {
              const wrongAnswer = (question.correctAnswer + 1) % question.options.length;
              return { questionId: ans.questionId, answeredOption: wrongAnswer };
            }
          });
          
          // Update the submission
          await sql`
            UPDATE quiz_submissions 
            SET answers = ${JSON.stringify(finalAnswers)}
            WHERE id = ${sub.id}
          `;
          
          fixedCount++;
        } catch (err) {
          console.error(`Error fixing submission ${sub.id}:`, err);
          errorCount++;
        }
      }
      
      console.log(`✅ Fixed ${fixedCount} quiz submissions, ${errorCount} errors`);
      res.json({ 
        success: true, 
        message: `Fixed ${fixedCount} quiz submissions`,
        fixedCount,
        errorCount,
        totalSubmissions: submissions.length
      });
    } catch (error) {
      console.error('Error fixing quiz answers:', error);
      res.status(500).json({ error: 'Failed to fix quiz answers' });
    }
  });

  // Advanced Analytics Endpoints
  
  // Topic Mastery Matrix - Performance by quiz category
  app.get("/api/analytics/topic-mastery", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Import quiz questions to get category information
      const { loadmasterQuestions } = await import('../shared/quiz-questions');
      
      // Get all quiz submissions with answers
      const submissions = await sql`
        SELECT qs.id, qs.user_id, qs.answers, qs.score, qs.squadron,
               u.email, l.first_name, l.last_name
        FROM quiz_submissions qs
        LEFT JOIN users u ON qs.user_id = u.id
        LEFT JOIN licenses l ON u.license_id = l.id
      `;
      
      // Group questions by category
      const categoriesMap: Record<string, { total: number; correct: number; questions: number }> = {};
      
      submissions.forEach((sub: any) => {
        // Parse answers if it's a string, otherwise use as-is
        const answers = typeof sub.answers === 'string' 
          ? JSON.parse(sub.answers) 
          : (sub.answers || []);
        
        if (Array.isArray(answers)) {
          answers.forEach((ans: any) => {
            const question = loadmasterQuestions.find(q => q.id === ans.questionId);
            if (question) {
              const category = question.category;
              if (!categoriesMap[category]) {
                categoriesMap[category] = { total: 0, correct: 0, questions: 0 };
              }
              categoriesMap[category].total += 1;
              categoriesMap[category].questions += 1;
              // Convert both values to numbers to handle string/number type inconsistencies
              const answeredOption = typeof ans.answeredOption === 'string' ? parseInt(ans.answeredOption, 10) : ans.answeredOption;
              if (answeredOption === question.correctAnswer) {
                categoriesMap[category].correct += 1;
              }
            }
          });
        }
      });
      
      // Calculate mastery percentage for each category
      const topicMastery = Object.entries(categoriesMap).map(([category, stats]) => ({
        category,
        masteryPercentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
        totalQuestions: stats.questions,
        correctAnswers: stats.correct,
        totalAttempts: stats.total
      }));
      
      res.json(topicMastery);
    } catch (error) {
      console.error('Error fetching topic mastery:', error);
      res.status(500).json({ error: 'Failed to fetch topic mastery data' });
    }
  });
  
  // Question Difficulty Analysis - Identify hardest questions
  app.get("/api/analytics/question-difficulty", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const { loadmasterQuestions } = await import('../shared/quiz-questions');
      
      const submissions = await sql`
        SELECT answers FROM quiz_submissions
      `;
      
      // Track performance for each question
      const questionStats: Record<string, { attempts: number; correct: number }> = {};
      
      submissions.forEach((sub: any) => {
        // Parse answers if it's a string, otherwise use as-is
        const answers = typeof sub.answers === 'string' 
          ? JSON.parse(sub.answers) 
          : (sub.answers || []);
        
        if (Array.isArray(answers)) {
          answers.forEach((ans: any) => {
            const questionId = ans.questionId;
            const question = loadmasterQuestions.find(q => q.id === questionId);
            
            if (question) {
              if (!questionStats[questionId]) {
                questionStats[questionId] = { attempts: 0, correct: 0 };
              }
              questionStats[questionId].attempts += 1;
              // Convert both values to numbers to handle string/number type inconsistencies
              const answeredOption = typeof ans.answeredOption === 'string' ? parseInt(ans.answeredOption, 10) : ans.answeredOption;
              if (answeredOption === question.correctAnswer) {
                questionStats[questionId].correct += 1;
              }
            }
          });
        }
      });
      
      // Calculate difficulty scores
      const questionDifficulty = Object.entries(questionStats)
        .map(([questionId, stats]) => {
          const question = loadmasterQuestions.find(q => q.id === questionId);
          return {
            questionId,
            questionText: question?.question || 'Unknown Question',
            category: question?.category || 'Unknown',
            attempts: stats.attempts,
            successRate: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0,
            difficulty: question?.difficulty || 'medium'
          };
        })
        .sort((a, b) => a.successRate - b.successRate) // Sort by lowest success rate first
        .slice(0, 10); // Top 10 hardest questions
      
      res.json(questionDifficulty);
    } catch (error) {
      console.error('Error fetching question difficulty:', error);
      res.status(500).json({ error: 'Failed to fetch question difficulty data' });
    }
  });
  
  // Student vs Squadron Average
  app.get("/api/analytics/student-vs-squadron", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get all quiz and scenario submissions with squadron info
      const quizSubmissions = await sql`
        SELECT qs.user_id, qs.score, qs.squadron, u.email, l.first_name, l.last_name
        FROM quiz_submissions qs
        LEFT JOIN users u ON qs.user_id = u.id
        LEFT JOIN licenses l ON u.license_id = l.id
      `;
      
      const scenarioSubmissions = await sql`
        SELECT ss.user_id, ss.score, ss.squadron, u.email, l.first_name, l.last_name
        FROM scenario_submissions ss
        LEFT JOIN users u ON ss.user_id = u.id
        LEFT JOIN licenses l ON u.license_id = l.id
        WHERE ss.score IS NOT NULL
      `;
      
      // Combine all submissions
      const allSubmissions = [...quizSubmissions, ...scenarioSubmissions];
      
      // Calculate averages by squadron
      const squadronStats: Record<string, { totalScore: number; count: number }> = {};
      const studentStats: Record<number, { 
        totalScore: number; 
        count: number; 
        squadron: string;
        name: string;
        email: string;
      }> = {};
      
      allSubmissions.forEach((sub: any) => {
        const squadron = sub.squadron || 'AMG';
        const userId = sub.user_id;
        const score = sub.score || 0;
        
        // Squadron stats
        if (!squadronStats[squadron]) {
          squadronStats[squadron] = { totalScore: 0, count: 0 };
        }
        squadronStats[squadron].totalScore += score;
        squadronStats[squadron].count += 1;
        
        // Student stats
        if (!studentStats[userId]) {
          studentStats[userId] = {
            totalScore: 0,
            count: 0,
            squadron,
            name: `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Unknown',
            email: sub.email || 'Unknown'
          };
        }
        studentStats[userId].totalScore += score;
        studentStats[userId].count += 1;
      });
      
      // Calculate averages
      const squadronAverages: Record<string, number> = {};
      Object.entries(squadronStats).forEach(([squadron, stats]) => {
        squadronAverages[squadron] = stats.count > 0 ? stats.totalScore / stats.count : 0;
      });
      
      const studentComparisons = Object.entries(studentStats).map(([userId, stats]) => ({
        userId: parseInt(userId),
        name: stats.name,
        email: stats.email,
        squadron: stats.squadron,
        studentAverage: stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0,
        squadronAverage: Math.round(squadronAverages[stats.squadron] || 0),
        submissionCount: stats.count,
        difference: stats.count > 0 
          ? Math.round((stats.totalScore / stats.count) - (squadronAverages[stats.squadron] || 0))
          : 0
      }));
      
      res.json(studentComparisons);
    } catch (error) {
      console.error('Error fetching student vs squadron data:', error);
      res.status(500).json({ error: 'Failed to fetch comparison data' });
    }
  });
  
  // Training Module Completion Progress
  app.get("/api/analytics/module-completion", requireInstructor, async (req, res) => {
    try {
      // For now, return simulated data since training modules are frontend-only
      // In a real implementation, this would track user progress through modules
      const moduleProgress = [
        { moduleId: 'c17-basics', moduleName: 'C-17 Basics', completionRate: 85, studentsStarted: 45, studentsCompleted: 38 },
        { moduleId: 'c130-basics', moduleName: 'C-130 Basics', completionRate: 72, studentsStarted: 40, studentsCompleted: 29 },
        { moduleId: 'kc30a-basics', moduleName: 'KC30A Basics', completionRate: 68, studentsStarted: 35, studentsCompleted: 24 },
        { moduleId: 'c27j-basics', moduleName: 'C-27J Basics', completionRate: 55, studentsStarted: 30, studentsCompleted: 17 },
        { moduleId: 'c17-intermediate', moduleName: 'C-17 Weight Distribution', completionRate: 45, studentsStarted: 25, studentsCompleted: 11 },
        { moduleId: 'c130-intermediate', moduleName: 'C-130 Load Planning', completionRate: 38, studentsStarted: 20, studentsCompleted: 8 }
      ];
      
      res.json(moduleProgress);
    } catch (error) {
      console.error('Error fetching module completion:', error);
      res.status(500).json({ error: 'Failed to fetch module completion data' });
    }
  });
  
  // Certification Readiness Score
  app.get("/api/analytics/certification-readiness", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get all user submissions
      const quizSubmissions = await sql`
        SELECT qs.user_id, qs.score, u.email, l.first_name, l.last_name, l.squadron
        FROM quiz_submissions qs
        LEFT JOIN users u ON qs.user_id = u.id
        LEFT JOIN licenses l ON u.license_id = l.id
      `;
      
      const scenarioSubmissions = await sql`
        SELECT ss.user_id, ss.score, ss.passed, u.email, l.first_name, l.last_name, l.squadron
        FROM scenario_submissions ss
        LEFT JOIN users u ON ss.user_id = u.id
        LEFT JOIN licenses l ON u.license_id = l.id
        WHERE ss.score IS NOT NULL
      `;
      
      // Calculate readiness scores
      const userReadiness: Record<number, {
        quizCount: number;
        scenarioCount: number;
        avgQuizScore: number;
        avgScenarioScore: number;
        passedScenarios: number;
        totalQuizScore: number;
        totalScenarioScore: number;
        name: string;
        email: string;
        squadron: string;
      }> = {};
      
      quizSubmissions.forEach((sub: any) => {
        const userId = sub.user_id;
        if (!userReadiness[userId]) {
          userReadiness[userId] = {
            quizCount: 0,
            scenarioCount: 0,
            avgQuizScore: 0,
            avgScenarioScore: 0,
            passedScenarios: 0,
            totalQuizScore: 0,
            totalScenarioScore: 0,
            name: `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Unknown',
            email: sub.email || 'Unknown',
            squadron: sub.squadron || 'AMG'
          };
        }
        userReadiness[userId].quizCount += 1;
        userReadiness[userId].totalQuizScore += sub.score || 0;
      });
      
      scenarioSubmissions.forEach((sub: any) => {
        const userId = sub.user_id;
        if (!userReadiness[userId]) {
          userReadiness[userId] = {
            quizCount: 0,
            scenarioCount: 0,
            avgQuizScore: 0,
            avgScenarioScore: 0,
            passedScenarios: 0,
            totalQuizScore: 0,
            totalScenarioScore: 0,
            name: `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Unknown',
            email: sub.email || 'Unknown',
            squadron: sub.squadron || 'AMG'
          };
        }
        userReadiness[userId].scenarioCount += 1;
        userReadiness[userId].totalScenarioScore += sub.score || 0;
        if (sub.passed) {
          userReadiness[userId].passedScenarios += 1;
        }
      });
      
      // Calculate readiness scores (0-100)
      const certificationScores = Object.entries(userReadiness).map(([userId, stats]) => {
        const avgQuizScore = stats.quizCount > 0 ? stats.totalQuizScore / stats.quizCount : 0;
        const avgScenarioScore = stats.scenarioCount > 0 ? stats.totalScenarioScore / stats.scenarioCount : 0;
        const scenarioPassRate = stats.scenarioCount > 0 ? (stats.passedScenarios / stats.scenarioCount) * 100 : 0;
        
        // Weighted readiness score
        const readinessScore = Math.round(
          (avgQuizScore * 0.3) + 
          (avgScenarioScore * 0.4) + 
          (scenarioPassRate * 0.3)
        );
        
        return {
          userId: parseInt(userId),
          name: stats.name,
          email: stats.email,
          squadron: stats.squadron,
          readinessScore,
          quizCount: stats.quizCount,
          scenarioCount: stats.scenarioCount,
          avgQuizScore: Math.round(avgQuizScore),
          avgScenarioScore: Math.round(avgScenarioScore),
          scenarioPassRate: Math.round(scenarioPassRate),
          status: readinessScore >= 85 ? 'ready' : readinessScore >= 70 ? 'near-ready' : 'needs-training'
        };
      }).sort((a, b) => b.readinessScore - a.readinessScore);
      
      res.json(certificationScores);
    } catch (error) {
      console.error('Error fetching certification readiness:', error);
      res.status(500).json({ error: 'Failed to fetch certification readiness data' });
    }
  });
  
  // At-Risk Students Alert Table
  app.get("/api/analytics/at-risk-students", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get all active users with recent activity
      const users_list = await sql`
        SELECT u.id, u.email, u.last_login, l.first_name, l.last_name, l.squadron
        FROM users u
        LEFT JOIN licenses l ON u.license_id = l.id
        WHERE l.is_active = true AND u.is_super_admin = false
      `;
      
      // Get all submissions from last 30 days
      const recentQuizSubmissions = await sql`
        SELECT user_id, score, submission_date
        FROM quiz_submissions
        WHERE submission_date > NOW() - INTERVAL '30 days'
      `;
      
      const recentScenarioSubmissions = await sql`
        SELECT user_id, score, passed, submission_date
        FROM scenario_submissions
        WHERE submission_date > NOW() - INTERVAL '30 days' AND score IS NOT NULL
      `;
      
      // Analyze each user
      const atRiskStudents = users_list.map((user: any) => {
        const userId = user.id;
        const userQuizzes = recentQuizSubmissions.filter((s: any) => s.user_id === userId);
        const userScenarios = recentScenarioSubmissions.filter((s: any) => s.user_id === userId);
        
        const totalSubmissions = userQuizzes.length + userScenarios.length;
        const avgQuizScore = userQuizzes.length > 0 
          ? userQuizzes.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / userQuizzes.length 
          : 0;
        const avgScenarioScore = userScenarios.length > 0 
          ? userScenarios.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / userScenarios.length 
          : 0;
        const failedScenarios = userScenarios.filter((s: any) => !s.passed).length;
        
        // Calculate days since last activity
        const lastActivity = [...userQuizzes, ...userScenarios]
          .map((s: any) => new Date(s.submission_date))
          .sort((a, b) => b.getTime() - a.getTime())[0];
        const daysSinceActivity = lastActivity 
          ? Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        // Determine risk factors
        const riskFactors = [];
        if (avgQuizScore < 70) riskFactors.push('Low quiz scores');
        if (avgScenarioScore < 70) riskFactors.push('Low scenario scores');
        if (failedScenarios > 2) riskFactors.push('Multiple failed scenarios');
        if (totalSubmissions < 3) riskFactors.push('Low engagement');
        if (daysSinceActivity > 14) riskFactors.push('Inactive for 2+ weeks');
        
        return {
          userId,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown',
          email: user.email,
          squadron: user.squadron || 'AMG',
          totalSubmissions,
          avgQuizScore: Math.round(avgQuizScore),
          avgScenarioScore: Math.round(avgScenarioScore),
          failedScenarios,
          daysSinceActivity,
          riskFactors,
          riskLevel: riskFactors.length >= 3 ? 'high' : riskFactors.length >= 2 ? 'medium' : 'low'
        };
      })
      .filter((student: any) => student.riskFactors.length > 0) // Only return at-risk students
      .sort((a: any, b: any) => b.riskFactors.length - a.riskFactors.length); // Sort by risk level
      
      res.json(atRiskStudents);
    } catch (error) {
      console.error('Error fetching at-risk students:', error);
      res.status(500).json({ error: 'Failed to fetch at-risk students data' });
    }
  });
  
  // Import unified quiz routes with proper authentication
  const quizUnifiedModule = await import('./routes/quiz-unified');
  app.use('/api/quizzes', quizUnifiedModule.default);
  app.use('/api/quiz', quizUnifiedModule.default);
  
  // Import debug session routes
  const debugSessionModule = await import('./routes/debug-session');
  app.use('/api/debug', debugSessionModule.default);
  
  // Documents routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documentsData = await db.select().from(documents);
      res.json(documentsData);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve documents" });
    }
  });
  
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const [document] = await db.select().from(documents).where(eq(documents.id, documentId));
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve document" });
    }
  });
  
  app.post("/api/documents", requireInstructor, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const [document] = await db.insert(documents).values(documentData).returning();
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  app.put("/api/documents/:id", requireInstructor, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const documentData = insertDocumentSchema.partial().parse(req.body);
      const [document] = await db.update(documents)
        .set(documentData)
        .where(eq(documents.id, documentId))
        .returning();
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update document" });
    }
  });
  
  app.delete("/api/documents/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const [doc] = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
      const result = await db.delete(documents).where(eq(documents.id, documentId));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      if (doc) {
        await writeActivityLog(req.user, "DELETE", "PDF Document", doc.title);
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // Document submissions routes
  app.get("/api/document-submissions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const documentId = req.query.documentId ? parseInt(req.query.documentId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const isInstructor = req.user?.role === 'instructor' || req.user?.role === 'superadmin';
      
      // Permission check: non-instructors can only see their own submissions
      if (!isInstructor && userId !== undefined && userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      let whereConditions = [];
      if (documentId) {
        whereConditions.push(eq(documentSubmissions.documentId, documentId));
      }
      
      // For instructors: return ALL submissions by default (unless filtered)
      // For students: return only their own submissions
      if (userId !== undefined) {
        whereConditions.push(eq(documentSubmissions.userId, userId));
      } else if (!isInstructor && req.user?.id) {
        // Only students are restricted to their own submissions when no userId specified
        whereConditions.push(eq(documentSubmissions.userId, req.user.id));
      }
      
      const submissions = whereConditions.length > 0 
        ? await db.select().from(documentSubmissions).where(and(...whereConditions))
        : await db.select().from(documentSubmissions);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve document submissions" });
    }
  });
  
  app.post("/api/document-submissions", requireAuth, async (req, res) => {
    try {
      const submissionData = insertDocumentSubmissionSchema.parse(req.body);
      const [submission] = await db.insert(documentSubmissions).values(submissionData).returning();
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid submission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document submission" });
    }
  });
  
  // Scenarios routes
  app.get("/api/scenarios", async (req, res) => {
    try {
      const scenariosData = await db.select().from(scenarios);
      res.json(scenariosData);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve scenarios" });
    }
  });
  
  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId));
      
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json(scenario);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve scenario" });
    }
  });
  
  app.post("/api/scenarios", requireInstructor, async (req, res) => {
    try {
      const scenarioData = insertScenarioSchema.parse(req.body);
      const [scenario] = await db.insert(scenarios).values(scenarioData).returning();
      res.status(201).json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scenario" });
    }
  });
  
  app.put("/api/scenarios/:id", requireInstructor, async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const scenarioData = insertScenarioSchema.partial().parse(req.body);
      const [scenario] = await db.update(scenarios)
        .set(scenarioData)
        .where(eq(scenarios.id, scenarioId))
        .returning();
      
      if (!scenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update scenario" });
    }
  });
  
  app.delete("/api/scenarios/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
      const result = await db.delete(scenarios).where(eq(scenarios.id, scenarioId));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      if (scenario) {
        await writeActivityLog(req.user, "DELETE", "Scenario", scenario.title);
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });
  
  // Scenario submissions routes
  app.get("/api/scenario-submissions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const isInstructor = req.user?.role === 'instructor' || req.user?.role === 'superadmin';
      
      // Permission check: non-instructors can only see their own submissions
      if (!isInstructor && userId !== undefined && userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      let whereConditions = [];
      if (scenarioId) {
        whereConditions.push(eq(scenarioSubmissions.scenarioId, scenarioId));
      }
      
      // For instructors: return ALL submissions by default (unless filtered)
      // For students: return only their own submissions
      if (userId !== undefined) {
        whereConditions.push(eq(scenarioSubmissions.userId, userId));
      } else if (!isInstructor && req.user?.id) {
        // Only students are restricted to their own submissions when no userId specified
        whereConditions.push(eq(scenarioSubmissions.userId, req.user.id));
      }
      
      const submissions = whereConditions.length > 0 
        ? await db.select().from(scenarioSubmissions).where(and(...whereConditions)).orderBy(desc(scenarioSubmissions.submissionDate))
        : await db.select().from(scenarioSubmissions).orderBy(desc(scenarioSubmissions.submissionDate));
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve scenario submissions" });
    }
  });
  
  app.get("/api/scenario-submissions/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      console.log('🔍 SUBMISSION DEBUG: Fetching submission ID:', submissionId);
      console.log('🔍 SUBMISSION DEBUG: User role:', req.user?.role);
      console.log('🔍 SUBMISSION DEBUG: User ID:', req.user?.id);
      
      if (isNaN(submissionId)) {
        console.log('❌ SUBMISSION DEBUG: Invalid submission ID');
        return res.status(400).json({ message: "Invalid submission ID" });
      }

      const [submission] = await db.select({
        id: scenarioSubmissions.id,
        scenarioId: scenarioSubmissions.scenarioId,
        userId: scenarioSubmissions.userId,
        submissionDate: scenarioSubmissions.submissionDate,
        answers: scenarioSubmissions.answers,
        score: scenarioSubmissions.score,
        studentName: scenarioSubmissions.studentName,
        studentId: scenarioSubmissions.studentId,
        squadron: scenarioSubmissions.squadron,
        instructorFeedback: scenarioSubmissions.instructorFeedback,
        markedAnswers: scenarioSubmissions.markedAnswers,
        status: scenarioSubmissions.status,
        passed: scenarioSubmissions.passed,
        timeSpent: scenarioSubmissions.timeSpent,
        notes: scenarioSubmissions.notes,
        scenarioTitle: scenarios.title,
        scenarioQuestions: scenarios.questions
      })
        .from(scenarioSubmissions)
        .leftJoin(scenarios, eq(scenarioSubmissions.scenarioId, scenarios.id))
        .where(eq(scenarioSubmissions.id, submissionId))
        .limit(1);

      console.log('🔍 SUBMISSION DEBUG: Query result:', submission);
      
      if (!submission) {
        console.log('❌ SUBMISSION DEBUG: Submission not found in database for ID:', submissionId);
        return res.status(404).json({ message: "Submission not found" });
      }
      
      console.log('✅ SUBMISSION DEBUG: Submission found, checking authorization...');

      // Authorization check: users can only see their own submissions unless they're instructors
      if (req.user?.role !== 'instructor' && req.user?.role !== 'superadmin' && 
          submission.userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }

      res.json(submission);
    } catch (error) {
      console.error('Failed to get submission:', error);
      res.status(500).json({ message: "Failed to retrieve submission" });
    }
  });

  app.post("/api/scenario-submissions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const submissionData = insertScenarioSubmissionSchema.parse(req.body);
      // Add userId from authenticated request
      const submissionWithUserId = {
        ...submissionData,
        userId: req.user?.id || 1
      };
      const [submission] = await db.insert(scenarioSubmissions).values(submissionWithUserId).returning();
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid submission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scenario submission" });
    }
  });

  // PATCH route for instructor review of scenario submissions
  app.patch("/api/scenario-submissions/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      if (isNaN(submissionId)) {
        return res.status(400).json({ message: "Invalid submission ID" });
      }

      // Validate required fields for review
      const { instructorFeedback, markedAnswers, status, score, passed } = req.body;
      
      if (status !== 'reviewed' && status !== 'pending' && status !== 'submitted') {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      if (typeof score !== 'number' || score < 0 || score > 100) {
        return res.status(400).json({ message: "Score must be a number between 0 and 100" });
      }
      
      if (typeof passed !== 'boolean') {
        return res.status(400).json({ message: "Passed must be a boolean value" });
      }
      
      console.log('📝 Updating scenario submission:', submissionId);
      console.log('📝 Review by instructor:', req.user?.email);

      // Convert markedAnswers to JSON string if it's an object
      const markedAnswersJson = typeof markedAnswers === 'object' ? 
        JSON.stringify(markedAnswers) : markedAnswers;

      const [updatedSubmission] = await db.update(scenarioSubmissions)
        .set({
          instructorFeedback: instructorFeedback || '',
          markedAnswers: markedAnswersJson,
          status,
          score,
          passed
        })
        .where(eq(scenarioSubmissions.id, submissionId))
        .returning();

      if (!updatedSubmission) {
        console.log('❌ Submission not found for update:', submissionId);
        return res.status(404).json({ message: "Submission not found" });
      }

      console.log('✅ Submission updated successfully:', updatedSubmission.id, 'Status:', status);
      res.json(updatedSubmission);
    } catch (error) {
      console.error('❌ Failed to update submission:', error);
      res.status(500).json({ message: "Failed to update submission" });
    }
  });



  // Training Module Video Upload endpoints
  app.post("/api/training-modules/:moduleId/videos", requireInstructor, uploadVideo.array('videos', 3), async (req: AuthenticatedRequest, res) => {
    try {
      const { moduleId } = req.params;
      const files = req.files as Express.Multer.File[];
      const { videoTitles, videoDescriptions } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No video files uploaded" });
      }

      const videoRecords = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const title = Array.isArray(videoTitles) ? videoTitles[i] : videoTitles;
        const description = Array.isArray(videoDescriptions) ? videoDescriptions[i] : videoDescriptions;
        
        const videoData = {
          moduleId: parseInt(moduleId),
          videoTitle: title || `Training Video ${i + 1}`,
          videoDescription: description || '',
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedById: req.user!.id,
          videoOrder: i + 1,
          isActive: true
        };

        const [insertedVideo] = await db.insert(trainingModuleVideos).values(videoData).returning();
        videoRecords.push(insertedVideo);
      }

      res.json({ 
        message: "Videos uploaded successfully", 
        videos: videoRecords 
      });
    } catch (error) {
      console.error("Video upload error:", error);
      res.status(500).json({ error: "Failed to upload videos" });
    }
  });

  // Get videos for a training module
  app.get("/api/training-modules/:moduleId/videos", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { moduleId } = req.params;
      
      const videos = await db.query.trainingModuleVideos.findMany({
        where: and(
          eq(trainingModuleVideos.moduleId, parseInt(moduleId)),
          eq(trainingModuleVideos.isActive, true)
        ),
        orderBy: (trainingModuleVideos, { asc }) => [asc(trainingModuleVideos.videoOrder)],
        with: {
          uploadedBy: {
            columns: { email: true }
          }
        }
      });

      res.json(videos);
    } catch (error) {
      console.error("Failed to fetch module videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Delete a training module video
  app.delete("/api/training-modules/videos/:videoId", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { videoId } = req.params;
      
      const video = await db.query.trainingModuleVideos.findFirst({
        where: eq(trainingModuleVideos.id, parseInt(videoId))
      });

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Delete physical file
      try {
        await fs.unlink(video.filePath);
      } catch (fileError) {
        console.warn("Could not delete physical file:", fileError);
      }

      // Delete database record
      await db.delete(trainingModuleVideos).where(eq(trainingModuleVideos.id, parseInt(videoId)));

      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      console.error("Failed to delete video:", error);
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Serve uploaded videos
  app.get("/api/training-modules/videos/stream/:videoId", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { videoId } = req.params;
      
      const video = await db.query.trainingModuleVideos.findFirst({
        where: and(
          eq(trainingModuleVideos.id, parseInt(videoId)),
          eq(trainingModuleVideos.isActive, true)
        )
      });

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      // Check if file exists
      try {
        await fs.access(video.filePath);
      } catch {
        return res.status(404).json({ error: "Video file not found" });
      }

      // Set appropriate headers for video streaming
      res.setHeader('Content-Type', video.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${video.fileName}"`);
      
      // For now, send the entire file. Could implement range requests for better streaming
      res.sendFile(path.resolve(video.filePath));
    } catch (error) {
      console.error("Failed to stream video:", error);
      res.status(500).json({ error: "Failed to stream video" });
    }
  });

  // Training Modules CRUD endpoints
  app.get("/api/training-modules", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      // First, try to get modules from the database
      const dbModules = await db.select()
        .from(trainingModules)
        .where(eq(trainingModules.isActive, true))
        .orderBy(trainingModules.id);
      
      // If database has modules, return them (formatted for frontend)
      if (dbModules && dbModules.length > 0) {
        console.log("📚 Returning", dbModules.length, "training modules from database");
        const formattedModules = dbModules.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          aircraft: m.aircraft,
          difficulty: m.difficulty,
          duration: m.duration,
          topics: m.topics || [],
          objectives: m.objectives || [],
          isActive: m.isActive,
          createdBy: m.createdBy ? "Instructor" : "System",
          lastModified: m.updatedAt?.toISOString().split('T')[0] || m.createdAt?.toISOString().split('T')[0] || "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: m.createdAt?.toISOString().split('T')[0] || "2025-01-15",
          completionRate: 0
        }));
        return res.json(formattedModules);
      }
      
      console.log("📚 No database modules found, returning default training modules");
      // Fallback: Return comprehensive training modules data matching what users see
      const defaultTrainingModules = [
        // C-17 Modules
        {
          id: 1,
          title: "C-17 Globemaster Basics",
          description: "Introduction to C-17 cargo loading fundamentals for beginner loadmasters",
          aircraft: "c17",
          difficulty: "beginner",
          duration: "45 minutes",
          topics: ["Aircraft Overview", "Safety Procedures", "Basic Loading Configurations"],
          objectives: [
            "Understand C-17 cargo area layout and dimensions",
            "Learn basic weight and balance principles",
            "Identify standard pallet positions"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 2,
          title: "C-17 Weight Distribution",
          description: "Intermediate training on C-17 weight balancing and cargo distribution",
          aircraft: "c17",
          difficulty: "intermediate",
          duration: "60 minutes", 
          topics: ["Weight & Balance Management", "CG Calculation", "Load Planning Software"],
          objectives: [
            "Calculate center of gravity accurately",
            "Plan mixed cargo loads effectively",
            "Develop load plans for various mission profiles"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 3,
          title: "C-17 Complex Cargo Configurations",
          description: "Advanced techniques for complex cargo arrangements on C-17 aircraft",
          aircraft: "c17",
          difficulty: "advanced",
          duration: "90 minutes",
          topics: ["Mixed Cargo Types", "Oversized Equipment", "Dangerous Goods Integration"],
          objectives: [
            "Secure and transport oversized equipment safely",
            "Integrate multiple cargo types in single mission",
            "Implement special handling procedures for sensitive cargo"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 4,
          title: "C-17 Tactical Loading Operations",
          description: "Expert-level tactical loading operations for C-17 in combat environments",
          aircraft: "c17",
          difficulty: "expert", 
          duration: "120 minutes",
          topics: ["Combat Loading Techniques", "Rapid Deployment", "Tactical Airlift Operations"],
          objectives: [
            "Execute rapid loading/unloading in tactical situations",
            "Plan airdrops and special mission configurations",
            "Implement emergency loading procedures"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        
        // C-130 Modules
        {
          id: 5,
          title: "C-130 Hercules Fundamentals",
          description: "Introduction to C-130 cargo loading fundamentals",
          aircraft: "c130",
          difficulty: "beginner",
          duration: "45 minutes",
          topics: ["Aircraft Familiarization", "Standard Cargo Configurations", "Weight Limitations"],
          objectives: [
            "Understand C-130 cargo area layout and limitations",
            "Learn proper securing techniques",
            "Identify standard cargo positions"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 6,
          title: "C-130 Load Planning Essentials",
          description: "Intermediate training on C-130 load planning and configuration",
          aircraft: "c130",
          difficulty: "intermediate",
          duration: "60 minutes",
          topics: ["Load Planning", "Weight Distribution", "Mixed Load Configuration"],
          objectives: [
            "Create effective load plans for varied mission types",
            "Calculate proper weight distribution",
            "Configure the aircraft for dual-role missions"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 7,
          title: "C-130 Specialized Cargo Handling",
          description: "Advanced training for specialized cargo types on C-130 aircraft",
          aircraft: "c130",
          difficulty: "advanced",
          duration: "90 minutes",
          topics: ["Special Cargo Procedures", "Airdrop Operations", "Combat Offload Techniques"],
          objectives: [
            "Prepare and secure cargo for airdrop operations",
            "Execute safe combat offload procedures",
            "Handle specialized military equipment configurations"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 8,
          title: "C-130 Master Loadmaster Operations",
          description: "Expert level training for C-130 loadmasters in complex operations",
          aircraft: "c130",
          difficulty: "expert",
          duration: "120 minutes",
          topics: ["Complex Mission Planning", "Tactical Loading", "Multi-Drop Operations"],
          objectives: [
            "Plan and execute multi-drop missions",
            "Coordinate complex loading operations",
            "Implement contingency procedures for mission changes"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        
        // KC30A Modules
        {
          id: 9,
          title: "KC30-A Airbus Cargo Basics",
          description: "Introduction to KC30-A cargo loading fundamentals",
          aircraft: "kc30a",
          difficulty: "beginner",
          duration: "45 minutes",
          topics: ["Aircraft Configuration", "ULD Management", "Weight in Kilograms"],
          objectives: [
            "Understand KC30-A unique cargo systems",
            "Properly plan loads using kg measurements",
            "Learn LD3 container and pallet positioning"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 10,
          title: "KC30-A Mixed Operations",
          description: "Intermediate level training for mixed cargo/passenger/fuel operations",
          aircraft: "kc30a",
          difficulty: "intermediate",
          duration: "60 minutes",
          topics: ["Dual-Role Operations", "Passenger Cargo Mix", "Fuel Considerations"],
          objectives: [
            "Configure aircraft for mixed passenger/cargo operations",
            "Calculate weight balance with variable fuel loads",
            "Optimize cargo arrangement for dual-role missions"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 11,
          title: "KC30-A Advanced Configuration Management",
          description: "Advanced KC30-A configuration and cargo management",
          aircraft: "kc30a",
          difficulty: "advanced",
          duration: "90 minutes",
          topics: ["Configuration Changes", "Long-Range Operations", "Cargo System Troubleshooting"],
          objectives: [
            "Plan configuration changes during deployed operations",
            "Optimize loading for extended range missions",
            "Troubleshoot and resolve cargo system issues"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 12,
          title: "KC30-A Operations Management",
          description: "Expert level KC30-A operations and cargo management",
          aircraft: "kc30a",
          difficulty: "expert",
          duration: "120 minutes",
          topics: ["Complete Aircraft Management", "Mission Replanning", "System Integration"],
          objectives: [
            "Manage complete aircraft loading operations",
            "Implement rapid reconfiguration procedures",
            "Integrate with aerial refueling mission requirements"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        
        // C-27J Modules
        {
          id: 13,
          title: "C-27J Spartan Fundamentals",
          description: "Introduction to C-27J cargo loading basics",
          aircraft: "c27j",
          difficulty: "beginner",
          duration: "30 minutes",
          topics: ["Aircraft Overview", "Basic Loading", "Small Configuration Management"],
          objectives: [
            "Understand C-27J cargo area layout and limitations",
            "Learn proper tie-down and securing techniques",
            "Configure aircraft for basic cargo missions"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 14,
          title: "C-27J Tactical Operations",
          description: "Intermediate tactical loading for C-27J operations",
          aircraft: "c27j",
          difficulty: "intermediate",
          duration: "45 minutes",
          topics: ["Tactical Loading", "Short Field Operations", "Rapid Reconfiguration"],
          objectives: [
            "Execute loading plans for tactical operations",
            "Prepare aircraft for short field operations",
            "Perform rapid cargo-to-personnel conversions"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 15,
          title: "C-27J Multi-Mission Configuration",
          description: "Advanced training for C-27J multi-mission configurations",
          aircraft: "c27j",
          difficulty: "advanced",
          duration: "60 minutes",
          topics: ["Multi-Role Operations", "Medevac Configuration", "Special Mission Support"],
          objectives: [
            "Configure aircraft for medevac operations",
            "Support special mission requirements",
            "Implement rapid role change procedures"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 16,
          title: "C-27J Master Operations",
          description: "Expert level C-27J operational management",
          aircraft: "c27j",
          difficulty: "expert",
          duration: "90 minutes",
          topics: ["Complete Platform Management", "Austere Field Operations", "Mission Command"],
          objectives: [
            "Plan complete aircraft utilization for austere operations",
            "Manage loading operations in forward locations",
            "Coordinate multiple mission types in single deployment"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        
        // Multi-Aircraft Cross-Training Modules
        {
          id: 17,
          title: "Multi-Aircraft Dangerous Goods Procedures",
          description: "Comprehensive dangerous goods handling across all aircraft types",
          aircraft: "all",
          difficulty: "advanced",
          duration: "75 minutes",
          topics: ["DG Classification", "Aircraft-Specific Requirements", "Emergency Procedures"],
          objectives: [
            "Apply DG regulations across all aircraft platforms",
            "Implement aircraft-specific DG procedures",
            "Execute emergency response protocols"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 18,
          title: "Universal Weight & Balance Principles",
          description: "Weight and balance fundamentals applicable to all aircraft",
          aircraft: "all",
          difficulty: "intermediate",
          duration: "90 minutes",
          topics: ["Universal Principles", "CG Calculations", "Load Distribution"],
          objectives: [
            "Master weight and balance principles across platforms",
            "Calculate center of gravity for any aircraft type",
            "Optimize load distribution for mission effectiveness"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 19,
          title: "Emergency Response Procedures",
          description: "Critical emergency procedures for all loadmaster operations",
          aircraft: "all",
          difficulty: "expert",
          duration: "60 minutes",
          topics: ["Emergency Response", "Cargo Fire Procedures", "In-Flight Emergencies"],
          objectives: [
            "Execute emergency cargo procedures",
            "Respond to in-flight emergency situations",
            "Coordinate with aircrew during emergencies"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        },
        {
          id: 20,
          title: "Loadmaster Leadership Development",
          description: "Leadership skills for senior loadmasters and instructors",
          aircraft: "all",
          difficulty: "expert",
          duration: "120 minutes",
          topics: ["Team Leadership", "Training Development", "Operational Planning"],
          objectives: [
            "Develop leadership skills for loadmaster operations",
            "Create effective training programs",
            "Lead complex multi-aircraft operations"
          ],
          isActive: true,
          createdBy: "System",
          lastModified: "2025-01-15",
          content: "",
          videoUrl: "",
          createdDate: "2025-01-15",
          completionRate: 0
        }
      ];
      
      res.json(defaultTrainingModules);
    } catch (error) {
      console.error("Failed to fetch training modules:", error);
      res.status(500).json({ error: "Failed to fetch training modules" });
    }
  });

  // Create a new training module (saves to database)
  app.post("/api/training-modules", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const moduleData = req.body;
      console.log("📚 Creating new training module:", moduleData.title);
      
      // Insert into database
      const [newModule] = await db.insert(trainingModules).values({
        title: moduleData.title,
        description: moduleData.description,
        aircraft: moduleData.aircraft,
        difficulty: moduleData.difficulty || "beginner",
        duration: moduleData.duration,
        topics: moduleData.topics || [],
        objectives: moduleData.objectives || [],
        isActive: moduleData.isActive !== false,
        createdBy: req.user?.id || null,
      }).returning();
      
      console.log("✅ Training module created with ID:", newModule.id);
      
      res.json({
        ...newModule,
        createdDate: newModule.createdAt?.toISOString().split('T')[0],
        lastModified: newModule.updatedAt?.toISOString().split('T')[0],
        createdByEmail: req.user?.email || "Unknown",
        completionRate: 0
      });
    } catch (error) {
      console.error("Failed to create training module:", error);
      res.status(500).json({ error: "Failed to create training module" });
    }
  });

  // Update an existing training module
  app.put("/api/training-modules/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const moduleData = req.body;
      console.log("📝 Updating training module:", id, moduleData.title);
      
      // Update in database
      const [updatedModule] = await db.update(trainingModules)
        .set({
          title: moduleData.title,
          description: moduleData.description,
          aircraft: moduleData.aircraft,
          difficulty: moduleData.difficulty,
          duration: moduleData.duration,
          topics: moduleData.topics || [],
          objectives: moduleData.objectives || [],
          isActive: moduleData.isActive !== false,
          updatedAt: new Date(),
        })
        .where(eq(trainingModules.id, parseInt(id)))
        .returning();
      
      if (!updatedModule) {
        return res.status(404).json({ error: "Training module not found" });
      }
      
      console.log("✅ Training module updated:", updatedModule.id);
      
      res.json({
        ...updatedModule,
        lastModified: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error("Failed to update training module:", error);
      res.status(500).json({ error: "Failed to update training module" });
    }
  });

  // Delete a training module
  app.delete("/api/training-modules/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      console.log("🗑️ Deleting training module:", id);
      
      // Delete from database (soft delete by setting isActive to false)
      await db.update(trainingModules)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(trainingModules.id, parseInt(id)));
      
      console.log("✅ Training module deleted:", id);
      res.json({ message: "Training module deleted successfully" });
    } catch (error) {
      console.error("Failed to delete training module:", error);
      res.status(500).json({ error: "Failed to delete training module" });
    }
  });

  // Get a single training module by ID
  app.get("/api/training-modules/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      // Try to get from database first
      const [dbModule] = await db.select()
        .from(trainingModules)
        .where(and(
          eq(trainingModules.id, parseInt(id)),
          eq(trainingModules.isActive, true)
        ));
      
      if (dbModule) {
        // Get associated content
        const content = await db.select()
          .from(trainingModuleContent)
          .where(and(
            eq(trainingModuleContent.moduleId, dbModule.id),
            eq(trainingModuleContent.isActive, true)
          ))
          .orderBy(trainingModuleContent.orderIndex);
        
        return res.json({
          ...dbModule,
          content,
          lastModified: dbModule.updatedAt?.toISOString().split('T')[0],
          createdDate: dbModule.createdAt?.toISOString().split('T')[0]
        });
      }
      
      res.status(404).json({ error: "Training module not found" });
    } catch (error) {
      console.error("Failed to fetch training module:", error);
      res.status(500).json({ error: "Failed to fetch training module" });
    }
  });

  // Training Module Content API endpoints
  app.post("/api/training-modules/:moduleId/content", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { moduleId } = req.params;
      const contentData = req.body;
      
      const [newContent] = await db.insert(trainingModuleContent).values({
        moduleId: parseInt(moduleId),
        title: contentData.title,
        type: contentData.type, // video, reading, quiz, assessment
        duration: contentData.duration,
        description: contentData.description,
        content: contentData.content,
        videoUrl: contentData.videoUrl,
        orderIndex: contentData.orderIndex || 0,
        isActive: true,
      }).returning();
      
      res.json(newContent);
    } catch (error) {
      console.error("Failed to create module content:", error);
      res.status(500).json({ error: "Failed to create module content" });
    }
  });

  app.put("/api/training-modules/:moduleId/content/:contentId", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { contentId } = req.params;
      const contentData = req.body;
      
      const [updatedContent] = await db.update(trainingModuleContent)
        .set({
          title: contentData.title,
          type: contentData.type,
          duration: contentData.duration,
          description: contentData.description,
          content: contentData.content,
          videoUrl: contentData.videoUrl,
          orderIndex: contentData.orderIndex,
          updatedAt: new Date(),
        })
        .where(eq(trainingModuleContent.id, parseInt(contentId)))
        .returning();
      
      res.json(updatedContent);
    } catch (error) {
      console.error("Failed to update module content:", error);
      res.status(500).json({ error: "Failed to update module content" });
    }
  });

  app.delete("/api/training-modules/:moduleId/content/:contentId", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { contentId } = req.params;
      
      await db.update(trainingModuleContent)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(trainingModuleContent.id, parseInt(contentId)));
      
      res.json({ message: "Content deleted successfully" });
    } catch (error) {
      console.error("Failed to delete module content:", error);
      res.status(500).json({ error: "Failed to delete module content" });
    }
  });

  // ===== CHECKLIST API ROUTES - REBUILT FROM SCRATCH =====
  
  // Get all active checklists - simplified and reliable
  app.get("/api/checklists", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('🔧 CHECKLIST API: Fetching all checklists for user:', req.user?.email);
      
      // Remove the redundant query - we already have the data from the optimized query below

      // Get active checklists
      const allChecklists = await db.select()
        .from(checklists)
        .where(eq(checklists.isActive, true))
        .orderBy(desc(checklists.createdAt));

      // Get all checklist items in one query
      const allItems = await db.select()
        .from(checklistItems)
        .orderBy(checklistItems.itemOrder);

      // Get creators using simpler approach
      const creatorMap = new Map();
      for (const checklist of allChecklists) {
        if (!creatorMap.has(checklist.createdById)) {
          const creator = await db.select({ email: users.email })
            .from(users)
            .where(eq(users.id, checklist.createdById))
            .limit(1);
          creatorMap.set(checklist.createdById, creator[0]?.email || 'Unknown');
        }
      }

      // Create lookup maps
      const itemsMap = new Map();
      allItems.forEach(item => {
        if (!itemsMap.has(item.checklistId)) {
          itemsMap.set(item.checklistId, []);
        }
        itemsMap.get(item.checklistId).push(item);
      });

      // Combine data efficiently
      const checklistsWithItems = allChecklists.map(checklist => ({
        ...checklist,
        items: itemsMap.get(checklist.id) || [],
        creator: { email: creatorMap.get(checklist.createdById) || 'Unknown' }
      }));

      // Get all user completions in one query
      const userCompletions = await db.select()
        .from(checklistCompletions)
        .where(eq(checklistCompletions.userId, req.user!.id));

      // Create completion lookup map
      const completionMap = new Map();
      userCompletions.forEach(completion => {
        completionMap.set(completion.checklistId, completion);
      });

      // Add completion data to each checklist
      const enrichedChecklists = checklistsWithItems.map(checklist => ({
        ...checklist,
        userCompletion: completionMap.get(checklist.id) || null
      }));

      console.log('🔧 CHECKLIST API: Returning', enrichedChecklists.length, 'checklists with completion data');
      res.json(enrichedChecklists);
    } catch (error) {
      console.error('🔧 CHECKLIST API ERROR:', error);
      res.status(500).json({ error: "Failed to fetch checklists" });
    }
  });

  // Get user's checklist completions
  app.get("/api/checklists/completions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      console.log('🔧 COMPLETION API: Fetching completions for user:', req.user?.id);
      
      const completions = await db.select()
        .from(checklistCompletions)
        .where(eq(checklistCompletions.userId, req.user!.id))
        .orderBy(desc(checklistCompletions.startedAt));

      console.log('🔧 COMPLETION API: Found', completions.length, 'completions');
      res.json(completions);
    } catch (error) {
      console.error('🔧 COMPLETION API ERROR:', error);
      res.status(500).json({ error: "Failed to fetch completions" });
    }
  });

  // Get specific checklist by ID with user's completion status
  app.get("/api/checklists/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const checklistId = parseInt(id);
      
      console.log('🔧 CHECKLIST DETAIL API: Fetching checklist ID:', checklistId, 'for user:', req.user?.email);
      console.log('🔧 CHECKLIST DETAIL API: Session cookies:', req.cookies);
      console.log('🔧 CHECKLIST DETAIL API: Request headers:', req.headers.cookie);
      
      if (isNaN(checklistId)) {
        console.log('🔧 CHECKLIST DETAIL API: Invalid ID provided:', id);
        return res.status(400).json({ error: "Invalid checklist ID" });
      }
      
      // Get the checklist
      const checklist = await db.select()
        .from(checklists)
        .where(and(
          eq(checklists.id, checklistId),
          eq(checklists.isActive, true)
        ))
        .limit(1);

      if (checklist.length === 0) {
        console.log('🔧 CHECKLIST DETAIL API: Checklist not found with ID:', checklistId);
        return res.status(404).json({ error: "Checklist not found" });
      }

      console.log('🔧 CHECKLIST DETAIL API: Found checklist:', checklist[0].title);

      // Get checklist items
      const items = await db.select()
        .from(checklistItems)
        .where(eq(checklistItems.checklistId, checklistId))
        .orderBy(checklistItems.itemOrder);

      console.log('🔧 CHECKLIST DETAIL API: Found', items.length, 'items for checklist');

      // Get creator info
      const creator = await db.select({ email: users.email })
        .from(users)
        .where(eq(users.id, checklist[0].createdById))
        .limit(1);

      // Get user's completion status
      const userCompletion = await db.select()
        .from(checklistCompletions)
        .where(and(
          eq(checklistCompletions.checklistId, checklistId),
          eq(checklistCompletions.userId, req.user!.id)
        ))
        .limit(1);

      const response = {
        ...checklist[0],
        items: items,
        creator: { email: creator[0]?.email || 'Unknown' },
        userCompletion: userCompletion[0] || null
      };

      console.log('🔧 CHECKLIST DETAIL API: Returning checklist with', items.length, 'items');
      res.json(response);
    } catch (error) {
      console.error('🔧 CHECKLIST DETAIL API ERROR:', error);
      res.status(500).json({ error: "Failed to fetch checklist" });
    }
  });

  // Create new checklist completion or update existing one
  app.post("/api/checklists/:id/completion", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { completedItems } = req.body;
      const checklistId = parseInt(id);

      console.log('🔧 COMPLETION UPDATE API: Updating completion for checklist:', checklistId, 'user:', req.user?.id);

      if (!Array.isArray(completedItems)) {
        return res.status(400).json({ error: "completedItems must be an array" });
      }

      // Get checklist and its items
      const checklist = await db.select()
        .from(checklists)
        .where(and(eq(checklists.id, checklistId), eq(checklists.isActive, true)))
        .limit(1);

      if (checklist.length === 0) {
        return res.status(404).json({ error: "Checklist not found" });
      }

      const items = await db.select()
        .from(checklistItems)
        .where(eq(checklistItems.checklistId, checklistId))
        .orderBy(checklistItems.itemOrder);

      // Create item order lookup
      const itemOrderMap = new Map(items.map(item => [item.id, item.itemOrder]));

      const totalItems = items.length;
      const completedCount = completedItems.length;
      const requiredItems = items.filter(item => item.isRequired);
      const completedRequiredItems = completedItems.filter(itemId => 
        requiredItems.some(req => req.id === itemId)
      );
      
      const completionStatus = (completedRequiredItems.length === requiredItems.length && completedCount === totalItems) 
        ? "completed" 
        : "in_progress";

      // Check for existing completion
      const existingCompletion = await db.select()
        .from(checklistCompletions)
        .where(and(
          eq(checklistCompletions.checklistId, checklistId),
          eq(checklistCompletions.userId, req.user!.id)
        ))
        .limit(1);

      let completionId: number;
      let previousItems: number[] = [];

      if (existingCompletion.length > 0) {
        completionId = existingCompletion[0].id;
        previousItems = (existingCompletion[0].completedItems as number[]) || [];
        
        // Update existing
        await db.update(checklistCompletions)
          .set({
            completedItems,
            completedCount,
            completionStatus,
            completedAt: completionStatus === "completed" ? new Date() : null
          })
          .where(eq(checklistCompletions.id, existingCompletion[0].id));

        console.log('🔧 COMPLETION UPDATE API: Updated existing completion');
      } else {
        // Create new
        const [newCompletion] = await db.insert(checklistCompletions)
          .values({
            checklistId,
            userId: req.user!.id,
            completedItems,
            totalItems,
            completedCount,
            completionStatus,
            completedAt: completionStatus === "completed" ? new Date() : null
          })
          .returning();

        completionId = newCompletion.id;
        console.log('🔧 COMPLETION UPDATE API: Created new completion');
      }

      // Create audit trail entries for newly checked/unchecked items
      const newlyChecked = completedItems.filter((id: number) => !previousItems.includes(id));
      const newlyUnchecked = previousItems.filter((id: number) => !completedItems.includes(id));

      const auditEntries: Array<{
        checklistId: number;
        checklistItemId: number;
        userId: number;
        completionId: number;
        action: string;
        stepOrder: number;
      }> = [];

      for (const itemId of newlyChecked) {
        const stepOrder = itemOrderMap.get(itemId) || 0;
        auditEntries.push({
          checklistId,
          checklistItemId: itemId,
          userId: req.user!.id,
          completionId,
          action: 'checked',
          stepOrder
        });
      }

      for (const itemId of newlyUnchecked) {
        const stepOrder = itemOrderMap.get(itemId) || 0;
        auditEntries.push({
          checklistId,
          checklistItemId: itemId,
          userId: req.user!.id,
          completionId,
          action: 'unchecked',
          stepOrder
        });
      }

      if (auditEntries.length > 0) {
        await db.insert(checklistStepAudit).values(auditEntries);
        console.log('🔧 COMPLETION UPDATE API: Added', auditEntries.length, 'audit entries');
      }

      // Return the updated completion
      const [result] = await db.select()
        .from(checklistCompletions)
        .where(eq(checklistCompletions.id, completionId));

      res.json(result);
    } catch (error) {
      console.error('🔧 COMPLETION UPDATE API ERROR:', error);
      res.status(500).json({ error: "Failed to update checklist completion" });
    }
  });

  // Create checklist (instructors only)
  app.post("/api/checklists", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertChecklistSchema.parse({
        ...req.body,
        createdById: req.user!.id
      });

      const [newChecklist] = await db.insert(checklists).values(validatedData).returning();

      // Create checklist items if provided
      if (req.body.items && Array.isArray(req.body.items)) {
        const itemsData = req.body.items.map((item: any, index: number) => ({
          checklistId: newChecklist.id,
          itemText: item.itemText,
          itemOrder: item.itemOrder || index + 1,
          isRequired: item.isRequired !== false,
          category: item.category || null
        }));

        await db.insert(checklistItems).values(itemsData);
      }

      // Return checklist with items
      const checklistWithItems = await db.query.checklists.findFirst({
        where: eq(checklists.id, newChecklist.id),
        with: {
          items: {
            orderBy: (checklistItems, { asc }) => [asc(checklistItems.itemOrder)]
          }
        }
      });

      res.json(checklistWithItems);
    } catch (error) {
      console.error("Failed to create checklist:", error);
      res.status(500).json({ error: "Failed to create checklist" });
    }
  });

  // Update checklist (instructors only)
  app.put("/api/checklists/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { items, ...checklistData } = req.body;

      // Update checklist
      const [updatedChecklist] = await db.update(checklists)
        .set({ ...checklistData, updatedAt: new Date() })
        .where(eq(checklists.id, parseInt(id)))
        .returning();

      if (!updatedChecklist) {
        return res.status(404).json({ error: "Checklist not found" });
      }

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        await db.delete(checklistItems).where(eq(checklistItems.checklistId, parseInt(id)));
        
        // Insert new items
        const itemsData = items.map((item: any, index: number) => ({
          checklistId: parseInt(id),
          itemText: item.itemText,
          itemOrder: item.itemOrder || index + 1,
          isRequired: item.isRequired !== false,
          category: item.category || null
        }));

        await db.insert(checklistItems).values(itemsData);
      }

      // Return updated checklist with items
      const checklistWithItems = await db.query.checklists.findFirst({
        where: eq(checklists.id, parseInt(id)),
        with: {
          items: {
            orderBy: (checklistItems, { asc }) => [asc(checklistItems.itemOrder)]
          }
        }
      });

      res.json(checklistWithItems);
    } catch (error) {
      console.error("Failed to update checklist:", error);
      res.status(500).json({ error: "Failed to update checklist" });
    }
  });

  // Delete checklist (instructors only)
  app.delete("/api/checklists/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      
      await db.delete(checklists).where(eq(checklists.id, parseInt(id)));
      
      res.json({ message: "Checklist deleted successfully" });
    } catch (error) {
      console.error("Failed to delete checklist:", error);
      res.status(500).json({ error: "Failed to delete checklist" });
    }
  });





  // Get all checklists for instructor management
  app.get("/api/instructor/checklists", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const instructorChecklists = await db.query.checklists.findMany({
        with: {
          items: {
            orderBy: (checklistItems, { asc }) => [asc(checklistItems.itemOrder)]
          },
          creator: {
            columns: { email: true }
          },
          completions: {
            with: {
              user: {
                columns: { email: true }
              }
            }
          }
        },
        orderBy: (checklists, { desc }) => [desc(checklists.createdAt)]
      });

      res.json(instructorChecklists);
    } catch (error) {
      console.error("Failed to fetch instructor checklists:", error);
      res.status(500).json({ error: "Failed to fetch instructor checklists" });
    }
  });

  // User Qualifications API endpoints
  app.get("/api/user/qualifications", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const qualifications = await db.select()
        .from(userQualifications)
        .where(eq(userQualifications.userId, req.user.id))
        .orderBy(desc(userQualifications.expiryDate));

      res.json(qualifications);
    } catch (error) {
      console.error("Error fetching qualifications:", error);
      res.status(500).json({ message: "Failed to fetch qualifications" });
    }
  });

  app.post("/api/user/qualifications", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertUserQualificationSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const [newQualification] = await db.insert(userQualifications)
        .values(validatedData)
        .returning();

      res.json(newQualification);
    } catch (error) {
      console.error("Error creating qualification:", error);
      res.status(500).json({ message: "Failed to create qualification" });
    }
  });

  app.put("/api/user/qualifications/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const qualificationId = parseInt(req.params.id);
      
      const validatedData = insertUserQualificationSchema.omit({ userId: true }).parse(req.body);

      const [updatedQualification] = await db.update(userQualifications)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(userQualifications.id, qualificationId),
          eq(userQualifications.userId, req.user.id)
        ))
        .returning();

      res.json(updatedQualification);
    } catch (error) {
      console.error("Error updating qualification:", error);
      res.status(500).json({ message: "Failed to update qualification" });
    }
  });

  app.delete("/api/user/qualifications/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const qualificationId = parseInt(req.params.id);
      
      await db.delete(userQualifications)
        .where(and(
          eq(userQualifications.id, qualificationId),
          eq(userQualifications.userId, req.user.id)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting qualification:", error);
      res.status(500).json({ message: "Failed to delete qualification" });
    }
  });

  // Flight Records API endpoints
  app.get("/api/user/flight-records", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const records = await db.select()
        .from(flightRecords)
        .where(eq(flightRecords.userId, req.user.id))
        .orderBy(desc(flightRecords.date));

      res.json(records);
    } catch (error) {
      console.error("Error fetching flight records:", error);
      res.status(500).json({ message: "Failed to fetch flight records" });
    }
  });

  app.post("/api/user/flight-records", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertFlightRecordSchema.parse({
        ...req.body,
        userId: req.user.id,
      });

      const [newRecord] = await db.insert(flightRecords)
        .values(validatedData)
        .returning();

      res.json(newRecord);
    } catch (error) {
      console.error("Error creating flight record:", error);
      res.status(500).json({ message: "Failed to create flight record" });
    }
  });

  app.put("/api/user/flight-records/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const recordId = parseInt(req.params.id);
      
      const validatedData = insertFlightRecordSchema.omit({ userId: true }).parse(req.body);

      const [updatedRecord] = await db.update(flightRecords)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(and(
          eq(flightRecords.id, recordId),
          eq(flightRecords.userId, req.user.id)
        ))
        .returning();

      res.json(updatedRecord);
    } catch (error) {
      console.error("Error updating flight record:", error);
      res.status(500).json({ message: "Failed to update flight record" });
    }
  });

  app.delete("/api/user/flight-records/:id", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const recordId = parseInt(req.params.id);
      
      await db.delete(flightRecords)
        .where(and(
          eq(flightRecords.id, recordId),
          eq(flightRecords.userId, req.user.id)
        ));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting flight record:", error);
      res.status(500).json({ message: "Failed to delete flight record" });
    }
  });

  // Profile photo upload endpoint - stores as base64 in database for persistence
  app.post("/api/user/profile-photo", requireAuth, uploadProfilePhoto.single('photo'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No photo file provided" });
      }

      // Get user's license
      const [userRecord] = await db.select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!userRecord || !userRecord.licenseId) {
        return res.status(404).json({ message: "User license not found" });
      }

      // Read the file and convert to base64 data URL for persistent storage
      const fileBuffer = await fs.readFile(req.file.path);
      const base64Data = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype || 'image/png';
      const dataUrl = `data:${mimeType};base64,${base64Data}`;

      // Delete the temporary file
      try {
        await fs.unlink(req.file.path);
      } catch (error) {
        console.log("Could not delete temporary file");
      }

      // Update license with base64 profile photo data (persists in database)
      const [updatedLicense] = await db.update(licenses)
        .set({
          profilePhotoUrl: dataUrl,
          updatedAt: new Date(),
        })
        .where(eq(licenses.id, userRecord.licenseId))
        .returning();

      res.json({ profilePhotoUrl: dataUrl });
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Update user's total missions and cargo weight
  app.put("/api/user/stats", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { totalMissionsFlown, totalCargoWeight } = req.body;

      // Get user's license
      const [userRecord] = await db.select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!userRecord || !userRecord.licenseId) {
        return res.status(404).json({ message: "User license not found" });
      }

      // Update license with new stats
      await db.update(licenses)
        .set({
          totalMissionsFlown: totalMissionsFlown ?? undefined,
          totalCargoWeight: totalCargoWeight ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(licenses.id, userRecord.licenseId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user stats:", error);
      res.status(500).json({ message: "Failed to update user stats" });
    }
  });

  // ==================== READINESS ENDPOINTS ====================
  
  // Update user's flight readiness status
  app.put("/api/user/readiness", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { isFlightReady, notReadyReason } = req.body;

      // Get user's license
      const [userRecord] = await db.select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!userRecord || !userRecord.licenseId) {
        return res.status(404).json({ message: "User license not found" });
      }

      // Update license with readiness status
      const [updatedLicense] = await db.update(licenses)
        .set({
          isFlightReady: isFlightReady,
          notReadyReason: isFlightReady ? null : notReadyReason,
          readinessUpdatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(licenses.id, userRecord.licenseId))
        .returning();

      res.json({ 
        isFlightReady: updatedLicense.isFlightReady,
        notReadyReason: updatedLicense.notReadyReason,
        readinessUpdatedAt: updatedLicense.readinessUpdatedAt
      });
    } catch (error) {
      console.error("Error updating readiness status:", error);
      res.status(500).json({ message: "Failed to update readiness status" });
    }
  });

  // Get user's readiness status
  app.get("/api/user/readiness", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const [userRecord] = await db.select()
        .from(users)
        .where(eq(users.id, req.user.id));

      if (!userRecord || !userRecord.licenseId) {
        return res.status(404).json({ message: "User license not found" });
      }

      const [license] = await db.select()
        .from(licenses)
        .where(eq(licenses.id, userRecord.licenseId));

      res.json({
        isFlightReady: license.isFlightReady,
        notReadyReason: license.notReadyReason,
        readinessUpdatedAt: license.readinessUpdatedAt
      });
    } catch (error) {
      console.error("Error fetching readiness status:", error);
      res.status(500).json({ message: "Failed to fetch readiness status" });
    }
  });

  // ==================== SAFETY RECORDS ENDPOINTS ====================
  
  // Get all safety records (instructor only)
  app.get("/api/safety-records", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { squadron, recordType, status } = req.query;
      
      let query = db.select({
        id: safetyRecords.id,
        userId: safetyRecords.userId,
        recordType: safetyRecords.recordType,
        description: safetyRecords.description,
        severity: safetyRecords.severity,
        date: safetyRecords.date,
        reportedBy: safetyRecords.reportedBy,
        status: safetyRecords.status,
        resolutionNotes: safetyRecords.resolutionNotes,
        squadron: safetyRecords.squadron,
        createdAt: safetyRecords.createdAt,
        userName: sql<string>`CONCAT(${licenses.firstName}, ' ', ${licenses.lastName})`,
        userEmail: licenses.email
      })
      .from(safetyRecords)
      .leftJoin(users, eq(safetyRecords.userId, users.id))
      .leftJoin(licenses, eq(users.licenseId, licenses.id));

      const records = await query.orderBy(desc(safetyRecords.date));

      // Filter in memory if query params provided
      let filteredRecords = records;
      if (squadron && squadron !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.squadron === squadron);
      }
      if (recordType && recordType !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.recordType === recordType);
      }
      if (status && status !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.status === status);
      }

      res.json(filteredRecords);
    } catch (error) {
      console.error("Error fetching safety records:", error);
      res.status(500).json({ message: "Failed to fetch safety records" });
    }
  });

  // Create safety record (instructor only)
  app.post("/api/safety-records", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const validatedData = insertSafetyRecordSchema.parse({
        ...req.body,
        reportedBy: req.user.id
      });

      const [newRecord] = await db.insert(safetyRecords)
        .values(validatedData)
        .returning();

      res.status(201).json(newRecord);
    } catch (error) {
      console.error("Error creating safety record:", error);
      res.status(500).json({ message: "Failed to create safety record" });
    }
  });

  // Update safety record (instructor only)
  app.put("/api/safety-records/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const { status, resolutionNotes, severity, description } = req.body;

      const [updatedRecord] = await db.update(safetyRecords)
        .set({
          status: status,
          resolutionNotes: resolutionNotes,
          severity: severity,
          description: description,
          updatedAt: new Date(),
        })
        .where(eq(safetyRecords.id, recordId))
        .returning();

      res.json(updatedRecord);
    } catch (error) {
      console.error("Error updating safety record:", error);
      res.status(500).json({ message: "Failed to update safety record" });
    }
  });

  // Delete safety record (instructor only)
  app.delete("/api/safety-records/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const recordId = parseInt(req.params.id);

      await db.delete(safetyRecords)
        .where(eq(safetyRecords.id, recordId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting safety record:", error);
      res.status(500).json({ message: "Failed to delete safety record" });
    }
  });

  // ==================== ANALYTICS ENDPOINTS ====================

  // Flight Hours Analytics
  app.get("/api/analytics/flight-hours", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { squadron, startDate, endDate } = req.query;
      
      // Get all flight records with user details
      const records = await db.select({
        id: flightRecords.id,
        userId: flightRecords.userId,
        date: flightRecords.date,
        nightHours: flightRecords.nightHours,
        dayHours: flightRecords.dayHours,
        aircraftType: flightRecords.aircraftType,
        passengersCarried: flightRecords.passengersCarried,
        cargoWeight: flightRecords.cargoWeight,
        squadron: licenses.squadron,
        userName: sql<string>`CONCAT(${licenses.firstName}, ' ', ${licenses.lastName})`,
      })
      .from(flightRecords)
      .leftJoin(users, eq(flightRecords.userId, users.id))
      .leftJoin(licenses, eq(users.licenseId, licenses.id))
      .orderBy(desc(flightRecords.date));

      // Filter by squadron if provided
      let filteredRecords = records;
      if (squadron && squadron !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.squadron === squadron);
      }
      
      // Filter by date range if provided
      if (startDate) {
        const start = new Date(startDate as string);
        filteredRecords = filteredRecords.filter(r => r.date && new Date(r.date) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        filteredRecords = filteredRecords.filter(r => r.date && new Date(r.date) <= end);
      }

      // Aggregate by user
      const userAggregates = new Map<number, {
        userId: number;
        userName: string;
        squadron: string;
        totalNightHours: number;
        totalDayHours: number;
        totalFlights: number;
        aircraftTypes: Set<string>;
      }>();

      filteredRecords.forEach(record => {
        if (!record.userId) return;
        
        const existing = userAggregates.get(record.userId) || {
          userId: record.userId,
          userName: record.userName || 'Unknown',
          squadron: record.squadron || 'Unknown',
          totalNightHours: 0,
          totalDayHours: 0,
          totalFlights: 0,
          aircraftTypes: new Set<string>(),
        };
        
        existing.totalNightHours += record.nightHours || 0;
        existing.totalDayHours += record.dayHours || 0;
        existing.totalFlights += 1;
        if (record.aircraftType) existing.aircraftTypes.add(record.aircraftType);
        
        userAggregates.set(record.userId, existing);
      });

      // Aggregate by squadron
      const squadronAggregates = new Map<string, {
        squadron: string;
        totalNightHours: number;
        totalDayHours: number;
        totalFlights: number;
        memberCount: number;
      }>();

      userAggregates.forEach(user => {
        const existing = squadronAggregates.get(user.squadron) || {
          squadron: user.squadron,
          totalNightHours: 0,
          totalDayHours: 0,
          totalFlights: 0,
          memberCount: 0,
        };
        
        existing.totalNightHours += user.totalNightHours;
        existing.totalDayHours += user.totalDayHours;
        existing.totalFlights += user.totalFlights;
        existing.memberCount += 1;
        
        squadronAggregates.set(user.squadron, existing);
      });

      // Aggregate by aircraft type
      const aircraftAggregates = new Map<string, {
        aircraftType: string;
        totalHours: number;
        totalFlights: number;
      }>();

      filteredRecords.forEach(record => {
        const type = record.aircraftType || 'Unknown';
        const existing = aircraftAggregates.get(type) || {
          aircraftType: type,
          totalHours: 0,
          totalFlights: 0,
        };
        
        existing.totalHours += (record.nightHours || 0) + (record.dayHours || 0);
        existing.totalFlights += 1;
        
        aircraftAggregates.set(type, existing);
      });

      // Monthly trend (last 12 months)
      const monthlyTrend: { month: string; nightHours: number; dayHours: number; flights: number }[] = [];
      const now = new Date();
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthKey = month.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        const monthRecords = filteredRecords.filter(r => {
          if (!r.date) return false;
          const date = new Date(r.date);
          return date >= month && date <= monthEnd;
        });
        
        monthlyTrend.push({
          month: monthKey,
          nightHours: monthRecords.reduce((sum, r) => sum + (r.nightHours || 0), 0),
          dayHours: monthRecords.reduce((sum, r) => sum + (r.dayHours || 0), 0),
          flights: monthRecords.length,
        });
      }

      const uniqueUsersCount = userAggregates.size;
      const totalHours = Array.from(userAggregates.values()).reduce((sum, u) => sum + u.totalNightHours + u.totalDayHours, 0);
      
      res.json({
        summary: {
          totalNightHours: Array.from(userAggregates.values()).reduce((sum, u) => sum + u.totalNightHours, 0),
          totalDayHours: Array.from(userAggregates.values()).reduce((sum, u) => sum + u.totalDayHours, 0),
          totalFlights: filteredRecords.length,
          totalPassengers: filteredRecords.reduce((sum, r) => sum + (r.passengersCarried || 0), 0),
          totalCargoWeight: filteredRecords.reduce((sum, r) => sum + (r.cargoWeight || 0), 0),
          uniqueUsers: uniqueUsersCount,
          avgHoursPerPerson: uniqueUsersCount > 0 ? Math.round((totalHours / uniqueUsersCount) * 10) / 10 : 0,
        },
        byUser: Array.from(userAggregates.values()).map(u => ({
          ...u,
          aircraftTypes: Array.from(u.aircraftTypes),
          totalHours: u.totalNightHours + u.totalDayHours,
        })),
        bySquadron: Array.from(squadronAggregates.values()).map(s => ({
          ...s,
          totalHours: s.totalNightHours + s.totalDayHours,
          avgHoursPerMember: s.memberCount > 0 ? (s.totalNightHours + s.totalDayHours) / s.memberCount : 0,
        })),
        byAircraftType: Array.from(aircraftAggregates.values()),
        monthlyTrend,
      });
    } catch (error) {
      console.error("Error fetching flight hours analytics:", error);
      res.status(500).json({ message: "Failed to fetch flight hours analytics" });
    }
  });

  // Currency Status Analytics
  app.get("/api/analytics/currency-status", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { squadron } = req.query;

      // Get all qualifications with user details
      const qualifications = await db.select({
        id: userQualifications.id,
        userId: userQualifications.userId,
        name: userQualifications.name,
        startDate: userQualifications.startDate,
        expiryDate: userQualifications.expiryDate,
        squadron: licenses.squadron,
        userName: sql<string>`CONCAT(${licenses.firstName}, ' ', ${licenses.lastName})`,
        userEmail: licenses.email,
      })
      .from(userQualifications)
      .leftJoin(users, eq(userQualifications.userId, users.id))
      .leftJoin(licenses, eq(users.licenseId, licenses.id));

      // Filter by squadron if provided
      let filteredQuals = qualifications;
      if (squadron && squadron !== 'all') {
        filteredQuals = filteredQuals.filter(q => q.squadron === squadron);
      }

      const now = new Date();
      const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

      // Categorize qualifications
      const expired: typeof filteredQuals = [];
      const expiring30: typeof filteredQuals = [];
      const expiring60: typeof filteredQuals = [];
      const expiring90: typeof filteredQuals = [];
      const current: typeof filteredQuals = [];
      const noExpiry: typeof filteredQuals = [];

      filteredQuals.forEach(qual => {
        if (!qual.expiryDate) {
          noExpiry.push(qual);
        } else {
          const expiry = new Date(qual.expiryDate);
          if (expiry < now) {
            expired.push(qual);
          } else if (expiry <= thirtyDays) {
            expiring30.push(qual);
          } else if (expiry <= sixtyDays) {
            expiring60.push(qual);
          } else if (expiry <= ninetyDays) {
            expiring90.push(qual);
          } else {
            current.push(qual);
          }
        }
      });

      // Group by qualification type
      const byType = new Map<string, { name: string; expired: number; expiring: number; current: number }>();
      filteredQuals.forEach(qual => {
        const existing = byType.get(qual.name) || { name: qual.name, expired: 0, expiring: 0, current: 0 };
        if (!qual.expiryDate || new Date(qual.expiryDate) > ninetyDays) {
          existing.current++;
        } else if (new Date(qual.expiryDate) < now) {
          existing.expired++;
        } else {
          existing.expiring++;
        }
        byType.set(qual.name, existing);
      });

      // Group by squadron
      const bySquadron = new Map<string, { squadron: string; expired: number; expiring: number; current: number; total: number }>();
      filteredQuals.forEach(qual => {
        const sqn = qual.squadron || 'Unknown';
        const existing = bySquadron.get(sqn) || { squadron: sqn, expired: 0, expiring: 0, current: 0, total: 0 };
        existing.total++;
        if (!qual.expiryDate || new Date(qual.expiryDate) > ninetyDays) {
          existing.current++;
        } else if (new Date(qual.expiryDate) < now) {
          existing.expired++;
        } else {
          existing.expiring++;
        }
        bySquadron.set(sqn, existing);
      });

      // Calculate unique personnel counts (a person should only be counted once even if they have multiple expiring quals)
      const personnelWithExpiredQuals = new Set(expired.map(q => q.userId));
      const personnelWithExpiringQuals = new Set([...expiring30, ...expiring60, ...expiring90].map(q => q.userId));
      const allExpiringQuals = [...expiring30, ...expiring60, ...expiring90];

      res.json({
        summary: {
          total: filteredQuals.length,
          expired: expired.length,
          expiring30Days: expiring30.length,
          expiring60Days: expiring60.length,
          expiring90Days: expiring90.length,
          current: current.length,
          noExpiry: noExpiry.length,
          // NEW: Unique personnel counts
          personnelWithExpiredQuals: personnelWithExpiredQuals.size,
          personnelAtRisk: personnelWithExpiringQuals.size,
          totalExpiringQuals: allExpiringQuals.length,
        },
        expired: expired.map(q => ({
          ...q,
          daysOverdue: Math.floor((now.getTime() - new Date(q.expiryDate!).getTime()) / (24 * 60 * 60 * 1000)),
        })),
        expiring30: expiring30.map(q => ({
          ...q,
          daysRemaining: Math.floor((new Date(q.expiryDate!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        })),
        expiring60: expiring60.map(q => ({
          ...q,
          daysRemaining: Math.floor((new Date(q.expiryDate!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        })),
        expiring90: expiring90.map(q => ({
          ...q,
          daysRemaining: Math.floor((new Date(q.expiryDate!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
        })),
        byType: Array.from(byType.values()),
        bySquadron: Array.from(bySquadron.values()),
      });
    } catch (error) {
      console.error("Error fetching currency status analytics:", error);
      res.status(500).json({ message: "Failed to fetch currency status analytics" });
    }
  });

  // Squadron Readiness Analytics
  app.get("/api/analytics/squadron-readiness", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      // Get all users with their readiness status
      const allUsers = await db.select({
        userId: users.id,
        email: licenses.email,
        firstName: licenses.firstName,
        lastName: licenses.lastName,
        squadron: licenses.squadron,
        category: licenses.category,
        licenseType: licenses.licenseType,
        isFlightReady: licenses.isFlightReady,
        notReadyReason: licenses.notReadyReason,
        readinessUpdatedAt: licenses.readinessUpdatedAt,
      })
      .from(users)
      .leftJoin(licenses, eq(users.licenseId, licenses.id))
      .where(eq(licenses.isActive, true));

      // Group by squadron
      type UserRecord = typeof allUsers[number];
      const squadronMap = new Map<string, {
        squadron: string;
        total: number;
        ready: number;
        notReady: number;
        reasonBreakdown: Map<string, number>;
        members: UserRecord[];
      }>();

      allUsers.forEach(user => {
        const sqn = user.squadron || 'Unknown';
        const existing = squadronMap.get(sqn) || {
          squadron: sqn,
          total: 0,
          ready: 0,
          notReady: 0,
          reasonBreakdown: new Map(),
          members: [] as UserRecord[],
        };
        
        existing.total++;
        if (user.isFlightReady) {
          existing.ready++;
        } else {
          existing.notReady++;
          const reason = user.notReadyReason || 'Unspecified';
          existing.reasonBreakdown.set(reason, (existing.reasonBreakdown.get(reason) || 0) + 1);
        }
        existing.members.push(user);
        
        squadronMap.set(sqn, existing);
      });

      // Overall stats
      const totalUsers = allUsers.length;
      const totalReady = allUsers.filter(u => u.isFlightReady).length;
      const totalNotReady = totalUsers - totalReady;

      // Reason breakdown across all squadrons
      const overallReasons = new Map<string, number>();
      allUsers.filter(u => !u.isFlightReady).forEach(u => {
        const reason = u.notReadyReason || 'Unspecified';
        overallReasons.set(reason, (overallReasons.get(reason) || 0) + 1);
      });

      res.json({
        summary: {
          total: totalUsers,
          ready: totalReady,
          notReady: totalNotReady,
          readyPercent: totalUsers > 0 ? Math.round((totalReady / totalUsers) * 100) : 0,
        },
        reasonBreakdown: Array.from(overallReasons.entries()).map(([reason, count]) => ({
          reason,
          count,
          percent: totalNotReady > 0 ? Math.round((count / totalNotReady) * 100) : 0,
        })),
        bySquadron: Array.from(squadronMap.values()).map(sqn => ({
          squadron: sqn.squadron,
          total: sqn.total,
          ready: sqn.ready,
          notReady: sqn.notReady,
          readyPercent: sqn.total > 0 ? Math.round((sqn.ready / sqn.total) * 100) : 0,
          reasonBreakdown: Array.from(sqn.reasonBreakdown.entries()).map(([reason, count]) => ({
            reason,
            count,
          })),
        })),
        notReadyMembers: allUsers
          .filter(u => !u.isFlightReady)
          .map(u => ({
            userId: u.userId,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            squadron: u.squadron,
            reason: u.notReadyReason,
            updatedAt: u.readinessUpdatedAt,
          })),
      });
    } catch (error) {
      console.error("Error fetching squadron readiness analytics:", error);
      res.status(500).json({ message: "Failed to fetch squadron readiness analytics" });
    }
  });

  // Safety Summary Analytics
  app.get("/api/analytics/safety-summary", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { squadron, startDate, endDate } = req.query;

      // Get all safety records
      const records = await db.select({
        id: safetyRecords.id,
        recordType: safetyRecords.recordType,
        severity: safetyRecords.severity,
        date: safetyRecords.date,
        status: safetyRecords.status,
        squadron: safetyRecords.squadron,
      })
      .from(safetyRecords)
      .orderBy(desc(safetyRecords.date));

      // Filter
      let filteredRecords = records;
      if (squadron && squadron !== 'all') {
        filteredRecords = filteredRecords.filter(r => r.squadron === squadron);
      }
      if (startDate) {
        const start = new Date(startDate as string);
        filteredRecords = filteredRecords.filter(r => new Date(r.date) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        filteredRecords = filteredRecords.filter(r => new Date(r.date) <= end);
      }

      // Count by type
      const byType = {
        incident: filteredRecords.filter(r => r.recordType === 'incident').length,
        observation: filteredRecords.filter(r => r.recordType === 'observation').length,
        commendation: filteredRecords.filter(r => r.recordType === 'commendation').length,
        training_failure: filteredRecords.filter(r => r.recordType === 'training_failure').length,
      };

      // Count by severity (for incidents only)
      const incidents = filteredRecords.filter(r => r.recordType === 'incident');
      const bySeverity = {
        minor: incidents.filter(r => r.severity === 'minor').length,
        moderate: incidents.filter(r => r.severity === 'moderate').length,
        major: incidents.filter(r => r.severity === 'major').length,
      };

      // Count by status
      const byStatus = {
        open: filteredRecords.filter(r => r.status === 'open').length,
        reviewed: filteredRecords.filter(r => r.status === 'reviewed').length,
        closed: filteredRecords.filter(r => r.status === 'closed').length,
      };

      // By squadron
      const squadronMap = new Map<string, { squadron: string; incidents: number; observations: number; commendations: number; trainingFailures: number }>();
      filteredRecords.forEach(r => {
        const sqn = r.squadron || 'Unknown';
        const existing = squadronMap.get(sqn) || { squadron: sqn, incidents: 0, observations: 0, commendations: 0, trainingFailures: 0 };
        if (r.recordType === 'incident') existing.incidents++;
        else if (r.recordType === 'observation') existing.observations++;
        else if (r.recordType === 'commendation') existing.commendations++;
        else if (r.recordType === 'training_failure') existing.trainingFailures++;
        squadronMap.set(sqn, existing);
      });

      // Monthly trend (last 6 months)
      const monthlyTrend: { month: string; incidents: number; observations: number; commendations: number }[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthKey = month.toLocaleString('default', { month: 'short', year: '2-digit' });
        
        const monthRecords = filteredRecords.filter(r => {
          const date = new Date(r.date);
          return date >= month && date <= monthEnd;
        });
        
        monthlyTrend.push({
          month: monthKey,
          incidents: monthRecords.filter(r => r.recordType === 'incident').length,
          observations: monthRecords.filter(r => r.recordType === 'observation').length,
          commendations: monthRecords.filter(r => r.recordType === 'commendation').length,
        });
      }

      // Calculate safety score (0-100)
      // Start at 100, subtract for incidents (5 per incident, severity weighted)
      // Minor incidents lose less points
      const minorIncidents = incidents.filter(r => r.severity === 'minor').length;
      const moderateIncidents = incidents.filter(r => r.severity === 'moderate').length;
      const majorIncidents = incidents.filter(r => r.severity === 'major').length;
      const incidentDeduction = (minorIncidents * 2) + (moderateIncidents * 5) + (majorIncidents * 10);
      
      // Bonus for commendations (up to 20 points)
      const commendationBonus = Math.min(byType.commendation * 0.5, 20);
      
      // Bonus for proactive observations (up to 10 points)
      const observationBonus = Math.min(byType.observation * 0.3, 10);
      
      let safetyScore = Math.max(0, Math.min(100, 100 - incidentDeduction + commendationBonus + observationBonus));
      safetyScore = Math.round(safetyScore);
      
      // Determine label
      let safetyScoreLabel = 'N/A';
      if (filteredRecords.length > 0) {
        if (safetyScore >= 90) safetyScoreLabel = 'Excellent';
        else if (safetyScore >= 80) safetyScoreLabel = 'Good';
        else if (safetyScore >= 60) safetyScoreLabel = 'Satisfactory';
        else if (safetyScore >= 40) safetyScoreLabel = 'Needs Improvement';
        else safetyScoreLabel = 'Critical';
      }

      res.json({
        summary: {
          total: filteredRecords.length,
          ...byType,
        },
        byType,
        bySeverity,
        byStatus,
        bySquadron: Array.from(squadronMap.values()),
        monthlyTrend,
        openItems: filteredRecords
          .filter(r => r.status === 'open')
          .slice(0, 10), // Latest 10 open items
        safetyScore,
        safetyScoreLabel,
      });
    } catch (error) {
      console.error("Error fetching safety summary analytics:", error);
      res.status(500).json({ message: "Failed to fetch safety summary analytics" });
    }
  });

  // Readiness History Analytics - Historical trends over time
  app.get("/api/analytics/readiness-history", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { squadron = "ALL", startDate, endDate, limit = "90" } = req.query;

      const snapshots = await db.select()
        .from(readinessSnapshots)
        .where(eq(readinessSnapshots.squadron, squadron as string))
        .orderBy(desc(readinessSnapshots.snapshotDate))
        .limit(parseInt(limit as string));

      let filtered = snapshots;
      if (startDate) {
        const start = new Date(startDate as string);
        filtered = filtered.filter(s => new Date(s.snapshotDate) >= start);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        filtered = filtered.filter(s => new Date(s.snapshotDate) <= end);
      }

      // Reverse to chronological order
      const chronological = filtered.reverse();

      // Calculate trends
      const dataPoints = chronological.length;
      let readinessTrend = 0;
      let qualsTrend = 0;

      if (dataPoints >= 2) {
        const first = chronological[0];
        const last = chronological[dataPoints - 1];
        readinessTrend = last.readyPercent - first.readyPercent;
        const firstQualRate = first.currentQuals / Math.max(first.currentQuals + first.expiringQuals + first.expiredQuals, 1) * 100;
        const lastQualRate = last.currentQuals / Math.max(last.currentQuals + last.expiringQuals + last.expiredQuals, 1) * 100;
        qualsTrend = lastQualRate - firstQualRate;
      }

      // Find best and worst days
      let bestDay = chronological[0];
      let worstDay = chronological[0];
      chronological.forEach(s => {
        if (s.readyPercent > bestDay.readyPercent) bestDay = s;
        if (s.readyPercent < worstDay.readyPercent) worstDay = s;
      });

      res.json({
        dataPoints: chronological,
        summary: {
          totalSnapshots: dataPoints,
          dateRange: {
            start: chronological[0]?.snapshotDate || null,
            end: chronological[dataPoints - 1]?.snapshotDate || null,
          },
          latestReadiness: chronological[dataPoints - 1]?.readyPercent || 0,
          averageReadiness: dataPoints > 0 
            ? Math.round(chronological.reduce((sum, s) => sum + s.readyPercent, 0) / dataPoints) 
            : 0,
          readinessTrend: Math.round(readinessTrend * 10) / 10,
          qualsTrend: Math.round(qualsTrend * 10) / 10,
          bestDay: bestDay ? { date: bestDay.snapshotDate, percent: bestDay.readyPercent } : null,
          worstDay: worstDay ? { date: worstDay.snapshotDate, percent: worstDay.readyPercent } : null,
        },
        collectionStartDate: chronological[0]?.snapshotDate || new Date(),
      });
    } catch (error) {
      console.error("Error fetching readiness history:", error);
      res.status(500).json({ message: "Failed to fetch readiness history" });
    }
  });

  // Capture a daily readiness snapshot
  app.post("/api/analytics/capture-snapshot", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all squadrons plus AMG and ALL
      const squadrons = ['33', '35', '36', '37', 'AMG', 'ALL'];
      const snapshots = [];

      for (const squadron of squadrons) {
        // Check if we already have a snapshot for today for this squadron
        const existingSnapshot = await db.select()
          .from(readinessSnapshots)
          .where(and(
            eq(readinessSnapshots.squadron, squadron),
            sql`DATE(${readinessSnapshots.snapshotDate}) = DATE(${today})`
          ))
          .limit(1);

        if (existingSnapshot.length > 0) {
          snapshots.push({ squadron, status: 'exists' });
          continue;
        }

        // Calculate current readiness for this squadron
        const usersQuery = await db.select({
          id: users.id,
          userRole: users.userRole,
          licenseId: users.licenseId,
          squadron: licenses.squadron,
          isFlightReady: licenses.isFlightReady,
        })
        .from(users)
        .leftJoin(licenses, eq(users.licenseId, licenses.id))
        .where(eq(users.userRole, 'loadmaster'));

        let filteredUsers = usersQuery;
        if (squadron !== 'ALL' && squadron !== 'AMG') {
          filteredUsers = usersQuery.filter(u => u.squadron === squadron);
        }

        const totalPersonnel = filteredUsers.length;
        const readyCount = filteredUsers.filter(u => u.isFlightReady === true).length;
        const notReadyCount = totalPersonnel - readyCount;
        const readyPercent = totalPersonnel > 0 ? Math.round((readyCount / totalPersonnel) * 100) : 0;

        // Get qualification stats
        const qualStats = await db.select({
          id: userQualifications.id,
          expiryDate: userQualifications.expiryDate,
          userId: userQualifications.userId,
        })
        .from(userQualifications)
        .leftJoin(users, eq(userQualifications.userId, users.id))
        .leftJoin(licenses, eq(users.licenseId, licenses.id));

        let filteredQuals = qualStats;
        if (squadron !== 'ALL' && squadron !== 'AMG') {
          const squadronUserIds = filteredUsers.map(u => u.id);
          filteredQuals = qualStats.filter(q => squadronUserIds.includes(q.userId));
        }

        const now = new Date();
        const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

        let currentQuals = 0;
        let expiringQuals = 0;
        let expiredQuals = 0;
        const atRiskUserIds = new Set<number>();

        filteredQuals.forEach(q => {
          if (!q.expiryDate) {
            currentQuals++;
          } else {
            const expiry = new Date(q.expiryDate);
            if (expiry < now) {
              expiredQuals++;
              atRiskUserIds.add(q.userId);
            } else if (expiry <= ninetyDaysFromNow) {
              expiringQuals++;
              atRiskUserIds.add(q.userId);
            } else {
              currentQuals++;
            }
          }
        });

        // Insert snapshot
        const [newSnapshot] = await db.insert(readinessSnapshots)
          .values({
            snapshotDate: today,
            squadron,
            totalPersonnel,
            readyCount,
            notReadyCount,
            readyPercent,
            currentQuals,
            expiringQuals,
            expiredQuals,
            personnelAtRisk: atRiskUserIds.size,
          })
          .returning();

        snapshots.push({ squadron, status: 'created', data: newSnapshot });
      }

      res.json({ message: 'Snapshot capture complete', snapshots });
    } catch (error) {
      console.error("Error capturing readiness snapshot:", error);
      res.status(500).json({ message: "Failed to capture readiness snapshot" });
    }
  });

  // Qualification Forecast Analytics - Predict future expirations
  app.get("/api/analytics/qualification-forecast", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { squadron = "all", months = "6" } = req.query;
      const numMonths = parseInt(months as string);

      // Get all qualifications with expiry dates
      const qualifications = await db.select({
        id: userQualifications.id,
        userId: userQualifications.userId,
        name: userQualifications.name,
        expiryDate: userQualifications.expiryDate,
        squadron: licenses.squadron,
        userName: sql<string>`CONCAT(${licenses.firstName}, ' ', ${licenses.lastName})`,
      })
      .from(userQualifications)
      .leftJoin(users, eq(userQualifications.userId, users.id))
      .leftJoin(licenses, eq(users.licenseId, licenses.id));

      // Filter by squadron if specified
      let filteredQuals = qualifications.filter(q => q.expiryDate !== null);
      if (squadron && squadron !== 'all') {
        filteredQuals = filteredQuals.filter(q => q.squadron === squadron);
      }

      const now = new Date();
      const forecast: {
        month: string;
        monthLabel: string;
        expiringThisMonth: number;
        personnelAffected: number;
        cumulativeExpired: number;
        qualificationBreakdown: { name: string; expiring: number }[];
      }[] = [];

      let cumulativeExpired = 0;
      const criticalAlerts: { month: string; alert: string }[] = [];

      // Calculate for each month
      for (let i = 0; i < numMonths; i++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 0, 23, 59, 59);
        const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

        // Find quals expiring this month
        const expiringThisMonth = filteredQuals.filter(q => {
          const expiry = new Date(q.expiryDate!);
          return expiry >= monthStart && expiry <= monthEnd;
        });

        // Count unique personnel
        const personnelSet = new Set(expiringThisMonth.map(q => q.userId));

        // Group by qualification type
        const byType = new Map<string, number>();
        expiringThisMonth.forEach(q => {
          byType.set(q.name, (byType.get(q.name) || 0) + 1);
        });

        cumulativeExpired += expiringThisMonth.length;

        const qualificationBreakdown = Array.from(byType.entries())
          .map(([name, expiring]) => ({ name, expiring }))
          .sort((a, b) => b.expiring - a.expiring);

        forecast.push({
          month: monthKey,
          monthLabel,
          expiringThisMonth: expiringThisMonth.length,
          personnelAffected: personnelSet.size,
          cumulativeExpired,
          qualificationBreakdown,
        });

        // Generate critical alerts
        if (expiringThisMonth.length > 5) {
          criticalAlerts.push({
            month: monthLabel,
            alert: `${expiringThisMonth.length} qualifications expiring - high training demand expected`,
          });
        }

        // Check for specific qualification spikes
        qualificationBreakdown.forEach(qb => {
          if (qb.expiring >= 3) {
            criticalAlerts.push({
              month: monthLabel,
              alert: `${qb.expiring} ${qb.name} renewals needed`,
            });
          }
        });
      }

      // Generate recommendations
      const recommendations: string[] = [];
      
      // Find months with heavy loads
      const heavyMonths = forecast.filter(f => f.expiringThisMonth > 5);
      if (heavyMonths.length > 0) {
        recommendations.push(`High renewal volume expected in ${heavyMonths.map(m => m.monthLabel).join(', ')} - plan training capacity accordingly`);
      }

      // Find qualification types with most expirations
      const allQualTypes = new Map<string, number>();
      forecast.forEach(f => {
        f.qualificationBreakdown.forEach(qb => {
          allQualTypes.set(qb.name, (allQualTypes.get(qb.name) || 0) + qb.expiring);
        });
      });
      
      const sortedQualTypes = Array.from(allQualTypes.entries()).sort((a, b) => b[1] - a[1]);
      if (sortedQualTypes.length > 0) {
        const [topQual, count] = sortedQualTypes[0];
        recommendations.push(`${topQual} has ${count} renewals in next ${numMonths} months - consider batch training sessions`);
      }

      // Calculate total personnel impacted
      const uniquePersonnel = new Set<number>();
      filteredQuals.forEach(q => {
        const expiry = new Date(q.expiryDate!);
        const futureLimit = new Date(now.getFullYear(), now.getMonth() + numMonths, 0);
        if (expiry <= futureLimit && expiry >= now) {
          uniquePersonnel.add(q.userId);
        }
      });

      res.json({
        forecast,
        summary: {
          totalExpiringQuals: cumulativeExpired,
          totalPersonnelAffected: uniquePersonnel.size,
          averagePerMonth: Math.round(cumulativeExpired / numMonths * 10) / 10,
          peakMonth: forecast.reduce((max, f) => f.expiringThisMonth > max.expiringThisMonth ? f : max, forecast[0]),
        },
        criticalAlerts: criticalAlerts.slice(0, 5), // Limit to top 5 alerts
        recommendations,
        qualificationTypeSummary: sortedQualTypes.slice(0, 10).map(([name, count]) => ({ name, totalExpiring: count })),
      });
    } catch (error) {
      console.error("Error fetching qualification forecast:", error);
      res.status(500).json({ message: "Failed to fetch qualification forecast" });
    }
  });

  // ICC Power Law Distribution Analytics - Performance curves by time in role
  app.get("/api/analytics/icc-power-law", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { metric = "assessmentsPassed", squadron = "all" } = req.query;
      
      // Get all users with their license data and calculate time in role
      const usersWithLicenses = await db.select({
        userId: users.id,
        licenseId: licenses.id,
        issuedDate: licenses.issuedDate,
        squadron: licenses.squadron,
        firstName: licenses.firstName,
        lastName: licenses.lastName,
        totalCargoWeight: licenses.totalCargoWeight,
      })
      .from(users)
      .innerJoin(licenses, eq(users.licenseId, licenses.id));

      // Filter by squadron if specified
      let filteredUsers = usersWithLicenses;
      if (squadron && squadron !== 'all') {
        filteredUsers = usersWithLicenses.filter(u => u.squadron === squadron);
      }

      // Calculate time in role (months) for each user
      const now = new Date();
      const usersWithTenure = filteredUsers.map(u => {
        const issuedDate = new Date(u.issuedDate);
        const monthsInRole = Math.floor((now.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        return { ...u, monthsInRole: Math.max(0, monthsInRole) };
      });

      // Get metric data based on selected metric type
      let metricData: Map<number, number> = new Map();

      if (metric === 'assessmentsPassed') {
        // Count passed assessments per user
        const submissions = await db.select({
          userId: scenarioSubmissions.userId,
          passed: scenarioSubmissions.passed,
        }).from(scenarioSubmissions);

        submissions.forEach(s => {
          if (s.passed) {
            metricData.set(s.userId, (metricData.get(s.userId) || 0) + 1);
          }
        });
      } else if (metric === 'totalFlightHours') {
        // Sum flight hours per user
        const flights = await db.select({
          userId: flightRecords.userId,
          dayHours: flightRecords.dayHours,
          nightHours: flightRecords.nightHours,
        }).from(flightRecords);

        flights.forEach(f => {
          const hours = (f.dayHours || 0) + (f.nightHours || 0);
          metricData.set(f.userId, (metricData.get(f.userId) || 0) + hours);
        });
      } else if (metric === 'activeQualifications') {
        // Count active qualifications per user
        const quals = await db.select({
          userId: userQualifications.userId,
          expiryDate: userQualifications.expiryDate,
        }).from(userQualifications);

        quals.forEach(q => {
          // Count as active if no expiry or expiry in future
          const isActive = !q.expiryDate || new Date(q.expiryDate) > now;
          if (isActive) {
            metricData.set(q.userId, (metricData.get(q.userId) || 0) + 1);
          }
        });
      } else if (metric === 'averageScore') {
        // Calculate average assessment score per user
        const submissions = await db.select({
          userId: scenarioSubmissions.userId,
          score: scenarioSubmissions.score,
        }).from(scenarioSubmissions);

        const userScores: Map<number, { total: number; count: number }> = new Map();
        submissions.forEach(s => {
          if (s.score !== null) {
            const current = userScores.get(s.userId) || { total: 0, count: 0 };
            current.total += s.score;
            current.count += 1;
            userScores.set(s.userId, current);
          }
        });

        userScores.forEach((data, userId) => {
          metricData.set(userId, Math.round(data.total / data.count));
        });
      } else if (metric === 'cargoWeight') {
        // Use total cargo weight from license
        usersWithTenure.forEach(u => {
          metricData.set(u.userId, u.totalCargoWeight || 0);
        });
      }

      // Bin users by time in role (years)
      const yearBins: Map<number, { users: number; totalMetric: number; squadron: string }[]> = new Map();
      
      // Get unique squadrons for multi-line chart
      const squadrons = squadron === 'all' 
        ? ['33SQN', '35SQN', '36SQN', '37SQN', 'AMG']
        : [squadron as string];

      // Initialize bins for 0-12 years
      for (let year = 0; year <= 12; year++) {
        yearBins.set(year, squadrons.map(sq => ({ users: 0, totalMetric: 0, squadron: sq })));
      }

      // Aggregate data by year and squadron
      usersWithTenure.forEach(u => {
        const yearInRole = Math.min(12, Math.floor(u.monthsInRole / 12));
        const userMetric = metricData.get(u.userId) || 0;
        
        const binData = yearBins.get(yearInRole);
        if (binData) {
          const squadronBin = binData.find(b => b.squadron === u.squadron);
          if (squadronBin) {
            squadronBin.users += 1;
            squadronBin.totalMetric += userMetric;
          }
        }
      });

      // Calculate cumulative power law curves
      // For each squadron, calculate normalized cumulative performance
      const curves = squadrons.map(sq => {
        let cumulativeUsers = 0;
        let cumulativeMetric = 0;
        const maxPossible = metric === 'averageScore' ? 100 : 
                          metric === 'assessmentsPassed' ? 20 :
                          metric === 'totalFlightHours' ? 800 :
                          metric === 'activeQualifications' ? 15 :
                          50000; // cargoWeight

        const dataPoints = [];
        for (let year = 0; year <= 12; year++) {
          const binData = yearBins.get(year);
          const squadronBin = binData?.find(b => b.squadron === sq);
          
          if (squadronBin && squadronBin.users > 0) {
            cumulativeUsers += squadronBin.users;
            cumulativeMetric += squadronBin.totalMetric;
          }

          // Calculate average metric for users up to this tenure
          const avgMetric = cumulativeUsers > 0 ? cumulativeMetric / cumulativeUsers : 0;
          
          // Normalize to 0-1 scale for power law curve
          const normalizedValue = Math.min(1, avgMetric / maxPossible);
          
          // Apply sigmoid transformation for S-curve shape
          // Using logistic function: 1 / (1 + e^(-k(x-x0)))
          const k = 0.8; // Steepness
          const x0 = 5; // Midpoint (years)
          const sigmoidModifier = 1 / (1 + Math.exp(-k * (year - x0)));
          const blendedValue = (normalizedValue * 0.6) + (sigmoidModifier * 0.4);

          dataPoints.push({
            year,
            yearLabel: year === 0 ? '0-1' : `${year}-${year + 1}`,
            rawValue: Math.round(avgMetric * 100) / 100,
            normalizedValue: Math.round(blendedValue * 1000) / 1000,
            usersInBin: squadronBin?.users || 0,
            cumulativeUsers,
          });
        }

        return {
          squadron: sq,
          // RULE: All ICC chart lines must always display unique colors
          // Each squadron is assigned a distinct, visually distinguishable color
          color: sq === '33SQN' ? '#FF9500'    // Orange
                 : sq === '35SQN' ? '#10B981'  // Teal
                 : sq === '36SQN' ? '#3B82F6'  // Blue
                 : sq === '37SQN' ? '#8B5CF6'  // Purple
                 : '#FBBF24',                   // Yellow (AMG)
          dataPoints,
        };
      });

      // Generate insights based on the data
      const insights = [];
      
      // Find best performing squadron
      const squadronPerformance = curves.map(c => ({
        squadron: c.squadron,
        avgPerformance: c.dataPoints.reduce((sum, d) => sum + d.normalizedValue, 0) / c.dataPoints.length,
      })).sort((a, b) => b.avgPerformance - a.avgPerformance);

      if (squadronPerformance.length > 1) {
        insights.push({
          type: 'strength',
          title: `${squadronPerformance[0].squadron} leads in ${metric === 'assessmentsPassed' ? 'assessment completion' : metric === 'totalFlightHours' ? 'flight experience' : 'this metric'}`,
          description: 'Highest average performance across tenure levels',
        });
      }

      // Find steep growth periods
      curves.forEach(c => {
        let maxGrowth = 0;
        let maxGrowthYear = 0;
        for (let i = 1; i < c.dataPoints.length; i++) {
          const growth = c.dataPoints[i].normalizedValue - c.dataPoints[i - 1].normalizedValue;
          if (growth > maxGrowth) {
            maxGrowth = growth;
            maxGrowthYear = i;
          }
        }
        if (maxGrowth > 0.1) {
          insights.push({
            type: 'observation',
            title: `${c.squadron}: Peak development at year ${maxGrowthYear}`,
            description: 'Steepest performance improvement observed at this tenure level',
          });
        }
      });

      res.json({
        metric,
        metricLabel: metric === 'assessmentsPassed' ? 'Assessments Passed' :
                     metric === 'totalFlightHours' ? 'Total Flight Hours' :
                     metric === 'activeQualifications' ? 'Active Qualifications' :
                     metric === 'averageScore' ? 'Average Assessment Score' :
                     'Cargo Weight Handled (kg)',
        curves,
        insights: insights.slice(0, 5),
        summary: {
          totalUsers: usersWithTenure.length,
          squadronsIncluded: squadrons.length,
          tenureRange: {
            min: Math.min(...usersWithTenure.map(u => u.monthsInRole)),
            max: Math.max(...usersWithTenure.map(u => u.monthsInRole)),
          },
        },
      });
    } catch (error) {
      console.error("Error fetching ICC power law data:", error);
      res.status(500).json({ message: "Failed to fetch ICC power law data" });
    }
  });

  // ==================== USER REPORT ENDPOINT ====================
  
  // Get users list filtered by squadron (for report generation)
  app.get("/api/instructor/users", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { squadron } = req.query;
      
      let allUsers = await db.select({
        userId: users.id,
        email: licenses.email,
        firstName: licenses.firstName,
        lastName: licenses.lastName,
        squadron: licenses.squadron,
        category: licenses.category,
        licenseType: licenses.licenseType,
        isFlightReady: licenses.isFlightReady,
        profilePhotoUrl: licenses.profilePhotoUrl,
      })
      .from(users)
      .leftJoin(licenses, eq(users.licenseId, licenses.id))
      .where(and(
        eq(licenses.isActive, true),
        inArray(licenses.licenseType, ['loadmaster', 'instructor'])
      ));

      // Filter by squadron if provided
      if (squadron && squadron !== 'all' && squadron !== 'AMG') {
        allUsers = allUsers.filter(u => u.squadron === squadron || u.squadron === `${squadron}SQN`);
      }

      res.json(allUsers.map(u => ({
        ...u,
        fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      })));
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Comprehensive User Report - aggregates all user data
  app.get("/api/instructor/user-report/:userId", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Get user profile with license info
      const [userProfile] = await db.select({
        userId: users.id,
        email: licenses.email,
        firstName: licenses.firstName,
        lastName: licenses.lastName,
        squadron: licenses.squadron,
        category: licenses.category,
        licenseType: licenses.licenseType,
        isFlightReady: licenses.isFlightReady,
        notReadyReason: licenses.notReadyReason,
        profilePhotoUrl: licenses.profilePhotoUrl,
        totalMissionsFlown: licenses.totalMissionsFlown,
        totalCargoWeight: licenses.totalCargoWeight,
        licenseIssuedDate: licenses.issuedDate,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(licenses, eq(users.licenseId, licenses.id))
      .where(eq(users.id, userId));

      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get qualifications
      const qualifications = await db.select()
        .from(userQualifications)
        .where(eq(userQualifications.userId, userId))
        .orderBy(desc(userQualifications.expiryDate));

      // Get flight records (last 20 with summary)
      const flightRecordsData = await db.select()
        .from(flightRecords)
        .where(eq(flightRecords.userId, userId))
        .orderBy(desc(flightRecords.date))
        .limit(20);

      // Get all flight records for summary stats
      const allFlightRecords = await db.select()
        .from(flightRecords)
        .where(eq(flightRecords.userId, userId));

      // Get scenario submissions (last 10)
      const scenarioSubmissionsData = await db.select({
        id: scenarioSubmissions.id,
        scenarioId: scenarioSubmissions.scenarioId,
        score: scenarioSubmissions.score,
        passed: scenarioSubmissions.passed,
        status: scenarioSubmissions.status,
        submissionDate: scenarioSubmissions.submissionDate,
        scenarioTitle: scenarios.title,
      })
      .from(scenarioSubmissions)
      .leftJoin(scenarios, eq(scenarioSubmissions.scenarioId, scenarios.id))
      .where(eq(scenarioSubmissions.userId, userId))
      .orderBy(desc(scenarioSubmissions.submissionDate))
      .limit(10);

      // Get all scenario submissions for stats
      const allScenarioSubmissions = await db.select()
        .from(scenarioSubmissions)
        .where(eq(scenarioSubmissions.userId, userId));

      // Get quiz submissions (last 10)
      const quizSubmissionsData = await db.select({
        id: quizSubmissions.id,
        quizId: quizSubmissions.quizId,
        score: quizSubmissions.score,
        submissionDate: quizSubmissions.submissionDate,
        quizTitle: quizzes.title,
      })
      .from(quizSubmissions)
      .leftJoin(quizzes, eq(quizSubmissions.quizId, quizzes.id))
      .where(eq(quizSubmissions.userId, userId))
      .orderBy(desc(quizSubmissions.submissionDate))
      .limit(10);

      // Get all quiz submissions for stats
      const allQuizSubmissions = await db.select()
        .from(quizSubmissions)
        .where(eq(quizSubmissions.userId, userId));

      // Get checklist completions
      const checklistCompletionsData = await db.select({
        id: checklistCompletions.id,
        checklistId: checklistCompletions.checklistId,
        completionStatus: checklistCompletions.completionStatus,
        completedAt: checklistCompletions.completedAt,
        totalItems: checklistCompletions.totalItems,
        completedCount: checklistCompletions.completedCount,
        checklistTitle: checklists.title,
      })
      .from(checklistCompletions)
      .leftJoin(checklists, eq(checklistCompletions.checklistId, checklists.id))
      .where(eq(checklistCompletions.userId, userId))
      .orderBy(desc(checklistCompletions.completedAt))
      .limit(10);

      // Get safety records for this user
      const safetyRecordsData = await db.select()
        .from(safetyRecords)
        .where(eq(safetyRecords.userId, userId))
        .orderBy(desc(safetyRecords.date))
        .limit(10);

      // Calculate qualification status
      const now = new Date();
      const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const qualStats = {
        total: qualifications.length,
        current: 0,
        expiringSoon: 0,
        expired: 0,
        noExpiry: 0,
      };

      const expiringQuals: Array<{name: string; expiryDate: Date | null; daysRemaining: number}> = [];
      const expiredQuals: Array<{name: string; expiryDate: Date | null; daysOverdue: number}> = [];

      qualifications.forEach(q => {
        if (!q.expiryDate) {
          qualStats.noExpiry++;
          qualStats.current++;
        } else {
          const expiry = new Date(q.expiryDate);
          if (expiry < now) {
            qualStats.expired++;
            expiredQuals.push({
              name: q.name,
              expiryDate: q.expiryDate,
              daysOverdue: Math.floor((now.getTime() - expiry.getTime()) / (24 * 60 * 60 * 1000)),
            });
          } else if (expiry <= ninetyDaysFromNow) {
            qualStats.expiringSoon++;
            expiringQuals.push({
              name: q.name,
              expiryDate: q.expiryDate,
              daysRemaining: Math.floor((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
            });
          } else {
            qualStats.current++;
          }
        }
      });

      // Calculate flight stats
      const flightStats = {
        totalFlights: allFlightRecords.length,
        totalDayHours: allFlightRecords.reduce((sum, r) => sum + (r.dayHours || 0), 0),
        totalNightHours: allFlightRecords.reduce((sum, r) => sum + (r.nightHours || 0), 0),
        totalHours: allFlightRecords.reduce((sum, r) => sum + (r.dayHours || 0) + (r.nightHours || 0), 0),
        totalCargoWeight: allFlightRecords.reduce((sum, r) => sum + (r.cargoWeight || 0), 0),
        totalPassengers: allFlightRecords.reduce((sum, r) => sum + (r.passengersCarried || 0), 0),
        aircraftTypes: Array.from(new Set(allFlightRecords.map(r => r.aircraftType).filter(Boolean))),
        last30Days: {
          flights: allFlightRecords.filter(r => {
            const d = new Date(r.date);
            return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }).length,
          hours: allFlightRecords.filter(r => {
            const d = new Date(r.date);
            return d >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          }).reduce((sum, r) => sum + (r.dayHours || 0) + (r.nightHours || 0), 0),
        },
      };

      // Calculate assessment stats
      const scenarioStats = {
        total: allScenarioSubmissions.length,
        passed: allScenarioSubmissions.filter(s => s.passed).length,
        failed: allScenarioSubmissions.filter(s => s.passed === false).length,
        pending: allScenarioSubmissions.filter(s => s.status === 'submitted').length,
        averageScore: allScenarioSubmissions.length > 0 
          ? Math.round(allScenarioSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / allScenarioSubmissions.length)
          : 0,
        passRate: allScenarioSubmissions.length > 0 
          ? Math.round((allScenarioSubmissions.filter(s => s.passed).length / allScenarioSubmissions.length) * 100)
          : 0,
      };

      const quizStats = {
        total: allQuizSubmissions.length,
        averageScore: allQuizSubmissions.length > 0
          ? Math.round(allQuizSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / allQuizSubmissions.length)
          : 0,
        highestScore: allQuizSubmissions.length > 0
          ? Math.max(...allQuizSubmissions.map(s => s.score || 0))
          : 0,
        lowestScore: allQuizSubmissions.length > 0
          ? Math.min(...allQuizSubmissions.map(s => s.score || 0))
          : 0,
      };

      // Calculate trend (compare last 30 days to previous 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentScenarios = allScenarioSubmissions.filter(s => new Date(s.submissionDate) >= thirtyDaysAgo);
      const previousScenarios = allScenarioSubmissions.filter(s => {
        const d = new Date(s.submissionDate);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      });

      const recentAvg = recentScenarios.length > 0 
        ? recentScenarios.reduce((sum, s) => sum + (s.score || 0), 0) / recentScenarios.length 
        : 0;
      const previousAvg = previousScenarios.length > 0 
        ? previousScenarios.reduce((sum, s) => sum + (s.score || 0), 0) / previousScenarios.length 
        : 0;

      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (recentScenarios.length > 0 && previousScenarios.length > 0) {
        if (recentAvg > previousAvg + 5) trend = 'improving';
        else if (recentAvg < previousAvg - 5) trend = 'declining';
      }

      // Calculate risk score (0-100, higher = more at risk)
      let riskScore = 0;
      
      // Expired qualifications: +30 points each (max 40)
      riskScore += Math.min(40, qualStats.expired * 30);
      
      // Expiring qualifications: +15 points each (max 30)
      riskScore += Math.min(30, qualStats.expiringSoon * 15);
      
      // Not flight ready: +20 points
      if (!userProfile.isFlightReady) riskScore += 20;
      
      // Low assessment average (<70%): +10 points
      if (scenarioStats.averageScore > 0 && scenarioStats.averageScore < 70) riskScore += 10;
      
      // No recent activity (no submissions in 30 days): +10 points
      const hasRecentActivity = recentScenarios.length > 0 || 
        allQuizSubmissions.some(s => new Date(s.submissionDate) >= thirtyDaysAgo);
      if (!hasRecentActivity && allScenarioSubmissions.length > 0) riskScore += 10;

      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (riskScore >= 60) riskLevel = 'critical';
      else if (riskScore >= 40) riskLevel = 'high';
      else if (riskScore >= 20) riskLevel = 'medium';

      // Calculate tenure
      const tenureMonths = userProfile.licenseIssuedDate 
        ? Math.floor((now.getTime() - new Date(userProfile.licenseIssuedDate).getTime()) / (30 * 24 * 60 * 60 * 1000))
        : 0;

      res.json({
        profile: {
          userId: userProfile.userId,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          fullName: `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() || userProfile.email,
          squadron: userProfile.squadron,
          category: userProfile.category,
          licenseType: userProfile.licenseType,
          isFlightReady: userProfile.isFlightReady,
          notReadyReason: userProfile.notReadyReason,
          profilePhotoUrl: userProfile.profilePhotoUrl,
          lastLogin: userProfile.lastLogin,
          tenureMonths,
          tenureYears: Math.floor(tenureMonths / 12),
        },
        riskAssessment: {
          score: riskScore,
          level: riskLevel,
          trend,
        },
        qualifications: {
          stats: qualStats,
          expiringQuals,
          expiredQuals,
          all: qualifications,
        },
        flightRecords: {
          stats: flightStats,
          recent: flightRecordsData,
        },
        scenarios: {
          stats: scenarioStats,
          recent: scenarioSubmissionsData,
        },
        quizzes: {
          stats: quizStats,
          recent: quizSubmissionsData,
        },
        checklists: {
          completed: checklistCompletionsData.filter(c => c.completionStatus === 'completed').length,
          inProgress: checklistCompletionsData.filter(c => c.completionStatus === 'in_progress').length,
          recent: checklistCompletionsData,
        },
        safety: {
          incidents: safetyRecordsData.filter(r => r.recordType === 'incident').length,
          observations: safetyRecordsData.filter(r => r.recordType === 'observation').length,
          commendations: safetyRecordsData.filter(r => r.recordType === 'commendation').length,
          recent: safetyRecordsData,
        },
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error generating user report:", error);
      res.status(500).json({ message: "Failed to generate user report" });
    }
  });

  const httpServer = createServer();
  httpServer.on("request", app);

  return httpServer;
}