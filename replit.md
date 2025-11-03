# LOADMworkflow - Military Logistics Training Platform

## Overview
LOADMworkflow is a comprehensive military logistics training and management platform for loadmaster operations. It provides advanced aircraft load planning, training modules, quiz systems, and analytics for military aviation logistics, aiming to enhance training efficiency and operational readiness.

## Recent Changes (November 3, 2025)
- **Navigation Bar Enhancements** (Nov 3 - Latest): 
  - Home button made 15% larger than other navigation buttons (w-[97px] h-[97px] vs w-[84px] h-[84px]) for improved prominence
  - Home button positioned in middle (4th of 7 buttons)
  - Button order: Scenarios, Airframe, Documents, Home, Profile, Tools, Instructor
  - Maintains dark theme consistency with orange active states
- **Qualifications Management Enhancements** (Nov 3 - Latest):
  - Added "No End Date" toggle option in Add and Edit Qualification dialogs for qualifications without expiry
  - Updated expiring soon threshold from 30 days to 90 days (3 months)
  - Implemented automatic sorting: expiring soon → expired → current → no expiry
  - Added full edit functionality with Edit buttons and edit dialogs
  - Qualifications display status indicators: Current (green), Expiring Soon (yellow, 90 days), Expired (red), No Expiry (blue)
  - Enhanced date handling with proper Date object conversion before API calls
- **Flight Records Management Enhancements** (Nov 3 - Latest):
  - Added full edit functionality with Edit buttons and edit dialogs
  - Dual-unit cargo weight support (kg/lbs) in both add and edit flows
  - Unit selector dropdown with automatic conversion (1 lb = 0.453592 kg, rounded to nearest integer)
  - All weights stored in kg in database for consistency
  - Extended flight records with three new fields: callsign (text), night hours (decimal), and day hours (decimal)
  - Hours tracked with 1 decimal point precision (step 0.1) for accurate flight time logging
  - All new fields available in both Add Flight and Edit Flight dialogs
  - Added 25 sample flight records with diverse RAAF bases, military ranks, and varied data
  - Enhanced date handling with proper Date object conversion before API calls
  - **Flight Statistics Dashboard**: Added real-time calculated statistics in Essential Information panel
    - Total Flight Hours (sum of night + day hours with 1 decimal place)
    - Night Hours and Day Hours displayed side-by-side
    - Total Cargo Carried (kg) with comma formatting
    - Total Passengers Carried with comma formatting
    - Statistics auto-update when flight records are added, edited, or deleted
    - Modern, sleek design with dividers and plane icon header matching DDG branding
- **Complete User Profile Redesign** (Nov 3): Rebuilt user profile page with modern dark theme matching login aesthetic
  - Implemented three-tab interface: Qualifications, Activity History, Flight Records
  - Added qualifications/currencies tracking with full add/edit/delete functionality
  - Added flight records management with detailed flight information (route, captain, passengers, cargo)
  - Implemented inline editing for user stats (squadron, category, total missions flown, total cargo weight)
  - Dark grey (#1a1a1a, #2a2a2a) backgrounds with orange accents matching DDG branding
  - Removed achievements and streak counters per user request
- **Database Schema Updates** (Nov 3): 
  - Added `user_qualifications` table with nullable expiry_date for "No End Date" support
  - Added `flight_records` table (date, callsign, departure, arrival, captain, passengers_carried, cargo_weight, night_hours, day_hours)
  - Added `total_missions_flown` and `total_cargo_weight` fields to licenses table
  - Extended flight_records with callsign (text, nullable), night_hours (real), and day_hours (real) columns
  - Fixed date validation using z.coerce.date() for proper date string handling
- **API Enhancements** (Nov 3): 
  - Added REST endpoints for qualifications: GET, POST, PUT, DELETE with authentication
  - Added REST endpoints for flight records: GET, POST, PUT, DELETE with authentication
  - PUT endpoints enable full edit functionality for both qualifications and flight records
  - All endpoints properly validate data using Zod schemas

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