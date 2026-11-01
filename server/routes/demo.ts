import { Router } from "express";
import { z } from "zod";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_CAPABILITIES } from "@shared/constants";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../lib/async";
import { DEMO_ROLE_COOKIE, loadPersona } from "../middleware/persona";
import { toPublicUser } from "../services/user-service";
import { resetDemoData, getDemoStatus } from "../services/demo-service";
import { isProd } from "../config";
import { NotFound } from "../lib/errors";

/**
 * Persona selection and demo housekeeping. This is the whole "login" flow.
 */
export const demoRouter = Router();

/** The roles a visitor can pick, with the persona attached to each. */
demoRouter.get(
  "/roles",
  asyncHandler(async (_req, res) => {
    const roles = await Promise.all(
      ROLES.map(async (role) => {
        const persona = await loadPersona(role);
        return {
          role,
          label: ROLE_LABELS[role],
          description: ROLE_DESCRIPTIONS[role],
          capabilities: ROLE_CAPABILITIES[role],
          persona: persona ? toPublicUser(persona) : null,
        };
      }),
    );
    res.json(roles);
  }),
);

/** Who am I right now. 200 with `user: null` when no role is chosen. */
demoRouter.get("/me", (req, res) => {
  res.json({
    role: req.user?.role ?? null,
    user: req.user ? toPublicUser(req.user) : null,
    capabilities: req.user ? ROLE_CAPABILITIES[req.user.role] : [],
  });
});

/** Choose (or switch) the role. Sets the cookie the client relies on. */
demoRouter.post(
  "/role",
  validate(z.object({ role: z.enum(ROLES) })),
  asyncHandler(async (req, res) => {
    const { role } = req.body as { role: (typeof ROLES)[number] };
    const persona = await loadPersona(role);
    if (!persona) throw new NotFound(`Persona for role ${role}`);
    res.cookie(DEMO_ROLE_COOKIE, role, {
      httpOnly: false, // the client reads it to restore state without a round-trip
      sameSite: "lax",
      secure: isProd,
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ role, user: toPublicUser(persona), capabilities: ROLE_CAPABILITIES[role] });
  }),
);

demoRouter.post("/leave", (_req, res) => {
  res.clearCookie(DEMO_ROLE_COOKIE, { path: "/" });
  res.json({ ok: true });
});

demoRouter.get("/status", asyncHandler(async (_req, res) => res.json(await getDemoStatus())));

/** Restore the seed data. Anyone can press it; that is the point of a demo. */
demoRouter.post(
  "/reset",
  asyncHandler(async (_req, res) => {
    const result = await resetDemoData("manual");
    res.json(result);
  }),
);
