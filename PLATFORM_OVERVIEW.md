# LoadM Workflow — Full Platform Overview
> Generated: 30 July 2026  
> Total lines of code: **115,099** across **582 source files** (TypeScript, TSX, JS, CSS, SQL)  
> Largest files: `server/routes.ts` (5,532 lines), `training-modules/[id].tsx` (2,464 lines), `workforce-analytics.tsx` (2,342 lines), `leadership-portal/index.tsx` (2,264 lines)

---

## 1. What the Platform Is

LoadM Workflow is a **military aviation workforce management and training platform** built specifically for Royal Australian Air Force (RAAF) Loadmaster personnel. It covers:

- Licensing and access control for personnel
- Training modules, quizzes, and scenario assessments
- Mission planning and load planning tools
- Flight record and qualification (currency) tracking
- Readiness management and reporting
- Leadership analytics and dashboards
- Safety record management
- Checklists (QRH-style) for aircraft procedures
- An in-app chat/messaging system
- A phone directory for airbase contacts

---

## 2. Infrastructure

### Hosting
- **Replit** — the entire platform (frontend + backend) runs as a single Node.js process on Replit's infrastructure.
- The app is served via Vite (development) or compiled static assets (production) from the same Express server.
- Replit proxies traffic through mTLS to a public `.replit.dev` URL for development, and a separate deployment URL for production.

### Database
- **Neon** — serverless PostgreSQL. Neon provides a connection string (`DATABASE_URL`) that is accessed via the `@neondatabase/serverless` driver.
- There is a **single shared database** used for both development and production (no separate prod DB has been provisioned yet).
- The database is managed with **Drizzle ORM** and schema changes are applied with `drizzle-kit push`.

### File Storage
- **Local filesystem** — uploaded files (videos, profile photos, PDF documents) are stored directly on the Replit container's disk under `/uploads/` and subdirectories.
- Profile photos are stored as base64 data URLs directly in the `licenses.profile_photo_url` database column.
- Videos uploaded for training modules are stored on disk and served via Express static routes.

### Email
- **SendGrid** — used for transactional email (e.g., license notifications). Configured via `SENDGRID_VERIFIED_SENDER` secret.

### Sessions
- **In-memory Map** — sessions are stored in a JavaScript `Map` on the server process (see auth section). This means sessions are lost on server restart. There is no Redis or persistent session store.

---

## 3. Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (TypeScript) |
| Build tool | Vite 5 |
| Routing | Wouter 3 |
| Server state | TanStack Query (React Query v5) |
| Styling | Tailwind CSS 3 |
| Component library | shadcn/ui (Radix UI primitives) |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Animations | Framer Motion |
| PDF viewing | react-pdf / pdfjs-dist |
| PDF generation | jsPDF + html2canvas |
| Date handling | date-fns |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (tsx for dev, esbuild for prod) |
| Framework | Express 4 |
| Language | TypeScript 5.6 |
| ORM | Drizzle ORM |
| Database driver | @neondatabase/serverless |
| Password hashing | bcryptjs |
| File uploads | Multer 2 |
| Email | @sendgrid/mail |
| WebSockets | ws |
| Auth (legacy) | passport + passport-local (partially present, largely superseded) |

### Shared
- `shared/schema.ts` — single source of truth for all database table definitions, TypeScript types, and Zod validation schemas. Used by both frontend and backend.
- `shared/quiz-questions.ts` — the static question bank (1,358 lines) used as the base question pool for quizzes.

### Dev / Build
- `drizzle-kit` — schema migration tooling (`npm run db:push`)
- `tsc` — type checking (`npm run check`)
- Vite dev server with HMR for frontend
- `tsx` for running TypeScript server directly in development

---

## 4. Folder Structure

```
/
├── client/                          # Frontend React application
│   └── src/
│       ├── App.tsx                  # Root component, routing tree
│       ├── auth-isolated/           # Login/logout UI components, auth context
│       ├── assets/                  # Static assets (images, icons)
│       ├── components/
│       │   ├── ui/                  # shadcn/ui component library (40+ components)
│       │   ├── aircraft-grids/      # Aircraft-specific cargo grid components
│       │   │   ├── C130Grid.tsx
│       │   │   ├── C17Grid.tsx
│       │   │   ├── C27JGrid.tsx
│       │   │   └── KC30AGrid.tsx
│       │   ├── chat-system.tsx      # Real-time chat component
│       │   ├── CargoManifestForm.tsx
│       │   ├── CargoGridCell.tsx
│       │   ├── LoadSummary.tsx
│       │   ├── OnboardingTour.tsx
│       │   └── ...                  # Other shared components
│       └── pages/
│           ├── home-page.tsx        # Landing/home for authenticated users
│           ├── user-profile.tsx     # Personal profile, flight log, quals
│           ├── load-planning-page.tsx  # Cargo load planning tool
│           ├── documents-page.tsx   # Document library
│           ├── scenarios-page.tsx   # Scenario assessments
│           ├── tools-page.tsx       # Utility tools
│           ├── tools/               # Individual tool pages
│           ├── quizzes/             # Quiz pages
│           ├── training-modules/    # Training module viewer + assessments
│           ├── instructors-portal/  # Instructor-only section
│           │   ├── index.tsx        # Instructor home dashboard
│           │   ├── analytics/       # Analytics dashboards
│           │   ├── training-modules/# Module management
│           │   ├── scenarios/       # Scenario management
│           │   ├── quizzes/         # Quiz management
│           │   ├── users/           # User management
│           │   ├── workforce/       # Workforce analytics
│           │   ├── workforce-analytics.tsx  # Full workforce analytics page
│           │   ├── checklist-management.tsx
│           │   ├── best-practices.tsx
│           │   └── resources.tsx
│           ├── leadership-portal/   # Leadership-only readiness dashboard
│           │   └── index.tsx
│           ├── admin/               # Admin management pages
│           │   ├── document-management.tsx
│           │   └── scenario-management.tsx
│           ├── licensing-management.tsx  # SuperAdmin license CRUD
│           ├── superadmin-dashboard.tsx
│           └── ...
│
├── server/                          # Backend Express application
│   ├── index.ts                     # App entrypoint, Express setup, route mounting
│   ├── routes.ts                    # Main API routes (~5,500 lines)
│   ├── db.ts                        # Drizzle ORM + Neon connection setup
│   ├── auth-isolated/
│   │   ├── auth-core.ts             # Session store (Map), login logic, bcrypt
│   │   └── auth-routes.ts           # /api/isolated-auth endpoints (login/logout)
│   ├── auth-middleware-unified.ts   # requireAuth, requireInstructor, etc.
│   ├── license-expiry-service.ts    # License validity checks
│   ├── licensing-middleware.ts      # License gate middleware
│   ├── services/
│   │   ├── email-service.ts         # SendGrid email service
│   │   └── snapshot-service.ts      # Readiness snapshot persistence
│   ├── routes/                      # Split-out route files
│   │   ├── licensing.ts
│   │   ├── quiz-unified.ts
│   │   ├── quiz-edit.ts
│   │   └── ...
│   └── vite.ts                      # Vite dev server integration for SSR/SPA
│
├── shared/
│   ├── schema.ts                    # All DB table definitions + Zod schemas (964 lines)
│   └── quiz-questions.ts            # Static question bank (1,358 lines)
│
├── mobile-app/                      # React Native / Expo app (separate, not deployed)
│   └── src/
│       ├── screens/                 # Mobile screen components
│       └── services/                # Mobile services (offline, analytics, etc.)
│
├── scripts/                         # Data seeding / backfill scripts
├── public/
│   └── service-worker.js            # PWA service worker
├── uploads/                         # Runtime file uploads (videos, photos)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
└── tsconfig.json
```

---

## 5. Database Schema

All tables are PostgreSQL, managed by Drizzle ORM. The schema lives in `shared/schema.ts`.

### Core Identity Tables

#### `licenses`
The primary identity record for every person in the system. One license per person.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `email` | text UNIQUE | Login identifier |
| `first_name` / `last_name` | text | Display name |
| `license_key` | text UNIQUE | System-generated access key |
| `license_type` | text | `loadmaster` \| `instructor` \| `superadmin` \| `readonly` |
| `squadron` | text | `33SQN` \| `35SQN` \| `36SQN` \| `37SQN` \| `AMG` |
| `category` | text | `D` \| `C` \| `B` \| `A` (seniority, D=junior) |
| `is_active` | boolean | License enabled/disabled |
| `issued_date` / `expiry_date` | timestamp | License validity window |
| `max_concurrent_sessions` | integer | Default 1 |
| `max_devices` | integer | Default 2 |
| `is_flight_ready` | boolean | Manual readiness flag |
| `not_ready_reason` | text | Reason if not ready |
| `total_missions_flown` | integer | Cumulative counter |
| `total_flight_hours` / `total_night_hours` / `total_day_hours` | real | Cumulative hours |
| `total_cargo_carried` / `total_passengers_carried` | integer | Cumulative stats |
| `profile_photo_url` | text | Base64-encoded image |

#### `users`
Authentication record linked to a license.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `email` | text UNIQUE | Must match license email |
| `hashed_password` | text | bcrypt hash |
| `is_first_login` | boolean | Triggers password change flow |
| `license_id` | FK → licenses | Cascade delete |
| `user_role` | text | Mirrors license_type |
| `last_login` | timestamp | Set on each successful login |

#### `license_sessions`
Device/session tracking for concurrent session limits.

| Column | Type | Notes |
|---|---|---|
| `license_id` | FK → licenses | |
| `device_fingerprint` | text | Browser fingerprint |
| `ip_address` / `user_agent` | text | |
| `login_time` / `last_activity` / `logout_time` | timestamp | |
| `status` | text | `active` \| `inactive` \| `expired` |

#### `license_audit_log`
Immutable audit trail of all admin actions on licenses.

---

### Training Tables

#### `documents`
Instructor-created form templates (pre-flight forms, checklists, etc.).
- `fields` (JSON) — array of `FormField` objects defining the form structure (text, number, select, checkbox, date, textarea)

#### `document_submissions`
User completions of document forms.
- `form_data` (JSON) — the submitted field values

#### `scenarios`
Assessment scenarios (open-ended or multiple-choice question sets).
- `questions` (JSON) — array of `ScenarioQuestion` objects
- `passing_threshold` — integer percentage (default 70%)

#### `scenario_submissions`
User attempts at scenarios.
- `answers` (JSON) — array of `{questionId, answer, notes?}`
- `marked_answers` (JSON) — instructor grading
- `status` — `submitted` \| `marked` \| `reviewed`
- `submission_type` — `training` \| `assessment`

#### `quizzes`
Instructor-created quizzes drawn from the question bank.
- `categories` (JSON string array) — topic filters applied when drawing questions
- `question_count` — number of questions to draw

#### `quiz_submissions`
User quiz attempts.
- `answers` (JSON) — `{questionId, answeredOption: number}[]`
- `score` — integer percentage

#### `quiz_questions`
Editable question bank (instructor-managed).
- One correct answer + 3 incorrect options per question
- `difficulty` — `easy` \| `medium` \| `hard`
- `category` — topic tag (e.g., `dangerous-goods`, `loadmaster-fundamentals`)

#### `training_module_videos`
Video files uploaded by instructors for training modules.
- `file_path` — disk path to MP4/WebM file
- `video_order` — 1–3 ordering within a module

---

### Operations Tables

#### `missions`
Mission records created by loadmasters.
- Tracks departure/arrival, captain, loadmasters, dangerous goods flag
- `is_completed` — boolean

#### `mission_documents`
PDF documents attached to a mission (e.g., DD Form, load plan).

#### `checklists`
Aircraft procedure checklists created by instructors.
- `aircraft_type` — `C-17` \| `C-130` \| `C-27J` \| `KC30A` \| `General`
- `enforce_linear_progression` — QRH mode (must complete items in order)

#### `checklist_items`
Individual steps within a checklist, with `item_order`.

#### `checklist_completions`
User completion records for a checklist run.

#### `checklist_step_audit`
Timestamped audit of every individual step check/uncheck action.

---

### Personnel Tables

#### `user_qualifications`
Named qualifications/currencies with start and expiry dates (e.g., Night Fam, Medical, Dangerous Goods).

#### `flight_records`
Individual flight log entries per user.
- `night_hours` / `day_hours` (real)
- `passengers_carried` / `cargo_weight`
- `aircraft_type`

#### `phone_directory`
Airbase contact lists.
- `contacts` (JSON) — array of `{id, name, phoneNumber, description}`

#### `chat_messages`
In-app chat messages.
- `message_type` — `question` \| `answer`

---

### Analytics / Snapshot Tables

#### `readiness_snapshots` (managed by snapshot-service)
Point-in-time records of squadron readiness percentages, used for trend charting in the leadership portal.

---

## 6. Authentication & Security

### Authentication System

The app uses a **custom isolated authentication system** (not passport, not express-session for the main flow). It was purpose-built to be completely independent of any third-party auth library.

**Flow:**
1. User POSTs email + password to `/api/isolated-auth/login`
2. `auth-core.ts` checks the superadmin hardcoded record first (env var override)
3. If not superadmin, queries the `users` table with case-insensitive `ILIKE` email match
4. `bcryptjs.compare()` verifies the password against the `hashed_password` column
5. License validity is checked via `licenseExpiryService.checkLicenseStatus(email)`
6. On success, a session ID is generated: `'isolated_' + random + '_' + Date.now()`
7. Session is stored in a **server-side in-memory `Map<string, session>`**
8. Session ID is set as an **HTTP cookie** (`isolated_session`, SameSite=Lax, HttpOnly in prod)
9. `last_login` timestamp is written to the `users` table (non-fatal if it fails)

**⚠️ Important limitation:** Sessions live only in process memory. A server restart clears all sessions and forces all users to log in again.

### Middleware Layers

| Middleware | What it does |
|---|---|
| `unifiedAuthMiddleware` | Reads `isolated_session` cookie, looks up session Map, attaches `req.user` |
| `requireAuth` | 401 if not authenticated |
| `requireInstructor` | 403 unless role is `instructor` or `superadmin` |
| `requireInstructorOrLeadership` | 403 unless role is `instructor`, `leadership`, or `superadmin` |
| `requireSuperAdmin` | 403 unless role is `superadmin` |

### Role Hierarchy

```
superadmin
    └── instructor
            └── leadership      (parallel — read-only analytics, no editing)
                    └── loadmaster  (base user — training, missions, profile)
```

- **loadmaster** — core users; can do training, missions, flight log, profile, tools
- **instructor** — can create/edit content (modules, quizzes, scenarios, documents, checklists), view all analytics, manage users
- **leadership** — read-only analytics access (leadership portal, workforce analytics); cannot edit content
- **superadmin** — full access including license management, user creation, system configuration

### Password Security
- Passwords are hashed with **bcryptjs** (bcrypt, cost factor 10 rounds by default)
- First-login flow: `is_first_login = true` forces a password change screen on first access
- Password change endpoint: `PUT /api/auth/change-password`

### License Gate
- Every user account is linked to a `license` record with an `expiry_date`
- At login, `licenseExpiryService` checks whether the license is still valid
- If expired → login is rejected with `LICENSE_EXPIRED` error, even with correct credentials
- Licenses can also be manually suspended (`is_active = false`) by a superadmin
- License sessions are tracked in `license_sessions` to enforce `max_concurrent_sessions`

---

## 7. API Surface

The API is REST-style JSON, served from the same Express process as the frontend. All endpoints are prefixed with `/api/`.

### Auth Endpoints (public)
```
POST /api/isolated-auth/login        — Login, sets isolated_session cookie
POST /api/isolated-auth/logout       — Clears cookie and removes session from Map
GET  /api/isolated-auth/status       — Check if current cookie is valid
POST /api/auth/set-password          — Set password on first login
PUT  /api/auth/change-password       — Change existing password
```

### Profile & User
```
GET  /api/profile                    — Full profile (user + license merged)
PUT  /api/user/stats                 — Update cumulative stats on license
PUT  /api/user/readiness             — Toggle isFlightReady + reason
GET  /api/user/readiness             — Get current readiness status
POST /api/user/profile-photo         — Upload profile photo (multipart)
PUT  /api/user/squadron              — Update squadron assignment
PUT  /api/user/category              — Update category
GET  /api/user/activity-history      — Recent activity log
GET  /api/user/qualifications        — All qualifications for current user
POST /api/user/qualifications        — Add qualification
PUT  /api/user/qualifications/:id    — Update qualification
DELETE /api/user/qualifications/:id  — Delete qualification
GET  /api/user/flight-records        — All flight records for current user
POST /api/user/flight-records        — Add flight record
PUT  /api/user/flight-records/:id    — Update flight record
DELETE /api/user/flight-records/:id  — Delete flight record
```

### Missions
```
GET    /api/missions                    — List user's missions
POST   /api/missions                    — Create mission
PATCH  /api/missions/:id                — Update mission
DELETE /api/missions/:id                — Delete mission
GET    /api/missions/:id/documents      — List mission documents
POST   /api/missions/:id/documents      — Attach document to mission
DELETE /api/missions/:id/documents/:docId — Remove document
```

### Documents / Forms
```
GET    /api/documents          — List all form templates
GET    /api/documents/:id      — Single template
POST   /api/documents          — Create template (instructor)
PUT    /api/documents/:id      — Update template (instructor)
DELETE /api/documents/:id      — Delete template (instructor)
GET    /api/document-submissions — User's submissions
POST   /api/document-submissions — Submit a form
```

### Scenarios
```
GET    /api/scenarios          — List scenarios
GET    /api/scenarios/:id      — Single scenario
POST   /api/scenarios          — Create (instructor)
PUT    /api/scenarios/:id      — Update (instructor)
POST   /api/training-assessments — Submit scenario attempt
GET    /api/training-assessments/my — My submissions
POST   /api/quiz-submissions/:id/mark — Instructor marks a submission
```

### Quizzes
```
GET  /api/quiz-questions       — Question bank (instructor+)
POST /api/quiz-questions       — Add question (instructor)
PUT  /api/quiz-questions/:id   — Edit question (instructor)
DELETE /api/quiz-questions/:id — Delete question (instructor)
GET  /api/instructor/quiz-submissions — All quiz submissions (instructor+)
```

### Training Modules
```
POST /api/training-modules/:id/videos  — Upload video (instructor, multipart)
GET  /api/training-modules/:id/videos  — List module videos
POST /api/training-modules/:id/content — Add/update content (instructor)
PUT  /api/training-modules/:id/content/:contentId — Update content
DELETE /api/training-modules/:id/content/:contentId — Delete content
```

### Checklists
```
GET    /api/checklists                  — All checklists (filtered by aircraft)
GET    /api/checklists/:id              — Single checklist + items
POST   /api/checklists/:id/completion   — Record/update completion
GET    /api/checklists/completions      — My completions
POST   /api/checklists                  — Create (instructor)
PUT    /api/checklists/:id              — Update (instructor)
DELETE /api/checklists/:id             — Delete (instructor)
GET    /api/instructor/checklists       — All completions (instructor+)
```

### Analytics (instructor+ or leadership+)
```
GET /api/analytics/topic-mastery          — Quiz scores grouped by topic category
GET /api/analytics/question-difficulty    — Per-question success rates
GET /api/analytics/student-vs-squadron    — Individual vs squadron benchmark
GET /api/analytics/module-completion      — Training module completion rates
GET /api/analytics/certification-readiness— Qual/currency expiry overview
GET /api/analytics/at-risk-students       — Risk-scored user list
GET /api/analytics/flight-hours           — Flight hours summary and trends
GET /api/analytics/currency-status        — Qualification expiry status per user
GET /api/analytics/squadron-readiness     — readyPercent per squadron (live)
GET /api/analytics/safety-summary         — Safety record aggregation
GET /api/analytics/readiness-history      — Historical readiness snapshots
GET /api/analytics/qualification-forecast — Future expiry forecast
GET /api/analytics/expiring-qualifications— Near-term expiry alerts
GET /api/analytics/icc-power-law          — ICC performance learning curves
POST /api/analytics/capture-snapshot      — Manually save readiness snapshot
```

### Workforce (instructor+)
```
GET /api/workforce/squadrons              — Squadron list
GET /api/workforce/squadron-personnel-counts — Personnel counts per squadron
GET /api/workforce/squadron/:id/users     — Users in a squadron
GET /api/workforce/user/:userId/submissions — All submissions for a user
```

### Licensing (superadmin only)
```
GET    /api/licensing/licenses            — All licenses + user info
POST   /api/licensing/licenses            — Create license + user account
POST   /api/licensing/licenses/:id/renew  — Extend expiry date
POST   /api/licensing/licenses/:id/toggle-suspension — Enable/disable
DELETE /api/licensing/licenses/:id        — Delete license + user
PATCH  /api/licensing/licenses/:id/role   — Change user role
GET    /api/licensing/dashboard-stats     — Aggregate license stats
```

### Instructor User Management
```
GET /api/instructor/users              — All users with merged profile data
GET /api/instructor/user-report/:userId — Full report for one user
```

### Misc
```
GET  /api/phone-directory              — All airbase contacts
DELETE /api/phone-directory/:id        — Delete entry
GET  /api/chat-messages                — Fetch chat history
DELETE /api/chat-messages/reset        — Clear chat
GET  /api/activity-log                 — System activity feed
GET  /api/licenses/expired             — List expired licenses
```

---

## 8. Key Business Logic / Math

### Squadron Readiness Score
```
readyPercent = (count of users WHERE is_flight_ready = true) 
               ÷ (total users in squadron) × 100
```
- Rounded to nearest integer
- Threshold target: **85%** (green bar ≥ 85, orange bar < 85)
- `is_flight_ready` is a **manually set boolean** on the `licenses` table
- Snapshots are saved periodically to `readiness_snapshots` for trend charting

### At-Risk Score (per user)
Additive risk scoring, capped per category:
```
riskScore = 0
riskScore += min(40, expiredQualifications × 30)      // expired quals, max 40pts
riskScore += min(30, expiringSoonQualifications × 15)  // expiring < 30 days, max 30pts
riskScore += 20  (if isFlightReady = false)
riskScore += 10  (if averageScenarioScore < 70%)
riskScore += 10  (if no activity in last 30 days, but has history)

Risk Level:
  >= 60 → critical
  >= 40 → high
  >= 20 → medium
  <  20 → low
```

### Quiz Score
```
score = (correct answers ÷ total questions) × 100    (integer percentage)
```
- Questions are drawn randomly from the pool filtered by the quiz's `categories`
- Options for each question are shuffled client-side on render
- Passing threshold for scenarios: configurable per scenario (default 70%)

### ICC Power Law Curves
- Groups users by time-in-role bracket
- Plots quiz score vs. time as a power law learning curve
- Used for tracking collective squadron learning progression
- Data is normalized to 0–1 scale for curve fitting

### Currency / Qualification Status
- `daysUntilExpiry = ceil((expiryDate - now) / (1000 × 60 × 60 × 24))`
- Urgency buckets:
  - `critical` — ≤ 30 days
  - `high` — ≤ 60 days
  - `medium` — ≤ 90 days
  - `low` — > 90 days

### License Expiry
- `daysUntilExpiry = ceil((expiryDate - now) / 86400000)`
- Users cannot log in once `expiry_date` has passed, regardless of password correctness
- SuperAdmin can renew (extend `expiry_date`) via the Licensing Management page

---

## 9. Frontend Architecture

### Routing (Wouter)
All routes are defined in `client/src/App.tsx`. Route protection is handled by a `ProtectedRoute` wrapper component that checks the auth context.

Key route groups:
- `/` — Home page (role-aware)
- `/profile` — User profile, flight log, qualifications
- `/load-planning` — Load planning tool
- `/documents` — Document library and form submission
- `/scenarios` — Scenario assessments
- `/training-modules/:id` — Training module viewer
- `/quizzes` — Quiz list and attempt
- `/tools` — Utility tools
- `/instructors-portal/*` — Instructor-only section
- `/leadership-portal` — Leadership analytics
- `/licensing-management` — SuperAdmin license management
- `/superadmin-dashboard` — SuperAdmin overview

### Auth Context
`client/src/auth-isolated/auth-context.tsx` provides a React context with:
- `user` — current user object (null if not logged in)
- `login(email, password)` — calls `/api/isolated-auth/login`
- `logout()` — calls `/api/isolated-auth/logout`
- `isLoading` — auth check in progress flag

On mount, the context hits `/api/isolated-auth/status` to rehydrate the session from the cookie.

### Data Fetching Pattern
- **TanStack Query** for all server state
- Mutations use `useMutation` with `queryClient.invalidateQueries` on success
- Some pages (especially the Leadership Portal and Workforce Analytics) use `useState` + `useEffect` with raw `fetch()` calls for more complex multi-source data aggregation

### Component Library
shadcn/ui components live in `client/src/components/ui/` and include: Button, Card, Dialog, Table, Select, Input, Progress, Badge, Tabs, Sheet, Toast, Avatar, Calendar, Chart, and ~30 more.

---

## 10. Load Planning Tool

The load planning tool is a significant feature built specifically for loadmaster operations.

**Aircraft supported:**
- C-130 Hercules
- C-17 Globemaster
- C-27J Spartan
- KC-30A Multi Role Tanker Transport

**Features:**
- Visual cargo grid representing the aircraft floor plan
- Cell-by-cell cargo placement with weight tracking
- Centre of gravity (CG) calculation
- Balance indicator showing CG position
- Pallet configuration options
- Dangerous goods flag integration
- Load summary with weight totals
- PDF export of the load plan

**Key components:**
- `load-planning-page.tsx` — main orchestrator
- `CargoGridCell.tsx` — individual grid cell
- `CargoManifestForm.tsx` — cargo entry form
- `BalanceIndicator.tsx` — CG visualisation
- `LoadSummary.tsx` — totals and summary
- `aircraft-grids/` — per-aircraft grid layouts (C130Grid, C17Grid, C27JGrid, KC30AGrid)

---

## 11. Squadrons & Organisational Structure

```
AMG (Air Mobility Group)
├── 33 SQN   — flying unit
├── 35 SQN   — flying unit
├── 36 SQN   — flying unit
└── 37 SQN   — flying unit
```

- **AMG** is the admin/leadership container — superadmin and leadership users are assigned to AMG
- The four numbered squadrons are the operational flying units where loadmasters and instructors belong
- Squadron is stored on the `licenses` table and propagated through the system
- Most analytics can be filtered by squadron

**Category levels (seniority):**
- `D` — junior / new entry
- `C` — mid-level
- `B` — senior
- `A` — most senior

---

## 12. Training System

### Training Modules
- Modules are defined in the codebase (not a database table for the module metadata itself)
- Each module has a `moduleId` referenced by videos and content records
- Modules contain: reading content, embedded videos, and an end-of-module quiz/assessment
- Videos are uploaded by instructors (up to 3 per module, ordered 1–3)
- Dynamic content is managed via `training_module_content` table (PostgreSQL)

### Quizzes
1. Instructor creates a quiz, specifying: title, question count, categories to draw from
2. System draws `question_count` questions randomly from the `quiz_questions` table filtered by the selected categories
3. User takes quiz — answers stored as `{questionId, answeredOption}[]`
4. Score calculated server-side on submission
5. Results visible to user and instructor

### Scenarios
1. Instructor creates a scenario with questions (multiple-choice or free-text)
2. User submits answers
3. Instructor reviews and marks free-text answers, providing feedback
4. `passed` boolean and `score` set by instructor
5. `submission_type` distinguishes training (practice) from assessment (graded)

### Documents / Forms
1. Instructor creates a form template with custom fields
2. User fills in and submits the form
3. Submission stored as JSON form data

### Checklists (QRH)
1. Instructor creates checklist for a specific aircraft type
2. Optional linear progression enforcement (QRH mode — must complete in order)
3. User works through checklist, checking off items
4. Each step completion is timestamped in `checklist_step_audit`
5. Completion record stored in `checklist_completions`

---

## 13. Analytics & Dashboards

### Instructor Analytics Portal (`/instructors-portal/analytics`)
- Topic mastery radar/bar charts (quiz scores by category)
- Question difficulty matrix (per-question success rates)
- Student vs. squadron performance comparison
- Module completion rates
- Certification readiness overview (qual expiries)
- At-risk student identification (risk scoring)
- Flight hours trends and totals

### Workforce Analytics (`/instructors-portal/workforce-analytics`)
- Full personnel view across all squadrons
- Individual user drill-down
- Qualification/currency status matrix
- ICC Power Law learning curves (score vs. time in role)
- Expiring qualification alerts with urgency tiering

### Leadership Portal (`/leadership-portal`)
- Squadron readiness % bars (green ≥ 85%, orange < 85%)
- Readiness trend over time (historical snapshots)
- KPI cards: overall readiness %, trend direction, best/worst day
- Safety record summary
- Flight hours aggregates
- Qualification forecast (upcoming expiries)
- AI-assisted summary via OpenAI integration (GPT-4o)
- Chat interface for querying data

---

## 14. Notifications & Email

- **In-app notifications** for scenario submission marking (instructor marks → user sees notification badge)
- `notification_seen` boolean on `scenario_submissions`
- **Email** via SendGrid for license-related events (creation, expiry warnings)
- Email service is in `server/services/email-service.ts`

---

## 15. AI Integration

- **OpenAI SDK** (`openai` npm package) is installed
- Used in the Leadership Portal for natural language query/summary of readiness data
- The AI receives structured readiness context and generates human-readable summaries

---

## 16. Mobile App

A React Native / Expo mobile app exists under `/mobile-app/` but is **not currently deployed**. It includes:
- Screen components (Profile, Quizzes, Scenarios, Tools, etc.)
- Offline data service for caching
- Analytics and performance services
- Its own EAS build configuration (`eas-cli` in dependencies)

---

## 17. Known Architectural Notes for Future Development

1. **Sessions are in-memory** — a server restart logs everyone out. To fix: migrate sessions to a Redis store or a `pg-session-store` backed by the existing PostgreSQL database.

2. **Single database** — dev and prod share the same Neon instance. To fix: provision a separate Neon database for production via Replit deployment settings.

3. **`isFlightReady` is manual** — squadron readiness is driven by a boolean that a person or instructor sets manually. Future work: auto-derive readiness from qualifications currency, medical status, and training completion.

4. **Routes file is very large** — `server/routes.ts` is 5,532 lines. It should be progressively split into domain-specific route files under `server/routes/`.

5. **No automated tests** — there is no test suite. Playwright is installed but only used for agent-driven e2e verification during development.

6. **File storage is on-disk** — uploaded videos and photos are stored on the Replit container's local filesystem. This is ephemeral and not suitable for production scale. Should migrate to object storage (S3-compatible).

7. **`shared/schema.ts` is the single source of truth** — both the backend (Drizzle queries) and the frontend (TypeScript types, Zod validation) import from this file. Any database schema change must go here first, then `npm run db:push`.

8. **Static question bank** — `shared/quiz-questions.ts` contains the original hardcoded question pool. The editable `quiz_questions` table in the database is the live question bank. Both exist; the database one takes precedence when populated.

---

## 18. Environment Variables / Secrets

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Individual PG connection components |
| `SESSION_SECRET` | Express session secret (legacy, may not be actively used) |
| `SENDGRID_VERIFIED_SENDER` | Verified sender email for SendGrid |
| `SUPERADMIN_EMAIL` (optional) | Override default superadmin email |
| `SUPERADMIN_PASSWORD` (optional) | Override default superadmin password |
| `OPENAI_API_KEY` (if configured) | OpenAI API for leadership portal AI features |

---

## 19. Build & Run Commands

```bash
# Development (hot reload)
npm run dev              # Runs: NODE_ENV=development tsx server/index.ts
                         # Vite HMR + Express on same port (5000)

# Production build
npm run build            # Vite build (frontend) + esbuild (server)
npm run start            # node dist/index.js

# Database
npm run db:push          # Apply schema changes to Neon database (drizzle-kit)

# Type check
npm run check            # tsc --noEmit
```

---

*This document was auto-generated from codebase analysis on 30 July 2026.*
