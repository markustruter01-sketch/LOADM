# LOADMworkflow - Military Logistics Training Platform

## Overview
LOADMworkflow is a comprehensive military logistics training and management platform for loadmaster operations. It provides advanced aircraft load planning, training modules, quiz systems, and analytics for military aviation logistics, aiming to enhance training efficiency and operational readiness. The platform aims to be a leading solution in military aviation logistics, improving preparedness and training outcomes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built with a React 18 frontend using TypeScript, Shadcn/ui, Tailwind CSS, and TanStack React Query for state management. The backend is an Express.js server with TypeScript, utilizing Drizzle ORM and PostgreSQL. A custom, isolated session-based authentication system with role-based access (SuperAdmin, Instructor, Student) is implemented.

**UI/UX Decisions:**
- Modern dark theme with orange accents consistent with DDG branding.
- Clean, minimalist design for logos and navigation elements.
- Navigation bar features a prominent, larger Home button centered among other navigation items (Scenarios, Airframe, Documents, Profile, Tools, Instructor).
- Interactive elements like calculator quick links and login screens feature dark grey gradients and orange hover effects.
- User profile pages are redesigned with a three-tab interface (Qualifications, Activity History, Flight Records) for organized data.
- Chat system displays circular user profile photos.
- Workforce analytics dashboard uses a single-page layout with distinct sections and a critical alert banner.

**Technical Implementations:**
- **Aircraft Load Planning Engine**: Supports C-130, C-17, C-27J, KC30A with physics-based weight and balance calculations, cargo management, and a visual drag-and-drop interface.
- **Training & Assessment System**: Dynamic quiz engine, interactive training scenarios, and a document management system with integrated PDF viewer.
- **Analytics & Reporting**: Real-time performance metrics for students and squadrons, instructor dashboard, and AI-powered insights, including workforce readiness, flight operations, qualifications, and safety compliance. Features historical workforce readiness trends (30/60/90-day views with daily snapshots), qualification renewal forecasting (6-month projections with critical alerts and recommendations), and ICC Power Law Distribution charts showing S-curves for 5 performance metrics (Assessments Passed, Flight Hours, Active Qualifications, Average Score, Cargo Weight) across time-in-role by squadron.
- **User Profile Management**: Features for tracking qualifications (with "No End Date" support, 90-day expiry threshold, and status indicators), managing detailed flight records (dual-unit cargo weight, callsign, night/day hours, auto-calculated statistics), and profile photo uploads.
- **PDF Viewer**: Uses Express-served worker files for stable document rendering.
- **API Endpoints**: Comprehensive RESTful APIs for managing qualifications, flight records, safety records, and analytics data, with Zod schema validation.

## External Dependencies
- **Database**: PostgreSQL (via Neon serverless)
- **Email Service**: SendGrid
- **AI Integration**: OpenAI GPT-4o
- **Frontend Libraries**: Radix UI, React Hook Form (with Zod), Chart.js, PDF.js, Lucide React
- **Backend Libraries**: Express-session
- **Deployment**: Node.js 20, PostgreSQL 16 on Replit

## Deployment Notes (January 2026)
- **Authentication**: Isolated session-based auth with bcrypt password hashing. Superadmin credentials configurable via environment variables (SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD) for production security.
- **Database**: 30 tables across 6 domains with proper foreign key relationships. All migrations run via `npm run db:push`.
- **Data Integrity**: Data Audit Modal provides blockchain-style visualization using SHA-256 hashing for immutable audit trails.
- **Quiz Routes**: Unified under `/api/quizzes` and `/api/quiz` endpoints via `quiz-unified.ts`.
- **Accessibility**: DialogDescription components added to modals for screen reader support.
- **Readiness Snapshots**: Automatic daily snapshots capture workforce readiness metrics.
- **License Expiry**: Periodic checks every 4 hours for expired licenses.
- **Session Management**: In-memory session store with session preservation on restart.

## Production Deployment Checklist
1. Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD environment variables (required for production auth)
2. Ensure DATABASE_URL points to production PostgreSQL database
3. Run `npm run db:push` to sync schema
4. Configure SENDGRID_VERIFIED_SENDER for email notifications
5. Review license expiry settings and readiness snapshot schedules

## Recent Changes (January 28, 2026)
- **Leadership Role Implementation**: Added new "Leadership" role with read-only observation access
  - Leadership users have same view access as instructors but cannot make changes (read-only mode)
  - Leadership users are hidden from instructor views, reports, and analytics (only visible to SuperAdmin)
  - New permissions helper functions: `filterForInstructorView()` and `canSeeUser()` in permissions.ts
  - New `useReadOnlyMode` hook for Leadership toast notifications
- **Enhanced Permissions Dashboard** (at /permissions-dashboard):
  - 4 functional role toggles: Loadmaster (green), Instructor (blue), Leadership (amber), Super Admin (purple)
  - Real-time role updates via PATCH /api/licensing/licenses/:id/role endpoint
  - Stats cards showing counts by role type
  - Search and filter functionality by role
- **Realistic Test Data Created**: 150 user profiles with performance data
  - 40 loadmasters + 30 instructors + 80 additional loadmasters
  - All assigned to 33SQN, 35SQN, 36SQN, or 37SQN
  - Ranks from CPL to WO
  - 777 quiz submissions, 1744 flight records, 796 qualifications
  - Score distribution: 85% high performers (85-95%), 15% struggling (55-75%)

## Previous Changes (January 28, 2026)
- **Complete test data cleanup**: Deleted all test users and associated data
  - Removed 1,644 test users (testuser*, loadmaster.*.@raaf.mil.au, test_*@test.mil.au)
  - Removed 866 test licenses
  - Removed ~33,000 test records across scenario_submissions, quiz_submissions, flight_records, user_qualifications, and safety_records
- Platform now contains only legitimate user data from 11 real accounts with licenses
- Analytics and performance features will show real data only (some sections may appear empty until real usage generates data)

## Recent Changes (January 27, 2026)
- Removed loadmaster character image from scenarios page
- Added DialogDescription to Data Audit Modal and Instructor Portal modals for accessibility
- Verified instructor portal CRUD operations (scenarios, quizzes) working end-to-end
- Confirmed Data Audit Modal displays real-time submission data with month navigation