import { users, type User, type InsertUser, documents, type Document, type InsertDocument, scenarios, type Scenario, type InsertScenario, documentSubmissions, type DocumentSubmission, type InsertDocumentSubmission, scenarioSubmissions, type ScenarioSubmission, type InsertScenarioSubmission } from "@shared/schema";
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
    try {
      // Check if admin user already exists
      const existingAdmin = await this.getUserByUsername("admin");
      if (!existingAdmin) {
        console.log("Creating admin user...");
        // Create admin user with pre-hashed password equivalent to "adminpassword"
        await db.insert(users).values({
          username: "admin",
          password: "c9a296801d0dbb46fda407f3e66b0dc4bd2a1710ae25679a5a3aee380c2d720b8b5eb26d69b962a8df0887544ed530edd5cf104ef175845b64ee3f9a158d16ad.e4be0aba9c1c64eb9ba018c11f3ad0e2",
          isAdmin: true
        });
      }
    } catch (error) {
      console.error("Error initializing admin user:", error);
    }
  }

  // User Management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
      console.log("Creating submission with:", insertSubmission);
      
      // Use a simplified and consistent approach
      const { scenarioId, userId, answers, studentName, studentId } = insertSubmission;
      
      // Execute a direct SQL insert
      const result = await db.execute(
        `INSERT INTO scenario_submissions 
         (scenario_id, user_id, submission_date, answers, status, student_name, student_id) 
         VALUES 
         ($1, $2, NOW(), $3, $4, $5, $6) 
         RETURNING *`,
        [
          scenarioId,
          userId,
          JSON.stringify(answers), // Ensure answers is properly stringified
          'pending',
          studentName || '',
          studentId || ''
        ]
      );
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error("Failed to create submission - no rows returned");
      }
      
      return result.rows[0];
    } catch (error) {
      console.error("Error in createScenarioSubmission:", error);
      throw error;
    }
  }

  async updateScenarioSubmission(id: number, updateSubmission: Partial<InsertScenarioSubmission>): Promise<ScenarioSubmission | undefined> {
    const [submission] = await db
      .update(scenarioSubmissions)
      .set(updateSubmission)
      .where(eq(scenarioSubmissions.id, id))
      .returning();
    return submission;
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();