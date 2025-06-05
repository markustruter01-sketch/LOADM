# LOADMworkflow - Military Logistics & Training Management Platform

A comprehensive aircraft load planning and operational readiness simulation platform designed for military logistics training and assessment.

## Features

- **Advanced Load Planning**: Precise aircraft cargo positioning with center of gravity calculations
- **Multi-Aircraft Support**: C-17, C-130, C-27J, KC30A aircraft configurations
- **AI-Powered Assistant**: Load planning optimization and safety recommendations
- **PDF Export**: Generate and email detailed load plans with visual layouts
- **Training Modules**: Interactive exercises and scenario-based learning
- **Instructor Portal**: Student submission management and feedback system
- **Analytics Dashboard**: Performance tracking across squadrons (33, 35, 36, 37)
- **Document Management**: Comprehensive PDF viewing and sharing capabilities
- **Real-time Chat**: In-app communication system
- **User Management**: Role-based access (Students, Instructors, Super Admins)

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session management
- **File Processing**: PDF.js for document viewing, jsPDF for generation
- **Email**: SendGrid integration for notifications
- **Real-time**: WebSocket connections for chat functionality

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- SendGrid API key (for email functionality)
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd loadmworkflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/loadmworkflow
   SENDGRID_API_KEY=your_sendgrid_api_key_here
   SESSION_SECRET=your_secure_session_secret
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Database Schema

The application uses Drizzle ORM with PostgreSQL. Key tables include:

- `users`: User accounts with role-based permissions
- `documents`: PDF documents and training materials
- `submissions`: Student submission tracking
- `phone_directory`: Contact information management
- `load_plans`: Saved aircraft load configurations

## API Endpoints

### Authentication
- `POST /auth-isolated/login` - User login
- `POST /auth-isolated/logout` - User logout
- `GET /auth-isolated/user` - Get current user

### Documents
- `GET /api/documents` - List all documents
- `POST /api/documents` - Upload new document
- `GET /api/documents/:id` - Get specific document

### Load Planning
- `POST /api/send-load-plan-email` - Email load plan PDF

### Analytics
- `GET /api/admin/statistics` - Dashboard statistics
- `GET /api/submissions` - Get all submissions

## Deployment

### Environment Variables for Production
```env
DATABASE_URL=your_production_database_url
SENDGRID_API_KEY=your_sendgrid_api_key
SESSION_SECRET=your_secure_session_secret
NODE_ENV=production
```

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utility functions
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── auth-isolated/     # Authentication logic
│   └── storage.ts         # Database interface
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema definitions
├── public/                # Static assets
└── attached_assets/       # User-uploaded files
```

## Key Features Detail

### Aircraft Load Planning
- Visual cargo bay layouts for different aircraft types
- Real-time center of gravity calculations
- Weight distribution optimization
- Dangerous goods compliance checking

### Training System
- Scenario-based exercises
- Progress tracking and analytics
- Instructor feedback mechanisms
- Squadron-based organization

### Document Management
- PDF viewing with modal interfaces
- Document sharing and email capabilities
- Version control and access management

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is designed for military training purposes. Contact the development team for licensing information.

## Support

For technical support or feature requests, please create an issue in the GitHub repository.

## Security

- Session-based authentication with secure cookies
- Role-based access control
- Input validation and sanitization
- SQL injection prevention with parameterized queries

## Performance

- Optimized React components with proper memoization
- Database query optimization
- Lazy loading for large documents
- Efficient WebSocket connections for real-time features