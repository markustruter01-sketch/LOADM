import type { SubmissionStatus } from "@shared/constants";
import type { FlightRecord, PublicUser, UserQualification } from "@shared/schema";

/** One row of `activity[]` from GET /api/users/me (server/routes/users.ts buildProfile). */
export type ActivityItem = {
  type: "quiz" | "scenario" | "module" | "document";
  id: number;
  date: string;
  title: string;
  score: number | null;
  passed: boolean | null;
  status?: SubmissionStatus;
  feedback?: string | null;
  quizId?: number;
  scenarioId?: number;
  moduleId?: number;
  documentId?: number;
};

export type QualificationStatus = "current" | "expiring" | "expired";

export type QualificationWithStatus = UserQualification & { status: QualificationStatus; daysRemaining: number | null };

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

/** GET /api/users/me. */
export type Profile = {
  user: PublicUser;
  stats: ProfileStats;
  activity: ActivityItem[];
  qualifications: QualificationWithStatus[];
};

/** GET /api/personnel/flight-records/summary. */
export type FlightSummary = {
  sorties: number;
  dayHours: number;
  nightHours: number;
  totalHours: number;
  cargoKg: number;
  passengers: number;
  byAircraft: Array<{ aircraft: string; sorties: number; hours: number }>;
  last12Months: Array<{ month: string; hours: number; sorties: number }>;
};

export type FlightRecordRow = FlightRecord;
