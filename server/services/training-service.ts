import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  trainingModuleContent, type TrainingModuleContent, type ModuleQuizQuestion,
} from "@shared/schema";
import { BadRequest } from "../lib/errors";

/**
 * The module screens treat every quiz/assessment question as its own content
 * item whose `content` is a JSON string. A stored content row can hold
 * several questions, so each question is served as a pseudo-row with id
 * "<rowId>-<index>"; readings keep the plain row id.
 */

export interface ContentRef {
  rowId: number;
  /** Question index within the row; null for a reading. */
  index: number | null;
}

export function parseContentRef(raw: string): ContentRef {
  const m = /^(\d+)(?:-(\d+))?$/.exec(raw);
  if (!m) throw new BadRequest("Invalid content id");
  return { rowId: Number(m[1]), index: m[2] === undefined ? null : Number(m[2]) };
}

/** One stored row as the client's content items (one per question, or one reading). */
export function toClientContent(row: TrainingModuleContent) {
  const base = {
    moduleId: row.moduleId,
    title: row.title,
    type: row.type,
    description: row.description,
    duration: `${row.durationMinutes} min`,
    orderIndex: row.orderIndex,
  };
  if (row.type === "reading") return [{ ...base, id: String(row.id), content: row.body ?? "" }];
  return (row.questions ?? []).map((q, i) => ({
    ...base,
    id: `${row.id}-${i}`,
    content: JSON.stringify({ question: q.question, options: q.options, correct: q.correctIndex, explanation: q.explanation ?? "" }),
  }));
}

const questionJson = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
    correct: z.number().int().nonnegative(),
    explanation: z.string().optional(),
  })
  .refine((q) => q.correct < q.options.length, { message: "correct must point at one of the options" });

/** Parse a question item's JSON `content` into a stored question with the given id. */
export function parseQuestionContent(content: string, id: string): ModuleQuizQuestion {
  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    throw new BadRequest("Question content must be JSON");
  }
  const parsed = questionJson.safeParse(raw);
  if (!parsed.success) throw new BadRequest("Invalid question content", parsed.error.issues);
  const { question, options, correct, explanation } = parsed.data;
  return { id, question, options, correctIndex: correct, explanation };
}

export interface RegradedAssessment {
  score: number;
  correctCount: number;
  totalQuestions: number;
  /** Chosen option index per client question id ("db-<rowId>-<index>"), -1 when the text matched no option. */
  answers: Record<string, number>;
}

/**
 * Re-grade the module page's answers (option text per "db-<rowId>-<index>"
 * question) against the stored questions. Null when any answer is not a
 * stored question of this module (e.g. the page's built-in fallback questions).
 */
export async function regradeModuleAnswers(
  moduleId: number,
  answers: Array<{ questionId: string; yourAnswer?: string }>,
): Promise<RegradedAssessment | null> {
  const refs = answers.map((a) => /^db-(\d+)-(\d+)$/.exec(a.questionId));
  const rowIds = refs.flatMap((m) => (m ? [Number(m[1])] : []));
  if (answers.length === 0 || rowIds.length !== answers.length) return null;
  const rows = await db
    .select()
    .from(trainingModuleContent)
    .where(and(eq(trainingModuleContent.moduleId, moduleId), inArray(trainingModuleContent.id, rowIds)));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const recorded: Record<string, number> = {};
  let correctCount = 0;
  for (let i = 0; i < answers.length; i++) {
    const q = byId.get(rowIds[i])?.questions?.[Number(refs[i]?.[2])];
    if (!q) return null;
    const answeredIndex = q.options.indexOf(answers[i].yourAnswer ?? "");
    recorded[answers[i].questionId] = answeredIndex;
    if (answeredIndex === q.correctIndex) correctCount++;
  }
  return {
    score: Math.round((correctCount / answers.length) * 100),
    correctCount,
    totalQuestions: answers.length,
    answers: recorded,
  };
}
