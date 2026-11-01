import { eq } from "drizzle-orm";
import { db } from "../db";
import { scenarios, type Scenario } from "@shared/schema";
import { isPassing } from "@shared/constants";
import { NotFound } from "../lib/errors";

export async function getScenario(id: number): Promise<Scenario> {
  const [row] = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  if (!row) throw new NotFound("Scenario");
  return row;
}

export interface ScenarioReviewGrade {
  /** Every question id of the scenario, unmarked ones set to false. */
  markedAnswers: Record<string, boolean>;
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
  const total = scenario.questions.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  return { markedAnswers, score, passed: isPassing(score, scenario) };
}
