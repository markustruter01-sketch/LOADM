import { eq } from "drizzle-orm";
import { db } from "../db";
import { scenarios, type Scenario, type ScenarioQuestion, type User } from "@shared/schema";
import { isPassing, roleHas } from "@shared/constants";
import { NotFound } from "../lib/errors";

/** A scenario question as served to a student: no answer key. */
export type StudentScenarioQuestion = Omit<ScenarioQuestion, "correctAnswer">;
export type StudentScenario = Omit<Scenario, "questions"> & { questions: StudentScenarioQuestion[] };

export function stripAnswerKey(scenario: Scenario): StudentScenario {
  return {
    ...scenario,
    questions: scenario.questions.map(({ id, question, questionType, options }) => ({ id, question, questionType, options })),
  };
}

/**
 * The scenario as the viewer may see it: instructors always get the answer
 * key; others only when `reveal` is true (their submission has been reviewed).
 */
export function scenarioForViewer(scenario: Scenario, viewer: User, reveal = false): Scenario | StudentScenario {
  return roleHas(viewer.role, "instruct") || reveal ? scenario : stripAnswerKey(scenario);
}

export async function getScenario(id: number): Promise<Scenario> {
  const [row] = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  if (!row) throw new NotFound("Scenario");
  return row;
}

export interface ScenarioReviewGrade {
  /** Every question id of the scenario, unmarked ones set to false. */
  markedAnswers: Record<string, boolean>;
  correctCount: number;
  totalQuestions: number;
  score: number;
  passed: boolean;
}

/** Score an instructor's marking: keys are question ids; unmarked = wrong. */
export function gradeReview(scenario: Scenario, marked: Record<string, boolean>): ScenarioReviewGrade {
  const markedAnswers: Record<string, boolean> = {};
  let correctCount = 0;
  for (const q of scenario.questions) {
    const ok = marked[q.id] === true;
    markedAnswers[q.id] = ok;
    if (ok) correctCount++;
  }
  const totalQuestions = scenario.questions.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  return { markedAnswers, correctCount, totalQuestions, score, passed: isPassing(score, scenario) };
}
