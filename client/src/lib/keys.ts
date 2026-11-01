import { qs } from "./api";

/**
 * Query keys.
 *
 * Every key in an area starts with that area's prefix and ends with the URL
 * the default queryFn fetches, e.g. `["/api/quizzes", "/api/quizzes/5"]`.
 * TanStack matches keys element by element, so invalidating `keys.quizzes.all`
 * (`["/api/quizzes"]`) refreshes every quiz query: lists, details and
 * submissions. Single-element keys are both area and URL.
 */
type Key = readonly [string] | readonly [string, string];

function k(area: string, url: string): Key {
  return url === area ? ([url] as const) : ([area, url] as const);
}

/** The URL a key fetches: always its last element. */
export function urlOf(key: readonly unknown[]): string {
  const url = key[key.length - 1];
  if (typeof url !== "string") throw new Error("query key must end with a URL string");
  return url;
}
export const keys = {
  demo: {
    me: ["/api/demo/me"] as const,
    roles: ["/api/demo/roles"] as const,
  },
  users: {
    all: ["/api/users"] as const,
    list: (p: { squadron?: string; role?: string; includeInactive?: boolean } = {}) => k("/api/users", `/api/users${qs(p)}`),
    me: k("/api/users", "/api/users/me"),
    profile: (id: number) => k("/api/users", `/api/users/${id}/profile`),
  },
  quizzes: {
    all: ["/api/quizzes"] as const,
    list: (p: { includeInactive?: boolean } = {}) => k("/api/quizzes", `/api/quizzes${qs(p)}`),
    one: (id: number) => k("/api/quizzes", `/api/quizzes/${id}`),
    submissions: (id: number) => k("/api/quizzes", `/api/quizzes/${id}/submissions`),
    mine: k("/api/quizzes", "/api/quizzes/submissions/mine"),
    submission: (id: number) => k("/api/quizzes", `/api/quizzes/submissions/${id}`),
  },
  questionBank: {
    all: ["/api/question-bank"] as const,
    list: (p: { category?: string; difficulty?: string; includeInactive?: boolean } = {}) => k("/api/question-bank", `/api/question-bank${qs(p)}`),
    categories: k("/api/question-bank", "/api/question-bank/categories"),
  },
  scenarios: {
    all: ["/api/scenarios"] as const,
    list: k("/api/scenarios", "/api/scenarios"),
    one: (id: number) => k("/api/scenarios", `/api/scenarios/${id}`),
    submissions: (p: { status?: string; squadron?: string; scenarioId?: number } = {}) => k("/api/scenarios", `/api/scenarios/submissions${qs(p)}`),
    submission: (id: number) => k("/api/scenarios", `/api/scenarios/submissions/${id}`),
    notifications: k("/api/scenarios", "/api/scenarios/notifications"),
  },
  training: {
    all: ["/api/training"] as const,
    modules: (p: { includeInactive?: boolean } = {}) => k("/api/training", `/api/training/modules${qs(p)}`),
    module: (id: number) => k("/api/training", `/api/training/modules/${id}`),
    mine: k("/api/training", "/api/training/completions/mine"),
  },
  checklists: {
    all: ["/api/checklists"] as const,
    list: k("/api/checklists", "/api/checklists"),
    /** Instructor view: includes inactive checklists. */
    manage: k("/api/checklists", "/api/checklists?includeInactive=true"),
    one: (id: number) => k("/api/checklists", `/api/checklists/${id}`),
    completions: (id: number) => k("/api/checklists", `/api/checklists/${id}/completions`),
    mine: k("/api/checklists", "/api/checklists/completions/mine"),
  },
  documents: {
    all: ["/api/documents"] as const,
    list: k("/api/documents", "/api/documents"),
    one: (id: number) => k("/api/documents", `/api/documents/${id}`),
    submissions: (p: { documentId?: number } = {}) => k("/api/documents", `/api/documents/submissions${qs(p)}`),
    submission: (id: number) => k("/api/documents", `/api/documents/submissions/${id}`),
  },
  missions: {
    all: ["/api/missions"] as const,
    list: (p: { all?: boolean } = {}) => k("/api/missions", `/api/missions${qs(p)}`),
    one: (id: number) => k("/api/missions", `/api/missions/${id}`),
  },
  personnel: {
    all: ["/api/personnel"] as const,
    qualifications: (p: { userId?: number } = {}) => k("/api/personnel", `/api/personnel/qualifications${qs(p)}`),
    expiring: (p: { squadron?: string; days?: number } = {}) => k("/api/personnel", `/api/personnel/qualifications/expiring${qs(p)}`),
    flightRecords: (p: { userId?: number; limit?: number } = {}) => k("/api/personnel", `/api/personnel/flight-records${qs(p)}`),
    flightSummary: (p: { userId?: number } = {}) => k("/api/personnel", `/api/personnel/flight-records/summary${qs(p)}`),
    safety: (p: { squadron?: string; status?: string; recordType?: string } = {}) => k("/api/personnel", `/api/personnel/safety-records${qs(p)}`),
    safetyOne: (id: number) => k("/api/personnel", `/api/personnel/safety-records/${id}`),
    roster: (p: { squadron?: string } = {}) => k("/api/personnel", `/api/personnel/roster${qs(p)}`),
  },
  analytics: {
    all: ["/api/analytics"] as const,
    overview: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/overview${qs(p)}`),
    squadronReadiness: k("/api/analytics", "/api/analytics/squadron-readiness"),
    readinessHistory: (p: { squadron?: string; days?: number } = {}) => k("/api/analytics", `/api/analytics/readiness-history${qs(p)}`),
    squadronPerformance: k("/api/analytics", "/api/analytics/squadron-performance"),
    scoreDistribution: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/score-distribution${qs(p)}`),
    performanceTrend: (p: { squadron?: string; months?: number } = {}) => k("/api/analytics", `/api/analytics/performance-trend${qs(p)}`),
    questionDifficulty: k("/api/analytics", "/api/analytics/question-difficulty"),
    atRisk: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/at-risk-students${qs(p)}`),
    certificationReadiness: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/certification-readiness${qs(p)}`),
    moduleCompletion: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/module-completion${qs(p)}`),
    flightHours: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/flight-hours${qs(p)}`),
    currency: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/currency-status${qs(p)}`),
    forecast: (p: { squadron?: string; months?: number } = {}) => k("/api/analytics", `/api/analytics/qualification-forecast${qs(p)}`),
    safety: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/safety-summary${qs(p)}`),
    student: (id: number) => k("/api/analytics", `/api/analytics/student/${id}`),
    instructorWorkload: k("/api/analytics", "/api/analytics/instructor-workload"),
    recommendations: (p: { squadron?: string } = {}) => k("/api/analytics", `/api/analytics/recommendations${qs(p)}`),
  },
  directory: { all: ["/api/directory"] as const },
  chat: { all: ["/api/chat/messages"] as const },
  activity: { all: ["/api/activity"] as const },
};
