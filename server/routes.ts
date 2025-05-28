import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Remove auth import - handled directly in index.ts now
import { z } from "zod";
import { insertDocumentSchema, insertScenarioSchema, insertDocumentSubmissionSchema, insertScenarioSubmissionSchema, licenses, users } from "@shared/schema";
import { eq, and, gt } from "drizzle-orm";
import { db } from "./db";
import { generateAnalytics, analyzeCargoBalance, generateAdvancedAnalytics } from "./openai";

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
  // Remove duplicate auth setup - handled in index.ts now

  // License management endpoints - integrated into main routes
  app.get("/api/licensing/licenses", async (req, res) => {
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
  app.post("/api/licensing/licenses", async (req, res) => {
    try {
      const { email, firstName, lastName, licenseType, expiryDate } = req.body;

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

      // Create user account with default password
      const defaultPassword = '12345678';
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

  // Logout is now handled in index.ts

  // Quiz submissions endpoint for instructors
  app.get("/api/instructor/quiz-submissions", async (req, res) => {
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
  app.post("/api/quiz-submissions/:id/mark", async (req, res) => {
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
  
  // Old licensing routes removed - using the new fixed system above

  // License verification endpoint
  app.post('/api/verify-license', async (req, res) => {
    try {
      const { email, username, licenseKey } = req.body;
      
      const license = await db
        .select()
        .from(licenses)
        .where(
          and(
            eq(licenses.email, email),
            eq(licenses.username, username),
            eq(licenses.licenseKey, licenseKey),
            eq(licenses.status, 'active'),
            gt(licenses.expiryDate, new Date())
          )
        )
        .limit(1);

      if (!license[0]) {
        return res.status(404).json({ 
          message: 'Invalid license credentials or license has expired' 
        });
      }

      // Check if user already exists for this license
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.licenseId, license[0].id))
        .limit(1);

      if (existingUser[0]) {
        return res.status(409).json({ 
          message: 'An account already exists for this license' 
        });
      }

      res.json({
        licenseId: license[0].id,
        username: license[0].username,
        email: license[0].email,
        expiryDate: license[0].expiryDate,
        maxConcurrentSessions: license[0].maxConcurrentSessions
      });
    } catch (error) {
      console.error('License verification error:', error);
      res.status(500).json({ message: 'License verification failed' });
    }
  });
  
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
  
  app.post("/api/documents", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
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
  
  app.put("/api/documents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
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
  
  app.delete("/api/documents/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !(req.user?.isAdmin)) {
        return res.status(403).json({ message: "Unauthorized: Admin access required" });
      }
      
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
  app.get("/api/document-submissions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const documentId = req.query.documentId ? parseInt(req.query.documentId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Only admin can see all submissions or other user's submissions
      if ((!req.user?.isAdmin) && (userId !== undefined && userId !== req.user?.id)) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      const submissions = await storage.getDocumentSubmissions(documentId, userId || req.user?.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve document submissions" });
    }
  });
  
  app.post("/api/document-submissions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const submissionData = insertDocumentSubmissionSchema.parse({
        ...req.body,
        userId: req.user?.id || 9
      });
      
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
  
  app.post("/api/scenarios", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized: Authentication required" });
      }
      
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
  
  app.put("/api/scenarios/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized: Authentication required" });
      }
      
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
  
  // Special endpoint to update a scenario's questions
  app.patch("/api/scenarios/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized: Authentication required" });
      }
      
      const scenarioId = parseInt(req.params.id);
      // Get the current scenario
      const currentScenario = await storage.getScenario(scenarioId);
      
      if (!currentScenario) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      // Validate and sanitize the request body
      const scenarioData = insertScenarioSchema.partial().parse(req.body);
      
      const scenario = await storage.updateScenario(scenarioId, scenarioData);
      
      res.json(scenario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scenario data", errors: error.errors });
      }
      console.error("Error updating scenario:", error);
      res.status(500).json({ message: "Failed to update scenario" });
    }
  });
  
  app.delete("/api/scenarios/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized: Authentication required" });
      }
      
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
  app.get("/api/scenario-submissions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Import pool for direct query
      const { pool } = await import('./db');
      
      // Create a safer, simpler query with error handling
      try {
        const query = `
          SELECT 
            ss.id, 
            ss.scenario_id AS "scenarioId", 
            ss.user_id AS "userId", 
            ss.submission_date AS "submissionDate", 
            ss.answers,
            ss.score, 
            ss.student_name AS "studentName", 
            ss.student_id AS "studentId", 
            ss.instructor_feedback AS "instructorFeedback", 
            ss.marked_answers AS "markedAnswers", 
            ss.status, 
            ss.passed,
            s.title AS "scenarioTitle"
          FROM 
            scenario_submissions ss
          LEFT JOIN
            scenarios s ON ss.scenario_id = s.id
          ORDER BY 
            ss.submission_date DESC
        `;
        
        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} scenario submissions`);
        
        if (result.rows.length > 0) {
          console.log("Sample submission:", JSON.stringify(result.rows[0]).substring(0, 200) + "...");
        }
        
        res.json(result.rows);
      } catch (dbError) {
        console.error("Database error in scenario submissions:", dbError);
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
        res.status(500).json({ 
          message: "Database error retrieving submissions", 
          error: errorMessage 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("General error in scenario submissions:", errorMessage);
      res.status(500).json({ 
        message: "Failed to retrieve scenario submissions"
      });
    }
  });
  
  app.post("/api/scenario-submissions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Log incoming data for debugging
      console.log("Incoming scenario submission data:", req.body);
      
      // Use the raw pool directly to avoid ORM type issues
      const { pool } = await import('./db');
      
      // Store squadron information in the student_id field (format: "ID - Squadron")
      const studentIdWithSquadron = req.body.squadron 
        ? `${req.body.studentId} - ${req.body.squadron}`
        : req.body.studentId;
        
      // Ensure answers is valid JSON
      let sanitizedAnswers;
      try {
        // If it's a string, try to parse it to make sure it's valid JSON
        if (typeof req.body.answers === 'string') {
          // Parse then stringify to validate
          sanitizedAnswers = JSON.stringify(JSON.parse(req.body.answers));
        } else {
          // If it's already an object, stringify it
          sanitizedAnswers = JSON.stringify(req.body.answers);
        }
      } catch (jsonError) {
        console.error("Invalid JSON in answers:", jsonError);
        // Provide a fallback empty array if the JSON is invalid
        sanitizedAnswers = '[]';
      }
      
      // Log and validate the scenarioId
      const scenarioId = req.body.scenarioId ? parseInt(req.body.scenarioId) : null;
      console.log("Scenario ID from request:", req.body.scenarioId, "Parsed:", scenarioId);
      
      // Ensure we have a valid scenario ID
      if (!scenarioId || isNaN(scenarioId)) {
        console.error("Invalid scenario ID:", req.body.scenarioId);
        return res.status(400).json({ 
          message: "Invalid scenario ID", 
          error: "Scenario ID must be a number" 
        });
      }
      
      const result = await pool.query(
        `INSERT INTO scenario_submissions 
         (scenario_id, user_id, submission_date, answers, status, student_name, student_id) 
         VALUES 
         ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6) 
         RETURNING *`,
        [
          scenarioId,
          req.user?.id || 9,
          sanitizedAnswers, // Properly validated JSON string
          'pending',
          req.body.studentName || '',
          studentIdWithSquadron || ''
        ]
      );
      
      // Return the inserted row
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error creating scenario submission:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid submission data", 
          errors: error.errors 
        });
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to create scenario submission", error: errorMessage });
    }
  });
  
  // Get a specific scenario submission - simplified approach
  app.get("/api/scenario-submissions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const submissionId = parseInt(req.params.id);
      console.log(`Retrieving submission ID: ${submissionId}`);
      
      // Use direct DB query with simpler format
      const { pool } = await import('./db');
      
      try {
        // Basic query to get the submission
        const result = await pool.query(
          `SELECT * FROM scenario_submissions WHERE id = $1`, 
          [submissionId]
        );
        
        // Check if submission exists
        if (result.rows.length === 0) {
          console.log(`Submission with ID ${submissionId} not found`);
          return res.status(404).json({ message: "Submission not found" });
        }
        
        // Transform the data to match frontend expectations
        const rawSubmission = result.rows[0];
        const submission = {
          id: rawSubmission.id,
          scenarioId: rawSubmission.scenario_id,
          userId: rawSubmission.user_id,
          submissionDate: rawSubmission.submission_date,
          answers: rawSubmission.answers,
          score: rawSubmission.score,
          studentName: rawSubmission.student_name,
          studentId: rawSubmission.student_id,
          instructorFeedback: rawSubmission.instructor_feedback,
          markedAnswers: rawSubmission.marked_answers,
          status: rawSubmission.status,
          passed: rawSubmission.passed
        };
        
        console.log(`Successfully retrieved submission: ${submission.id}`);
        res.json(submission);
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error';
        console.error("Database error retrieving submission:", errorMessage);
        res.status(500).json({ message: "Database error retrieving submission" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Error retrieving scenario submission:", errorMessage);
      res.status(500).json({ message: "Failed to retrieve scenario submission" });
    }
  });
  
  // Update a scenario submission (for instructor review)
  app.patch("/api/scenario-submissions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const submissionId = parseInt(req.params.id);
      console.log(`Updating submission ID: ${submissionId}`);
      
      const submission = await storage.getScenarioSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // For this test version, allow all authenticated users to review
      // This allows any user to provide reviews during testing
      
      // Skip zod validation to avoid type issues - pass the raw data
      // The storage method will handle the data correctly
      const updateData = {
        instructorFeedback: req.body.instructorFeedback,
        markedAnswers: req.body.markedAnswers,
        status: req.body.status,
        score: req.body.score ? parseInt(req.body.score) : undefined,
        passed: req.body.passed
      };
      
      console.log("Processing update with data:", JSON.stringify(updateData));
      
      // Use the updated storage method that handles raw data
      const updatedSubmission = await storage.updateScenarioSubmission(submissionId, updateData);
      
      if (!updatedSubmission) {
        return res.status(500).json({ message: "Failed to update submission" });
      }
      
      console.log(`Successfully updated submission: ${submissionId}`);
      res.json(updatedSubmission);
    } catch (error) {
      console.error("Error updating scenario submission:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to update scenario submission", error: errorMessage });
    }
  });
  
  // === User Management Routes ===
  
  // Get all registered users (admin only)
  app.get("/api/users", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only admins can view all users
      if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });
  
  // Delete a user (super admin only)
  app.delete("/api/users/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only super admins can delete users
      if (!req.user?.isSuperAdmin) {
        return res.status(403).json({ message: "Forbidden: Super Admin access required for account deletion" });
      }
      
      const userId = parseInt(req.params.id);
      
      // Prevent deleting your own account
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // AI analytics endpoint
  app.post("/api/analytics/insights", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { 
        scenarioName, 
        selectedScenarioId, 
        totalSubmissions, 
        averageScore, 
        passRate, 
        scoreDistribution, 
        passFailRatio 
      } = req.body;
      
      // Check if there's enough data to generate meaningful insights
      if (totalSubmissions < 2) {
        return res.status(400).json({ 
          message: "Insufficient data", 
          error: "At least 2-3 submissions are required for meaningful analysis" 
        });
      }
      
      const insightText = await generateAnalytics({
        scenarioName,
        selectedScenarioId,
        totalSubmissions,
        averageScore,
        passRate,
        scoreDistribution,
        passFailRatio
      });
      
      res.json({ insight: insightText });
    } catch (error) {
      console.error("Error generating analytics insights:", error);
      res.status(500).json({ 
        message: "Failed to generate analytics insights",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  
  // Load Planning Balance Analysis
  app.post("/api/load-planning/analysis", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { message, aircraftType, cargoData, balanceValue, balanceCG } = req.body;
      
      if (!aircraftType || balanceCG === undefined) {
        return res.status(400).json({ error: "Missing required cargo data" });
      }
      
      // Skip the OpenAI call entirely and use local analysis
      console.log("Using local analysis for cargo balance");
      
      // Generate a detailed fallback analysis
      let analysis = generateFallbackAnalysis(aircraftType, cargoData, balanceValue, balanceCG);
      
      // Return the local analysis
      res.json({ analysis });
    } catch (error) {
      console.error("Error generating cargo balance analysis:", error);
      // Still provide a useful response even if error
      res.json({ 
        analysis: "I'm having trouble analyzing the cargo data. Please check that all pallets have valid weights and positions." 
      });
    }
  });
  
  // Helper function to generate fallback analysis when OpenAI is unavailable
  function generateFallbackAnalysis(
    aircraftType: string,
    cargoData: any[],
    balanceValue: number,
    balanceCG: number
  ): string {
    // Get aircraft information
    const aircraftName = 
      aircraftType === 'c17' ? 'C-17 Globemaster' : 
      aircraftType === 'c130' ? 'C-130 Hercules' : 
      aircraftType === 'kc30a' ? 'KC30-A Airbus' : 'C-27J Spartan';
    
    // Calculate total weight and determine if balance is acceptable
    const totalWeight = cargoData.reduce((sum, pallet) => sum + (pallet.weight || 0), 0);
    const isBalanced = Math.abs(balanceValue) < 20;
    const isAcceptable = balanceCG >= 18 && balanceCG <= 88;
    
    let analysis = `Cargo Analysis for ${aircraftName}:\n\n`;
    analysis += `Total Weight: ${totalWeight} kg\n`;
    analysis += `Center of Gravity: ${balanceCG.toFixed(2)}° (${isAcceptable ? 'acceptable' : 'out of acceptable range'})\n`;
    analysis += `Balance Value: ${balanceValue.toFixed(2)}\n\n`;
    
    if (!isBalanced) {
      // Determine which side is heavy
      const heavySide = balanceValue < 0 ? "forward" : "aft";
      
      analysis += `Your cargo is currently ${Math.abs(balanceValue) < 40 ? 'slightly' : 'significantly'} imbalanced toward the ${heavySide} section.\n\n`;
      
      analysis += "Recommendations:\n";
      
      if (heavySide === "forward") {
        // Too much weight forward
        const forwardPallets = cargoData.filter(p => {
          const position = parseInt((p.positionLabel || "P0").substring(1));
          return position <= Math.ceil(cargoData.length / 2);
        }).sort((a, b) => (b.weight || 0) - (a.weight || 0));
        
        if (forwardPallets.length > 0) {
          const heaviestPallet = forwardPallets[0];
          analysis += `1. Consider moving the ${heaviestPallet.weight} kg pallet at position ${heaviestPallet.positionLabel} to a more aft position.\n`;
        }
        
        analysis += "2. Try redistributing weight from forward to aft positions to improve balance.\n";
      } else {
        // Too much weight aft
        const aftPallets = cargoData.filter(p => {
          const position = parseInt((p.positionLabel || "P0").substring(1));
          return position > Math.ceil(cargoData.length / 2);
        }).sort((a, b) => (b.weight || 0) - (a.weight || 0));
        
        if (aftPallets.length > 0) {
          const heaviestPallet = aftPallets[0];
          analysis += `1. Consider moving the ${heaviestPallet.weight} kg pallet at position ${heaviestPallet.positionLabel} to a more forward position.\n`;
        }
        
        analysis += "2. Try redistributing weight from aft to forward positions to improve balance.\n";
      }
    } else {
      analysis += "Your cargo appears to be well-balanced. No adjustments needed at this time.\n";
    }
    
    analysis += "\nTips for maintaining balance:\n";
    analysis += "- Keep heavier items near the center when possible\n";
    analysis += "- Distribute weight evenly between forward and aft sections\n";
    analysis += "- Ensure all cargo is properly secured before flight\n";
    
    if (!isAcceptable) {
      analysis += "\nWARNING: The current Center of Gravity (CG) value is outside the acceptable range (18°-88°). This must be corrected before flight.\n";
    }
    
    return analysis;
  }
  
  // Advanced analytics AI insights endpoint
  app.post('/api/advanced-analytics/insights', async (req, res) => {
    try {
      // Check for API key before processing
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({ error: "OpenAI API key is required for this feature" });
      }
      
      const { 
        analysisType,
        overallStats,
        squadronData,
        assessmentTypeData,
        scoreDistribution,
        trendData,
        selectedFilters
      } = req.body;
      
      // Validate required data
      if (!overallStats || !selectedFilters) {
        return res.status(400).json({ error: "Missing required analytics data" });
      }
      
      // Ensure we have sufficient data to analyze
      if (overallStats.totalSubmissions < 1) {
        return res.status(400).json({ error: "Insufficient data for analysis" });
      }
      
      // Call OpenAI service
      const insight = await generateAdvancedAnalytics({
        analysisType,
        overallStats,
        squadronData,
        assessmentTypeData,
        scoreDistribution,
        trendData,
        selectedFilters
      });
      
      res.json({ insight });
    } catch (error) {
      console.error("Error generating analytics insights:", error);
      res.status(500).json({ error: "Failed to generate analytics insights" });
    }
  });

  // User management endpoints for permissions dashboard - moved to index.ts

  app.patch("/api/users/:id/permissions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user?.isSuperAdmin) {
        return res.status(403).json({ message: "Access denied. Super admin required." });
      }

      const userId = parseInt(req.params.id);
      const { isAdmin, isSuperAdmin } = req.body;

      await db.update(users)
        .set({ isAdmin, isSuperAdmin })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user permissions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
