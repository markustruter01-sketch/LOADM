# LOADMworkflow - Military Logistics Training Platform

## Overview
LOADMworkflow is a comprehensive military logistics training and management platform for loadmaster operations. It provides advanced aircraft load planning, training modules, quiz systems, and analytics for military aviation logistics, aiming to enhance training efficiency and operational readiness.

## Recent Changes (November 3, 2025)
- **Complete User Profile Redesign** (Nov 3): Rebuilt user profile page with modern dark theme matching login aesthetic
  - Implemented three-tab interface: Qualifications, Activity History, Flight Records
  - Added qualifications/currencies tracking with add/delete functionality and expiry status indicators (Current/Expiring Soon/Expired)
  - Added flight records management with detailed flight information (route, captain, passengers, cargo)
  - Implemented inline editing for user stats (squadron, category, total missions flown, total cargo weight)
  - Dark grey (#1a1a1a, #2a2a2a) backgrounds with orange accents matching DDG branding
  - Removed achievements and streak counters per user request
- **Database Schema Updates** (Nov 3): 
  - Added `user_qualifications` table (name, start_date, expiry_date)
  - Added `flight_records` table (date, departure, arrival, captain, passengers_carried, cargo_weight)
  - Added `total_missions_flown` and `total_cargo_weight` fields to licenses table
  - Fixed date validation using z.coerce.date() for proper date string handling
- **API Enhancements** (Nov 3): Added REST endpoints for qualifications and flight records (GET, POST, DELETE) with proper authentication middleware

## Previous Changes (October 30-31, 2025)
- **Company Logo Update** (Oct 31): Replaced header logo with new DDG logo
- **Fixed Student Submissions Sorting** (Oct 30): Backend API now sorts by submission date DESC; frontend displays pending review (newest first) then reviewed (newest first)
- **Enhanced Quiz UX**: Implemented full-area clickable answer options and moved results to bottom of page with auto-scroll on submission
- **Modernized UI Design**: Updated header with transparent glass effect (backdrop-blur-md) matching navigation buttons, enlarged user profile icon by 50%; chat bubble moved higher and window enlarged by 40%
- **Chat Positioning**: Moved chat bubble above navigation bar for better accessibility
- **Fixed PDF Viewing in Mission Documents** (Oct 28): Resolved Chrome blocking issue by replacing iframe with HTML object tag and implementing overlay-based loading indicator

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
The platform is built with a React 18 frontend using TypeScript, Shadcn/ui, Tailwind CSS, and TanStack React Query for state management. The backend is an Express.js server with TypeScript, utilizing Drizzle ORM and PostgreSQL. A custom, isolated session-based authentication system with role-based access (SuperAdmin, Instructor, Student) is implemented.

Key features include:
- **Multi-Aircraft Load Planning Engine**: Supports C-130, C-17, C-27J, KC30A with advanced physics-based weight and balance calculations, comprehensive cargo management, and a visual drag-and-drop interface.
- **Training & Assessment System**: Features a dynamic quiz engine with loadmaster-specific questions, interactive training scenarios, a document management system for military PDFs, and progress tracking.
- **Analytics & Reporting**: Offers real-time performance metrics for students and squadrons, an instructor dashboard, and AI-powered insights.
- **Mission Documents**: A comprehensive system for managing mission data, including aircraft call signs, crew details, dangerous goods flagging, and attachment of relevant PDF documents.

## External Dependencies
- **Database**: PostgreSQL (via Neon serverless)
- **Email Service**: SendGrid
- **AI Integration**: OpenAI GPT-4o
- **Frontend Libraries**: Radix UI, React Hook Form (with Zod), Chart.js, PDF.js, Lucide React
- **Backend Libraries**: Express-session
- **Deployment**: Node.js 20, PostgreSQL 16 on Replit, configured with environment variables for database, API keys, and session secrets.