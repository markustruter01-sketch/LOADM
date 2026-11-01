import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, type Db, type Tx } from "../db";
import {
  quizzes, quizQuestions, quizAttempts, quizSubmissions,
  type Quiz, type QuizQuestion, type QuizAttempt, type QuizSubmission, type QuizAnswer, type StudentQuizQuestion, type User,
} from "@shared/schema";
import { QUESTION_CATEGORIES, isPassing, type QuestionCategory } from "@shared/constants";
import { Conflict, NotFound } from "../lib/errors";

/** One graded question, as returned after a submission (answer key included). */
export interface QuizQuestionResult {
  questionId: number;
  questionText: string;
  options: string[];
  answeredIndex: number;
  correctIndex: number;
  explanation: string | null;
  correct: boolean;
}

export interface GradedQuiz {
  correctCount: number;
  totalQuestions: number;
  results: QuizQuestionResult[];
}

/** A question as served to a student before they submit: no answer key. */
export function toStudentQuestion(q: QuizQuestion): StudentQuizQuestion {
  const { id, category, questionText, options, difficulty } = q;
  return { id, category, questionText, options, difficulty };
}

export async function getQuiz(id: number): Promise<Quiz> {
  const [row] = await db.select().from(quizzes).where(eq(quizzes.id, id)).limit(1);
  if (!row) throw new NotFound("Quiz");
  return row;
}

/** `quizzes.categories` is stored as json string[]; narrow it to known categories. */
export function quizCategories(quiz: Pick<Quiz, "categories">): QuestionCategory[] {
  return quiz.categories.filter((c): c is QuestionCategory => (QUESTION_CATEGORIES as readonly string[]).includes(c));
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw `questionCount` random ACTIVE questions from the quiz's categories.
 * If fewer are available, every available question is used.
 */
export async function drawQuestions(quiz: Quiz): Promise<QuizQuestion[]> {
  const categories = quizCategories(quiz);
  if (categories.length === 0) return [];
  const pool = await db
    .select()
    .from(quizQuestions)
    .where(and(eq(quizQuestions.isActive, true), inArray(quizQuestions.category, categories)));
  return shuffle(pool).slice(0, quiz.questionCount);
}

/**
 * The questions of an attempt, in the order they were served. Inactive
 * questions are included: an attempt is always graded against what the
 * student actually saw.
 */
export async function getAttemptQuestions(conn: Db | Tx, questionIds: number[]): Promise<QuizQuestion[]> {
  if (questionIds.length === 0) return [];
  const rows = await conn.select().from(quizQuestions).where(inArray(quizQuestions.id, questionIds));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return questionIds.flatMap((id) => {
    const q = byId.get(id);
    return q ? [q] : [];
  });
}

/**
 * Grade by question id. Answers for ids not in `questions` are ignored;
 * questions without an answer count as wrong (answeredIndex -1).
 */
export function gradeAnswers(questions: QuizQuestion[], answers: QuizAnswer[]): GradedQuiz {
  const answered = new Map<number, number>();
  for (const a of answers) answered.set(a.questionId, a.answeredIndex);
  const results = questions.map((q): QuizQuestionResult => {
    const answeredIndex = answered.get(q.id) ?? -1;
    return {
      questionId: q.id,
      questionText: q.questionText,
      options: q.options,
      answeredIndex,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      correct: answeredIndex === q.correctIndex,
    };
  });
  return { correctCount: results.filter((r) => r.correct).length, totalQuestions: results.length, results };
}

export function scoreFor(correctCount: number, totalQuestions: number): number {
  return totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
}

/** Re-derive the per-question results for a stored submission (attempt + questions). */
export async function buildSubmissionResults(submission: QuizSubmission): Promise<QuizQuestionResult[]> {
  const [attempt] = await db.select().from(quizAttempts).where(eq(quizAttempts.id, submission.attemptId)).limit(1);
  if (!attempt) throw new NotFound("Quiz attempt");
  const questions = await getAttemptQuestions(db, attempt.questionIds);
  return gradeAnswers(questions, submission.answers).results;
}

/**
 * Close an attempt and record its graded submission, atomically. The attempt
 * is claimed with a guarded update so a double submit cannot grade twice.
 */
export async function submitAttempt(params: {
  quiz: Quiz;
  attempt: QuizAttempt;
  user: User;
  answers: QuizAnswer[];
  timeSpentSeconds?: number;
}): Promise<{ submission: QuizSubmission; results: QuizQuestionResult[] }> {
  const { quiz, attempt, user } = params;
  return db.transaction(async (tx) => {
    const claimed = await tx
      .update(quizAttempts)
      .set({ submittedAt: new Date() })
      .where(and(eq(quizAttempts.id, attempt.id), isNull(quizAttempts.submittedAt)))
      .returning({ id: quizAttempts.id });
    if (claimed.length === 0) throw new Conflict("This attempt has already been submitted");

    const served = new Set(attempt.questionIds);
    const answers = params.answers.filter((a) => served.has(a.questionId));
    const questions = await getAttemptQuestions(tx, attempt.questionIds);
    const graded = gradeAnswers(questions, answers);
    const score = scoreFor(graded.correctCount, graded.totalQuestions);

    const [submission] = await tx
      .insert(quizSubmissions)
      .values({
        attemptId: attempt.id,
        quizId: quiz.id,
        userId: user.id,
        squadron: user.squadron,
        answers,
        correctCount: graded.correctCount,
        totalQuestions: graded.totalQuestions,
        score,
        passed: isPassing(score, quiz),
        timeSpentSeconds: params.timeSpentSeconds ?? null,
      })
      .returning();
    return { submission, results: graded.results };
  });
}
