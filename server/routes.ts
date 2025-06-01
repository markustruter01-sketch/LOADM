import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db } from "./db";
import { 
  licenses, 
  users, 
  documents, 
  scenarios, 
  documentSubmissions, 
  scenarioSubmissions,
  quizzes as quiz,
  quizSubmissions,
  phoneDirectory,
  chatMessages
} from "@shared/schema";
import { sendLicenseWelcomeEmail } from "./services/email-service";
import * as authCore from "./auth-isolated/auth-core";

// Authentication middleware
function requireAuth(req: Request, res: Response, next: Function) {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId || !sessionId.startsWith('isolated_')) {
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
  // Phone Directory - Public access
  app.get("/api/phone-directory", async (req, res) => {
    try {
      const directories = await db.select().from(phoneDirectory).orderBy(phoneDirectory.airbaseName);
      res.json(directories);
    } catch (error) {
      console.error("Error fetching phone directory:", error);
      res.status(500).json({ message: "Failed to fetch phone directory" });
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
          createdAt: licenses.createdAt,
          userId: users.id,
          userEmail: users.email,
          isFirstLogin: users.isFirstLogin
        })
        .from(licenses)
        .leftJoin(users, eq(licenses.id, users.licenseId))
        .orderBy(desc(licenses.createdAt));

      res.json(allLicenses);
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
          isFirstLogin: false
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
      const documentId = parseInt(req.params.id);
      const doc = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
      
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
      const documentId = parseInt(req.params.id);
      const { title, content, category, description } = req.body;

      const updatedDoc = await db.update(documents)
        .set({
          title,
          content,
          category,
          description,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))
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
      const documentId = parseInt(req.params.id);
      
      const deleted = await db.delete(documents).where(eq(documents.id, documentId)).returning();
      
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
      const scenarioId = parseInt(req.params.id);
      const scenario = await db.select().from(scenarios).where(eq(scenarios.id, scenarioId)).limit(1);
      
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
      const { title, description, aircraftType, maxWeight, cargoItems, objectives } = req.body;
      
      if (!title || !aircraftType) {
        return res.status(400).json({ message: "Title and aircraft type required" });
      }

      const newScenario = await db.insert(scenarios).values({
        title,
        description: description || '',
        aircraftType,
        maxWeight: maxWeight || 0,
        cargoItems: cargoItems || [],
        objectives: objectives || [],
        createdBy: (req as any).user.id
      }).returning();

      res.status(201).json(newScenario[0]);
    } catch (error) {
      console.error('Error creating scenario:', error);
      res.status(500).json({ message: "Failed to create scenario" });
    }
  });

  app.put("/api/scenarios/:id", requireInstructor, async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      const { title, description, aircraftType, maxWeight, cargoItems, objectives } = req.body;

      const updatedScenario = await db.update(scenarios)
        .set({
          title,
          description,
          aircraftType,
          maxWeight,
          cargoItems,
          objectives,
          updatedAt: new Date()
        })
        .where(eq(scenarios.id, scenarioId))
        .returning();

      if (updatedScenario.length === 0) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      res.json(updatedScenario[0]);
    } catch (error) {
      res.status(500).json({ message: "Failed to update scenario" });
    }
  });

  app.delete("/api/scenarios/:id", requireInstructor, async (req, res) => {
    try {
      const scenarioId = parseInt(req.params.id);
      
      const deleted = await db.delete(scenarios).where(eq(scenarios.id, scenarioId)).returning();
      
      if (deleted.length === 0) {
        return res.status(404).json({ message: "Scenario not found" });
      }

      res.json({ success: true, message: "Scenario deleted successfully" });
    } catch (error) {
      console.error('Error deleting scenario:', error);
      res.status(500).json({ message: "Failed to delete scenario" });
    }
  });

  // QUIZ MANAGEMENT
  app.get("/api/quizzes", async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const quizzes_list = await sql`
        SELECT q.*, u.email as created_by_email
        FROM quizzes q
        LEFT JOIN users u ON q.created_by_id = u.id
        ORDER BY q.created_at DESC
      `;
      
      res.json(quizzes_list);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const quiz = await sql`
        SELECT q.*, u.email as created_by_email
        FROM quizzes q
        LEFT JOIN users u ON q.created_by_id = u.id
        WHERE q.id = ${quizId}
      `;
      
      if (quiz.length === 0) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      
      res.json(quiz[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quiz' });
    }
  });

  app.post("/api/quizzes", requireInstructor, async (req, res) => {
    try {
      const { title, description, questionCount, categories, isActive, expiresAt } = req.body;
      
      if (!title || !questionCount || !categories || !categories.length) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Debug logging to identify the user ID issue
      console.log('🔧 OLD ROUTE DEBUG: User object:', (req as any).user);
      console.log('🔧 OLD ROUTE DEBUG: User ID being used:', (req as any).user?.id);

      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Verify user exists first
      const userCheck = await sql`SELECT id FROM users WHERE id = ${(req as any).user.id}`;
      console.log('🔧 OLD ROUTE DEBUG: User check result:', userCheck);
      
      if (userCheck.length === 0) {
        console.error('🔧 OLD ROUTE DEBUG: User ID does not exist in users table');
        return res.status(400).json({ error: 'Invalid user reference' });
      }
      
      const newQuiz = await sql`
        INSERT INTO quizzes (title, description, created_by_id, question_count, categories, is_active, expires_at)
        VALUES (${title}, ${description || ''}, ${(req as any).user.id}, ${questionCount}, ${JSON.stringify(categories)}, ${isActive !== false}, ${expiresAt ? new Date(expiresAt) : null})
        RETURNING *
      `;

      res.status(201).json(newQuiz[0]);
    } catch (error) {
      console.error('Error creating quiz:', error);
      res.status(500).json({ error: 'Failed to create quiz' });
    }
  });

  app.delete("/api/quizzes/:id", requireInstructor, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      
      if (isNaN(quizId)) {
        return res.status(400).json({ error: 'Invalid quiz ID' });
      }

      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const deleted = await sql`DELETE FROM quizzes WHERE id = ${quizId} RETURNING id`;
      
      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      res.json({ success: true, message: 'Quiz deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz:', error);
      res.status(500).json({ error: 'Failed to delete quiz' });
    }
  });

  // STUDENT SUBMISSIONS
  app.get("/api/instructor/quiz-submissions", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
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
      
      res.json(submissions);
    } catch (error) {
      console.error('Quiz submissions API error:', error);
      res.status(500).json({ error: 'Failed to fetch quiz submissions' });
    }
  });

  app.get("/api/scenario-submissions", requireAuth, async (req, res) => {
    try {
      const user = (req as any).user;
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      let submissions;
      if (user.role === 'instructor' || user.role === 'superadmin') {
        // Instructors can see all submissions
        submissions = await sql`
          SELECT 
            ss.*,
            u.email,
            s.title as scenario_title
          FROM scenario_submissions ss
          LEFT JOIN users u ON ss.user_id = u.id
          LEFT JOIN scenarios s ON ss.scenario_id = s.id
          ORDER BY ss.submission_date DESC
        `;
      } else {
        // Students can only see their own submissions
        submissions = await sql`
          SELECT 
            ss.*,
            u.email,
            s.title as scenario_title
          FROM scenario_submissions ss
          LEFT JOIN users u ON ss.user_id = u.id
          LEFT JOIN scenarios s ON ss.scenario_id = s.id
          WHERE ss.user_id = ${user.id}
          ORDER BY ss.submission_date DESC
        `;
      }
      
      res.json(submissions);
    } catch (error) {
      console.error('Scenario submissions API error:', error);
      res.status(500).json({ error: 'Failed to fetch scenario submissions' });
    }
  });

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
      const { documentId, content, notes } = req.body;
      const user = (req as any).user;
      
      if (!documentId || !content) {
        return res.status(400).json({ error: 'Document ID and content required' });
      }

      const newSubmission = await db.insert(documentSubmissions).values({
        documentId,
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

  app.post("/api/scenario-submissions", requireAuth, async (req, res) => {
    try {
      const { scenarioId, loadPlan, notes } = req.body;
      const user = (req as any).user;
      
      if (!scenarioId || !loadPlan) {
        return res.status(400).json({ error: 'Scenario ID and load plan required' });
      }

      const newSubmission = await db.insert(scenarioSubmissions).values({
        scenarioId,
        userId: user.id,
        loadPlan,
        notes: notes || '',
        status: 'submitted'
      }).returning();

      res.status(201).json(newSubmission[0]);
    } catch (error) {
      console.error('Error creating scenario submission:', error);
      res.status(500).json({ error: 'Failed to create submission' });
    }
  });

  // QUIZ QUESTIONS AND SUBMISSION
  app.get("/api/quizzes/:id/questions", async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const quiz = await sql`SELECT * FROM quizzes WHERE id = ${quizId}`;
      
      if (quiz.length === 0) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      // Import quiz questions dynamically
      const { loadmasterQuestions } = await import('@shared/quiz-questions');
      
      const filteredQuestions = loadmasterQuestions.filter(question => 
        quiz[0].categories.includes(question.category)
      );
      
      if (filteredQuestions.length === 0) {
        return res.status(400).json({ error: 'No questions available' });
      }
      
      // Randomly select questions
      const selectedQuestions = filteredQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(quiz[0].question_count, filteredQuestions.length));
      
      // Remove correct answers for security
      const quizQuestions = selectedQuestions.map(({ correctAnswer, ...rest }) => rest);
      
      res.json(quizQuestions);
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      res.status(500).json({ error: 'Failed to fetch quiz questions' });
    }
  });

  app.post("/api/quizzes/:id/submit", requireAuth, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const { answers, squadron } = req.body;
      const user = (req as any).user;
      
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'Answers required' });
      }

      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      // Get quiz and questions for scoring
      const quiz = await sql`SELECT * FROM quizzes WHERE id = ${quizId}`;
      if (quiz.length === 0) {
        return res.status(404).json({ error: 'Quiz not found' });
      }

      const { loadmasterQuestions } = await import('@shared/quiz-questions');
      const allPossibleQuestions = loadmasterQuestions.filter(q => 
        quiz[0].categories.includes(q.category)
      );
      
      // Calculate score
      let correctCount = 0;
      answers.forEach(answer => {
        const question = allPossibleQuestions.find(q => q.id === answer.questionId);
        if (question && question.correctAnswer === parseInt(answer.answeredOption)) {
          correctCount++;
        }
      });
      
      const score = Math.round((correctCount / answers.length) * 100);
      
      // Save submission
      const newSubmission = await sql`
        INSERT INTO quiz_submissions (quiz_id, user_id, answers, score, squadron, submission_date)
        VALUES (${quizId}, ${user.id}, ${JSON.stringify(answers)}, ${score}, ${squadron || 'AMG'}, NOW())
        RETURNING *
      `;

      res.status(201).json({
        id: newSubmission[0].id,
        score,
        correctCount,
        totalQuestions: answers.length,
        passed: score >= 70
      });
    } catch (error) {
      console.error('Quiz submission error:', error);
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  });

  // INSTRUCTOR PORTAL SPECIFIC ENDPOINTS
  app.get("/api/instructor/quizzes", requireInstructor, async (req, res) => {
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      const quizzes = await sql`SELECT * FROM quizzes ORDER BY created_at DESC`;
      res.json(quizzes);
    } catch (error) {
      console.error('Instructor quizzes error:', error);
      res.status(500).json({ error: "Failed to fetch instructor quizzes" });
    }
  });

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

  const httpServer = createServer();
  httpServer.on("request", app);
  return httpServer;
}