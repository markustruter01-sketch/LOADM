import { pgTable, text, serial, integer, boolean, timestamp, json, foreignKey, real } from "drizzle-orm/pg-core";
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
  licenseType: text("license_type").notNull().default("loadmaster"), // loadmaster, instructor, superadmin, readonly
  squadron: text("squadron").default("AMG").notNull(), // 33SQN | 35SQN | 36SQN | 37SQN (flying units) | AMG (leadership/admin container only)
  category: text("category").default("D").notNull(), // D, C, B, A (seniority level)
  isActive: boolean("is_active").default(true).notNull(),
  issuedDate: timestamp("issued_date").defaultNow().notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  maxConcurrentSessions: integer("max_concurrent_sessions").default(1).notNull(),
  maxDevices: integer("max_devices").default(2).notNull(),
  createdByAdmin: integer("created_by_admin").notNull(),
  notes: text("notes").default(""),
  totalMissionsFlown: integer("total_missions_flown").default(0),
  totalCargoWeight: integer("total_cargo_weight").default(0),
  totalFlightHours: real("total_flight_hours").default(0),
  totalNightHours: real("total_night_hours").default(0),
  totalDayHours: real("total_day_hours").default(0),
  totalCargoCarried: integer("total_cargo_carried").default(0),
  totalPassengersCarried: integer("total_passengers_carried").default(0),
  profilePhotoUrl: text("profile_photo_url"),
  isFlightReady: boolean("is_flight_ready").default(true).notNull(),
  notReadyReason: text("not_ready_reason"),
  readinessUpdatedAt: timestamp("readiness_updated_at"),
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
  reviewedBy: text("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  questionFeedback: json("question_feedback").$type<Record<string, string>>(),
  notificationSeen: boolean("notification_seen").default(true).notNull(),
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
  squadron: text("squadron").default('33SQN').notNull(), // 33SQN | 35SQN | 36SQN | 37SQN — flying units only; null recorded as unattributed
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

// Missions schema
export const missions = pgTable("missions", {
  id: serial("id").primaryKey(),
  missionName: text("mission_name").notNull(),
  aircraftCallSign: text("aircraft_call_sign").notNull(),
  captainName: text("captain_name").notNull(),
  departureLocation: text("departure_location").notNull(),
  arrivalDestination: text("arrival_destination").notNull(),
  loadmaster1Name: text("loadmaster1_name").notNull(),
  loadmaster2Name: text("loadmaster2_name").default(""),
  hasDangerousGoods: boolean("has_dangerous_goods").default(false).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMissionSchema = createInsertSchema(missions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missions.$inferSelect;

// Mission Documents - Links missions to PDF documents
export const missionDocuments = pgTable("mission_documents", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  documentFilename: text("document_filename").notNull(),
  documentTitle: text("document_title").notNull(),
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedBy: integer("added_by").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const insertMissionDocumentSchema = createInsertSchema(missionDocuments).omit({
  id: true,
  addedAt: true,
});

export type InsertMissionDocument = z.infer<typeof insertMissionDocumentSchema>;
export type MissionDocument = typeof missionDocuments.$inferSelect;

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
  profilePhotoUrl: text("profile_photo_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  messageType: true,
  content: true,
  userName: true,
  userRole: true,
  profilePhotoUrl: true,
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// Checklists schema - For instructor-created checklists
export const checklists = pgTable("checklists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  aircraftType: text("aircraft_type").notNull(), // C-17, C-130, C-27J, KC30A, General
  category: text("category").notNull().default("startup"), // startup, shutdown, pre-flight, post-flight, emergency
  isActive: boolean("is_active").default(true).notNull(),
  enforceLinearProgression: boolean("enforce_linear_progression").default(false).notNull(), // QRH mode: must complete items in order
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertChecklistSchema = createInsertSchema(checklists).pick({
  title: true,
  description: true,
  aircraftType: true,
  category: true,
  isActive: true,
  enforceLinearProgression: true,
  createdById: true,
});

export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;

// Checklist items schema - Individual items within a checklist
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").notNull().references(() => checklists.id, { onDelete: "cascade" }),
  itemText: text("item_text").notNull(),
  itemOrder: integer("item_order").notNull(),
  isRequired: boolean("is_required").default(true).notNull(),
  category: text("category"), // Optional grouping like "Engine Start", "Systems Check"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).pick({
  checklistId: true,
  itemText: true,
  itemOrder: true,
  isRequired: true,
  category: true,
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

// Checklist completions schema - User completions of checklists
export const checklistCompletions = pgTable("checklist_completions", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").notNull().references(() => checklists.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completedItems: json("completed_items").$type<number[]>().notNull(), // Array of completed item IDs
  completionStatus: text("completion_status").notNull().default("in_progress"), // in_progress, completed
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  totalItems: integer("total_items").notNull(),
  completedCount: integer("completed_count").notNull().default(0),
});

export const insertChecklistCompletionSchema = createInsertSchema(checklistCompletions).pick({
  checklistId: true,
  userId: true,
  completedItems: true,
  completionStatus: true,
  completedAt: true,
  totalItems: true,
  completedCount: true,
});

export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type InsertChecklistCompletion = z.infer<typeof insertChecklistCompletionSchema>;

// Checklist step audit trail - Records each individual step completion with timestamp
export const checklistStepAudit = pgTable("checklist_step_audit", {
  id: serial("id").primaryKey(),
  checklistId: integer("checklist_id").notNull().references(() => checklists.id, { onDelete: "cascade" }),
  checklistItemId: integer("checklist_item_id").notNull().references(() => checklistItems.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  completionId: integer("completion_id").notNull().references(() => checklistCompletions.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // 'checked' or 'unchecked'
  stepOrder: integer("step_order").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertChecklistStepAuditSchema = createInsertSchema(checklistStepAudit).pick({
  checklistId: true,
  checklistItemId: true,
  userId: true,
  completionId: true,
  action: true,
  stepOrder: true,
});

export type ChecklistStepAudit = typeof checklistStepAudit.$inferSelect;
export type InsertChecklistStepAudit = z.infer<typeof insertChecklistStepAuditSchema>;

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  documentSubmissions: many(documentSubmissions),
  scenarioSubmissions: many(scenarioSubmissions),
  quizzes: many(quizzes),
  quizSubmissions: many(quizSubmissions),
  chatMessages: many(chatMessages),
  checklists: many(checklists),
  checklistCompletions: many(checklistCompletions),
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

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  creator: one(users, {
    fields: [checklists.createdById],
    references: [users.id],
  }),
  items: many(checklistItems),
  completions: many(checklistCompletions),
  stepAudits: many(checklistStepAudit),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one, many }) => ({
  checklist: one(checklists, {
    fields: [checklistItems.checklistId],
    references: [checklists.id],
  }),
  stepAudits: many(checklistStepAudit),
}));

export const checklistStepAuditRelations = relations(checklistStepAudit, ({ one }) => ({
  checklist: one(checklists, {
    fields: [checklistStepAudit.checklistId],
    references: [checklists.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [checklistStepAudit.checklistItemId],
    references: [checklistItems.id],
  }),
  user: one(users, {
    fields: [checklistStepAudit.userId],
    references: [users.id],
  }),
  completion: one(checklistCompletions, {
    fields: [checklistStepAudit.completionId],
    references: [checklistCompletions.id],
  }),
}));

export const checklistCompletionsRelations = relations(checklistCompletions, ({ one }) => ({
  checklist: one(checklists, {
    fields: [checklistCompletions.checklistId],
    references: [checklists.id],
  }),
  user: one(users, {
    fields: [checklistCompletions.userId],
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

// User Qualifications/Currencies schema
export const userQualifications = pgTable("user_qualifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserQualificationSchema = createInsertSchema(userQualifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date().nullable().optional(),
});

export type UserQualification = typeof userQualifications.$inferSelect;
export type InsertUserQualification = z.infer<typeof insertUserQualificationSchema>;

// Flight Records schema
export const flightRecords = pgTable("flight_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  callsign: text("callsign"),
  departure: text("departure").notNull(),
  arrival: text("arrival").notNull(),
  passengersCarried: integer("passengers_carried").default(0),
  cargoWeight: integer("cargo_weight").default(0),
  captain: text("captain").notNull(),
  nightHours: real("night_hours").default(0),
  dayHours: real("day_hours").default(0),
  aircraftType: text("aircraft_type").default("KC30A"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFlightRecordSchema = createInsertSchema(flightRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.coerce.date(),
});

export type FlightRecord = typeof flightRecords.$inferSelect;
export type InsertFlightRecord = z.infer<typeof insertFlightRecordSchema>;

// Safety Records schema - for tracking incidents, observations, and compliance
export const safetyRecords = pgTable("safety_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recordType: text("record_type").notNull(), // "incident", "observation", "commendation", "training_failure"
  description: text("description").notNull(),
  severity: text("severity"), // "minor", "moderate", "major" - nullable for non-incidents
  date: timestamp("date").notNull(),
  reportedBy: integer("reported_by").references(() => users.id, { onDelete: "set null" }),
  status: text("status").default("open").notNull(), // "open", "reviewed", "closed"
  resolutionNotes: text("resolution_notes"),
  squadron: text("squadron"),
  // Aviation-specific fields
  location: text("location"),                     // e.g. "RAAF Base Amberley", "En Route"
  aircraftType: text("aircraft_type"),            // C130J, C17A, KC30A, C27J
  flightPhase: text("flight_phase"),              // ground, taxi, takeoff, climb, cruise, descent, approach, landing, parking
  safetyLevel: text("safety_level"),             // Level 1-Catastrophic, Level 2-Critical, Level 3-Marginal, Level 4-Negligible
  immediateActions: text("immediate_actions"),    // What was done at the time
  contributingFactors: text("contributing_factors"), // Causal/contributing factors
  correctiveActions: text("corrective_actions"), // Follow-up actions to prevent recurrence
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSafetyRecordSchema = createInsertSchema(safetyRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.coerce.date(),
  location: z.string().optional(),
  aircraftType: z.string().optional(),
  flightPhase: z.string().optional(),
  safetyLevel: z.string().optional(),
  immediateActions: z.string().optional(),
  contributingFactors: z.string().optional(),
  correctiveActions: z.string().optional(),
});

export type SafetyRecord = typeof safetyRecords.$inferSelect;
export type InsertSafetyRecord = z.infer<typeof insertSafetyRecordSchema>;

// Standard qualification types for consistent tracking
export const STANDARD_QUALIFICATION_TYPES = [
  "Basic Loadmaster Certification",
  "KC30A Type Rating",
  "Night Operations Currency",
  "Dangerous Goods (DG) Handling",
  "Air-to-Air Refueling (AAR)",
  "Aeromedical Evacuation",
  "Combat Readiness",
  "Annual Proficiency Check",
  "Other"
] as const;

// Not ready reasons for readiness tracking
export const NOT_READY_REASONS = [
  "Medical",
  "Leave/Personal",
  "Currency Lapsed",
  "Training Required",
  "Administrative",
  "Other"
] as const;

// Training Modules schema - For instructor portal management
export const trainingModules = pgTable("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  aircraft: text("aircraft").notNull(), // c17, c130, kc30a, c27j, all
  difficulty: text("difficulty").notNull().default("beginner"), // beginner, intermediate, advanced, expert
  duration: text("duration").notNull(),
  topics: text("topics").array().default([]),
  objectives: text("objectives").array().default([]),
  isActive: boolean("is_active").default(true).notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrainingModuleSchema = createInsertSchema(trainingModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;

// Training Module Content schema - Individual lessons within modules
export const trainingModuleContent = pgTable("training_module_content", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").notNull().references(() => trainingModules.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(), // video, reading, quiz, assessment
  duration: text("duration").notNull(),
  description: text("description").notNull(),
  content: text("content"), // Text content for readings, quiz questions JSON, etc.
  videoUrl: text("video_url"), // For video content
  orderIndex: integer("order_index").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTrainingModuleContentSchema = createInsertSchema(trainingModuleContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type TrainingModuleContent = typeof trainingModuleContent.$inferSelect;
export type InsertTrainingModuleContent = z.infer<typeof insertTrainingModuleContentSchema>;

// Readiness Snapshots schema - For tracking historical workforce readiness trends
export const readinessSnapshots = pgTable("readiness_snapshots", {
  id: serial("id").primaryKey(),
  snapshotDate: timestamp("snapshot_date").notNull(),
  squadron: text("squadron").notNull(), // "33" | "35" | "36" | "37" (flying squadrons) | "ALL" — AMG excluded (leadership are not flight-ready metrics subjects)
  totalPersonnel: integer("total_personnel").notNull(),
  readyCount: integer("ready_count").notNull(),
  notReadyCount: integer("not_ready_count").notNull(),
  readyPercent: real("ready_percent").notNull(),
  currentQuals: integer("current_quals").notNull(),
  expiringQuals: integer("expiring_quals").notNull(),
  expiredQuals: integer("expired_quals").notNull(),
  personnelAtRisk: integer("personnel_at_risk").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReadinessSnapshotSchema = createInsertSchema(readinessSnapshots).omit({
  id: true,
  createdAt: true,
}).extend({
  snapshotDate: z.coerce.date(),
});

export type ReadinessSnapshot = typeof readinessSnapshots.$inferSelect;
export type InsertReadinessSnapshot = z.infer<typeof insertReadinessSnapshotSchema>;

// Training Module Assessment Completions - records assessment submissions from training modules
export const trainingModuleCompletions = pgTable("training_module_completions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  moduleId: text("module_id").notNull(),
  moduleTitle: text("module_title").notNull(),
  aircraft: text("aircraft").notNull().default("all"),
  difficulty: text("difficulty").notNull().default("beginner"),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").notNull(),
  squadron: text("squadron").notNull().default("33SQN"), // 33SQN | 35SQN | 36SQN | 37SQN — flying units; defaults to 33SQN for safety (auto-populated from session in practice)
  answers: json("answers").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertTrainingModuleCompletionSchema = createInsertSchema(trainingModuleCompletions).omit({
  id: true,
  submittedAt: true,
});

export type TrainingModuleCompletion = typeof trainingModuleCompletions.$inferSelect;
export type InsertTrainingModuleCompletion = z.infer<typeof insertTrainingModuleCompletionSchema>;

// Activity Log — tracks destructive actions (deletions) for SuperAdmin audit trail
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  userEmail: text("user_email").notNull(),
  userName: text("user_name").notNull(),
  action: text("action").notNull(), // e.g. "DELETE"
  resourceType: text("resource_type").notNull(), // e.g. "Phone Directory Entry"
  resourceName: text("resource_name").notNull(), // e.g. "Adelaide Airport"
  details: text("details"), // optional extra context
  performedAt: timestamp("performed_at").defaultNow().notNull(),
});

export const insertActivityLogSchema = createInsertSchema(activityLog).omit({
  id: true,
  performedAt: true,
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
