import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async";
import { parseSquadron } from "../lib/client-format";
import { validate } from "../middleware/validate";
import { requireInstruct } from "../middleware/persona";
import { captureSnapshot } from "../services/readiness-service";
import {
  ICC_METRICS, getSquadronReadiness, getReadinessHistory, getCurrencyStatus, getQualificationForecast,
  getExpiringQualifications, getFlightHours, getSafetySummary, getAtRiskStudents, getCertificationReadiness,
  getStudentVsSquadron, getModuleCompletion, getQuestionDifficulty, getTopicMastery, getIccPowerLaw,
} from "../services/analytics-service";

/**
 * Analytics for instructors and command, in the shapes the workforce,
 * leadership, advanced-analytics and superadmin screens read. A squadron
 * parameter may be "33" or "33SQN"; empty or "ALL" means every flying squadron.
 */
export const analyticsRouter = Router();

analyticsRouter.use(requireInstruct);

const squadron = z.unknown().transform(parseSquadron);
const optionalDate = z.preprocess((v) => (v === "" ? undefined : v), z.coerce.date().optional());

const squadronQuery = z.object({ squadron });
const rangeQuery = squadronQuery.extend({ startDate: optionalDate, endDate: optionalDate });
const monthsQuery = squadronQuery.extend({ months: z.coerce.number().int().min(1).max(24).default(6) });
const historyQuery = squadronQuery.extend({ limit: z.coerce.number().int().min(1).max(3650).default(30) });
const iccQuery = z.object({ metric: z.enum(ICC_METRICS).catch("assessmentsPassed") });

/** GET route whose query string is validated by `schema` and handed to `handler`. */
function getWithQuery<S extends z.ZodTypeAny>(path: string, schema: S, handler: (q: z.output<S>) => Promise<unknown>): void {
  analyticsRouter.get(
    path,
    validate(schema, "query"),
    asyncHandler(async (req, res) => {
      res.json(await handler(req.query as unknown as z.output<S>));
    }),
  );
}

function get(path: string, handler: () => Promise<unknown>): void {
  analyticsRouter.get(path, asyncHandler(async (_req, res) => { res.json(await handler()); }));
}

getWithQuery("/squadron-readiness", squadronQuery, (q) => getSquadronReadiness(q.squadron));
getWithQuery("/currency-status", squadronQuery, (q) => getCurrencyStatus(q.squadron));
getWithQuery("/safety-summary", rangeQuery, (q) => getSafetySummary({ squadron: q.squadron, from: q.startDate, to: q.endDate }));
getWithQuery("/flight-hours", rangeQuery, (q) => getFlightHours({ squadron: q.squadron, from: q.startDate, to: q.endDate }));
getWithQuery("/readiness-history", historyQuery, (q) => getReadinessHistory(q.squadron ?? "ALL", q.limit));
getWithQuery("/qualification-forecast", monthsQuery, (q) => getQualificationForecast(q.squadron, q.months));
getWithQuery("/expiring-qualifications", monthsQuery, (q) => getExpiringQualifications(q.squadron, q.months));
getWithQuery("/at-risk-students", squadronQuery, (q) => getAtRiskStudents(q.squadron));
getWithQuery("/icc-power-law", iccQuery, (q) => getIccPowerLaw(q.metric));
get("/certification-readiness", getCertificationReadiness);
get("/student-vs-squadron", getStudentVsSquadron);
get("/module-completion", getModuleCompletion);
get("/question-difficulty", getQuestionDifficulty);
get("/topic-mastery", getTopicMastery);

analyticsRouter.post(
  "/capture-snapshot",
  asyncHandler(async (_req, res) => {
    res.json(await captureSnapshot());
  }),
);
