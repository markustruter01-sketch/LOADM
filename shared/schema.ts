import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  type: text("type").notNull(),
  fields: json("fields").notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  description: true,
  type: true,
  fields: true,
});

// Document submission schema
export const documentSubmissions = pgTable("document_submissions", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id").notNull(),
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  formData: json("form_data").notNull(),
});

export const insertDocumentSubmissionSchema = createInsertSchema(documentSubmissions).pick({
  documentId: true,
  userId: true,
  formData: true,
});

// Scenario schema
export const scenarios = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  numberOfQuestions: integer("number_of_questions").notNull(),
  questions: json("questions").notNull(),
});

export const insertScenarioSchema = createInsertSchema(scenarios).pick({
  title: true,
  description: true,
  numberOfQuestions: true,
  questions: true,
});

// Scenario submission schema
export const scenarioSubmissions = pgTable("scenario_submissions", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id").notNull(),
  userId: integer("user_id").notNull(),
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  answers: json("answers").notNull(),
  score: integer("score"),
});

export const insertScenarioSubmissionSchema = createInsertSchema(scenarioSubmissions).pick({
  scenarioId: true,
  userId: true,
  answers: true,
  score: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertDocumentSubmission = z.infer<typeof insertDocumentSubmissionSchema>;
export type DocumentSubmission = typeof documentSubmissions.$inferSelect;

export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type Scenario = typeof scenarios.$inferSelect;

export type InsertScenarioSubmission = z.infer<typeof insertScenarioSubmissionSchema>;
export type ScenarioSubmission = typeof scenarioSubmissions.$inferSelect;

// Field type for document forms
export type FormField = {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "date" | "textarea";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

// Question type for scenarios
export type ScenarioQuestion = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
};
