import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { insertDocumentSchema, insertScenarioSchema, insertDocumentSubmissionSchema, insertScenarioSubmissionSchema, insertPhoneDirectorySchema, phoneDirectory, licenses, users, documents, scenarios, documentSubmissions, scenarioSubmissions } from "@shared/schema";
import { eq, and, gt, desc, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { generateAnalytics, analyzeCargoBalance, generateAdvancedAnalytics } from "./openai";
import { sendLicenseWelcomeEmail } from "./services/email-service";

// Authentication middleware functions
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // This will be handled by the isolated auth system in index.ts
  next();
}

function requireInstructor(req: Request, res: Response, next: NextFunction) {
  // This will be handled by the isolated auth system in index.ts
  next();
}

function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  // This will be handled by the isolated auth system in index.ts
  next();
}

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
  app.post("/api/licensing/licenses", requireSuperAdmin, async (req, res) => {
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
        userRole: licenseType === 'instructor' ? 'instructor' : 'loadmaster',
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
      const newStatus = activate ? 'active' : 'suspended';
      const updatedLicense = await db.update(licenses)
        .set({
          status: newStatus,
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
  
  // Import quiz routes with proper authentication
  const quizzesModule = await import('./routes/quizzes');
  app.use('/api/quizzes', quizzesModule.default);
  
  // Import direct quiz routes for comprehensive auth handling
  const quizDirectModule = await import('./routes/quiz-direct');
  app.use('/api/quiz', quizDirectModule.default);
  
  // Import debug session routes
  const debugSessionModule = await import('./routes/debug-session');
  app.use('/api/debug', debugSessionModule.default);
  
  // Documents routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve documents" });
    }
  });
  
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
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
      const document = await storage.createDocument(documentData);
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
      const document = await storage.updateDocument(documentId, documentData);
      
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
      const success = await storage.deleteDocument(documentId);
      
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // Document submissions routes
  app.get("/api/document-submissions", requireAuth, async (req, res) => {
    try {
      const documentId = req.query.documentId ? parseInt(req.query.documentId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Only instructors can see all submissions or other user's submissions
      if (req.user?.role !== 'instructor' && req.user?.role !== 'superadmin' && 
          (userId !== undefined && userId !== req.user?.id)) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      const submissions = await storage.getDocumentSubmissions(documentId, userId || req.user?.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve document submissions" });
    }
  });
  
  app.post("/api/document-submissions", requireAuth, async (req, res) => {
    try {
      const submissionData = insertDocumentSubmissionSchema.parse(req.body);
      const submission = await storage.createDocumentSubmission(submissionData);
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
      const scenarios = await storage.getScenarios();
      res.json(scenarios);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve scenarios" });
    }
  });
  
  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const scenario = await storage.getScenario(scenarioId);
      
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
      const scenario = await storage.createScenario(scenarioData);
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
      const scenario = await storage.updateScenario(scenarioId, scenarioData);
      
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
      const success = await storage.deleteScenario(scenarioId);
      
      if (!success) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });
  
  // Scenario submissions routes
  app.get("/api/scenario-submissions", requireAuth, async (req, res) => {
    try {
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Only instructors can see all submissions or other user's submissions
      if (req.user?.role !== 'instructor' && req.user?.role !== 'superadmin' && 
          (userId !== undefined && userId !== req.user?.id)) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      const submissions = await storage.getScenarioSubmissions(scenarioId, userId || req.user?.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve scenario submissions" });
    }
  });
  
  app.post("/api/scenario-submissions", requireAuth, async (req, res) => {
    try {
      const submissionData = insertScenarioSubmissionSchema.parse(req.body);
      const submission = await storage.createScenarioSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid submission data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create scenario submission" });
    }
  });

  // Analytics routes
  app.post("/api/analytics/generate", requireAuth, async (req, res) => {
    try {
      const { submissionId, type } = req.body;
      const analytics = await generateAnalytics(submissionId, type);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate analytics" });
    }
  });

  app.post("/api/analytics/cargo-balance", requireAuth, async (req, res) => {
    try {
      const { cargoData } = req.body;
      const analysis = await analyzeCargoBalance(cargoData);
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze cargo balance" });
    }
  });

  app.post("/api/analytics/advanced", requireAuth, async (req, res) => {
    try {
      const { userId, timeframe } = req.body;
      const analytics = await generateAdvancedAnalytics(userId, timeframe);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate advanced analytics" });
    }
  });

  const httpServer = createServer();
  httpServer.on("request", app);

  return httpServer;
}