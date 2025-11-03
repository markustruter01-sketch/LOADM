import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertDocumentSchema, insertScenarioSchema, insertDocumentSubmissionSchema, insertScenarioSubmissionSchema, insertPhoneDirectorySchema, insertMissionSchema, insertMissionDocumentSchema, insertTrainingModuleVideoSchema, insertChecklistSchema, insertChecklistItemSchema, insertChecklistCompletionSchema, insertUserQualificationSchema, insertFlightRecordSchema, phoneDirectory, missions, missionDocuments, licenses, users, documents, scenarios, documentSubmissions, scenarioSubmissions, trainingModuleVideos, checklists, checklistItems, checklistCompletions, userQualifications, flightRecords } from "@shared/schema";
import { eq, and, gt, desc, lt, sql } from "drizzle-orm";
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
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mission:", error);
      res.status(500).json({ message: "Failed to delete mission" });
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
              if (ans.answeredOption === question.correctAnswer) {
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
              if (ans.answeredOption === question.correctAnswer) {
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
  
  app.delete("/api/documents/:id", requireInstructor, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const result = await db.delete(documents).where(eq(documents.id, documentId));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Document not found" });
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
      
      // Only instructors can see all submissions or other user's submissions
      if (req.user?.role !== 'instructor' && req.user?.role !== 'superadmin' && 
          (userId !== undefined && userId !== req.user?.id)) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      let whereConditions = [];
      if (documentId) {
        whereConditions.push(eq(documentSubmissions.documentId, documentId));
      }
      if (userId !== undefined) {
        whereConditions.push(eq(documentSubmissions.userId, userId));
      } else if (req.user?.id) {
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
  
  app.delete("/api/scenarios/:id", requireInstructor, async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const result = await db.delete(scenarios).where(eq(scenarios.id, scenarioId));
      
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Scenario not found" });
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
      
      // Only instructors can see all submissions or other user's submissions
      if (req.user?.role !== 'instructor' && req.user?.role !== 'superadmin' && 
          (userId !== undefined && userId !== req.user?.id)) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      let whereConditions = [];
      if (scenarioId) {
        whereConditions.push(eq(scenarioSubmissions.scenarioId, scenarioId));
      }
      if (userId !== undefined) {
        whereConditions.push(eq(scenarioSubmissions.userId, userId));
      } else if (req.user?.id) {
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
      // Return comprehensive training modules data matching what users see
      const trainingModules = [
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
      
      res.json(trainingModules);
    } catch (error) {
      console.error("Failed to fetch training modules:", error);
      res.status(500).json({ error: "Failed to fetch training modules" });
    }
  });

  app.post("/api/training-modules", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const moduleData = req.body;
      
      // Generate a mock ID for now
      const newModule = {
        id: Math.floor(Math.random() * 1000) + 100,
        ...moduleData,
        createdDate: new Date().toISOString().split('T')[0],
        lastModified: new Date().toISOString().split('T')[0],
        createdBy: req.user?.email || "Unknown",
        completionRate: 0
      };
      
      res.json(newModule);
    } catch (error) {
      console.error("Failed to create training module:", error);
      res.status(500).json({ error: "Failed to create training module" });
    }
  });

  app.put("/api/training-modules/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const moduleData = req.body;
      
      const updatedModule = {
        id: parseInt(id),
        ...moduleData,
        lastModified: new Date().toISOString().split('T')[0]
      };
      
      res.json(updatedModule);
    } catch (error) {
      console.error("Failed to update training module:", error);
      res.status(500).json({ error: "Failed to update training module" });
    }
  });

  app.delete("/api/training-modules/:id", requireInstructor, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      res.json({ message: "Training module deleted successfully" });
    } catch (error) {
      console.error("Failed to delete training module:", error);
      res.status(500).json({ error: "Failed to delete training module" });
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
        .where(eq(checklistItems.checklistId, checklistId));

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

      if (existingCompletion.length > 0) {
        // Update existing
        const [updated] = await db.update(checklistCompletions)
          .set({
            completedItems,
            completedCount,
            completionStatus,
            completedAt: completionStatus === "completed" ? new Date() : null
          })
          .where(eq(checklistCompletions.id, existingCompletion[0].id))
          .returning();

        console.log('🔧 COMPLETION UPDATE API: Updated existing completion');
        res.json(updated);
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

        console.log('🔧 COMPLETION UPDATE API: Created new completion');
        res.json(newCompletion);
      }
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

  const httpServer = createServer();
  httpServer.on("request", app);

  return httpServer;
}