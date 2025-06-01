# LOADMworkflow - Military Logistics Training Platform

## Overview
A comprehensive military logistics and training management platform designed for loadmaster operations, featuring advanced authentication, role-based access controls, and comprehensive analytics.

## Architecture
- **Frontend**: React + TypeScript + Shadcn/ui
- **Backend**: Express.js + TypeScript  
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom isolated session management
- **Deployment**: Replit-ready configuration

## Key Features
- Role-based access control (Superadmin, Instructor, Student)
- Advanced analytics dashboard with performance tracking
- Quiz and scenario management system
- Document submission and review system
- Real-time chat functionality
- Comprehensive licensing system

## Security Features
- Isolated authentication system
- Secure session management
- Input validation and sanitization
- Role-based API protection
- Secure password handling with bcrypt

## Database Schema
See `shared/schema.ts` for complete database schema including:
- User management and licensing
- Quiz and scenario systems
- Submission tracking
- Analytics data

## Development
```bash
npm install
npm run dev
```

## Production Deployment
Ready for deployment on Replit with automatic SSL and health checks.

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `SENDGRID_API_KEY` - SendGrid API key for email services

## License
Proprietary - Digital Dynamics