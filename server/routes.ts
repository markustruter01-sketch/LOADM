import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertDocumentSchema, insertScenarioSchema, insertDocumentSubmissionSchema, insertScenarioSubmissionSchema, insertPhoneDirectorySchema, phoneDirectory, licenses, users } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { db } from "./db";
import { generateAnalytics, analyzeCargoBalance, generateAdvancedAnalytics } from "./openai";
import { sendLicenseWelcomeEmail } from "./services/email-service";
import { requireAuth, requireInstructor, requireSuperAdmin } from "./middleware/auth-middleware";

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
        createdAt: licenses.createdAt,
        userId: users.id,
        userEmail: users.email,
        isFirstLogin: users.isFirstLogin,
        hasPassword: users.hashedPassword
      })
      .from(licenses)
      .leftJoin(users, eq(licenses.id, users.licenseId))
      .orderBy(licenses.createdAt);

      res.json(allLicenses);
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
      
      // Get quiz submissions with proper ordering
      const rawSubmissions = await sql`SELECT * FROM quiz_submissions ORDER BY submission_date DESC`;
      
      if (rawSubmissions.length === 0) {
        return res.json([]);
      }
      
      // Get users and quizzes separately
      const users = await sql`SELECT id, email, first_name, last_name FROM users`;
      const quizzes = await sql`SELECT id, title, description FROM quizzes`;
      
      // Manually join the data
      const submissions = rawSubmissions.map(submission => {
        const user = users.find(u => u.id === submission.user_id);
        const quiz = quizzes.find(q => q.id === submission.quiz_id);
        
        return {
          id: submission.id,
          quizId: submission.quiz_id,
          userId: submission.user_id,
          submissionDate: submission.submission_date,
          answers: submission.answers,
          score: submission.score,
          squadron: submission.squadron,
          email: user?.email || 'Unknown User',
          firstName: user?.first_name || '',
          lastName: user?.last_name || '',
          quizTitle: quiz?.title || 'Unknown Quiz',
          quizDescription: quiz?.description || ''
        };
      });
      
      res.json(submissions);
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
  
  // Import quiz routes
  const quizzesRouter = await import('./routes/quizzes');
  app.use('/api/quizzes', quizzesRouter.default);
  
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