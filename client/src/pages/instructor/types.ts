import type {
  Checklist,
  ChecklistItem,
  PublicUser,
  Quiz,
  QuizQuestion,
  QuizSubmission,
  SafetyRecord,
  Scenario,
  ScenarioSubmission,
  TrainingModule,
  TrainingModuleContent,
  TrainingModuleVideo,
  UserQualification,
} from "@shared/schema";
import type { FlyingSquadron, QuestionCategory } from "@shared/constants";

/**
 * Response shapes for the INSTRUCT area. These mirror what the server attaches
 * on top of the plain rows (see CONTRACT.md); domain types come from
 * @shared/schema and are never redefined here.
 */

// ---- Reviews -------------------------------------------------------------

/** GET /api/scenarios/submissions (list rows). */
export type ScenarioSubmissionRow = ScenarioSubmission & {
  user: PublicUser | null;
  scenarioTitle: string | null;
};

/** GET /api/scenarios/submissions/:id (instructors always get the answer key). */
export type ScenarioSubmissionDetail = ScenarioSubmission & {
  user: PublicUser | null;
  reviewer: PublicUser | null;
  scenario: Scenario;
};

/** PATCH /api/scenarios/submissions/:id/review body. */
export type ReviewBody = {
  markedAnswers: Record<string, boolean>;
  questionFeedback?: Record<string, string>;
  instructorFeedback?: string;
};

// ---- Students --------------------------------------------------------------

export type QualificationStatus = "current" | "expiring" | "expired";
export type QualificationWithStatus = UserQualification & { status: QualificationStatus; daysRemaining: number | null };

export type AtRiskFlag = "not_flight_ready" | "expired_qualification" | "expiring_qualification" | "low_average_score" | "inactive";

export const AT_RISK_LABELS: Record<AtRiskFlag, string> = {
  not_flight_ready: "Not flight ready",
  expired_qualification: "Expired qualification",
  expiring_qualification: "Expiring qualification",
  low_average_score: "Low average score",
  inactive: "Inactive",
};

/** GET /api/personnel/roster rows. */
export type RosterEntry = {
  user: PublicUser;
  isReady: boolean;
  expiredQuals: QualificationWithStatus[];
  expiringQuals: QualificationWithStatus[];
  lastActiveAt: string | null;
  recentAverageScore: number | null;
  atRisk: AtRiskFlag[];
};

export type ProfileActivityType = "quiz" | "scenario" | "module" | "document";

/** One row of the activity feed in GET /api/users/:id/profile. */
export type ProfileActivity = {
  type: ProfileActivityType;
  id: number;
  date: string;
  title: string;
  score: number | null;
  passed: boolean | null;
  status?: "submitted" | "reviewed";
  feedback?: string | null;
};

export type ProfileStats = {
  totalSubmissions: number;
  graded: number;
  passed: number;
  failed: number;
  pendingGrading: number;
  passRate: number;
  averageScore: number | null;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  weeksSinceLastActivity: number | null;
  flight: { sorties: number; dayHours: number; nightHours: number; cargoKg: number; passengers: number } | undefined;
  qualifications: { current: number; expiring: number; expired: number };
};

/** GET /api/users/:id/profile (same shape as /api/users/me). */
export type StudentProfile = {
  user: PublicUser;
  stats: ProfileStats;
  activity: ProfileActivity[];
  qualifications: QualificationWithStatus[];
};

export type TrendPoint = { month: string; averageScore: number; passRate: number; submissions: number };

export type StudentComparison = {
  squadron: FlyingSquadron;
  averageScore: { student: number | null; squadron: number; delta: number | null };
  passRate: { student: number; squadron: number; delta: number };
  submissions: { student: number; squadronPerMember: number };
  rank: { position: number | null; of: number };
};

/** GET /api/analytics/student/:id — typed loosely; render whatever is present. */
export type StudentAnalytics = Partial<{
  user: PublicUser;
  stats: Partial<ProfileStats & { quizAvg: number | null; scenarioAvg: number | null; moduleAvg: number | null; lastActivityAt: string | null }>;
  recent: Array<{ type: "quiz" | "scenario" | "module"; id: number; itemId: number; title: string; score: number; passed: boolean; submittedAt: string }>;
  trend: TrendPoint[];
  comparison: StudentComparison | null;
}>;

export type ReadinessBody = { isFlightReady: boolean; notReadyReason?: string | null };

// ---- Dashboard -----------------------------------------------------------

export type RecommendationSeverity = "info" | "warning" | "critical";

/** GET /api/analytics/recommendations rows. */
export type Recommendation = {
  id: string;
  severity: RecommendationSeverity;
  title: string;
  detail: string;
  metric?: string;
  value?: number;
  threshold?: number;
  link: string;
  squadron?: FlyingSquadron | null;
};

// ---- Question bank ---------------------------------------------------------

export type QuestionBankResponse = { questions: QuizQuestion[]; counts: Record<string, number> };
export type CategoryCount = { category: QuestionCategory; label: string; activeCount: number };

// ---- Quizzes ---------------------------------------------------------------

export type QuizListItem = Quiz & { attemptCount: number; myBest: number | null };
export type QuizSubmissionRow = QuizSubmission & { user: PublicUser | null };

// ---- Scenarios -------------------------------------------------------------

export type ScenarioListItem = Scenario & {
  submissionCount: number;
  mySubmission: { id: number; status: string; score: number | null; passed: boolean | null; submittedAt: string } | null;
};

// ---- Training modules ------------------------------------------------------

export type ModuleListItem = TrainingModule & {
  contentCount: number;
  myCompletion: { score: number; passed: boolean; submittedAt: string } | null;
  completionRate: number;
};

export type ModuleDetail = TrainingModule & { content: TrainingModuleContent[]; videos: TrainingModuleVideo[] };

// ---- Checklists ------------------------------------------------------------

export type ChecklistListItem = Checklist & {
  items: ChecklistItem[];
  myProgress: { completedItemIds: number[]; isComplete: boolean; updatedAt: string } | null;
};

// ---- Safety ----------------------------------------------------------------

export type SafetyRecordRow = SafetyRecord & { user: PublicUser; reportedBy: PublicUser | null };
