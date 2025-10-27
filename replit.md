# LOADMworkflow - Military Logistics Training Platform

## Overview
LOADMworkflow is a comprehensive military logistics training and management platform for loadmaster operations. It provides advanced aircraft load planning, training modules, quiz systems, and analytics for military aviation logistics, aiming to enhance training efficiency and operational readiness.

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