import type { ActivityLog, PublicUser, ReadinessSnapshot, SafetyRecord, UserQualification } from "@shared/schema";
import type {
  AircraftType,
  FlyingSquadron,
  QuestionCategory,
  QuestionDifficulty,
  SafetyRecordType,
  SafetySeverity,
  SafetyStatus,
} from "@shared/constants";

/**
 * Response shapes for the command area. Mirrors server/services/analytics-service.ts
 * (dates arrive as ISO strings on the wire).
 */

export type SnapshotSquadron = FlyingSquadron | "ALL";

export type ReadinessFigures = {
  squadron: SnapshotSquadron;
  totalPersonnel: number;
  readyCount: number;
  notReadyCount: number;
  readyPercent: number;
  currentQuals: number;
  expiringQuals: number;
  expiredQuals: number;
  personnelAtRisk: number;
};

/** GET /api/analytics/overview */
export type Overview = {
  personnel: { total: number; students: number; loadmasters: number; instructors: number };
  submissions: { total: number; last30d: number };
  passRate: number;
  averageScore: number;
  gradedCount: number;
  pendingReviews: number;
  readiness: ReadinessFigures;
  safety: { open: number; last90d: number; incidents: number };
};

/** GET /api/analytics/readiness-history row (ReadinessSnapshot with ISO dates). */
export type ReadinessHistoryRow = Omit<ReadinessSnapshot, "snapshotDate" | "createdAt"> & { snapshotDate: string; createdAt: string };

/** POST /api/analytics/capture-snapshot */
export type CaptureSnapshotResponse = { created: number };

export type MonthPoint = { month: string; averageScore: number; submissions: number };

/** GET /api/analytics/squadron-performance row */
export type SquadronPerformance = {
  squadron: FlyingSquadron;
  personnel: number;
  submissions: number;
  passRate: number;
  averageScore: number;
  quizAvg: number;
  scenarioAvg: number;
  moduleAvg: number;
  trend: MonthPoint[];
};

/** GET /api/analytics/score-distribution */
export type ScoreDistribution = {
  buckets: Array<{ label: string; min: number; max: number; total: number; quiz: number; scenario: number; module: number }>;
  total: number;
};

/** GET /api/analytics/performance-trend row */
export type TrendPoint = { month: string; averageScore: number; passRate: number; submissions: number };

/** GET /api/analytics/question-difficulty */
export type QuestionDifficultyRow = {
  questionId: number;
  questionText: string;
  category: QuestionCategory;
  difficulty: QuestionDifficulty;
  attempts: number;
  correct: number;
  correctRate: number;
};
export type QuestionDifficultyResponse = {
  questions: QuestionDifficultyRow[];
  categories: Array<{ category: QuestionCategory; label: string; questions: number; attempts: number; correctRate: number }>;
};

export type AtRiskFlag = "low_average" | "inactive" | "consecutive_fails";

/** GET /api/analytics/at-risk-students row */
export type AtRiskStudent = {
  user: PublicUser;
  averageScore: number | null;
  gradedCount: number;
  consecutiveFails: number;
  lastActivityAt: string | null;
  weeksSinceLastActivity: number | null;
  flags: AtRiskFlag[];
  reasons: string[];
};

/** GET /api/analytics/certification-readiness row */
export type CertificationReady = {
  user: PublicUser;
  averageScore: number;
  submissions: number;
  passRate: number;
  qualifications: { current: number; expiring: number; expired: number };
};

/** GET /api/analytics/module-completion row */
export type ModuleCompletion = {
  module: { id: number; title: string; aircraft: AircraftType | null; difficulty: string; passingThreshold: number | null };
  attempts: number;
  passes: number;
  uniqueUsers: number;
  completionRate: number;
  averageScore: number;
};

/** GET /api/analytics/flight-hours */
export type FlightHours = {
  totalHours: number;
  dayHours: number;
  nightHours: number;
  sorties: number;
  cargoKg: number;
  passengers: number;
  byAircraft: Array<{ aircraft: AircraftType; hours: number; sorties: number }>;
  byMonth: Array<{ month: string; hours: number; sorties: number }>;
  topPersonnel: Array<{ user: PublicUser; hours: number; sorties: number }>;
};

export type QualItem = { id: number; name: string; expiryDate: string | null; daysRemaining: number | null };

/** GET /api/analytics/currency-status */
export type CurrencyStatus = {
  current: number;
  expiring: number;
  expired: number;
  byQualification: Array<{ name: string; current: number; expiring: number; expired: number }>;
  personnel: Array<{ user: PublicUser; current: number; expiring: QualItem[]; expired: QualItem[] }>;
};

/** GET /api/analytics/qualification-forecast row */
export type ForecastMonth = { month: string; expiring: number; personnel: number; names: string[] };

/** GET /api/analytics/safety-summary */
export type SafetySummary = {
  total: number;
  byType: Record<SafetyRecordType, number>;
  bySeverity: Record<SafetySeverity, number>;
  byStatus: Record<SafetyStatus, number>;
  byMonth: Array<{ month: string; total: number; incidents: number; open: number }>;
  open: number;
  openIncidents: number;
  complianceScore: number;
  window: { from: string; to: string };
};

/** GET /api/analytics/instructor-workload row */
export type InstructorWorkload = {
  user: PublicUser;
  reviewsLast30d: number;
  reviewsTotal: number;
  pendingInSquadron: number;
  contentAuthored: { quizzes: number; scenarios: number; modules: number; checklists: number; questions: number; documents: number; total: number };
};

/** GET /api/analytics/recommendations row */
export type Recommendation = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  metric: string;
  value: number;
  threshold: number;
  link: string;
  squadron: FlyingSquadron | null;
};

export type QualificationStatus = "current" | "expiring" | "expired";
export type QualificationWithStatus = UserQualification & { status: QualificationStatus; daysRemaining: number | null };

export type RosterFlag = "not_flight_ready" | "expired_qualification" | "expiring_qualification" | "low_average_score" | "inactive";

/** GET /api/personnel/roster row */
export type RosterEntry = {
  user: PublicUser;
  isReady: boolean;
  expiredQuals: QualificationWithStatus[];
  expiringQuals: QualificationWithStatus[];
  lastActiveAt: string | null;
  recentAverageScore: number | null;
  atRisk: RosterFlag[];
};

/** GET /api/personnel/qualifications/expiring row */
export type ExpiringQualification = {
  qualification: UserQualification;
  user: PublicUser;
  daysRemaining: number | null;
  status: QualificationStatus;
};

/** GET /api/personnel/safety-records row */
export type SafetyRecordWithPeople = SafetyRecord & { user: PublicUser; reportedBy: PublicUser | null };

/** GET /api/activity row */
export type ActivityRow = ActivityLog & { actor: PublicUser | null };
