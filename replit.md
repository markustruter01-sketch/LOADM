# LOADMworkflow - Military Logistics Training Platform

## Overview
LOADMworkflow is a comprehensive military logistics training and management platform for loadmaster operations. It provides advanced aircraft load planning, training modules, quiz systems, and analytics for military aviation logistics, aiming to enhance training efficiency and operational readiness. The platform aims to be a leading solution in military aviation logistics, improving preparedness and training outcomes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built with a React 18 frontend using TypeScript, Shadcn/ui, Tailwind CSS, and TanStack React Query. The backend is an Express.js server with TypeScript, utilizing Drizzle ORM and PostgreSQL. A custom, isolated session-based authentication system with role-based access (SuperAdmin, Instructor, Student) is implemented.

**UI/UX Decisions:**
- Modern dark theme with orange accents consistent with DDG branding.
- Clean, minimalist design for logos and navigation elements.
- Navigation bar features a prominent, larger Home button centered among other navigation items.
- Interactive elements like calculator quick links and login screens feature dark grey gradients and orange hover effects.
- User profile pages feature a four-tab interface (Qualifications, Activity History, Flight Records, Workbooks).
- Chat system displays circular user profile photos.
- Workforce analytics dashboard uses a single-page layout with distinct sections and a critical alert banner.

**Technical Implementations:**
- **Aircraft Load Planning Engine**: Supports C-130, C-17, C-27J, KC30A with physics-based weight and balance calculations, cargo management, and a visual drag-and-drop interface.
- **Training & Assessment System**: Dynamic quiz engine, interactive training scenarios, and a document management system with integrated PDF viewer.
- **Analytics & Reporting**: Real-time performance metrics for students and squadrons, instructor dashboard, and AI-powered insights, including workforce readiness, flight operations, qualifications, and safety compliance. Features historical workforce readiness trends, qualification renewal forecasting, and ICC Power Law Distribution charts for performance metrics.
- **User Profile Management**: Features for tracking qualifications (with "No End Date" support, 90-day expiry threshold, and status indicators), managing detailed flight records (dual-unit cargo weight, callsign, night/day hours, auto-calculated statistics), and profile photo uploads.
- **PDF Viewer**: Uses Express-served worker files for stable document rendering.
- **API Endpoints**: Comprehensive RESTful APIs for managing qualifications, flight records, safety records, and analytics data, with Zod schema validation.
- **Data Integrity**: Data Audit Modal provides blockchain-style visualization using SHA-256 hashing for immutable audit trails.
- **Safety Occurrence Management System**: Full CRUD system for safety records with detailed aviation-specific fields and reporting.
- **Deletion Activity Log**: Tracks all destructive deletions across the platform with an auditable log.

## External Dependencies
- **Database**: PostgreSQL (via Neon serverless)
- **Email Service**: SendGrid
- **AI Integration**: OpenAI GPT-4o
- **Frontend Libraries**: Radix UI, React Hook Form (with Zod), Chart.js, PDF.js, Lucide React
- **Backend Libraries**: Express-session
- **Deployment**: Node.js 20