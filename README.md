# LOADM — Loadmaster Training & Operations Platform

A full-stack showcase of a training, assessment and workforce-readiness platform for air mobility loadmasters. It covers the whole training pipeline — modules, quizzes drawn from a managed question bank, instructor-marked scenarios, checklists, load planning for four airframes, flight logs and qualification currency — and rolls it up into squadron-level readiness, safety and performance analytics for command.

There is no login. Open the app, pick a role, and use it from that seat. Everything is live and editable; the data is fictional and resets daily.

| Role | What you get |
| --- | --- |
| **Student** | Training modules with assessments, quizzes, scenarios, checklists, personal progress and streaks |
| **Qualified Loadmaster** | Everything above plus interactive load planning, missions, operational forms, flight log, qualifications, crew chat |
| **Instructor** | Author quizzes, scenarios, modules and checklists; review queue with marking; student roster with at-risk flags; question bank; safety records |
| **Command** | Squadron readiness with 90-day history, qualification forecasting, safety compliance, flight operations, rule-based recommendations, audit log |

## Stack

- **Client:** React 18, TypeScript, Vite, wouter, TanStack Query, react-hook-form + Zod, shadcn/ui (Radix), Tailwind, Recharts
- **Server:** Node 20, Express, TypeScript, Drizzle ORM, PostgreSQL (Neon serverless driver), Zod validation, pino logging, WebSockets for live chat
- **Shared:** one `shared/` package holds the schema, every enum and every business threshold, so client and server never disagree about a pass mark or a squadron name

## Architecture notes

- `shared/constants.ts` is the single source of truth for roles, capabilities, squadrons, aircraft, thresholds and pass-mark resolution.
- `shared/schema.ts` is the single source of truth for tables and request validation (Drizzle tables + Zod schemas side by side).
- Roles are capability sets (`train` → `assess` → `operate` → `instruct` → `command`). The server authorises with `requireCapability`; the client gates navigation and controls with the same table.
- Every API route lives in one domain router under `server/routes/`, validates its input with Zod, derives identity and scores server-side, and reports errors through one JSON error handler.
- Quiz grading is attempt-based: the questions served to a student are stored with the attempt and graded by question id, so a student is only ever graded on what they saw.
- Readiness has one definition (`server/services/readiness-service.ts`) used by the live dashboard, the daily snapshot and the seed.
- Demo data is generated deterministically (`server/seed/`) so every reset produces the same world; a Postgres advisory lock makes reset safe across instances.

## Running locally

```bash
cp .env.example .env            # set DATABASE_URL to any PostgreSQL 14+
npm install
npm run db:push                 # create the schema (or db:migrate once migrations are generated)
npm run dev                     # http://localhost:5000 — seeds demo data on first boot
```

Other scripts: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build && npm start`, `npm run db:reset` (restore seed data).

## Deploying

The app is a single Node process serving the API and the built client. `Dockerfile` builds a production image; any host with a PostgreSQL database works (Render, Railway, Fly, a VPS). Set `DATABASE_URL`, optionally `DEMO_RESET_HOUR_UTC` (default 16) and `UPLOAD_DIR` (mount a volume if uploads should survive restarts).

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
