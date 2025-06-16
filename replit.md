# LOADMworkflow - Military Logistics Training Platform

## Overview

LOADMworkflow is a comprehensive military logistics training and management platform specifically designed for loadmaster operations. The application provides advanced aircraft load planning capabilities, training modules, quiz systems, and comprehensive analytics for military aviation logistics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query v5 for server state management
- **UI Framework**: Shadcn/ui components with Tailwind CSS
- **Build System**: Vite with optimized production builds
- **Styling**: Custom CSS variables with dark theme support

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Isolated custom session-based authentication system
- **Session Storage**: In-memory session management with secure cookie handling
- **API Structure**: RESTful endpoints with comprehensive validation

## Key Components

### Authentication System
- **Isolated Authentication**: Custom-built authentication system completely separate from main application logic
- **Session Management**: Secure session handling with httpOnly cookies
- **Role-Based Access**: Support for SuperAdmin, Instructor, and Student roles
- **Password Security**: bcrypt hashing with salt rounds
- **License Integration**: Authentication tied to licensing system with expiry management

### Load Planning Engine
- **Multi-Aircraft Support**: C-130, C-17, C-27J, KC30A configurations
- **Balance Calculations**: Advanced physics-based weight and balance calculations
- **Cargo Management**: Comprehensive cargo type classification including dangerous goods
- **Visual Interface**: Drag-and-drop pallet positioning with real-time balance feedback

### Training & Assessment System
- **Quiz Engine**: Dynamic quiz generation with 97+ loadmaster-specific questions
- **Scenario Management**: Interactive training scenarios with submission tracking
- **Document System**: PDF viewing and management for military documentation
- **Progress Tracking**: Comprehensive analytics for student performance

### Analytics & Reporting
- **Performance Metrics**: Real-time tracking of student progress and quiz scores
- **Squadron Analytics**: Performance breakdown by squadron (33, 35, 36, 37, AMG)
- **Instructor Dashboard**: Comprehensive tools for managing students and reviewing submissions
- **Advanced Analytics**: AI-powered insights and recommendations

## Data Flow

### Authentication Flow
1. User submits credentials via isolated auth routes
2. System validates against license database with expiry checking
3. Session created and stored in memory with secure cookie
4. All subsequent requests validated through unified auth middleware
5. Session cleanup and expiry handled automatically

### Training Content Flow
1. Instructors create quizzes and scenarios through admin interface
2. Content stored in PostgreSQL with proper validation
3. Students access active content based on role permissions
4. Submissions tracked with comprehensive metadata
5. Analytics generated from submission data

### Load Planning Flow
1. User selects aircraft configuration
2. Drag-and-drop interface for cargo positioning
3. Real-time balance calculations using physics engine
4. AI assistant provides optimization recommendations
5. Final plans can be exported to PDF format

## External Dependencies

### Core Services
- **Database**: PostgreSQL with Neon serverless connection
- **Email Service**: SendGrid for notifications and welcome emails
- **AI Integration**: OpenAI GPT-4o for intelligent assistance and analytics

### Frontend Libraries
- **UI Components**: Radix UI primitives with custom styling
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Chart.js for analytics visualization
- **PDF Handling**: PDF.js for document viewing
- **Icons**: Lucide React icon library

### Backend Dependencies
- **WebSocket**: Real-time chat functionality
- **Session Store**: Express-session with PostgreSQL store
- **File Processing**: Image processing and PDF generation capabilities
- **Security**: Comprehensive input validation and sanitization

## Deployment Strategy

### Replit Configuration
- **Environment**: Node.js 20 with PostgreSQL 16
- **Deployment**: Autoscale deployment target with health checks
- **Build Process**: Vite production build with Express server compilation
- **Port Configuration**: Port 5000 for main application, 3000 for development

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required)
- `SENDGRID_API_KEY`: Email service API key
- `OPENAI_API_KEY`: AI service integration
- `SESSION_SECRET`: Secure session encryption key

### Security Measures
- **Input Validation**: Zod schemas for all API endpoints
- **Authentication**: Secure session management with role-based access
- **CORS**: Properly configured for production environment
- **Environment Isolation**: Sensitive credentials managed through environment variables

### Performance Optimizations
- **Code Splitting**: Automatic chunking through Vite
- **Query Optimization**: Efficient database queries with proper indexing
- **Caching**: React Query caching strategies for optimal performance
- **Asset Optimization**: Minified and compressed production assets

## Changelog

- June 16, 2025. Initial setup
- June 16, 2025. Fixed comprehensive squadron management system:
  - Resolved authentication middleware blocking frontend from loading
  - Standardized squadron auto-fill functionality in submission forms
  - Added missing submission viewing API route
  - Unified authentication middleware across all endpoints
  - Squadron values standardized (33SQN, 35SQN, 36SQN, 37SQN, AMG)
- June 16, 2025. Enhanced quiz questions management system:
  - Fixed quiz questions page crash by resolving component type mismatches
  - Added 3 additional weight-balance questions (now 15 total)
  - Fixed instructor feedback text color to black for better readability
  - Updated badge colors: Pass = green, Fail = orange
  - Increased activity history tabs to show 10 submissions per category
  - Fixed dynamic status counters to calculate from real submission data
  - Resolved duplicate key console error by fixing duplicate question ID "eh-7"
  - Updated UI backgrounds to match app's consistent grey styling
- June 16, 2025. Completed full CRUD functionality for quiz questions:
  - Fixed header text color to white for better visibility
  - Implemented complete edit functionality with working edit buttons
  - Added proper form dialogs for adding and editing questions
  - Added delete functionality with confirmation prompts
  - Added backend API endpoints for POST, PUT, and DELETE operations
  - Fixed layout width constraints (max-w-6xl) for optimal display

## User Preferences

Preferred communication style: Simple, everyday language.