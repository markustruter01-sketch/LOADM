import type { QuestionCategory, QuestionDifficulty } from "./constants";

/** A question-bank entry as the instructor question screens read it (GET /api/quiz-questions). */
export type { QuestionCategory };

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  /** Index into `options`. */
  correctAnswer: number;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
}
