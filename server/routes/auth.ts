import { Router } from "express";
import { z } from "zod";
import { ROLES } from "@shared/constants";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../lib/async";
import { DEMO_ROLE_COOKIE, loadPersona } from "../middleware/persona";
import { sessionUser } from "../lib/client-format";
import { isProd } from "../config";
import { NotFound, Unauthorized } from "../lib/errors";

/**
 * The client's sign-in flow (auth-isolated/auth-context.tsx), served at
 * /auth-isolated. There are no passwords: "login" picks one of the four
 * demo personas and stores the choice in a cookie.
 */
export const authRouter = Router();

authRouter.get("/user", (req, res) => {
  if (!req.user) throw new Unauthorized();
  res.json(sessionUser(req.user));
});

authRouter.post(
  "/login",
  validate(z.object({ role: z.enum(ROLES) })),
  asyncHandler(async (req, res) => {
    const { role } = req.body as { role: (typeof ROLES)[number] };
    const persona = await loadPersona(role);
    if (!persona) throw new NotFound(`Persona for role ${role}`);
    // Session cookie: every new browser session starts at the role picker.
    res.cookie(DEMO_ROLE_COOKIE, role, { httpOnly: true, sameSite: "lax", secure: isProd, path: "/" });
    res.json(sessionUser(persona));
  }),
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(DEMO_ROLE_COOKIE, { path: "/" });
  res.json({ ok: true });
});
