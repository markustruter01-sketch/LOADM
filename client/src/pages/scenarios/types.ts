import type { PublicUser, Scenario, ScenarioQuestion, ScenarioSubmission } from "@shared/schema";

/** A scenario question as served to a student: `correctAnswer` only present for instructors or once reviewed. */
export type StudentScenarioQuestion = Omit<ScenarioQuestion, "correctAnswer"> & { correctAnswer?: string };

export type ScenarioForStudent = Omit<Scenario, "questions"> & { questions: StudentScenarioQuestion[] };

/** GET /api/scenarios row. */
export type ScenarioListItem = ScenarioForStudent & {
  submissionCount: number;
  mySubmission: { id: number; status: ScenarioSubmission["status"]; score: number | null; passed: boolean | null } | null;
};

/** GET /api/scenarios/submissions row. */
export type ScenarioSubmissionRow = ScenarioSubmission & { user: PublicUser; scenarioTitle: string };

/** GET /api/scenarios/submissions/:id. */
export type ScenarioSubmissionDetail = ScenarioSubmission & {
  scenario: ScenarioForStudent;
  user: PublicUser;
  reviewer: PublicUser | null;
};

/** GET /api/scenarios/notifications row: a reviewed submission the user has not yet seen. */
export type ScenarioNotification = ScenarioSubmission & { scenarioTitle: string; passMark: number };

/** POST /api/scenarios/:id/submissions response is the inserted row. */
export type ScenarioSubmitResponse = ScenarioSubmission;
