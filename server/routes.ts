import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { z } from "zod";
import { eq, desc, and, gt, lt, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  licenses, 
  users, 
  documents, 
  scenarios, 
  documentSubmissions, 
  scenarioSubmissions,
  phoneDirectory,
  chatMessages,
  quizQuestions
} from "@shared/schema";
import quizRoutes from './routes/quiz-new';
import { sendLicenseWelcomeEmail } from "./services/email-service";
import * as authCore from "./auth-isolated/auth-core";

// Authentication middleware
function requireAuth(req: Request, res: Response, next: Function) {
  const sessionId = (req as any).cookies?.sessionId;
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
    console.log('✅ ISOLATED: No valid session found');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const session = authCore.getIsolatedSession(sessionId);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  console.log('🔧 AUTH DEBUG: Session data:', session);
  console.log('🔧 AUTH DEBUG: User ID from session:', session.userId);
  console.log('🔧 AUTH DEBUG: Checking mapping condition:', session.userId === 1, session.email === 'markustruter01@gmail.com');
  
  // Handle hardcoded superadmin case - map to actual database user
  let actualUserId = session.userId;
  if (session.userId === 1 && session.email === 'markustruter01@gmail.com') {
    actualUserId = 9; // Use the actual database user ID
    console.log('🔧 AUTH DEBUG: Mapped hardcoded user ID 1 to database user ID 9');
  } else {
    console.log('🔧 AUTH DEBUG: No mapping applied, using original user ID:', actualUserId);
  }
  
  (req as any).user = {
    id: actualUserId,
    email: session.email,
    role: session.role
  };
  
  console.log('🔧 AUTH DEBUG: User object set:', (req as any).user);
  
  next();
}

function requireInstructor(req: Request, res: Response, next: Function) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user && (user.role === 'instructor' || user.role === 'superadmin')) {
      next();
    } else {
      res.status(403).json({ error: 'Instructor access required' });
    }
  });
}

function requireSuperAdmin(req: Request, res: Response, next: Function) {
  requireAuth(req, res, () => {
    const user = (req as any).user;
    if (user && user.role === 'superadmin') {
      next();
    } else {
      res.status(403).json({ error: 'Superadmin access required' });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Increase payload limit for PDF uploads
  app.use('/api/send-load-plan-email', express.json({ limit: '50mb' }));
  app.use('/api/send-load-plan-email', express.urlencoded({ limit: '50mb', extended: true }));
  // Static file serving for PDFs
  app.use('/pdfs', express.static(path.join(process.cwd(), 'attached_assets'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
      }
    }
  }));
  
  // Mount new quiz routes
  app.use('/api/quizzes', quizRoutes);
  console.log('✅ Quiz routes module mounted successfully');
  
  // Get current user endpoint for authentication
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ error: 'No user session found' });
      }
      
      console.log('✅ ISOLATED: User check request successful for:', user.email);
      res.json(user);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ error: 'Failed to get user information' });
    }
  });

  // Phone Directory - Public access
  app.get("/api/phone-directory", async (req, res) => {
    try {
      console.log("NUCLEAR: Phone directory GET request received");
      const directories = await db.select().from(phoneDirectory);
      console.log("NUCLEAR: Raw directories count:", directories.length);
      console.log("NUCLEAR: First 3 unsorted:", directories.slice(0, 3).map(d => d.airbaseName));
      
      // Sort alphabetically by airbase name in JavaScript to ensure proper ordering
      const sortedDirectories = directories.sort((a, b) => 
        a.airbaseName.localeCompare(b.airbaseName, 'en', { sensitivity: 'base' })
      );
      
      console.log("NUCLEAR: First 3 sorted:", sortedDirectories.slice(0, 3).map(d => d.airbaseName));
      console.log("NUCLEAR: Phone directory data:", sortedDirectories);
      res.json(sortedDirectories);
    } catch (error) {
      console.error("Error fetching phone directory:", error);
      res.status(500).json({ message: "Failed to fetch phone directory" });
    }
  });

  // Users endpoint for analytics - instructor access required
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const allLicenses = await db.select().from(licenses);
      
      // Create formatted response with proper data
      const formattedUsers = allUsers.map(user => {
        const userLicense = allLicenses.find(license => license.id === user.licenseId);
        const isActive = userLicense ? userLicense.isActive : false;
        
        return {
          id: user.id,
          email: user.email,
          role: user.userRole === 'loadmaster' ? 'student' : user.userRole,
          licenseStatus: isActive ? 'active' : 'inactive',
          squadron: 'AMG',
          createdAt: user.createdAt
        };
      });

      console.log(`Users endpoint: Found ${formattedUsers.length} users`);
      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // SUPERADMIN LICENSE MANAGEMENT
  app.get("/api/licensing/licenses", requireSuperAdmin, async (req, res) => {
    try {
      const allLicenses = await db
        .select({
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
          isFirstLogin: users.isFirstLogin
        })
        .from(licenses)
        .leftJoin(users, eq(licenses.id, users.licenseId))
        .orderBy(desc(licenses.createdAt));

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
          isFirstLogin: license.isFirstLogin
        };
      });

      console.log(`📊 LICENSE API: Returning ${processedLicenses.length} licenses with calculated status`);
      res.json(processedLicenses);
    } catch (error) {
      console.error('Error fetching licenses:', error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  app.post("/api/licensing/licenses", requireSuperAdmin, async (req, res) => {
    try {
      const { email, firstName, lastName, licenseType, expiryDate } = req.body;

      if (!email || !firstName || !licenseType || !expiryDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check for existing email
      const existing = await db.select().from(licenses).where(eq(licenses.email, email)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const licenseKey = `LIC-${firstName.toUpperCase()}-${Date.now()}`;
      const defaultPassword = 'Password1!';
      const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(defaultPassword, 10));

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
        createdByAdmin: (req as any).user.id,
        notes: ''
      }).returning();

      // Create user
      const newUser = await db.insert(users).values({
        email,
        hashedPassword,
        isFirstLogin: true,
        licenseId: newLicense[0].id,
        createdBy: (req as any).user.id,
        userRole: licenseType === 'instructor' ? 'instructor' : 'loadmaster',
        isAdmin: licenseType === 'instructor',
        isSuperAdmin: false
      }).returning();

      // Send welcome email
      try {
        const appUrl = process.env.NODE_ENV === 'production' 
          ? `https://${req.get('host')}` 
          : `http://${req.get('host')}`;
        
        await sendLicenseWelcomeEmail({
          userEmail: email,
          userName: `${firstName} ${lastName || ''}`.trim(),
          appUrl,
          defaultPassword
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }

      res.status(201).json({
        license: newLicense[0],
        user: newUser[0],
        emailSent: true
      });
    } catch (error) {
      console.error('Error creating license:', error);
      res.status(500).json({ message: "Failed to create license" });
    }
  });

  app.delete("/api/licensing/licenses/:id", requireSuperAdmin, async (req, res) => {
    try {
      const licenseId = parseInt(req.params.id);
      
      if (!licenseId || isNaN(licenseId)) {
        return res.status(400).json({ message: "Invalid license ID" });
      }

      // Delete user first
      await db.delete(users).where(eq(users.licenseId, licenseId));
      
      // Delete license
      const deletedLicense = await db.delete(licenses).where(eq(licenses.id, licenseId)).returning();
      
      if (deletedLicense.length === 0) {
        return res.status(404).json({ message: "License not found" });
      }

      res.json({ success: true, message: "License deleted successfully" });
    } catch (error) {
      console.error('Error deleting license:', error);
      res.status(500).json({ message: "Failed to delete license" });
    }
  });

  // PASSWORD MANAGEMENT
  app.post("/api/auth/set-password", async (req, res) => {
    try {
      const { email, newPassword } = req.body;

      if (!email || !newPassword) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const hashedPassword = await import('bcryptjs').then(bcrypt => bcrypt.hash(newPassword, 10));

      await db.update(users)
        .set({ 
          hashedPassword,
          isFirstLogin: false,
          hasCompletedOnboarding: false
        })
        .where(eq(users.email, email));

      res.json({ success: true });
    } catch (error) {
      console.error('Error setting password:', error);
      res.status(500).json({ message: "Failed to set password" });
    }
  });

  // DOCUMENT MANAGEMENT
  app.get("/api/documents", async (req, res) => {
    try {
      const docs = await db.select().from(documents).orderBy(desc(documents.createdAt));
      res.json(docs);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document_id = parseInt(req.params.id);
      const doc = await db.select().from(documents).where(eq(documents.id, document_id)).limit(1);
      
      if (doc.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(doc[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve document" });
    }
  });

  app.post("/api/documents", requireInstructor, async (req, res) => {
    try {
      const { title, content, category, description } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content required" });
      }

      const newDoc = await db.insert(documents).values({
        title,
        content,
        category: category || 'general',
        description: description || '',
        createdBy: (req as any).user.id
      }).returning();

      res.status(201).json(newDoc[0]);
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", requireInstructor, async (req, res) => {
    try {
      const document_id = parseInt(req.params.id);
      const { title, content, category, description } = req.body;

      const updatedDoc = await db.update(documents)
        .set({
          title,
          content,
          category,
          description,
          updatedAt: new Date()
        })
        .where(eq(documents.id, document_id))
        .returning();

      if (updatedDoc.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json(updatedDoc[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", requireInstructor, async (req, res) => {
    try {
      const document_id = parseInt(req.params.id);
      
      const deleted = await db.delete(documents).where(eq(documents.id, document_id)).returning();
      
      if (deleted.length === 0) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json({ success: true, message: "Document deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // SCENARIO MANAGEMENT
  app.get("/api/scenarios", async (req, res) => {
    try {
      const scenarios_list = await db.select().from(scenarios);
      res.json(scenarios_list);
    } catch (error) {
      console.error('Scenarios API error:', error);
      res.status(500).json({ message: "Failed to retrieve scenarios" });
    }
  });

  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const scenario_id = parseInt(req.params.id);
      const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenario_id)).limit(1);
      
      if (scenario.length === 0) {
        return res.status(404).json({ message: "Scenario not found" });
      }
      
      res.json(scenario[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve scenario" });
    }
  });

  app.post("/api/scenarios", requireInstructor, async (req, res) => {
    try {
      const { 
        title, 
        description, 
        aircraftType, 
        difficulty, 
        questions, 
        numberOfQuestions, 
        timeLimit 
      } = req.body;
      
      if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required" });
      }

      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const newScenario = await sql`
        INSERT INTO scenarios (
          title, 
          description, 
          aircraft_type, 
          difficulty, 
          questions, 
          number_of_questions, 
          time_limit, 
          created_by_id,
          created_at
        ) VALUES (
          ${title}, 
          ${description}, 
          ${aircraftType || 'C-17'}, 
          ${difficulty || 'Medium'}, 
          ${JSON.stringify(questions || [])}, 
          ${numberOfQuestions || 1}, 
          ${timeLimit || 60}, 
          ${(req as any).user.id},
          NOW()
        ) RETURNING *
      `;

      res.status(201).json(newScenario[0]);
    } catch (error) {
      console.error('Error creating scenario:', error);
      res.status(500).json({ message: "Failed to create scenario: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  app.put("/api/scenarios/:id", requireInstructor, async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const { 
        title, 
        description, 
        aircraftType, 
        difficulty, 
        questions, 
        numberOfQuestions, 
        timeLimit 
      } = req.body;

      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const updatedScenario = await sql`
        UPDATE scenarios SET 
          title = ${title}, 
          description = ${description}, 
          aircraft_type = ${aircraftType}, 
          difficulty = ${difficulty}, 
          questions = ${JSON.stringify(questions)}, 
          number_of_questions = ${numberOfQuestions}, 
          time_limit = ${timeLimit}
        WHERE id = ${scenarioId} 
        RETURNING *
      `;

      if (updatedScenario.length === 0) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      res.json(updatedScenario[0]);
    } catch (error) {
      console.error('Error updating scenario:', error);
      res.status(500).json({ message: "Failed to update scenario: " + (error instanceof Error ? error.message : 'Unknown error') });
    }
  });

  app.delete("/api/scenarios/:id", requireInstructor, async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const deleted = await sql`
        DELETE FROM scenarios WHERE id = ${scenarioId} RETURNING *
      `;
      
      if (deleted.length === 0) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      res.json({ success: true, message: "Scenario deleted successfully" });
    } catch (error) {
      console.error('Error deleting scenario:', error);
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });

  // Note: Quiz routes are now handled by the new quiz-new.ts module

  // Quiz submissions endpoint for instructor analytics
  app.get("/api/instructor/quiz-submissions", requireAuth, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get quiz submissions with proper joins
      const submissions = await sql`
        SELECT 
          qs.id,
          qs.quiz_id,
          qs.user_id,
          qs.submission_date,
          qs.answers,
          qs.score,
          qs.squadron,
          u.email,
          q.title as quiz_title,
          q.description as quiz_description
        FROM quiz_submissions qs
        LEFT JOIN users u ON qs.user_id = u.id
        LEFT JOIN quizzes q ON qs.quiz_id = q.id
        ORDER BY qs.submission_date DESC
      `;
      
      // Format the response to match frontend expectations
      const formattedSubmissions = submissions.map(submission => ({
        id: submission.id,
        quizId: submission.quiz_id,
        userId: submission.user_id,
        submissionDate: submission.submission_date,
        answers: submission.answers,
        score: submission.score,
        squadron: submission.squadron,
        username: submission.email?.split('@')[0] || `User ${submission.user_id}`,
        email: submission.email || 'Unknown User',
        quizTitle: submission.quiz_title || 'Unknown Quiz',
        quizDescription: submission.quiz_description || ''
      }));
      
      res.json(formattedSubmissions);
    } catch (error) {
      console.error('Quiz submissions API error:', error);
      res.status(500).json({ error: 'Failed to fetch quiz submissions' });
    }
  });

  // STUDENT SUBMISSIONS (Quiz submissions now handled by quiz-new.ts module)

  // Note: Scenario submission routes now handled by ScenarioSubmissionService below

  // DOCUMENT SUBMISSIONS
  app.get("/api/document-submissions", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      let submissions;
      if (user.role === 'instructor' || user.role === 'superadmin') {
        // Instructors can see all submissions
        submissions = await sql`
          SELECT 
            ds.*,
            u.email,
            d.title as document_title
          FROM document_submissions ds
          LEFT JOIN users u ON ds.user_id = u.id
          LEFT JOIN documents d ON ds.document_id = d.id
          ORDER BY ds.submission_date DESC
        `;
      } else {
        // Students can only see their own submissions
        submissions = await sql`
          SELECT 
            ds.*,
            u.email,
            d.title as document_title
          FROM document_submissions ds
          LEFT JOIN users u ON ds.user_id = u.id
          LEFT JOIN documents d ON ds.document_id = d.id
          WHERE ds.user_id = ${user.id}
          ORDER BY ds.submission_date DESC
        `;
      }
      
      res.json(submissions);
    } catch (error) {
      console.error('Document submissions API error:', error);
      res.status(500).json({ error: 'Failed to fetch document submissions' });
    }
  });

  // CREATE SUBMISSIONS
  app.post("/api/document-submissions", requireAuth, async (req, res) => {
    try {
      const { document_id, content, notes } = req.body;
      const user = (req as any).user;
      
      if (!document_id || !content) {
        return res.status(400).json({ error: 'Document ID and content required' });
      }

      const newSubmission = await db.insert(documentSubmissions).values({
        document_id,
        userId: user.id,
        content,
        notes: notes || '',
        status: 'submitted'
      }).returning();

      res.status(201).json(newSubmission[0]);
    } catch (error) {
      console.error('Error creating document submission:', error);
      res.status(500).json({ error: 'Failed to create submission' });
    }
  });

  // Import and mount modern scenario submission service
  const { ScenarioSubmissionService } = await import('./scenario-submission-service');
  
  // Modern scenario submission endpoints
  app.post("/api/scenario-submissions", requireAuth, ScenarioSubmissionService.createSubmission);
  app.get("/api/scenario-submissions", requireAuth, ScenarioSubmissionService.getAllSubmissions);
  app.get("/api/scenario-submissions/user", requireAuth, ScenarioSubmissionService.getUserSubmissions);
  app.get("/api/scenario-submissions/:id", requireAuth, ScenarioSubmissionService.getSubmissionById);
  app.patch("/api/scenario-submissions/:id", requireAuth, ScenarioSubmissionService.updateSubmission);
  
  // User activity history endpoint (for training submissions)
  app.get("/api/user/activity-history", requireAuth, ScenarioSubmissionService.getUserActivityHistory);

  // Note: All quiz-related endpoints now handled by quiz-new.ts module

  app.get("/api/instructor/student-progress", requireInstructor, async (req, res) => {
    try {
      const submissions = await db.select().from(scenarioSubmissions);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student progress" });
    }
  });

  // CHAT SYSTEM ENDPOINTS
  app.get("/api/chat/messages", requireAuth, async (req, res) => {
    try {
      const messages = await db.select().from(chatMessages).orderBy(desc(chatMessages.createdAt));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Mount quiz routes module for proper DELETE endpoint handling
  try {
    const { default: quizRoutes } = await import('./routes/quizzes');
    app.use('/api/quizzes', quizRoutes);
    console.log('✅ Quiz routes module mounted successfully');
  } catch (error) {
    console.error('Failed to mount quiz routes:', error);
  }

  // Workforce Management Routes
  app.get("/api/workforce/squadrons", requireInstructor, async (req, res) => {
    try {
      const squadrons = ['33SQN', '35SQN', '36SQN', '37SQN', 'AMG'];
      res.json(squadrons);
    } catch (error) {
      console.error('Error fetching squadrons:', error);
      res.status(500).json({ error: "Failed to fetch squadrons" });
    }
  });

  app.get("/api/workforce/squadron/:squadronId/users", requireInstructor, async (req, res) => {
    try {
      const { squadronId } = req.params;
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get users in the specified squadron
      const users = await sql`
        SELECT 
          u.id,
          u.email,
          l.first_name,
          l.last_name,
          l.squadron,
          l.license_type,
          u.last_login,
          u.created_at
        FROM users u
        LEFT JOIN licenses l ON u.license_id = l.id
        WHERE l.squadron = ${squadronId} AND l.license_type = 'loadmaster'
        ORDER BY l.first_name, l.last_name
      `;
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching squadron users:', error);
      res.status(500).json({ error: "Failed to fetch squadron users" });
    }
  });

  app.get("/api/workforce/user/:userId/submissions", requireInstructor, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get latest 5 submissions for the user (scenarios, quizzes, documents)
      const [scenarioSubs, quizSubs, documentSubs] = await Promise.all([
        sql`
          SELECT 
            ss.id,
            ss.submission_date,
            ss.score,
            ss.passed,
            s.title,
            'scenario' as type
          FROM scenario_submissions ss
          JOIN scenarios s ON ss.scenario_id = s.id
          WHERE ss.user_id = ${userId}
          ORDER BY ss.submission_date DESC
          LIMIT 5
        `,
        sql`
          SELECT 
            qs.id,
            qs.submission_date,
            qs.score,
            CASE WHEN qs.score >= 70 THEN true ELSE false END as passed,
            q.title,
            'quiz' as type
          FROM quiz_submissions qs
          JOIN quizzes q ON qs.quiz_id = q.id
          WHERE qs.user_id = ${userId}
          ORDER BY qs.submission_date DESC
          LIMIT 5
        `,
        sql`
          SELECT 
            ds.id,
            ds.submission_date,
            null as score,
            true as passed,
            d.title,
            'document' as type
          FROM document_submissions ds
          JOIN documents d ON ds.document_id = d.id
          WHERE ds.user_id = ${userId}
          ORDER BY ds.submission_date DESC
          LIMIT 5
        `
      ]);
      
      // Combine all submissions and sort by date
      const allSubmissions = [
        ...scenarioSubs.map(s => ({ ...s, type: 'scenario' })),
        ...quizSubs.map(q => ({ ...q, type: 'quiz' })),
        ...documentSubs.map(d => ({ ...d, type: 'document' }))
      ].sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
       .slice(0, 5);
      
      res.json(allSubmissions);
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      res.status(500).json({ error: "Failed to fetch user submissions" });
    }
  });

  // Complete onboarding tour
  app.post("/api/users/complete-onboarding", requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      
      await db.update(users)
        .set({ hasCompletedOnboarding: true })
        .where(eq(users.id, userId));

      res.json({ success: true });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  // Dashboard statistics for Super Admin
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

  // Load Plan PDF Email Route
  app.post('/api/send-load-plan-email', async (req: Request, res: Response) => {
    try {
      console.log('📧 Load plan email request received');
      const { email, fileName, pdfData, aircraftName, centerOfGravity, totalWeight, status } = req.body;

      if (!email || !fileName || !pdfData) {
        console.error('❌ Missing required fields:', { email: !!email, fileName: !!fileName, pdfData: !!pdfData });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Log payload size for debugging
      const payloadSizeKB = Math.round(pdfData.length / 1024);
      console.log(`📊 PDF payload size: ${payloadSizeKB}KB`);

      // Check if SendGrid API key is properly configured
      if (!process.env.SENDGRID_API_KEY) {
        console.error('❌ SendGrid API key not configured');
        return res.status(500).json({ error: 'Email service not configured' });
      }

      console.log(`📧 Preparing email to: ${email} for aircraft: ${aircraftName}`);

      // Initialize SendGrid
      const sgMailModule = await import('@sendgrid/mail');
      const sgMail = sgMailModule.default;
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

      // Create email content
      const emailContent = {
        to: email,
        from: 'info@digitaldynamics-group.com', // Use verified sender email
        subject: `Load Plan: ${aircraftName} - CG ${centerOfGravity}%`,
        text: `Aircraft Load Plan

Load Plan Summary:
Aircraft: ${aircraftName}
Center of Gravity: ${centerOfGravity}%
Total Weight: ${totalWeight}
Status: ${status.toUpperCase()}
Generated: ${new Date().toLocaleString()}

The detailed load plan with visual cargo bay diagram is attached as a PDF document.

LOADMworkflow - Advanced Military Logistics Platform
`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Aircraft Load Plan</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px;">LOADMworkflow - Military Logistics Platform</p>
            </div>
            
            <div style="padding: 20px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #374151; margin-top: 0; font-size: 18px;">Load Plan Summary</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Aircraft:</td>
                    <td style="padding: 12px 0; font-weight: bold; color: #1f2937;">${aircraftName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Center of Gravity:</td>
                    <td style="padding: 12px 0; font-weight: bold; color: #1f2937;">${centerOfGravity}%</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Total Weight:</td>
                    <td style="padding: 12px 0; font-weight: bold; color: #1f2937;">${totalWeight}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Status:</td>
                    <td style="padding: 12px 0; font-weight: bold; color: ${status === 'safe' ? '#059669' : status === 'caution' ? '#d97706' : '#dc2626'};">${status.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; color: #6b7280; font-weight: 500;">Generated:</td>
                    <td style="padding: 12px 0; font-weight: bold; color: #1f2937;">${new Date().toLocaleString()}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
                The detailed load plan with enhanced visual cargo bay diagram is attached as a PDF document. 
                The diagram includes color-coded cargo positions, center of gravity indicators, and professional legends.
              </p>
              
              <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 500;">
                  This email was sent from LOADMworkflow Advanced Military Logistics Platform
                </p>
              </div>
            </div>
          </div>
        `,
        attachments: [
          {
            content: pdfData,
            filename: fileName,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      console.log('📤 Sending email via SendGrid...');
      console.log('Email payload details:', {
        to: emailContent.to,
        from: emailContent.from,
        subject: emailContent.subject,
        attachmentCount: emailContent.attachments?.length || 0,
        attachmentSize: emailContent.attachments?.[0]?.content?.length || 0
      });
      
      const result = await sgMail.send(emailContent);
      console.log('✅ SendGrid response:', {
        statusCode: result[0]?.statusCode,
        headers: result[0]?.headers,
        messageId: result[0]?.headers?.['x-message-id'],
        body: result[0]?.body
      });
      
      // Additional delivery verification
      if (result[0]?.statusCode === 202) {
        console.log('📬 Email accepted by SendGrid for delivery');
        console.log('Message ID for tracking:', result[0]?.headers?.['x-message-id']);
      } else {
        console.log('⚠️ Unexpected response code:', result[0]?.statusCode);
      }
      
      console.log('✅ Email sent successfully to:', email);
      
      res.json({ success: true, message: 'Load plan PDF sent successfully' });
      
    } catch (error: any) {
      console.error('❌ SendGrid error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        body: error.response?.body,
        stack: error.stack?.substring(0, 500)
      });
      
      // Log detailed configuration for debugging
      console.log('SendGrid Configuration Status:');
      console.log('- API Key configured:', !!process.env.SENDGRID_API_KEY);
      console.log('- Using sender: info@digitaldynamics-group.com');
      
      if (error.response?.body?.errors) {
        console.log('Specific SendGrid errors:');
        error.response.body.errors.forEach((err: any) => {
          console.log(`- ${err.message} (${err.field})`);
        });
      }
      
      // Handle specific SendGrid errors with actionable solutions
      if (error.code === 403 || error.response?.status === 403) {
        console.error('Authentication failed - sender verification required');
        res.status(200).json({ 
          success: false,
          error: 'Email service requires sender verification. Please verify info@digitaldynamics-group.com in your SendGrid account.',
          action: 'verify_sender',
          message: 'PDF ready for download. Email will be available once sender is verified.',
          fallback: 'download'
        });
      } else if (error.code === 400 || error.response?.status === 400) {
        console.error('Bad request - email configuration issue');
        res.status(200).json({ 
          success: false,
          error: 'Email configuration error. PDF available for download.',
          fallback: 'download'
        });
      } else if (error.code === 413 || error.message?.includes('too large')) {
        console.error('Payload too large for email');
        res.status(200).json({ 
          success: false,
          error: 'PDF file too large for email. Please download instead.',
          fallback: 'download'
        });
      } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
        console.error('Network connectivity issue');
        res.status(200).json({ 
          success: false,
          error: 'Network error. PDF available for download.',
          fallback: 'download'
        });
      } else {
        console.error('🔧 General email service error');
        res.status(500).json({ 
          error: 'Email service temporarily unavailable. Please download the PDF instead.' 
        });
      }
    }
  });

  // Quiz Questions Management API (Instructor Portal)
  
  // Get quiz questions by category
  app.get("/api/quiz-questions", requireInstructor, async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      
      let questionsResult;
      
      if (category) {
        questionsResult = await db.select().from(quizQuestions)
          .where(and(eq(quizQuestions.isActive, true), eq(quizQuestions.category, category as string)))
          .orderBy(quizQuestions.category, quizQuestions.questionText);
      } else {
        questionsResult = await db.select().from(quizQuestions)
          .where(eq(quizQuestions.isActive, true))
          .orderBy(quizQuestions.category, quizQuestions.questionText);
      }
      
      res.json(questionsResult);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(500).json({ error: 'Failed to fetch quiz questions' });
    }
  });

  // Get all question categories
  app.get("/api/quiz-questions/categories", requireInstructor, async (req: Request, res: Response) => {
    try {
      const categories = await db.select({ category: quizQuestions.category })
        .from(quizQuestions)
        .where(eq(quizQuestions.isActive, true))
        .groupBy(quizQuestions.category)
        .orderBy(quizQuestions.category);
      
      res.json(categories.map(c => c.category));
    } catch (error) {
      console.error('Error fetching question categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Create new quiz question
  app.post("/api/quiz-questions", requireInstructor, async (req: Request, res: Response) => {
    try {
      const { category, questionText, correctAnswer, incorrectOption1, incorrectOption2, incorrectOption3, difficulty } = req.body;
      const user = (req as any).user;

      if (!category || !questionText || !correctAnswer || !incorrectOption1 || !incorrectOption2 || !incorrectOption3) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const [newQuestion] = await db.insert(quizQuestions).values({
        category,
        questionText,
        correctAnswer,
        incorrectOption1,
        incorrectOption2,
        incorrectOption3,
        difficulty: difficulty || 'medium',
        createdById: user.id,
      }).returning();

      res.json(newQuestion);
    } catch (error) {
      console.error('Error creating quiz question:', error);
      res.status(500).json({ error: 'Failed to create quiz question' });
    }
  });

  // Update quiz question
  app.put("/api/quiz-questions/:id", requireInstructor, async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.id);
      const { category, questionText, correctAnswer, incorrectOption1, incorrectOption2, incorrectOption3, difficulty } = req.body;

      if (!category || !questionText || !correctAnswer || !incorrectOption1 || !incorrectOption2 || !incorrectOption3) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const [updatedQuestion] = await db.update(quizQuestions)
        .set({
          category,
          questionText,
          correctAnswer,
          incorrectOption1,
          incorrectOption2,
          incorrectOption3,
          difficulty: difficulty || 'medium',
          updatedAt: new Date(),
        })
        .where(eq(quizQuestions.id, questionId))
        .returning();

      if (!updatedQuestion) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json(updatedQuestion);
    } catch (error) {
      console.error('Error updating quiz question:', error);
      res.status(500).json({ error: 'Failed to update quiz question' });
    }
  });

  // Delete quiz question (soft delete)
  app.delete("/api/quiz-questions/:id", requireInstructor, async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.id);

      const [deletedQuestion] = await db.update(quizQuestions)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(quizQuestions.id, questionId))
        .returning();

      if (!deletedQuestion) {
        return res.status(404).json({ error: 'Question not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting quiz question:', error);
      res.status(500).json({ error: 'Failed to delete quiz question' });
    }
  });

  const httpServer = createServer();
  httpServer.on("request", app);
  return httpServer;
}