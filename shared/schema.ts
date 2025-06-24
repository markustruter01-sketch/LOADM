import { pgTable, text, serial, integer, boolean, timestamp, json, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Contact interface for phone directory
export interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  description: string;
}

// License schema - Updated for email-only authentication
export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").default(""),
  licenseKey: text("license_key").notNull().unique(),
  licenseType: text("license_type").notNull().default("loadmaster"), // loadmaster, instructor, superadmin
  squadron: text("squadron").default("AMG").notNull(), // 33SQN, 35SQN, 36SQN, 37SQN, AMG
  category: text("category").default("D").notNull(), // D, C, B, A (seniority level)
  isActive: boolean("is_active").default(true).notNull(),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  maxConcurrentSessions: integer("max_concurrent_sessions").default(1).notNull(),
  maxDevices: integer("max_devices").default(2).notNull(),
  createdByAdmin: integer("created_by_admin").notNull(),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User schema - Email-only authentication with password tracking
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  isFirstLogin: boolean("is_first_login").default(true).notNull(),
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isSuperAdmin: boolean("is_super_admin").default(false).notNull(),
  licenseId: integer("license_id").references(() => licenses.id, { onDelete: "cascade" }),
  userRole: text("user_role").default("loadmaster").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
});

// License sessions tracking
export const licenseSessions = pgTable("license_sessions", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").notNull().references(() => licenses.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  deviceFingerprint: text("device_fingerprint").notNull(),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  loginTime: timestamp("login_time").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  logoutTime: timestamp("logout_time"),
  status: text("status").notNull().default("active"), // active, inactive, expired
});

// License audit log
export const licenseAuditLog = pgTable("license_audit_log", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").references(() => licenses.id, { onDelete: "cascade" }),
  adminId: integer("admin_id").notNull().references(() => users.id),
  action: text("action").notNull(), // created, modified, suspended, activated, deleted
  details: json("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLicenseSessionSchema = createInsertSchema(licenseSessions).pick({
  licenseId: true,
  userId: true,
  deviceFingerprint: true,
  ipAddress: true,
  userAgent: true,
});

// Document schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  type: text("type").notNull(),
  fields: json("fields").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScenarioSchema = createInsertSchema(scenarios).pick({
  title: true,
  description: true,
  numberOfQuestions: true,
  questions: true,
  passingThreshold: true,
});

// Scenario Submission Schema - Updated to match actual database structure
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
  studentName: text("student_name"),
  studentId: text("student_id"),
  instructorFeedback: text("instructor_feedback"),
  markedAnswers: json("marked_answers"),
  status: text("status").default("submitted").notNull(),
  passed: boolean("passed").default(false),
  squadron: text("squadron"),
  timeSpent: integer("time_spent"),
  notes: text("notes"),
  submissionType: text("submission_type").default("assessment").notNull(), // "training" or "assessment"
});

export const insertScenarioSubmissionSchema = createInsertSchema(scenarioSubmissions, {
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string(),
    notes: z.string().optional()
  }))
}).pick({
  scenarioId: true,
  answers: true,
  studentName: true,
  studentId: true,
  squadron: true,
  timeSpent: true,
  notes: true,
  score: true,
  status: true,
  submissionType: true,
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

// Quiz Questions schema - Editable question bank for instructors
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // dangerous-goods, loadmaster-fundamentals, etc.
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  incorrectOption1: text("incorrect_option_1").notNull(),
  incorrectOption2: text("incorrect_option_2").notNull(),
  incorrectOption3: text("incorrect_option_3").notNull(),
  difficulty: text("difficulty").notNull().default("medium"), // easy, medium, hard
  createdById: integer("created_by_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).pick({
  category: true,
  questionText: true,
  correctAnswer: true,
  incorrectOption1: true,
  incorrectOption2: true,
  incorrectOption3: true,
  difficulty: true,
  createdById: true,
  isActive: true,
});

export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  aircraft: text("aircraft").notNull(),
  difficulty: text("difficulty").notNull(),
  duration: text("duration"),
  topics: text("topics").array(),
  objectives: text("objectives").array(),
  reading_content: text("reading_content"),
  video_content: text("video_content"),
  interactive_content: text("interactive_content"),
  quiz_content: text("quiz_content"),
  is_active: boolean("is_active").default(true),
  created_by: text("created_by").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).pick({
  title: true,
  description: true,
  aircraft: true,
  difficulty: true,
  duration: true,
  topics: true,
  objectives: true,
  reading_content: true,
  video_content: true,
  interactive_content: true,
  quiz_content: true,
  is_active: true,
  created_by: true,
});

// Phone Directory schema (moved from later in file to avoid conflicts)
export const phoneDirectory = pgTable("phone_directory", {
  id: serial("id").primaryKey(),
  airbaseCode: text("airbase_code").notNull(),
  airbaseName: text("airbase_name").notNull(),
  contacts: json("contacts").$type<Contact[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPhoneDirectorySchema = createInsertSchema(phoneDirectory).pick({
  airbaseCode: true,
  airbaseName: true,
  contacts: true,
});

export type InsertPhoneDirectory = z.infer<typeof insertPhoneDirectorySchema>;
export type PhoneDirectory = typeof phoneDirectory.$inferSelect;

// Training Module Videos schema - For direct video uploads
export const trainingModuleVideos = pgTable("training_module_videos", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull(), // Will reference training modules when that table exists
  videoTitle: text("video_title").notNull(),
  videoDescription: text("video_description"),
  fileName: text("file_name").notNull(), // Original filename
  filePath: text("file_path").notNull(), // Storage path on server
  fileSize: integer("file_size").notNull(), // File size in bytes
  mimeType: text("mime_type").notNull(), // video/mp4, video/webm, etc.
  duration: integer("duration"), // Video duration in seconds
  uploadedById: integer("uploaded_by_id").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  videoOrder: integer("video_order").default(1).notNull(), // For ordering videos in a module (1-3)
});

export const insertTrainingModuleVideoSchema = createInsertSchema(trainingModuleVideos).pick({
  moduleId: true,
  videoTitle: true,
  videoDescription: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  duration: true,
  uploadedById: true,
  videoOrder: true,
  isActive: true,
});

// Chat Messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  messageType: text("message_type").notNull(), // "question" or "answer"
  content: text("content").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  messageType: true,
  content: true,
  userName: true,
  userRole: true,
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  documentSubmissions: many(documentSubmissions),
  scenarioSubmissions: many(scenarioSubmissions),
  quizzes: many(quizzes),
  quizSubmissions: many(quizSubmissions),
  chatMessages: many(chatMessages),
  license: one(licenses, {
    fields: [users.licenseId],
    references: [licenses.id],
  }),
  licenseSessions: many(licenseSessions),
  auditLogs: many(licenseAuditLog),
}));

export const licensesRelations = relations(licenses, ({ many, one }) => ({
  users: many(users),
  sessions: many(licenseSessions),
  auditLogs: many(licenseAuditLog),
  createdBy: one(users, {
    fields: [licenses.createdByAdmin],
    references: [users.id],
  }),
}));

export const licenseSessionsRelations = relations(licenseSessions, ({ one }) => ({
  license: one(licenses, {
    fields: [licenseSessions.licenseId],
    references: [licenses.id],
  }),
  user: one(users, {
    fields: [licenseSessions.userId],
    references: [users.id],
  }),
}));

export const licenseAuditLogRelations = relations(licenseAuditLog, ({ one }) => ({
  license: one(licenses, {
    fields: [licenseAuditLog.licenseId],
    references: [licenses.id],
  }),
  admin: one(users, {
    fields: [licenseAuditLog.adminId],
    references: [users.id],
  }),
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

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  creator: one(users, {
    fields: [quizQuestions.createdById],
    references: [users.id],
  }),
}));

export const trainingModuleVideosRelations = relations(trainingModuleVideos, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [trainingModuleVideos.uploadedById],
    references: [users.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

// Types
export type InsertTrainingModuleVideo = z.infer<typeof insertTrainingModuleVideoSchema>;
export type TrainingModuleVideo = typeof trainingModuleVideos.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;

export type InsertLicenseSession = z.infer<typeof insertLicenseSessionSchema>;
export type LicenseSession = typeof licenseSessions.$inferSelect;

export type LicenseAuditLog = typeof licenseAuditLog.$inferSelect;

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

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type TrainingModule = typeof trainingModules.$inferSelect;

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
