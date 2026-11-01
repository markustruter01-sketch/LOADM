import { Router, type Request } from "express";
import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { users, userQualifications, flightRecords, scenarioSubmissions, scenarios, insertUserQualificationSchema, type User } from "@shared/schema";
import { SQUADRONS, CATEGORIES, NOT_READY_REASONS, FLYING_SQUADRONS } from "@shared/constants";
import { asyncHandler } from "../lib/async";
import { parseId } from "../lib/ids";
import { NotFound } from "../lib/errors";
import { validate } from "../middleware/validate";
import { requirePersona, requireInstruct, currentUser, invalidatePersonaCache, DEMO_ROLE_COOKIE } from "../middleware/persona";
import { clientRole, parseAircraft, parseSquadron, personName, sessionUser } from "../lib/client-format";
import { getUser, listUsers } from "../services/user-service";
import { logActivity } from "../services/activity-service";
import {
  listFlightRecords, toClientFlight, flightTotals, userSubmissions, buildUserReport,
} from "../services/personnel-service";

/**
 * Profile, personal records, instructor user list/report and workforce
 * screens, at the paths the client calls. Mounted at /api.
 */
export const peopleRouter = Router();

const newestFirst = <T extends { date: Date }>(a: T, b: T) => b.date.getTime() - a.date.getTime();

/** Update the current persona's own row and drop the cached persona. */
async function updateMe(req: Request, values: Partial<typeof users.$inferInsert>): Promise<User> {
  const [row] = await db.update(users).set(values).where(eq(users.id, currentUser(req).id)).returning();
  invalidatePersonaCache();
  return row;
}

// ---- Session ---------------------------------------------------------------

/** documents-page.tsx reads currentUser.email. */
peopleRouter.get("/auth/user", requirePersona, (req, res) => {
  res.json(sessionUser(currentUser(req)));
});

/** superadmin-dashboard.tsx sign-out: drop the persona cookie. */
peopleRouter.post("/logout", (_req, res) => {
  res.clearCookie(DEMO_ROLE_COOKIE, { path: "/" });
  res.json({ ok: true });
});

// ---- Profile (user-profile.tsx) --------------------------------------------

peopleRouter.get(
  "/profile",
  requirePersona,
  asyncHandler(async (req, res) => {
    const user = await getUser(currentUser(req).id);
    let totals = user.profileTotals;
    if (!totals) {
      const t = flightTotals(await listFlightRecords(user.id));
      totals = {
        totalMissionsFlown: t.sorties,
        totalCargoWeight: t.cargoKg,
        totalFlightHours: t.totalHours,
        totalNightHours: t.nightHours,
        totalDayHours: t.dayHours,
        totalCargoCarried: t.cargoKg,
        totalPassengersCarried: t.passengers,
      };
    }
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: clientRole(user.role),
        squadron: user.squadron,
        category: user.category,
        profilePhotoUrl: null,
        ...totals,
      },
    });
  }),
);

const count = z.coerce.number().nonnegative();
const statsBody = z.object({
  totalMissionsFlown: count,
  totalCargoWeight: count,
  totalFlightHours: count,
  totalNightHours: count,
  totalDayHours: count,
  totalCargoCarried: count,
  totalPassengersCarried: count,
});

peopleRouter.put(
  "/user/stats",
  requirePersona,
  validate(statsBody),
  asyncHandler(async (req, res) => {
    await updateMe(req, { profileTotals: req.body as z.infer<typeof statsBody> });
    res.json({ success: true });
  }),
);

peopleRouter.post("/user/profile-photo", (_req, res) => {
  res.status(410).json({ error: "Profile photos are not part of this build" });
});

peopleRouter.get(
  "/user/squadron",
  requirePersona,
  asyncHandler(async (req, res) => {
    res.json({ squadron: (await getUser(currentUser(req).id)).squadron });
  }),
);

const squadronBody = z.object({ squadron: z.enum(SQUADRONS) });

peopleRouter.put(
  "/user/squadron",
  requirePersona,
  validate(squadronBody),
  asyncHandler(async (req, res) => {
    const row = await updateMe(req, req.body as z.infer<typeof squadronBody>);
    res.json({ success: true, squadron: row.squadron });
  }),
);

const categoryBody = z.object({ category: z.enum(CATEGORIES) });

peopleRouter.put(
  "/user/category",
  requirePersona,
  validate(categoryBody),
  asyncHandler(async (req, res) => {
    const row = await updateMe(req, req.body as z.infer<typeof categoryBody>);
    res.json({ success: true, category: row.category });
  }),
);

const readiness = (u: User) => ({
  isFlightReady: u.isFlightReady,
  notReadyReason: u.notReadyReason,
  readinessUpdatedAt: u.readinessUpdatedAt,
});

peopleRouter.get(
  "/user/readiness",
  requirePersona,
  asyncHandler(async (req, res) => {
    res.json(readiness(await getUser(currentUser(req).id)));
  }),
);

const readinessBody = z
  .object({ isFlightReady: z.boolean(), notReadyReason: z.enum(NOT_READY_REASONS).nullish() })
  .refine((b) => b.isFlightReady || !!b.notReadyReason, { message: "A reason is required when not ready", path: ["notReadyReason"] });

peopleRouter.put(
  "/user/readiness",
  requirePersona,
  validate(readinessBody),
  asyncHandler(async (req, res) => {
    const b = req.body as z.infer<typeof readinessBody>;
    const row = await updateMe(req, {
      isFlightReady: b.isFlightReady,
      notReadyReason: b.isFlightReady ? null : b.notReadyReason,
      readinessUpdatedAt: new Date(),
    });
    res.json(readiness(row));
  }),
);

// ---- Qualifications (own) --------------------------------------------------

peopleRouter.get(
  "/user/qualifications",
  requirePersona,
  asyncHandler(async (req, res) => {
    res.json(
      await db
        .select()
        .from(userQualifications)
        .where(eq(userQualifications.userId, currentUser(req).id))
        .orderBy(desc(userQualifications.expiryDate)),
    );
  }),
);

peopleRouter.post(
  "/user/qualifications",
  requirePersona,
  validate(insertUserQualificationSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertUserQualificationSchema>;
    const [row] = await db
      .insert(userQualifications)
      .values({ userId: me.id, name: b.name, startDate: b.startDate, expiryDate: b.expiryDate ?? null })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "Qualification", resourceId: row.id, resourceName: row.name });
    res.status(201).json(row);
  }),
);

peopleRouter.put(
  "/user/qualifications/:id",
  requirePersona,
  validate(insertUserQualificationSchema),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const b = req.body as z.infer<typeof insertUserQualificationSchema>;
    const [row] = await db
      .update(userQualifications)
      .set({ name: b.name, startDate: b.startDate, expiryDate: b.expiryDate ?? null })
      .where(and(eq(userQualifications.id, parseId(req.params.id)), eq(userQualifications.userId, me.id)))
      .returning();
    if (!row) throw new NotFound("Qualification");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "Qualification", resourceId: row.id, resourceName: row.name });
    res.json(row);
  }),
);

peopleRouter.delete(
  "/user/qualifications/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .delete(userQualifications)
      .where(and(eq(userQualifications.id, parseId(req.params.id)), eq(userQualifications.userId, me.id)))
      .returning();
    if (!row) throw new NotFound("Qualification");
    await logActivity({ actor: me, action: "DELETE", resourceType: "Qualification", resourceId: row.id, resourceName: row.name });
    res.json({ success: true });
  }),
);

// ---- Flight records (own) --------------------------------------------------

const hours = z.coerce.number().nonnegative().max(24).default(0);
const flightBody = z
  .object({
    date: z.coerce.date(),
    callsign: z.string().max(50).nullish().transform((v) => v || null),
    departure: z.string().trim().min(1).max(100),
    arrival: z.string().trim().min(1).max(100),
    captain: z.string().trim().min(1).max(100),
    passengersCarried: z.coerce.number().int().nonnegative().default(0),
    cargoWeight: z.coerce.number().int().nonnegative().default(0),
    dayHours: hours,
    nightHours: hours,
    aircraftType: z.string().default("KC30A"),
  })
  .transform(({ cargoWeight, aircraftType, ...rest }, ctx) => {
    const aircraft = parseAircraft(aircraftType);
    if (!aircraft) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["aircraftType"], message: "Unknown aircraft type" });
      return z.NEVER;
    }
    return { ...rest, cargoWeightKg: cargoWeight, aircraft };
  });

const flightName = (r: { aircraft: string; departure: string; arrival: string }) => `${r.aircraft} ${r.departure}-${r.arrival}`;

peopleRouter.get(
  "/user/flight-records",
  requirePersona,
  asyncHandler(async (req, res) => {
    res.json((await listFlightRecords(currentUser(req).id)).map(toClientFlight));
  }),
);

peopleRouter.post(
  "/user/flight-records",
  requirePersona,
  validate(flightBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .insert(flightRecords)
      .values({ ...(req.body as z.infer<typeof flightBody>), userId: me.id })
      .returning();
    await logActivity({ actor: me, action: "CREATE", resourceType: "FlightRecord", resourceId: row.id, resourceName: flightName(row) });
    res.status(201).json(toClientFlight(row));
  }),
);

peopleRouter.put(
  "/user/flight-records/:id",
  requirePersona,
  validate(flightBody),
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .update(flightRecords)
      .set(req.body as z.infer<typeof flightBody>)
      .where(and(eq(flightRecords.id, parseId(req.params.id)), eq(flightRecords.userId, me.id)))
      .returning();
    if (!row) throw new NotFound("Flight record");
    await logActivity({ actor: me, action: "UPDATE", resourceType: "FlightRecord", resourceId: row.id, resourceName: flightName(row) });
    res.json(toClientFlight(row));
  }),
);

peopleRouter.delete(
  "/user/flight-records/:id",
  requirePersona,
  asyncHandler(async (req, res) => {
    const me = currentUser(req);
    const [row] = await db
      .delete(flightRecords)
      .where(and(eq(flightRecords.id, parseId(req.params.id)), eq(flightRecords.userId, me.id)))
      .returning();
    if (!row) throw new NotFound("Flight record");
    await logActivity({ actor: me, action: "DELETE", resourceType: "FlightRecord", resourceId: row.id, resourceName: flightName(row) });
    res.json({ success: true });
  }),
);

// ---- Activity and review notifications -------------------------------------

peopleRouter.get(
  "/user/activity-history",
  requirePersona,
  asyncHandler(async (req, res) => {
    const subs = await userSubmissions(currentUser(req).id);
    const rows = [
      ...subs.scenarios.map((s) => ({ ...s, type: "scenario" as const })),
      ...subs.quizzes.map((q) => ({ ...q, status: "completed", instructorFeedback: null, type: "quiz" as const })),
    ];
    res.json(rows.sort(newestFirst).slice(0, 50));
  }),
);

/** Reviewed assessments the member has not acknowledged yet. */
peopleRouter.get(
  "/user/review-notifications",
  requirePersona,
  asyncHandler(async (req, res) => {
    const rows = await db
      .select({
        submission: scenarioSubmissions,
        scenario: { id: scenarios.id, title: scenarios.title, questions: scenarios.questions, passingThreshold: scenarios.passingThreshold },
      })
      .from(scenarioSubmissions)
      .innerJoin(scenarios, eq(scenarios.id, scenarioSubmissions.scenarioId))
      .where(
        and(
          eq(scenarioSubmissions.userId, currentUser(req).id),
          eq(scenarioSubmissions.status, "reviewed"),
          eq(scenarioSubmissions.notificationSeen, false),
          eq(scenarioSubmissions.submissionType, "assessment"),
        ),
      )
      .orderBy(desc(scenarioSubmissions.reviewedAt));
    res.json(rows);
  }),
);

const dismissBody = z.object({ submissionIds: z.array(z.coerce.number().int().positive()) });

peopleRouter.post(
  "/user/dismiss-all-review-notifications",
  requirePersona,
  validate(dismissBody),
  asyncHandler(async (req, res) => {
    const { submissionIds } = req.body as z.infer<typeof dismissBody>;
    const dismissed = submissionIds.length
      ? await db
          .update(scenarioSubmissions)
          .set({ notificationSeen: true })
          .where(and(eq(scenarioSubmissions.userId, currentUser(req).id), inArray(scenarioSubmissions.id, submissionIds)))
          .returning({ id: scenarioSubmissions.id })
      : [];
    res.json({ success: true, dismissed: dismissed.length });
  }),
);

// ---- Instructor: user list and report (UserReportModal, superadmin-dashboard) ----

peopleRouter.get(
  "/instructor/users",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const rows = await listUsers({ squadron: parseSquadron(req.query.squadron) });
    res.json(
      rows
        .filter((u) => u.role !== "command")
        .map((u) => ({
          userId: u.id,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          fullName: personName(u) || u.email,
          squadron: u.squadron,
          category: u.category,
          licenseType: clientRole(u.role),
          isFlightReady: u.isFlightReady,
          profilePhotoUrl: null,
        })),
    );
  }),
);

peopleRouter.get(
  "/instructor/user-report/:id",
  requireInstruct,
  asyncHandler(async (req, res) => {
    res.json(await buildUserReport(parseId(req.params.id)));
  }),
);

// ---- Workforce (instructors-portal) ------------------------------------------

peopleRouter.get("/workforce/squadrons", requireInstruct, (_req, res) => {
  res.json(FLYING_SQUADRONS);
});

peopleRouter.get(
  "/workforce/squadron-personnel-counts",
  requireInstruct,
  asyncHandler(async (_req, res) => {
    const rows = await listUsers();
    res.json(
      FLYING_SQUADRONS.map((squadron) => {
        const members = rows.filter((u) => u.squadron === squadron && u.role !== "command");
        const instructors = members.filter((u) => u.role === "instructor").length;
        return { squadron, total: members.length, loadmasters: members.length - instructors, instructors };
      }),
    );
  }),
);

peopleRouter.get(
  "/workforce/squadron/:squadron/users",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const squadron = parseSquadron(req.params.squadron);
    if (!squadron) throw new NotFound("Squadron");
    const rows = await listUsers({ squadron });
    res.json(
      rows.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.firstName,
        last_name: u.lastName,
        squadron: u.squadron,
        license_type: clientRole(u.role),
        category: u.category,
        last_login: u.lastActiveAt,
        created_at: u.createdAt,
      })),
    );
  }),
);

peopleRouter.get(
  "/workforce/user/:id/submissions",
  requireInstruct,
  asyncHandler(async (req, res) => {
    const subs = await userSubmissions(parseId(req.params.id));
    const rows = [
      ...subs.scenarios.map((s) => ({ ...s, type: "scenario" as const })),
      ...subs.quizzes.map((q) => ({ ...q, status: "completed", type: "quiz" as const })),
      ...subs.documents.map((d) => ({ ...d, score: null, passed: true, status: "completed", type: "document" as const })),
    ];
    res.json(
      rows
        .sort(newestFirst)
        .slice(0, 10)
        .map((r) => ({ id: r.id, submission_date: r.date, score: r.score, passed: r.passed, status: r.status, title: r.title, type: r.type })),
    );
  }),
);
