import type { Quiz, QuizAttempt, QuizSubmission, StudentQuizQuestion } from "@shared/schema";

/** GET /api/quizzes row. */
export type QuizListItem = Quiz & { attemptCount: number; myBest: number | null };

/** GET /api/quizzes/submissions/mine row. */
export type MyQuizSubmission = QuizSubmission & { quizTitle: string };

/** POST /api/quizzes/:id/attempts. */
export type AttemptStart = { attempt: QuizAttempt; questions: StudentQuizQuestion[]; quiz: Quiz };

/** One graded line, returned by submit and by GET /api/quizzes/submissions/:id. */
export type QuizResultItem = {
  questionId: number;
  questionText: string;
  options: string[];
  answeredIndex: number;
  correctIndex: number;
  explanation: string | null;
  correct: boolean;
};

/** POST /api/quizzes/:id/submit. */
export type QuizSubmitResponse = { submission: QuizSubmission; results: QuizResultItem[] };

/** GET /api/quizzes/submissions/:id. */
export type QuizSubmissionDetail = { submission: QuizSubmission; results: QuizResultItem[]; quiz: Quiz };
