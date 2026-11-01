import { qs } from "./api";

/**
 * Query keys. `queryKey[0]` is always the URL the default queryFn fetches.
 * Invalidate with the prefix helpers (e.g. `keys.quizzes.all`) after mutations.
 */
export const keys = {
  demo: {
    me: ["/api/demo/me"] as const,
    roles: ["/api/demo/roles"] as const,
    status: ["/api/demo/status"] as const,
  },
  users: {
    all: ["/api/users"] as const,
    list: (p: { squadron?: string; role?: string; includeInactive?: boolean } = {}) => [`/api/users${qs(p)}`] as const,
    me: ["/api/users/me"] as const,
    profile: (id: number) => [`/api/users/${id}/profile`] as const,
  },
  quizzes: {
    all: ["/api/quizzes"] as const,
    list: (p: { includeInactive?: boolean } = {}) => [`/api/quizzes${qs(p)}`] as const,
    one: (id: number) => [`/api/quizzes/${id}`] as const,
    submissions: (id: number) => [`/api/quizzes/${id}/submissions`] as const,
    mine: ["/api/quizzes/submissions/mine"] as const,
    submission: (id: number) => [`/api/quizzes/submissions/${id}`] as const,
  },
  questionBank: {
    all: ["/api/question-bank"] as const,
    list: (p: { category?: string; difficulty?: string; includeInactive?: boolean } = {}) => [`/api/question-bank${qs(p)}`] as const,
    categories: ["/api/question-bank/categories"] as const,
  },
  scenarios: {
    all: ["/api/scenarios"] as const,
    list: ["/api/scenarios"] as const,
    one: (id: number) => [`/api/scenarios/${id}`] as const,
    submissions: (p: { status?: string; squadron?: string; scenarioId?: number } = {}) => [`/api/scenarios/submissions${qs(p)}`] as const,
    submission: (id: number) => [`/api/scenarios/submissions/${id}`] as const,
    notifications: ["/api/scenarios/notifications"] as const,
  },
  training: {
    all: ["/api/training"] as const,
    modules: (p: { includeInactive?: boolean } = {}) => [`/api/training/modules${qs(p)}`] as const,
    module: (id: number) => [`/api/training/modules/${id}`] as const,
    mine: ["/api/training/completions/mine"] as const,
  },
  checklists: {
    all: ["/api/checklists"] as const,
    list: ["/api/checklists"] as const,
    /** Instructor view: includes inactive checklists. */
    manage: ["/api/checklists?includeInactive=true"] as const,
    one: (id: number) => [`/api/checklists/${id}`] as const,
    completions: (id: number) => [`/api/checklists/${id}/completions`] as const,
    mine: ["/api/checklists/completions/mine"] as const,
  },
  documents: {
    all: ["/api/documents"] as const,
    list: ["/api/documents"] as const,
    one: (id: number) => [`/api/documents/${id}`] as const,
    submissions: (p: { documentId?: number } = {}) => [`/api/documents/submissions${qs(p)}`] as const,
    submission: (id: number) => [`/api/documents/submissions/${id}`] as const,
  },
  missions: {
    all: ["/api/missions"] as const,
    list: (p: { all?: boolean } = {}) => [`/api/missions${qs(p)}`] as const,
    one: (id: number) => [`/api/missions/${id}`] as const,
  },
  personnel: {
    all: ["/api/personnel"] as const,
    qualifications: (p: { userId?: number } = {}) => [`/api/personnel/qualifications${qs(p)}`] as const,
    expiring: (p: { squadron?: string; days?: number } = {}) => [`/api/personnel/qualifications/expiring${qs(p)}`] as const,
    flightRecords: (p: { userId?: number; limit?: number } = {}) => [`/api/personnel/flight-records${qs(p)}`] as const,
    flightSummary: (p: { userId?: number } = {}) => [`/api/personnel/flight-records/summary${qs(p)}`] as const,
    safety: (p: { squadron?: string; status?: string; recordType?: string } = {}) => [`/api/personnel/safety-records${qs(p)}`] as const,
    safetyOne: (id: number) => [`/api/personnel/safety-records/${id}`] as const,
    roster: (p: { squadron?: string } = {}) => [`/api/personnel/roster${qs(p)}`] as const,
  },
  analytics: {
    all: ["/api/analytics"] as const,
    overview: (p: { squadron?: string } = {}) => [`/api/analytics/overview${qs(p)}`] as const,
    squadronReadiness: ["/api/analytics/squadron-readiness"] as const,
    readinessHistory: (p: { squadron?: string; days?: number } = {}) => [`/api/analytics/readiness-history${qs(p)}`] as const,
    squadronPerformance: ["/api/analytics/squadron-performance"] as const,
    scoreDistribution: (p: { squadron?: string } = {}) => [`/api/analytics/score-distribution${qs(p)}`] as const,
    performanceTrend: (p: { squadron?: string; months?: number } = {}) => [`/api/analytics/performance-trend${qs(p)}`] as const,
    questionDifficulty: ["/api/analytics/question-difficulty"] as const,
    atRisk: (p: { squadron?: string } = {}) => [`/api/analytics/at-risk-students${qs(p)}`] as const,
    certificationReadiness: (p: { squadron?: string } = {}) => [`/api/analytics/certification-readiness${qs(p)}`] as const,
    moduleCompletion: (p: { squadron?: string } = {}) => [`/api/analytics/module-completion${qs(p)}`] as const,
    flightHours: (p: { squadron?: string } = {}) => [`/api/analytics/flight-hours${qs(p)}`] as const,
    currency: (p: { squadron?: string } = {}) => [`/api/analytics/currency-status${qs(p)}`] as const,
    forecast: (p: { squadron?: string; months?: number } = {}) => [`/api/analytics/qualification-forecast${qs(p)}`] as const,
    safety: (p: { squadron?: string } = {}) => [`/api/analytics/safety-summary${qs(p)}`] as const,
    student: (id: number) => [`/api/analytics/student/${id}`] as const,
    instructorWorkload: ["/api/analytics/instructor-workload"] as const,
    recommendations: (p: { squadron?: string } = {}) => [`/api/analytics/recommendations${qs(p)}`] as const,
  },
  directory: { all: ["/api/directory"] as const },
  chat: { all: ["/api/chat/messages"] as const },
  activity: { all: ["/api/activity"] as const },
};
