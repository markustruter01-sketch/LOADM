# LOADM — Loadmaster Training & Operations Platform

A full-stack showcase of a training, assessment and workforce-readiness platform for air mobility loadmasters. It covers the whole training pipeline — modules, quizzes drawn from a managed question bank, instructor-marked scenarios, checklists, load planning for four airframes, flight logs and qualification currency — and rolls it up into squadron-level readiness, safety and performance analytics for command.

There is no login. Open the app, pick a role, and use it from that seat. Everything is live and editable; the data is fictional, reloads itself once a day, and anyone can restore it with the "Reset demo data" button.

| Role | What you get |
| --- | --- |
| **Student** | Training modules with assessments, quizzes, scenarios, checklists, personal progress and streaks |
| **Qualified Loadmaster** | Everything above plus interactive load planning, missions, operational forms, flight log, qualifications, crew chat |
| **Instructor** | Author quizzes, scenarios, modules and checklists; review queue with marking; student roster with at-risk flags; question bank; safety records |
| **Command** | Squadron readiness with 90-day history, qualification forecasting, safety compliance, flight operations, rule-based recommendations, audit log |

## Stack

- **Client:** React 18, TypeScript, Vite, wouter, TanStack Query, react-hook-form + Zod, shadcn/ui (Radix), Tailwind, Recharts
- **Server:** Node 20, Express, TypeScript, Drizzle ORM, PostgreSQL (Neon), Zod validation, pino logging, WebSockets for live crew chat
- **Shared:** one `shared/` package holds the schema, every enum and every business threshold, so client and server never disagree about a pass mark or a squadron name

## Architecture notes

- `shared/constants.ts` is the single source of truth for roles, capabilities, squadrons, aircraft, thresholds and pass-mark resolution.
- `shared/schema.ts` is the single source of truth for tables and request validation (Drizzle tables + Zod schemas side by side).
- Roles are capability sets (`train` → `assess` → `operate` → `instruct` → `command`). The server authorises with `requireCapability`; the client gates navigation and controls with the same table.
- Every API route lives in one domain router under `server/routes/`, validates its input with Zod, derives identity and scores server-side, and reports errors through one JSON error handler.
- Quiz grading is attempt-based: the questions served to a student are stored with the attempt and graded by question id, so a student is only ever graded on what they saw.
- Readiness has one definition (`server/services/readiness-service.ts`) used by the live dashboard, the daily snapshot and the seed.
- Demo data is generated deterministically (`server/seed/`) so every reset produces the same world. On start-up the app creates its own tables and reloads the data if it is more than a day old — there are no background jobs.
- All tables live in a separate `showcase` Postgres schema, so tables from the earlier version of the app in `public` are never touched.

## Deploying

Pull `main` into the Replit project and publish. That is the whole process. The only setting the app needs is `DATABASE_URL`, which Replit already provides.

Developer scripts: `npm run dev`, `npm run typecheck`, `npm test`, `npm run build && npm start`.

## Project layout

```
client/src
  components/   shared UI (common.tsx, layout/, load-planning/, chat/, …)
  lib/          api client, query keys, persona context, navigation
  pages/        one folder per area: training, quizzes, scenarios, instructor, command, …
server
  routes/       one router per domain, mounted once in routes/index.ts
  services/     business logic (grading, readiness, analytics, demo reset)
  middleware/   persona (role) resolution, validation, error handling
  seed/         deterministic demo dataset
shared
  constants.ts  enums, roles, thresholds
  schema.ts     Drizzle tables + Zod request schemas
```

## Licence

MIT. All personnel, units, incidents and figures in the demo data are fictional.
