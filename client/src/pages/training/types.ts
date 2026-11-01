import type {
  ModuleQuizQuestion,
  TrainingModule,
  TrainingModuleCompletion,
  TrainingModuleContent,
} from "@shared/schema";

/** GET /api/training/modules row. */
export type TrainingModuleListItem = TrainingModule & {
  contentCount: number;
  myCompletion: { score: number; passed: boolean; submittedAt: string } | null;
  completionRate: number;
};

/** Assessment question as served to a non-instructor: no answer key. */
export type StudentModuleQuestion = Omit<ModuleQuizQuestion, "correctIndex"> & { correctIndex?: number };

/** GET /api/training/modules/:id. */
export type TrainingModuleDetail = TrainingModule & {
  content: Array<Omit<TrainingModuleContent, "questions"> & { questions: StudentModuleQuestion[] | null }>;
};

export type ModuleContentItem = TrainingModuleDetail["content"][number];

/** One graded line from POST /api/training/modules/:id/assessment. */
export type AssessmentResult = {
  id: string;
  question: string;
  options: string[];
  answeredIndex: number;
  correctIndex: number;
  correct: boolean;
};

export type AssessmentResponse = { completion: TrainingModuleCompletion; results: AssessmentResult[] };
