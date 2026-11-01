import { Router } from "express";
import { z } from "zod";
import { FLYING_SQUADRONS } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { validate } from "../middleware/validate";
import { requireInstruct, currentUser } from "../middleware/persona";
import { logActivity } from "../services/activity-service";
import {
  getOverview, getSquadronReadiness, getReadinessHistory, captureReadinessSnapshot, getSquadronPerformance,
  getScoreDistribution, getPerformanceTrend, getQuestionDifficulty, getAtRiskStudents, getCertificationReadiness,
  getModuleCompletion, getFlightHours, getCurrencyStatus, getQualificationForecast, getSafetySummary,
  getStudentSummary, getInstructorWorkload, getRecommendations,
} from "../services/analytics-service";

/**
 * Read-only analytics for instructors and command. The router validates the
 * query string and hands a filter to the analytics service, which computes
 * every figure from the tables; nothing here is estimated.
 */
export const analyticsRouter = Router();

analyticsRouter.use(requireInstruct);

// ---- Query schemas -------------------------------------------------------

const squadronQuery = z.object({ squadron: z.enum(FLYING_SQUADRONS).optional() });

const daysQuery = z.object({ days: z.coerce.number().int().min(1).max(365).default(90) });

const monthsQuery = squadronQuery.extend({ months: z.coerce.number().int().min(1).max(365).default(6) });

const historyQuery = daysQuery.extend({ squadron: z.enum([...FLYING_SQUADRONS, "ALL"] as const).default("ALL") });

const rangeQuery = squadronQuery.extend({ from: z.coerce.date().optional(), to: z.coerce.date().optional() });

// ---- Overview and readiness ----------------------------------------------

analyticsRouter.get(
  "/overview",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getOverview({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/squadron-readiness",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getSquadronReadiness({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/readiness-history",
  validate(historyQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof historyQuery>;
    res.json(await getReadinessHistory(q.squadron, q.days));
  }),
);

analyticsRouter.post(
  "/capture-snapshot",
  asyncHandler(async (req, res) => {
    const result = await captureReadinessSnapshot();
    await logActivity({ actor: currentUser(req), action: "CREATE", resourceType: "Readiness snapshot", resourceName: "Daily readiness snapshot", details: `${result.created} rows` });
    res.json(result);
  }),
);

// ---- Performance ---------------------------------------------------------

analyticsRouter.get(
  "/squadron-performance",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getSquadronPerformance({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/score-distribution",
  validate(rangeQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof rangeQuery>;
    res.json(await getScoreDistribution({ squadron: q.squadron, from: q.from, to: q.to }));
  }),
);

analyticsRouter.get(
  "/performance-trend",
  validate(monthsQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof monthsQuery>;
    res.json(await getPerformanceTrend({ squadron: q.squadron }, q.months));
  }),
);

analyticsRouter.get(
  "/question-difficulty",
  validate(rangeQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof rangeQuery>;
    res.json(await getQuestionDifficulty({ squadron: q.squadron, from: q.from, to: q.to }));
  }),
);

// ---- People --------------------------------------------------------------

analyticsRouter.get(
  "/at-risk-students",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getAtRiskStudents({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/certification-readiness",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getCertificationReadiness({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/module-completion",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getModuleCompletion({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/flight-hours",
  validate(rangeQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof rangeQuery>;
    res.json(await getFlightHours({ squadron: q.squadron, from: q.from, to: q.to }));
  }),
);

analyticsRouter.get(
  "/currency-status",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getCurrencyStatus({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/qualification-forecast",
  validate(monthsQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as unknown as z.infer<typeof monthsQuery>;
    res.json(await getQualificationForecast({ squadron: q.squadron }, q.months));
  }),
);

analyticsRouter.get(
  "/safety-summary",
  validate(rangeQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof rangeQuery>;
    res.json(await getSafetySummary({ squadron: q.squadron, from: q.from, to: q.to }));
  }),
);

analyticsRouter.get(
  "/student/:userId",
  asyncHandler(async (req, res) => {
    res.json(await getStudentSummary(parseId(req.params.userId, "userId")));
  }),
);

analyticsRouter.get(
  "/instructor-workload",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getInstructorWorkload({ squadron: q.squadron }));
  }),
);

analyticsRouter.get(
  "/recommendations",
  validate(squadronQuery, "query"),
  asyncHandler(async (req, res) => {
    const q = req.query as z.infer<typeof squadronQuery>;
    res.json(await getRecommendations({ squadron: q.squadron }));
  }),
);
