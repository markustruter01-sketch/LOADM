import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertDocumentSchema, insertScenarioSchema, insertDocumentSubmissionSchema, insertScenarioSubmissionSchema } from "@shared/schema";
import { generateAnalytics } from "./openai";

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
import { db } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes (/api/register, /api/login, /api/logout, /api/user)
  setupAuth(app);
  
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
        userId: req.user.id
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
      
      const scenarioId = req.query.scenarioId ? parseInt(req.query.scenarioId as string) : undefined;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Only admin can see all submissions or other user's submissions
      if ((!req.user?.isAdmin) && (userId !== undefined && userId !== req.user?.id)) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      const submissions = await storage.getScenarioSubmissions(scenarioId, userId || req.user?.id);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve scenario submissions" });
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
      
      const result = await pool.query(
        `INSERT INTO scenario_submissions 
         (scenario_id, user_id, submission_date, answers, status, student_name, student_id) 
         VALUES 
         ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6) 
         RETURNING *`,
        [
          Number(req.body.scenarioId),
          req.user.id,
          req.body.answers, // Already a JSON string from client
          'pending',
          req.body.studentName || '',
          req.body.studentId || ''
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
  
  // Get a specific scenario submission
  app.get("/api/scenario-submissions/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getScenarioSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Only admin or the user who submitted can view the submission
      if (!req.user?.isAdmin && submission.userId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: Can only access your own submissions" });
      }
      
      res.json(submission);
    } catch (error) {
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
      const submission = await storage.getScenarioSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // For this test version, allow all authenticated users to review
      // This allows any user to provide reviews during testing
      
      // Allow partial updates for instructor feedback, score, etc.
      const updateData = insertScenarioSubmissionSchema.partial().parse(req.body);
      
      // Add updateScenarioSubmission method to storage
      const updatedSubmission = await storage.updateScenarioSubmission(submissionId, updateData);
      
      res.json(updatedSubmission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update scenario submission" });
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

  const httpServer = createServer(app);
  return httpServer;
}
