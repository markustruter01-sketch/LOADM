import { pgTable, text, serial, integer, boolean, timestamp, json, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").default('').notNull(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  isAdmin: true,
  isSuperAdmin: true,
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
  documentId: integer("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
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
  passingThreshold: integer("passing_threshold").default(70), // Default 70% threshold
});

export const insertScenarioSchema = createInsertSchema(scenarios).pick({
  title: true,
  description: true,
  numberOfQuestions: true,
  questions: true,
  passingThreshold: true,
});

// Scenario submission schema
export const scenarioSubmissions = pgTable("scenario_submissions", {
  id: serial("id").primaryKey(),
  scenarioId: integer("scenario_id")
    .notNull()
    .references(() => scenarios.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  answers: json("answers").notNull().$type<Array<{questionId: string, answer: string, notes?: string}>>(),
  score: integer("score"),
  studentName: text("student_name").default(''),
  studentId: text("student_id").default(''),
  squadron: text("squadron").default(''),
  instructorFeedback: text("instructor_feedback"),
  markedAnswers: json("marked_answers").default({}),
  status: text("status").default("pending").notNull(),
  passed: boolean("passed").default(false),
});

export const insertScenarioSubmissionSchema = createInsertSchema(scenarioSubmissions).pick({
  scenarioId: true,
  userId: true,
  answers: true,
  score: true,
  studentName: true,
  studentId: true,
  instructorFeedback: true,
  markedAnswers: true,
  status: true,
});

// Quiz schema
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default('').notNull(),
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionCount: integer("question_count").notNull(),
  categories: json("categories").notNull().$type<string[]>(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
});

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  createdById: true,
  questionCount: true,
  categories: true,
  isActive: true,
  expiresAt: true,
});

// Quiz submission schema
export const quizSubmissions = pgTable("quiz_submissions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  submissionDate: timestamp("submission_date").defaultNow().notNull(),
  answers: json("answers").notNull().$type<Array<{questionId: string, answeredOption: number}>>(),
  score: integer("score").notNull(),
  squadron: text("squadron").default('AMG').notNull(),
});

export const insertQuizSubmissionSchema = createInsertSchema(quizSubmissions).pick({
  quizId: true,
  userId: true,
  answers: true,
  score: true,
  squadron: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documentSubmissions: many(documentSubmissions),
  scenarioSubmissions: many(scenarioSubmissions),
  quizzes: many(quizzes),
  quizSubmissions: many(quizSubmissions),
}));

export const documentsRelations = relations(documents, ({ many }) => ({
  submissions: many(documentSubmissions),
}));

export const documentSubmissionsRelations = relations(documentSubmissions, ({ one }) => ({
  document: one(documents, {
    fields: [documentSubmissions.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [documentSubmissions.userId],
    references: [users.id],
  }),
}));

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  submissions: many(scenarioSubmissions),
}));

export const scenarioSubmissionsRelations = relations(scenarioSubmissions, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenarioSubmissions.scenarioId],
    references: [scenarios.id],
  }),
  user: one(users, {
    fields: [scenarioSubmissions.userId],
    references: [users.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  creator: one(users, {
    fields: [quizzes.createdById],
    references: [users.id],
  }),
  submissions: many(quizSubmissions),
}));

export const quizSubmissionsRelations = relations(quizSubmissions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [quizSubmissions.quizId],
    references: [quizzes.id],
  }),
  user: one(users, {
    fields: [quizSubmissions.userId],
    references: [users.id],
  }),
}));

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

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertQuizSubmission = z.infer<typeof insertQuizSubmissionSchema>;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;

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
  questionType: "multiple-choice" | "free-text";
  options: string[];
  correctAnswer: string;
};
