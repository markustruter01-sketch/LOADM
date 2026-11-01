/**
 * Single source of truth for every enumerated value and business threshold
 * used by both the server and the client. Nothing in this file may be
 * duplicated elsewhere; import it.
 */

// ---------------------------------------------------------------------------
// Roles (demo personas)
// ---------------------------------------------------------------------------

export const ROLES = ["student", "loadmaster", "instructor", "command"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  student: "Student",
  loadmaster: "Qualified Loadmaster",
  instructor: "Instructor",
  command: "Command",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  student:
    "Trainee loadmaster. Works through training modules, sits quizzes and scenarios, and tracks personal progress.",
  loadmaster:
    "Qualified aircrew. Everything a student sees plus flight records, qualifications, mission planning and load-planning tools.",
  instructor:
    "Training staff. Authors quizzes, scenarios, checklists and modules; reviews submissions; monitors squadron performance.",
  command:
    "Squadron and wing leadership. Workforce readiness, safety, qualification forecasting and cross-squadron analytics.",
};

/** Capability matrix. Server authorisation and client gating both read this. */
export const ROLE_CAPABILITIES = {
  student: ["train", "assess"],
  loadmaster: ["train", "assess", "operate"],
  instructor: ["train", "assess", "operate", "instruct"],
  command: ["train", "assess", "operate", "instruct", "command"],
} as const satisfies Record<Role, readonly Capability[]>;

export type Capability = "train" | "assess" | "operate" | "instruct" | "command";

export function roleHas(role: Role, capability: Capability): boolean {
  return (ROLE_CAPABILITIES[role] as readonly Capability[]).includes(capability);
}

// ---------------------------------------------------------------------------
// Squadrons
// ---------------------------------------------------------------------------

/** Flying units. Analytics are computed per flying squadron. */
export const FLYING_SQUADRONS = ["33SQN", "35SQN", "36SQN", "37SQN"] as const;
/** AMG = Air Mobility Group HQ container for command and instructor staff. */
export const SQUADRONS = [...FLYING_SQUADRONS, "AMG"] as const;
export type Squadron = (typeof SQUADRONS)[number];
export type FlyingSquadron = (typeof FLYING_SQUADRONS)[number];

export const SQUADRON_LABELS: Record<Squadron, string> = {
  "33SQN": "No. 33 Squadron",
  "35SQN": "No. 35 Squadron",
  "36SQN": "No. 36 Squadron",
  "37SQN": "No. 37 Squadron",
  AMG: "Air Mobility Group",
};

export const SQUADRON_AIRCRAFT: Record<Squadron, AircraftType | null> = {
  "33SQN": "KC30A",
  "35SQN": "C27J",
  "36SQN": "C17",
  "37SQN": "C130J",
  AMG: null,
};

export function isFlyingSquadron(s: string): s is FlyingSquadron {
  return (FLYING_SQUADRONS as readonly string[]).includes(s);
}

// ---------------------------------------------------------------------------
// Aircraft, categories, misc enums
// ---------------------------------------------------------------------------

export const AIRCRAFT_TYPES = ["C130J", "C17", "C27J", "KC30A"] as const;
export type AircraftType = (typeof AIRCRAFT_TYPES)[number];
export const AIRCRAFT_LABELS: Record<AircraftType, string> = {
  C130J: "C-130J Hercules",
  C17: "C-17A Globemaster III",
  C27J: "C-27J Spartan",
  KC30A: "KC-30A MRTT",
};

/** Seniority category, D (junior) to A (senior). */
export const CATEGORIES = ["D", "C", "B", "A"] as const;
export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ["beginner", "intermediate", "advanced", "expert"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const QUESTION_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const QUESTION_CATEGORIES = [
  "dangerous-goods",
  "loadmaster-fundamentals",
  "emergency-procedures",
  "weight-balance",
  "cargo-securing",
  "aircraft-systems",
  "regulations",
  "equipment-handling",
] as const;
export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];
export const QUESTION_CATEGORY_LABELS: Record<QuestionCategory, string> = {
  "dangerous-goods": "Dangerous Goods",
  "loadmaster-fundamentals": "Loadmaster Fundamentals",
  "emergency-procedures": "Emergency Procedures",
  "weight-balance": "Weight & Balance",
  "cargo-securing": "Cargo Securing",
  "aircraft-systems": "Aircraft Systems",
  regulations: "Regulations",
  "equipment-handling": "Equipment Handling",
};

export const SUBMISSION_STATUSES = ["submitted", "reviewed"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_TYPES = ["training", "assessment"] as const;
export type SubmissionType = (typeof SUBMISSION_TYPES)[number];

export const SAFETY_RECORD_TYPES = ["incident", "observation", "commendation", "training_failure"] as const;
export type SafetyRecordType = (typeof SAFETY_RECORD_TYPES)[number];
export const SAFETY_SEVERITIES = ["minor", "moderate", "major"] as const;
export type SafetySeverity = (typeof SAFETY_SEVERITIES)[number];
export const SAFETY_STATUSES = ["open", "reviewed", "closed"] as const;
export type SafetyStatus = (typeof SAFETY_STATUSES)[number];
export const FLIGHT_PHASES = [
  "ground", "taxi", "takeoff", "climb", "cruise", "descent", "approach", "landing", "parking",
] as const;
export const SAFETY_LEVELS = [
  "Level 1 - Catastrophic", "Level 2 - Critical", "Level 3 - Marginal", "Level 4 - Negligible",
] as const;

export const CHECKLIST_CATEGORIES = ["startup", "shutdown", "pre-flight", "post-flight", "emergency"] as const;
export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];
export const CHECKLIST_AIRCRAFT = [...AIRCRAFT_TYPES, "General"] as const;

export const MODULE_CONTENT_TYPES = ["reading", "quiz", "assessment"] as const;
export type ModuleContentType = (typeof MODULE_CONTENT_TYPES)[number];

export const CHAT_MESSAGE_TYPES = ["question", "answer"] as const;

export const STANDARD_QUALIFICATION_TYPES = [
  "Basic Loadmaster Certification",
  "KC30A Type Rating",
  "C17A Type Rating",
  "C130J Type Rating",
  "C27J Type Rating",
  "Night Operations Currency",
  "Dangerous Goods (DG) Handling",
  "Air-to-Air Refueling (AAR)",
  "Aeromedical Evacuation",
  "Combat Readiness",
  "Annual Proficiency Check",
  "Other",
] as const;

export const NOT_READY_REASONS = [
  "Medical",
  "Leave/Personal",
  "Currency Lapsed",
  "Training Required",
  "Administrative",
  "Other",
] as const;

// ---------------------------------------------------------------------------
// Business thresholds
// ---------------------------------------------------------------------------

export const THRESHOLDS = {
  /** Default pass mark (%) when a quiz or scenario does not set its own. */
  DEFAULT_PASS_MARK: 70,
  /** Days before expiry at which a qualification is "expiring soon". */
  QUALIFICATION_EXPIRY_WARNING_DAYS: 90,
  /** Squadron readiness % considered healthy. */
  READINESS_TARGET_PERCENT: 85,
  /** Squadron readiness % below which it is critical. */
  READINESS_CRITICAL_PERCENT: 70,
  /** Safety compliance score considered healthy. */
  SAFETY_SCORE_MIN: 80,
  /** Average score at/below which a student is "at risk". */
  AT_RISK_AVERAGE_SCORE: 70,
  /** Score considered certification-ready. */
  CERTIFICATION_READY_SCORE: 85,
  /** Weeks without activity before a student is flagged inactive. */
  INACTIVE_AFTER_WEEKS: 4,
  /** Chat messages older than this are purged. */
  CHAT_RETENTION_DAYS: 7,
} as const;

/** Resolve the pass mark for an assessable item. */
export function passMarkFor(item: { passingThreshold?: number | null }): number {
  return item.passingThreshold ?? THRESHOLDS.DEFAULT_PASS_MARK;
}

export function isPassing(score: number, item: { passingThreshold?: number | null }): boolean {
  return score >= passMarkFor(item);
}
