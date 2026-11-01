import {
  pgSchema,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  real,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  ROLES,
  SQUADRONS,
  CATEGORIES,
  AIRCRAFT_TYPES,
  DIFFICULTIES,
  QUESTION_DIFFICULTIES,
  QUESTION_CATEGORIES,
  SUBMISSION_STATUSES,
  SUBMISSION_TYPES,
  SAFETY_RECORD_TYPES,
  SAFETY_SEVERITIES,
  SAFETY_STATUSES,
  CHECKLIST_CATEGORIES,
  MODULE_CONTENT_TYPES,
  CHAT_MESSAGE_TYPES,
} from "./constants";

/**
 * Every table and enum lives in the `showcase` Postgres schema, not `public`.
 * This keeps the rebuilt app fully separate from the legacy tables that
 * still sit in `public` in the same database, so the legacy data is never
 * read, altered or dropped.
 */
export const DB_SCHEMA = "showcase";
export const appSchema = pgSchema(DB_SCHEMA);

// ---------------------------------------------------------------------------
// Enums (mirrors shared/constants.ts — that file is the source of the values)
// ---------------------------------------------------------------------------

export const roleEnum = appSchema.enum("role", ROLES);
export const squadronEnum = appSchema.enum("squadron", SQUADRONS);
export const categoryEnum = appSchema.enum("category", CATEGORIES);
export const aircraftEnum = appSchema.enum("aircraft_type", AIRCRAFT_TYPES);
export const difficultyEnum = appSchema.enum("difficulty", DIFFICULTIES);
export const questionDifficultyEnum = appSchema.enum("question_difficulty", QUESTION_DIFFICULTIES);
export const questionCategoryEnum = appSchema.enum("question_category", QUESTION_CATEGORIES);
export const submissionStatusEnum = appSchema.enum("submission_status", SUBMISSION_STATUSES);
export const submissionTypeEnum = appSchema.enum("submission_type", SUBMISSION_TYPES);
export const safetyRecordTypeEnum = appSchema.enum("safety_record_type", SAFETY_RECORD_TYPES);
export const safetySeverityEnum = appSchema.enum("safety_severity", SAFETY_SEVERITIES);
export const safetyStatusEnum = appSchema.enum("safety_status", SAFETY_STATUSES);
export const checklistCategoryEnum = appSchema.enum("checklist_category", CHECKLIST_CATEGORIES);
export const moduleContentTypeEnum = appSchema.enum("module_content_type", MODULE_CONTENT_TYPES);
export const chatMessageTypeEnum = appSchema.enum("chat_message_type", CHAT_MESSAGE_TYPES);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

/**
 * One row per person. Replaces the old users + licenses pair.
 * There is no authentication: a visitor picks a role and is attached to the
 * `isDemoPersona` user for that role.
 */
export const users = appSchema.table(
  "users",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    rank: text("rank").notNull().default("LAC"),
    role: roleEnum("role").notNull(),
    squadron: squadronEnum("squadron").notNull(),
    category: categoryEnum("category").notNull().default("D"),
    isActive: boolean("is_active").notNull().default(true),
    /** The user a visitor "becomes" when they pick this role. One per role. */
    isDemoPersona: boolean("is_demo_persona").notNull().default(false),
    isFlightReady: boolean("is_flight_ready").notNull().default(true),
    notReadyReason: text("not_ready_reason"),
    readinessUpdatedAt: timestamp("readiness_updated_at", { withTimezone: true }),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("users_squadron_idx").on(t.squadron),
    index("users_role_idx").on(t.role),
    uniqueIndex("users_demo_persona_role_idx")
      .on(t.role)
      .where(sql`${t.isDemoPersona} = true`),
  ],
);

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isDemoPersona: true,
  lastActiveAt: true,
});
export const updateUserProfileSchema = insertUserSchema
  .pick({ firstName: true, lastName: true, rank: true, squadron: true, category: true })
  .partial();

// ---------------------------------------------------------------------------
// Documents (form templates) and submissions
// ---------------------------------------------------------------------------

export type FormField = {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "date" | "textarea";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

export const documents = appSchema.table("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  fields: json("fields").$type<FormField[]>().notNull(),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const insertDocumentSchema = createInsertSchema(documents, {
  fields: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum(["text", "number", "select", "checkbox", "date", "textarea"]),
      placeholder: z.string().optional(),
      options: z.array(z.string()).optional(),
      required: z.boolean().optional(),
    }),
  ),
}).pick({ title: true, description: true, type: true, fields: true });

export const documentSubmissions = appSchema.table(
  "document_submissions",
  {
    id: serial("id").primaryKey(),
    documentId: integer("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    formData: json("form_data").$type<Record<string, unknown>>().notNull(),
  },
  (t) => [index("document_submissions_user_idx").on(t.userId, t.submittedAt)],
);

export const insertDocumentSubmissionSchema = z.object({
  documentId: z.number().int().positive(),
  formData: z.record(z.unknown()),
});

// ---------------------------------------------------------------------------
// Scenarios and submissions
// ---------------------------------------------------------------------------

export type ScenarioQuestion = {
  id: string;
  question: string;
  questionType: "multiple-choice" | "free-text";
  options: string[];
  correctAnswer: string;
};

export const scenarioQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  questionType: z.enum(["multiple-choice", "free-text"]),
  options: z.array(z.string()).default([]),
  correctAnswer: z.string().default(""),
});

export const scenarios = appSchema.table("scenarios", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  aircraft: aircraftEnum("aircraft"),
  questions: json("questions").$type<ScenarioQuestion[]>().notNull(),
  passingThreshold: integer("passing_threshold"),
  isActive: boolean("is_active").notNull().default(true),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const insertScenarioSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  aircraft: z.enum(AIRCRAFT_TYPES).nullable().optional(),
  questions: z.array(scenarioQuestionSchema).min(1),
  passingThreshold: z.number().int().min(0).max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type ScenarioAnswer = { questionId: string; answer: string; notes?: string };

export const scenarioSubmissions = appSchema.table(
  "scenario_submissions",
  {
    id: serial("id").primaryKey(),
    scenarioId: integer("scenario_id")
      .notNull()
      .references(() => scenarios.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Squadron of the user at submission time (denormalised for analytics). */
    squadron: squadronEnum("squadron").notNull(),
    submissionType: submissionTypeEnum("submission_type").notNull().default("assessment"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    answers: json("answers").$type<ScenarioAnswer[]>().notNull(),
    timeSpentSeconds: integer("time_spent_seconds"),
    notes: text("notes"),
    status: submissionStatusEnum("status").notNull().default("submitted"),
    /** Set by instructor review. */
    score: integer("score"),
    passed: boolean("passed"),
    markedAnswers: json("marked_answers").$type<Record<string, boolean>>(),
    questionFeedback: json("question_feedback").$type<Record<string, string>>(),
    instructorFeedback: text("instructor_feedback"),
    reviewedById: integer("reviewed_by_id").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    notificationSeen: boolean("notification_seen").notNull().default(true),
  },
  (t) => [
    index("scenario_submissions_user_idx").on(t.userId, t.submittedAt),
    index("scenario_submissions_scenario_idx").on(t.scenarioId),
    index("scenario_submissions_status_idx").on(t.status),
  ],
);

export const insertScenarioSubmissionSchema = z.object({
  scenarioId: z.number().int().positive(),
  answers: z.array(z.object({ questionId: z.string(), answer: z.string(), notes: z.string().optional() })).min(1),
  submissionType: z.enum(SUBMISSION_TYPES).optional(),
  timeSpentSeconds: z.number().int().nonnegative().optional(),
  notes: z.string().max(5000).optional(),
});

export const reviewScenarioSubmissionSchema = z.object({
  markedAnswers: z.record(z.boolean()),
  questionFeedback: z.record(z.string()).optional(),
  instructorFeedback: z.string().max(10000).optional(),
});

// ---------------------------------------------------------------------------
// Quizzes: question bank, quiz definitions, attempts, submissions
// ---------------------------------------------------------------------------

export const quizQuestions = appSchema.table(
  "quiz_questions",
  {
    id: serial("id").primaryKey(),
    category: questionCategoryEnum("category").notNull(),
    questionText: text("question_text").notNull(),
    options: json("options").$type<string[]>().notNull(),
    /** Index into `options`. Never sent to a student before they submit. */
    correctIndex: integer("correct_index").notNull(),
    explanation: text("explanation"),
    difficulty: questionDifficultyEnum("difficulty").notNull().default("medium"),
    isActive: boolean("is_active").notNull().default(true),
    createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("quiz_questions_category_idx").on(t.category, t.isActive)],
);

export const insertQuizQuestionSchema = z
  .object({
    category: z.enum(QUESTION_CATEGORIES),
    questionText: z.string().min(5).max(2000),
    options: z.array(z.string().min(1)).min(2).max(6),
    correctIndex: z.number().int().nonnegative(),
    explanation: z.string().max(2000).nullable().optional(),
    difficulty: z.enum(QUESTION_DIFFICULTIES).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: "correctIndex must point at one of the options",
    path: ["correctIndex"],
  });

export const quizzes = appSchema.table("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  categories: json("categories").$type<string[]>().notNull(),
  questionCount: integer("question_count").notNull(),
  passingThreshold: integer("passing_threshold"),
  timeLimitMinutes: integer("time_limit_minutes"),
  isActive: boolean("is_active").notNull().default(true),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const insertQuizSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  categories: z.array(z.enum(QUESTION_CATEGORIES)).min(1),
  questionCount: z.number().int().min(1).max(100),
  passingThreshold: z.number().int().min(0).max(100).nullable().optional(),
  timeLimitMinutes: z.number().int().min(1).max(240).nullable().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

/**
 * The exact set of questions served to a user for one sitting. Submissions
 * are graded against this set, by question id, so the student is never
 * graded on questions they did not see.
 */
export const quizAttempts = appSchema.table(
  "quiz_attempts",
  {
    id: serial("id").primaryKey(),
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    questionIds: json("question_ids").$type<number[]>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
  },
  (t) => [index("quiz_attempts_user_quiz_idx").on(t.userId, t.quizId)],
);

export type QuizAnswer = { questionId: number; answeredIndex: number };

export const quizSubmissions = appSchema.table(
  "quiz_submissions",
  {
    id: serial("id").primaryKey(),
    attemptId: integer("attempt_id")
      .notNull()
      .unique()
      .references(() => quizAttempts.id, { onDelete: "cascade" }),
    quizId: integer("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    squadron: squadronEnum("squadron").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
    answers: json("answers").$type<QuizAnswer[]>().notNull(),
    correctCount: integer("correct_count").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    timeSpentSeconds: integer("time_spent_seconds"),
  },
  (t) => [
    index("quiz_submissions_user_idx").on(t.userId, t.submittedAt),
    index("quiz_submissions_quiz_idx").on(t.quizId),
  ],
);

export const submitQuizSchema = z.object({
  attemptId: z.number().int().positive(),
  answers: z.array(z.object({ questionId: z.number().int(), answeredIndex: z.number().int().min(-1) })),
  timeSpentSeconds: z.number().int().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// Training modules
// ---------------------------------------------------------------------------

export const trainingModules = appSchema.table("training_modules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  aircraft: aircraftEnum("aircraft"),
  difficulty: difficultyEnum("difficulty").notNull().default("beginner"),
  durationMinutes: integer("duration_minutes").notNull(),
  topics: json("topics").$type<string[]>().notNull().default([]),
  objectives: json("objectives").$type<string[]>().notNull().default([]),
  passingThreshold: integer("passing_threshold"),
  isActive: boolean("is_active").notNull().default(true),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const insertTrainingModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  aircraft: z.enum(AIRCRAFT_TYPES).nullable().optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  durationMinutes: z.number().int().min(1).max(100000),
  topics: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  passingThreshold: z.number().int().min(0).max(100).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type ModuleQuizQuestion = { id: string; question: string; options: string[]; correctIndex: number };

export const trainingModuleContent = appSchema.table(
  "training_module_content",
  {
    id: serial("id").primaryKey(),
    moduleId: integer("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    type: moduleContentTypeEnum("type").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(10),
    description: text("description").notNull().default(""),
    /** Markdown for readings. */
    body: text("body"),
    /** Questions for quiz/assessment content. */
    questions: json("questions").$type<ModuleQuizQuestion[]>(),
    orderIndex: integer("order_index").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [index("training_module_content_module_idx").on(t.moduleId, t.orderIndex)],
);

export const insertTrainingModuleContentSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(MODULE_CONTENT_TYPES),
  durationMinutes: z.number().int().min(1).optional(),
  description: z.string().optional(),
  body: z.string().nullable().optional(),
  questions: z
    .array(
      z.object({
        id: z.string(),
        question: z.string().min(1),
        options: z.array(z.string()).min(2),
        correctIndex: z.number().int().nonnegative(),
      }),
    )
    .nullable()
    .optional(),
  orderIndex: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const trainingModuleCompletions = appSchema.table(
  "training_module_completions",
  {
    id: serial("id").primaryKey(),
    moduleId: integer("module_id")
      .notNull()
      .references(() => trainingModules.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    squadron: squadronEnum("squadron").notNull(),
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    correctCount: integer("correct_count").notNull(),
    totalQuestions: integer("total_questions").notNull(),
    answers: json("answers").$type<Record<string, number>>().notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("training_module_completions_user_idx").on(t.userId, t.submittedAt)],
);

// ---------------------------------------------------------------------------
// Checklists
// ---------------------------------------------------------------------------

export const checklists = appSchema.table("checklists", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  aircraftType: text("aircraft_type").notNull(),
  category: checklistCategoryEnum("category").notNull().default("startup"),
  isActive: boolean("is_active").notNull().default(true),
  enforceLinearProgression: boolean("enforce_linear_progression").notNull().default(false),
  createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
});

export const checklistItems = appSchema.table(
  "checklist_items",
  {
    id: serial("id").primaryKey(),
    checklistId: integer("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "cascade" }),
    itemText: text("item_text").notNull(),
    itemOrder: integer("item_order").notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    section: text("section"),
  },
  (t) => [index("checklist_items_checklist_idx").on(t.checklistId, t.itemOrder)],
);

export const insertChecklistSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  aircraftType: z.string().min(1),
  category: z.enum(CHECKLIST_CATEGORIES).optional(),
  isActive: z.boolean().optional(),
  enforceLinearProgression: z.boolean().optional(),
  items: z
    .array(
      z.object({
        itemText: z.string().min(1),
        isRequired: z.boolean().optional(),
        section: z.string().nullable().optional(),
      }),
    )
    .min(1),
});

export const checklistCompletions = appSchema.table(
  "checklist_completions",
  {
    id: serial("id").primaryKey(),
    checklistId: integer("checklist_id")
      .notNull()
      .references(() => checklists.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    completedItemIds: json("completed_item_ids").$type<number[]>().notNull(),
    isComplete: boolean("is_complete").notNull().default(false),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("checklist_completions_user_checklist_idx").on(t.userId, t.checklistId)],
);

export const updateChecklistProgressSchema = z.object({
  completedItemIds: z.array(z.number().int().positive()),
});

export const checklistStepAudit = appSchema.table(
  "checklist_step_audit",
  {
    id: serial("id").primaryKey(),
    completionId: integer("completion_id")
      .notNull()
      .references(() => checklistCompletions.id, { onDelete: "cascade" }),
    checklistItemId: integer("checklist_item_id")
      .notNull()
      .references(() => checklistItems.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // checked | unchecked
    at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("checklist_step_audit_completion_idx").on(t.completionId, t.at)],
);

// ---------------------------------------------------------------------------
// Missions
// ---------------------------------------------------------------------------

export const missions = appSchema.table(
  "missions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    missionName: text("mission_name").notNull(),
    aircraft: aircraftEnum("aircraft").notNull(),
    aircraftCallSign: text("aircraft_call_sign").notNull(),
    captainName: text("captain_name").notNull(),
    departureLocation: text("departure_location").notNull(),
    arrivalDestination: text("arrival_destination").notNull(),
    loadmaster1Name: text("loadmaster1_name").notNull(),
    loadmaster2Name: text("loadmaster2_name"),
    hasDangerousGoods: boolean("has_dangerous_goods").notNull().default(false),
    isCompleted: boolean("is_completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("missions_user_idx").on(t.userId, t.createdAt)],
);

export const insertMissionSchema = z.object({
  missionName: z.string().min(1).max(200),
  aircraft: z.enum(AIRCRAFT_TYPES),
  aircraftCallSign: z.string().min(1).max(50),
  captainName: z.string().min(1).max(100),
  departureLocation: z.string().min(1).max(100),
  arrivalDestination: z.string().min(1).max(100),
  loadmaster1Name: z.string().min(1).max(100),
  loadmaster2Name: z.string().max(100).nullable().optional(),
  hasDangerousGoods: z.boolean().optional(),
});

export const missionDocuments = appSchema.table("mission_documents", {
  id: serial("id").primaryKey(),
  missionId: integer("mission_id")
    .notNull()
    .references(() => missions.id, { onDelete: "cascade" }),
  documentFilename: text("document_filename").notNull(),
  documentTitle: text("document_title").notNull(),
  addedById: integer("added_by_id").references(() => users.id, { onDelete: "set null" }),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertMissionDocumentSchema = z.object({
  documentFilename: z.string().min(1).max(255),
  documentTitle: z.string().min(1).max(255),
});

// ---------------------------------------------------------------------------
// Personnel records
// ---------------------------------------------------------------------------

export const userQualifications = appSchema.table(
  "user_qualifications",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    expiryDate: timestamp("expiry_date", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("user_qualifications_user_idx").on(t.userId), index("user_qualifications_expiry_idx").on(t.expiryDate)],
);

export const insertUserQualificationSchema = z.object({
  name: z.string().min(1).max(200),
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date().nullable().optional(),
});

export const flightRecords = appSchema.table(
  "flight_records",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    aircraft: aircraftEnum("aircraft").notNull(),
    callsign: text("callsign"),
    departure: text("departure").notNull(),
    arrival: text("arrival").notNull(),
    captain: text("captain").notNull(),
    passengersCarried: integer("passengers_carried").notNull().default(0),
    cargoWeightKg: integer("cargo_weight_kg").notNull().default(0),
    dayHours: real("day_hours").notNull().default(0),
    nightHours: real("night_hours").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("flight_records_user_date_idx").on(t.userId, t.date)],
);

export const insertFlightRecordSchema = z.object({
  date: z.coerce.date(),
  aircraft: z.enum(AIRCRAFT_TYPES),
  callsign: z.string().max(50).nullable().optional(),
  departure: z.string().min(1).max(100),
  arrival: z.string().min(1).max(100),
  captain: z.string().min(1).max(100),
  passengersCarried: z.number().int().nonnegative().optional(),
  cargoWeightKg: z.number().int().nonnegative().optional(),
  dayHours: z.number().nonnegative().max(24).optional(),
  nightHours: z.number().nonnegative().max(24).optional(),
});

export const safetyRecords = appSchema.table(
  "safety_records",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    squadron: squadronEnum("squadron").notNull(),
    recordType: safetyRecordTypeEnum("record_type").notNull(),
    description: text("description").notNull(),
    severity: safetySeverityEnum("severity"),
    date: timestamp("date", { withTimezone: true }).notNull(),
    reportedById: integer("reported_by_id").references(() => users.id, { onDelete: "set null" }),
    status: safetyStatusEnum("status").notNull().default("open"),
    resolutionNotes: text("resolution_notes"),
    location: text("location"),
    aircraft: aircraftEnum("aircraft"),
    flightPhase: text("flight_phase"),
    safetyLevel: text("safety_level"),
    immediateActions: text("immediate_actions"),
    contributingFactors: text("contributing_factors"),
    correctiveActions: text("corrective_actions"),
    ...timestamps,
  },
  (t) => [index("safety_records_squadron_date_idx").on(t.squadron, t.date), index("safety_records_user_idx").on(t.userId)],
);

export const insertSafetyRecordSchema = z.object({
  userId: z.number().int().positive(),
  recordType: z.enum(SAFETY_RECORD_TYPES),
  description: z.string().min(1).max(10000),
  severity: z.enum(SAFETY_SEVERITIES).nullable().optional(),
  date: z.coerce.date(),
  status: z.enum(SAFETY_STATUSES).optional(),
  resolutionNotes: z.string().max(10000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  aircraft: z.enum(AIRCRAFT_TYPES).nullable().optional(),
  flightPhase: z.string().max(50).nullable().optional(),
  safetyLevel: z.string().max(50).nullable().optional(),
  immediateActions: z.string().max(10000).nullable().optional(),
  contributingFactors: z.string().max(10000).nullable().optional(),
  correctiveActions: z.string().max(10000).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Readiness snapshots (daily, per squadron + ALL)
// ---------------------------------------------------------------------------

export const readinessSnapshots = appSchema.table(
  "readiness_snapshots",
  {
    id: serial("id").primaryKey(),
    snapshotDate: timestamp("snapshot_date", { withTimezone: true }).notNull(),
    /** A flying squadron, or "ALL". */
    squadron: text("squadron").notNull(),
    totalPersonnel: integer("total_personnel").notNull(),
    readyCount: integer("ready_count").notNull(),
    notReadyCount: integer("not_ready_count").notNull(),
    readyPercent: real("ready_percent").notNull(),
    currentQuals: integer("current_quals").notNull(),
    expiringQuals: integer("expiring_quals").notNull(),
    expiredQuals: integer("expired_quals").notNull(),
    personnelAtRisk: integer("personnel_at_risk").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("readiness_snapshots_date_squadron_idx").on(t.snapshotDate, t.squadron)],
);

// ---------------------------------------------------------------------------
// Phone directory, chat, activity log
// ---------------------------------------------------------------------------

export type Contact = { id: string; name: string; phoneNumber: string; description: string };

export const phoneDirectory = appSchema.table("phone_directory", {
  id: serial("id").primaryKey(),
  airbaseCode: text("airbase_code").notNull().unique(),
  airbaseName: text("airbase_name").notNull(),
  contacts: json("contacts").$type<Contact[]>().notNull(),
  ...timestamps,
});

export const insertPhoneDirectorySchema = z.object({
  airbaseCode: z.string().min(2).max(10).toUpperCase(),
  airbaseName: z.string().min(1).max(200),
  contacts: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1),
      phoneNumber: z.string().min(1),
      description: z.string().default(""),
    }),
  ),
});

export const chatMessages = appSchema.table(
  "chat_messages",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    messageType: chatMessageTypeEnum("message_type").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("chat_messages_created_idx").on(t.createdAt)],
);

export const insertChatMessageSchema = z.object({
  messageType: z.enum(CHAT_MESSAGE_TYPES),
  content: z.string().min(1).max(4000),
});

export const activityLog = appSchema.table(
  "activity_log",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resourceType: text("resource_type").notNull(),
    resourceId: integer("resource_id"),
    resourceName: text("resource_name").notNull(),
    details: text("details"),
    performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("activity_log_performed_idx").on(t.performedAt)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  documentSubmissions: many(documentSubmissions),
  scenarioSubmissions: many(scenarioSubmissions, { relationName: "submitter" }),
  quizSubmissions: many(quizSubmissions),
  quizAttempts: many(quizAttempts),
  chatMessages: many(chatMessages),
  checklistCompletions: many(checklistCompletions),
  qualifications: many(userQualifications),
  flightRecords: many(flightRecords),
  safetyRecords: many(safetyRecords, { relationName: "subject" }),
  missions: many(missions),
  moduleCompletions: many(trainingModuleCompletions),
}));

export const documentsRelations = relations(documents, ({ many }) => ({ submissions: many(documentSubmissions) }));
export const documentSubmissionsRelations = relations(documentSubmissions, ({ one }) => ({
  document: one(documents, { fields: [documentSubmissions.documentId], references: [documents.id] }),
  user: one(users, { fields: [documentSubmissions.userId], references: [users.id] }),
}));

export const scenariosRelations = relations(scenarios, ({ many }) => ({ submissions: many(scenarioSubmissions) }));
export const scenarioSubmissionsRelations = relations(scenarioSubmissions, ({ one }) => ({
  scenario: one(scenarios, { fields: [scenarioSubmissions.scenarioId], references: [scenarios.id] }),
  user: one(users, { fields: [scenarioSubmissions.userId], references: [users.id], relationName: "submitter" }),
  reviewer: one(users, { fields: [scenarioSubmissions.reviewedById], references: [users.id], relationName: "reviewer" }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  creator: one(users, { fields: [quizzes.createdById], references: [users.id] }),
  attempts: many(quizAttempts),
  submissions: many(quizSubmissions),
}));
export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  submission: one(quizSubmissions, { fields: [quizAttempts.id], references: [quizSubmissions.attemptId] }),
}));
export const quizSubmissionsRelations = relations(quizSubmissions, ({ one }) => ({
  quiz: one(quizzes, { fields: [quizSubmissions.quizId], references: [quizzes.id] }),
  user: one(users, { fields: [quizSubmissions.userId], references: [users.id] }),
  attempt: one(quizAttempts, { fields: [quizSubmissions.attemptId], references: [quizAttempts.id] }),
}));

export const trainingModulesRelations = relations(trainingModules, ({ many }) => ({
  content: many(trainingModuleContent),
  completions: many(trainingModuleCompletions),
}));
export const trainingModuleContentRelations = relations(trainingModuleContent, ({ one }) => ({
  module: one(trainingModules, { fields: [trainingModuleContent.moduleId], references: [trainingModules.id] }),
}));
export const trainingModuleCompletionsRelations = relations(trainingModuleCompletions, ({ one }) => ({
  module: one(trainingModules, { fields: [trainingModuleCompletions.moduleId], references: [trainingModules.id] }),
  user: one(users, { fields: [trainingModuleCompletions.userId], references: [users.id] }),
}));

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  creator: one(users, { fields: [checklists.createdById], references: [users.id] }),
  items: many(checklistItems),
  completions: many(checklistCompletions),
}));
export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(checklists, { fields: [checklistItems.checklistId], references: [checklists.id] }),
}));
export const checklistCompletionsRelations = relations(checklistCompletions, ({ one, many }) => ({
  checklist: one(checklists, { fields: [checklistCompletions.checklistId], references: [checklists.id] }),
  user: one(users, { fields: [checklistCompletions.userId], references: [users.id] }),
  steps: many(checklistStepAudit),
}));
export const checklistStepAuditRelations = relations(checklistStepAudit, ({ one }) => ({
  completion: one(checklistCompletions, { fields: [checklistStepAudit.completionId], references: [checklistCompletions.id] }),
  item: one(checklistItems, { fields: [checklistStepAudit.checklistItemId], references: [checklistItems.id] }),
}));

export const missionsRelations = relations(missions, ({ one, many }) => ({
  user: one(users, { fields: [missions.userId], references: [users.id] }),
  documents: many(missionDocuments),
}));
export const missionDocumentsRelations = relations(missionDocuments, ({ one }) => ({
  mission: one(missions, { fields: [missionDocuments.missionId], references: [missions.id] }),
}));

export const userQualificationsRelations = relations(userQualifications, ({ one }) => ({
  user: one(users, { fields: [userQualifications.userId], references: [users.id] }),
}));
export const flightRecordsRelations = relations(flightRecords, ({ one }) => ({
  user: one(users, { fields: [flightRecords.userId], references: [users.id] }),
}));
export const safetyRecordsRelations = relations(safetyRecords, ({ one }) => ({
  user: one(users, { fields: [safetyRecords.userId], references: [users.id], relationName: "subject" }),
  reportedBy: one(users, { fields: [safetyRecords.reportedById], references: [users.id], relationName: "reporter" }),
}));
export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, { fields: [chatMessages.userId], references: [users.id] }),
}));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
/** What the API returns for a person: never includes internal flags. */
export type PublicUser = Pick<
  User,
  | "id" | "email" | "firstName" | "lastName" | "rank" | "role" | "squadron" | "category"
  | "isActive" | "isFlightReady" | "notReadyReason" | "readinessUpdatedAt" | "lastActiveAt" | "createdAt"
>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type DocumentSubmission = typeof documentSubmissions.$inferSelect;

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = z.infer<typeof insertScenarioSchema>;
export type ScenarioSubmission = typeof scenarioSubmissions.$inferSelect;

export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
/** A question as served to a student: no answer key. */
export type StudentQuizQuestion = Omit<QuizQuestion, "correctIndex" | "explanation" | "createdById" | "createdAt" | "updatedAt" | "isActive">;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;

export type TrainingModule = typeof trainingModules.$inferSelect;
export type InsertTrainingModule = z.infer<typeof insertTrainingModuleSchema>;
export type TrainingModuleContent = typeof trainingModuleContent.$inferSelect;
export type InsertTrainingModuleContent = z.infer<typeof insertTrainingModuleContentSchema>;
export type TrainingModuleCompletion = typeof trainingModuleCompletions.$inferSelect;

export type Checklist = typeof checklists.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type ChecklistCompletion = typeof checklistCompletions.$inferSelect;
export type ChecklistWithItems = Checklist & { items: ChecklistItem[] };

export type Mission = typeof missions.$inferSelect;
export type InsertMission = z.infer<typeof insertMissionSchema>;
export type MissionDocument = typeof missionDocuments.$inferSelect;

export type UserQualification = typeof userQualifications.$inferSelect;
export type FlightRecord = typeof flightRecords.$inferSelect;
export type SafetyRecord = typeof safetyRecords.$inferSelect;
export type InsertSafetyRecord = z.infer<typeof insertSafetyRecordSchema>;
export type ReadinessSnapshot = typeof readinessSnapshots.$inferSelect;

export type PhoneDirectory = typeof phoneDirectory.$inferSelect;
export type InsertPhoneDirectory = z.infer<typeof insertPhoneDirectorySchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ActivityLog = typeof activityLog.$inferSelect;
