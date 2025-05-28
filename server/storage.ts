import { users, type User, type InsertUser, documents, type Document, type InsertDocument, scenarios, type Scenario, type InsertScenario, documentSubmissions, type DocumentSubmission, type InsertDocumentSubmission, scenarioSubmissions, type ScenarioSubmission, type InsertScenarioSubmission, quizzes, type Quiz, type InsertQuiz, quizSubmissions, type QuizSubmission, type InsertQuizSubmission } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPgSimple(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Document management
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Document submission management
  getDocumentSubmissions(documentId?: number, userId?: number): Promise<DocumentSubmission[]>;
  getDocumentSubmission(id: number): Promise<DocumentSubmission | undefined>;
  createDocumentSubmission(submission: InsertDocumentSubmission): Promise<DocumentSubmission>;
  
  // Scenario management
  getScenarios(): Promise<Scenario[]>;
  getScenario(id: number): Promise<Scenario | undefined>;
  createScenario(scenario: InsertScenario): Promise<Scenario>;
  updateScenario(id: number, scenario: Partial<InsertScenario>): Promise<Scenario | undefined>;
  deleteScenario(id: number): Promise<boolean>;
  
  // Scenario submission management
  getScenarioSubmissions(scenarioId?: number, userId?: number): Promise<ScenarioSubmission[]>;
  getScenarioSubmission(id: number): Promise<ScenarioSubmission | undefined>;
  createScenarioSubmission(submission: InsertScenarioSubmission): Promise<ScenarioSubmission>;
  updateScenarioSubmission(id: number, submission: Partial<InsertScenarioSubmission>): Promise<ScenarioSubmission | undefined>;
  
  // Quiz management
  getQuizzes(activeOnly?: boolean): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: number): Promise<boolean>;
  
  // Quiz submission management
  getQuizSubmissions(quizId?: number, userId?: number): Promise<QuizSubmission[]>;
  getQuizSubmission(id: number): Promise<QuizSubmission | undefined>;
  createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
    
    // Initialize admin user when constructed
    this.initAdminUser();
  }
  
  private async initAdminUser() {
    // DISABLED: Using isolated authentication system instead
    console.log("Database admin initialization disabled - using isolated auth system");
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    
    return result.length > 0;
  }

  // Document Management
  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.lastUpdated));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: number, updateDocument: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...updateDocument, lastUpdated: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return !!result;
  }

  // Document Submission Management
  async getDocumentSubmissions(documentId?: number, userId?: number): Promise<DocumentSubmission[]> {
    if (documentId !== undefined && userId !== undefined) {
      return await db.select().from(documentSubmissions).where(
        and(
          eq(documentSubmissions.documentId, documentId),
          eq(documentSubmissions.userId, userId)
        )
      ) as unknown as DocumentSubmission[];
    } else if (documentId !== undefined) {
      return await db.select().from(documentSubmissions).where(
        eq(documentSubmissions.documentId, documentId)
      ) as unknown as DocumentSubmission[];
    } else if (userId !== undefined) {
      return await db.select().from(documentSubmissions).where(
        eq(documentSubmissions.userId, userId)
      ) as unknown as DocumentSubmission[];
    } else {
      return await db.select().from(documentSubmissions) as unknown as DocumentSubmission[];
    }
  }

  async getDocumentSubmission(id: number): Promise<DocumentSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(documentSubmissions)
      .where(eq(documentSubmissions.id, id));
    return submission;
  }

  async createDocumentSubmission(insertSubmission: InsertDocumentSubmission): Promise<DocumentSubmission> {
    const [submission] = await db
      .insert(documentSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  // Scenario Management
  async getScenarios(): Promise<Scenario[]> {
    return await db.select().from(scenarios);
  }

  async getScenario(id: number): Promise<Scenario | undefined> {
    const [scenario] = await db.select().from(scenarios).where(eq(scenarios.id, id));
    return scenario;
  }

  async createScenario(insertScenario: InsertScenario): Promise<Scenario> {
    const [scenario] = await db
      .insert(scenarios)
      .values(insertScenario)
      .returning();
    return scenario;
  }

  async updateScenario(id: number, updateScenario: Partial<InsertScenario>): Promise<Scenario | undefined> {
    const [scenario] = await db
      .update(scenarios)
      .set(updateScenario)
      .where(eq(scenarios.id, id))
      .returning();
    return scenario;
  }

  async deleteScenario(id: number): Promise<boolean> {
    const result = await db.delete(scenarios).where(eq(scenarios.id, id));
    return !!result;
  }

  // Scenario Submission Management
  async getScenarioSubmissions(scenarioId?: number, userId?: number): Promise<ScenarioSubmission[]> {
    let conditions = [];
    
    if (scenarioId !== undefined) {
      conditions.push(eq(scenarioSubmissions.scenarioId, scenarioId));
    }
    
    if (userId !== undefined) {
      conditions.push(eq(scenarioSubmissions.userId, userId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(scenarioSubmissions).where(and(...conditions));
    } else {
      return await db.select().from(scenarioSubmissions);
    }
  }

  async getScenarioSubmission(id: number): Promise<ScenarioSubmission | undefined> {
    const [submission] = await db
      .select()
      .from(scenarioSubmissions)
      .where(eq(scenarioSubmissions.id, id));
    return submission;
  }

  async createScenarioSubmission(insertSubmission: InsertScenarioSubmission): Promise<ScenarioSubmission> {
    try {
      console.log("Creating simplified submission with:", insertSubmission);
      
      // Direct SQL approach using pool from db.ts
      const { pool } = await import('./db');
      
      const result = await pool.query(
        `INSERT INTO scenario_submissions 
        (scenario_id, user_id, submission_date, answers, status, student_name, student_id) 
        VALUES 
        ($1, $2, NOW(), $3, $4, $5, $6) 
        RETURNING *`,
        [
          insertSubmission.scenarioId,
          insertSubmission.userId,
          JSON.stringify(insertSubmission.answers),
          'pending',
          insertSubmission.studentName || '',
          insertSubmission.studentId || ''
        ]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create submission');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error in createScenarioSubmission:", error);
      throw error;
    }
  }

  async updateScenarioSubmission(id: number, updateData: any): Promise<ScenarioSubmission | undefined> {
    try {
      console.log(`Updating scenario submission ${id}`);
      
      // Get direct DB connection
      const { pool } = await import('./db');
      
      // Let's try with a simpler approach - create a direct update query
      // for just the specific fields we need to update
      let query = `
        UPDATE scenario_submissions 
        SET 
          instructor_feedback = $1,
          marked_answers = $2,
          status = $3,
          score = $4,
          passed = $5
        WHERE id = $6
        RETURNING *
      `;
      
      // Convert markedAnswers to proper JSON format
      let markedAnswersJson;
      try {
        if (typeof updateData.markedAnswers === 'string') {
          // Try to parse and re-stringify to validate the JSON
          markedAnswersJson = JSON.stringify(JSON.parse(updateData.markedAnswers));
        } else {
          markedAnswersJson = JSON.stringify(updateData.markedAnswers || {});
        }
      } catch (jsonError) {
        // If there's an error in parsing, fall back to an empty object
        console.error("Error parsing marked answers:", jsonError);
        markedAnswersJson = '{}';
      }
      
      // Calculate the score based on marked answers for greater accuracy
      let calculatedScore = 0;
      try {
        // Parse the marked answers to count correct answers
        const markedAnswersObj = typeof updateData.markedAnswers === 'string' 
          ? JSON.parse(updateData.markedAnswers) 
          : updateData.markedAnswers || {};
          
        // Count how many answers are marked as correct (true)
        const correctCount = Object.values(markedAnswersObj).filter(val => val === true).length;
        const totalQuestions = Object.keys(markedAnswersObj).length;
        
        // Calculate score as percentage if there are questions
        if (totalQuestions > 0) {
          calculatedScore = Math.round((correctCount / totalQuestions) * 100);
          console.log(`Calculated score: ${calculatedScore}% (${correctCount}/${totalQuestions} correct)`);
        }
      } catch (e) {
        console.error("Error calculating score from marked answers:", e);
        // Fall back to provided score if calculation fails
        calculatedScore = updateData.score || 0;
      }
      
      // Prepare params with default values in case some are undefined
      const params = [
        updateData.instructorFeedback || null,
        markedAnswersJson,
        updateData.status || 'reviewed',
        calculatedScore, // Use the calculated score instead of the raw input
        updateData.passed === undefined ? false : updateData.passed,
        id
      ];
      
      console.log(`Executing simplified update query for submission ${id}`);
      const result = await pool.query(query, params);
      
      if (result.rows.length === 0) {
        console.warn(`No submission found with ID: ${id}`);
        return undefined;
      }
      
      const updatedSubmission = result.rows[0];
      
      // Transform the database column names to camelCase for the frontend
      const transformedSubmission = {
        id: updatedSubmission.id,
        scenarioId: updatedSubmission.scenario_id,
        userId: updatedSubmission.user_id,
        submissionDate: updatedSubmission.submission_date,
        answers: updatedSubmission.answers,
        score: updatedSubmission.score,
        studentName: updatedSubmission.student_name,
        studentId: updatedSubmission.student_id,
        squadron: updatedSubmission.squadron || '',
        instructorFeedback: updatedSubmission.instructor_feedback,
        markedAnswers: updatedSubmission.marked_answers,
        status: updatedSubmission.status,
        passed: updatedSubmission.passed
      };
      
      console.log(`Successfully updated submission: ${id}`);
      return transformedSubmission;
    } catch (error) {
      console.error(`Error updating scenario submission ${id}:`, error);
      throw error;
    }
  }

  // Quiz Management Methods
  async getQuizzes(activeOnly: boolean = false): Promise<Quiz[]> {
    // We'll use our dedicated storage-quiz module for this
    const { getQuizzes } = await import('./storage-quiz');
    return getQuizzes(activeOnly);
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    const { getQuiz } = await import('./storage-quiz');
    return getQuiz(id);
  }

  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const { createQuiz } = await import('./storage-quiz');
    return createQuiz(quiz);
  }

  async updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const { updateQuiz } = await import('./storage-quiz');
    return updateQuiz(id, quiz);
  }

  async deleteQuiz(id: number): Promise<boolean> {
    const { deleteQuiz } = await import('./storage-quiz');
    return deleteQuiz(id);
  }

  // Quiz Submission Methods
  async getQuizSubmissions(quizId?: number, userId?: number): Promise<QuizSubmission[]> {
    const { getQuizSubmissions } = await import('./storage-quiz');
    return getQuizSubmissions(quizId, userId);
  }

  async getQuizSubmission(id: number): Promise<QuizSubmission | undefined> {
    const { getQuizSubmission } = await import('./storage-quiz');
    return getQuizSubmission(id);
  }

  async createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission> {
    const { createQuizSubmission } = await import('./storage-quiz');
    return createQuizSubmission(submission);
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();