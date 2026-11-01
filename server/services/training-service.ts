import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import {
  trainingModuleContent, trainingModuleCompletions,
  type TrainingModuleContent, type ModuleQuizQuestion,
} from "@shared/schema";
import { listReadinessPersonnel } from "./user-service";

// ---- Answer-key stripping -------------------------------------------------

/** A module question as served to a student: no answer key. */
export type StudentModuleQuestion = Omit<ModuleQuizQuestion, "correctIndex">;
export type StudentModuleContent = Omit<TrainingModuleContent, "questions"> & { questions: StudentModuleQuestion[] | null };

/** Remove `correctIndex` from quiz/assessment content before it reaches a non-instructor. */
export function stripAnswerKey(content: TrainingModuleContent): StudentModuleContent {
  const { questions, ...rest } = content;
  return {
    ...rest,
    questions: questions ? questions.map((q) => ({ id: q.id, question: q.question, options: q.options })) : null,
  };
}

// ---- Grading --------------------------------------------------------------

export interface AssessmentResult {
  questionId: string;
  question: string;
  options: string[];
  /** Index the student chose, or null when the question was not answered. */
  answeredIndex: number | null;
  correctIndex: number;
  correct: boolean;
}

export interface GradedAssessment {
  correctCount: number;
  totalQuestions: number;
  /** Whole-number percentage. */
  score: number;
  results: AssessmentResult[];
}

/**
 * Grade a set of answers (keyed by question id) against the module's
 * questions. Answers for unknown ids are ignored; missing answers are wrong.
 */
export function gradeModuleAssessment(questions: ModuleQuizQuestion[], answers: Record<string, number>): GradedAssessment {
  const results: AssessmentResult[] = questions.map((q) => {
    const answeredIndex = Object.prototype.hasOwnProperty.call(answers, q.id) ? answers[q.id] : null;
    return {
      questionId: q.id,
      question: q.question,
      options: q.options,
      answeredIndex,
      correctIndex: q.correctIndex,
      correct: answeredIndex !== null && answeredIndex === q.correctIndex,
    };
  });
  const correctCount = results.filter((r) => r.correct).length;
  const totalQuestions = questions.length;
  const score = totalQuestions ? Math.round((correctCount / totalQuestions) * 100) : 0;
  return { correctCount, totalQuestions, score, results };
}

/**
 * The content row a module is assessed on: the first active quiz/assessment
 * content (by order) that actually carries questions.
 */
export async function findAssessmentContent(moduleId: number): Promise<TrainingModuleContent | undefined> {
  const rows = await db
    .select()
    .from(trainingModuleContent)
    .where(
      and(
        eq(trainingModuleContent.moduleId, moduleId),
        eq(trainingModuleContent.isActive, true),
        inArray(trainingModuleContent.type, ["assessment", "quiz"]),
      ),
    )
    .orderBy(asc(trainingModuleContent.orderIndex), asc(trainingModuleContent.id));
  return rows.find((r) => r.questions !== null && r.questions.length > 0);
}

// ---- Per-module statistics ------------------------------------------------

export interface BestCompletion {
  score: number;
  passed: boolean;
  submittedAt: Date;
}

/** The user's best completion per module (highest score, then most recent). */
export async function bestCompletionsFor(userId: number, moduleIds: number[]): Promise<Map<number, BestCompletion>> {
  const best = new Map<number, BestCompletion>();
  if (moduleIds.length === 0) return best;
  const rows = await db
    .select({
      moduleId: trainingModuleCompletions.moduleId,
      score: trainingModuleCompletions.score,
      passed: trainingModuleCompletions.passed,
      submittedAt: trainingModuleCompletions.submittedAt,
    })
    .from(trainingModuleCompletions)
    .where(and(eq(trainingModuleCompletions.userId, userId), inArray(trainingModuleCompletions.moduleId, moduleIds)))
    .orderBy(desc(trainingModuleCompletions.score), desc(trainingModuleCompletions.submittedAt));
  for (const r of rows) {
    if (!best.has(r.moduleId)) best.set(r.moduleId, { score: r.score, passed: r.passed, submittedAt: r.submittedAt });
  }
  return best;
}

/**
 * Percentage of readiness personnel (active aircrew in a flying squadron)
 * who have passed each module at least once. Modules nobody passed map to 0.
 */
export async function moduleCompletionRates(moduleIds: number[]): Promise<Map<number, number>> {
  const rates = new Map<number, number>();
  if (moduleIds.length === 0) return rates;
  const aircrew = await listReadinessPersonnel();
  const aircrewIds = new Set(aircrew.map((u) => u.id));
  const rows = await db
    .selectDistinct({ moduleId: trainingModuleCompletions.moduleId, userId: trainingModuleCompletions.userId })
    .from(trainingModuleCompletions)
    .where(and(inArray(trainingModuleCompletions.moduleId, moduleIds), eq(trainingModuleCompletions.passed, true)));
  const passedBy = new Map<number, Set<number>>();
  for (const r of rows) {
    if (!aircrewIds.has(r.userId)) continue;
    const set = passedBy.get(r.moduleId) ?? new Set<number>();
    set.add(r.userId);
    passedBy.set(r.moduleId, set);
  }
  for (const id of moduleIds) {
    const n = passedBy.get(id)?.size ?? 0;
    rates.set(id, aircrewIds.size ? Math.round((n / aircrewIds.size) * 100) : 0);
  }
  return rates;
}

/** Count of active content rows per module. */
export async function contentCountsFor(moduleIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (moduleIds.length === 0) return counts;
  const rows = await db
    .select({ moduleId: trainingModuleContent.moduleId, id: trainingModuleContent.id })
    .from(trainingModuleContent)
    .where(and(inArray(trainingModuleContent.moduleId, moduleIds), eq(trainingModuleContent.isActive, true)));
  for (const r of rows) counts.set(r.moduleId, (counts.get(r.moduleId) ?? 0) + 1);
  return counts;
}
