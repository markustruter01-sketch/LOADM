# LOADMworkflow Production Deployment Guide

## Overview
This document provides production deployment guidelines for both the web application and mobile iPad app.

## Web Application Deployment

### Current Status
✅ **Production Ready**

### Deployment Platform
- **Platform**: Replit Autoscale Deployment
- **Domain**: `https://46964af9-bf0d-46cd-84c7-e19697f9daab-00-17jq3m1pxsynh.worf.replit.dev`
- **Port**: 5000
- **Database**: PostgreSQL (Neon-backed)

### Environment Variables Required
```env
DATABASE_URL=<PostgreSQL connection string>
SENDGRID_API_KEY=<SendGrid API key for email>
OPENAI_API_KEY=<OpenAI API key for AI features>
SESSION_SECRET=<Secure random string for session encryption>
```

### Production Checklist
- [x] No hardcoded localhost or development URLs
- [x] Environment variables properly configured
- [x] Authentication system with secure session management
- [x] Database migrations handled via Drizzle ORM
- [x] Static file serving for PDFs configured
- [x] CORS properly configured
- [x] Error handling implemented
- [x] Authorization checks on all protected routes

### Deployment Command
```bash
# Replit handles deployment automatically
# Application runs via: npm run dev (which uses tsx for TypeScript execution)
```

---

## Mobile Application Deployment (iPad)

### Current Status
✅ **Production Ready** (after October 27, 2025 fixes)

### Critical Production Fix (October 27, 2025)
**Issue**: Mobile app had hardcoded `localhost:5000` URLs that would completely break in production.
**Fix**: Implemented centralized API configuration with environment-aware URL selection.

### Production Configuration

#### API Configuration File
**Location**: `mobile-app/src/config/api.ts`

**IMPORTANT**: Before building for App Store, verify this URL matches your production server:

```typescript
// Production API URL - MUST BE UPDATED before App Store submission
const PRODUCTION_API_URL = 'https://46964af9-bf0d-46cd-84c7-e19697f9daab-00-17jq3m1pxsynh.worf.replit.dev';
```

### Environment Behavior
- **Development Mode** (`__DEV__ = true`): Uses `http://localhost:5000`
- **Production Mode** (`__DEV__ = false`): Uses production Replit URL
- **Automatic Selection**: React Native automatically sets `__DEV__` based on build type

### Build Process

#### iOS App Store Build
```bash
# Navigate to mobile app directory
cd mobile-app

# Verify production URL is correct in src/config/api.ts
# Check: PRODUCTION_API_URL constant

# Build for App Store using EAS
npm run build:ios

# Alternative: Production build with preview profile
npm run build:preview
```

### App Store Submission Checklist

#### Pre-Submission Configuration
- [ ] **Verify Production URL** in `mobile-app/src/config/api.ts`
- [ ] Confirm backend server is accessible via HTTPS
- [ ] Test authentication flow against production server
- [ ] Verify all API endpoints work with production URL
- [ ] Test offline-first functionality
- [ ] Validate PDF document loading from production

#### App Store Metadata
- **App Name**: LOADMworkflow
- **Bundle ID**: `com.loadmworkflow.training.new`
- **Version**: 1.0.0
- **Platform**: iOS (iPad only)
- **Orientation**: Landscape only
- **Category**: Education/Training
- **Target**: Military logistics training

#### Security & Compliance
- [x] Uses non-exempt encryption (set to false in config)
- [x] HTTPS for all production API calls
- [x] Secure credential storage (Expo SecureStore)
- [x] No hardcoded API keys or secrets
- [x] Offline-first architecture with SQLite

### Testing Before Release

#### Development Testing
1. Run app in development mode: `npm start`
2. Test on iPad simulator
3. Verify localhost connection works

#### Production Testing
1. Create production build
2. Install on physical iPad
3. Verify production API connection
4. Test all features end-to-end:
   - User authentication
   - Load planning
   - Quiz submission
   - Scenario completion
   - Document viewing
   - Chat functionality
   - Offline sync

### Post-Deployment Monitoring

#### Web Application
- Monitor error logs via Replit console
- Check database connection pool status
- Monitor API response times
- Track authentication failures (403 responses indicate potential authorization issues)

#### Mobile Application
- Monitor App Store Connect crash reports
- Track API connectivity issues
- Monitor offline sync queue performance
- Review user feedback for connectivity problems

### Troubleshooting

#### Mobile App Cannot Connect to Server
**Symptom**: App fails to authenticate or sync data  
**Diagnosis**:
1. Check mobile app config: `mobile-app/src/config/api.ts`
2. Verify `PRODUCTION_API_URL` matches deployed server
3. Confirm server is accessible via HTTPS
4. Test server endpoint manually: `curl https://your-server/api/auth/user`

**Solution**:
- Update `PRODUCTION_API_URL` in config file
- Rebuild and resubmit app to App Store
- Notify users to update to latest version

#### Authentication Failures
**Symptom**: Users cannot log in  
**Diagnosis**:
1. Check database connectivity
2. Verify license table has valid records
3. Check session management system
4. Review authentication middleware logs

**Solution**:
- Reset user password via SQL: `UPDATE users SET hashed_password = '<bcrypt_hash>' WHERE email = '<user_email>'`
- Check license expiry dates
- Verify session secret is consistent

### Security Best Practices

#### API Keys & Secrets
- Never commit API keys to repository
- Use Replit Secrets for sensitive environment variables
- Rotate SESSION_SECRET periodically
- Keep SENDGRID_API_KEY and OPENAI_API_KEY secure

#### Database
- Regular backups via Neon dashboard
- Use connection pooling for performance
- Monitor for SQL injection attempts
- Keep database schema migrations tracked

#### Mobile App
- API communication over HTTPS only
- Credentials stored in Expo SecureStore
- Offline data encrypted in SQLite
- No sensitive data in logs

### Deployment Timeline

#### Web Application
- Deploys automatically on Replit push
- Zero downtime deployment
- Database migrations via `npm run db:push`

#### Mobile Application
- App Store review: 1-3 days typical
- Critical updates: Request expedited review
- Force update mechanism: Not implemented (users must manually update)

### Support & Maintenance

#### Monitoring
- Web: Replit console logs
- Mobile: App Store Connect analytics
- Database: Neon dashboard metrics

#### Updates
- Web: Push to Replit (immediate deployment)
- Mobile: Build → Submit → Review → Release (1-3 day delay)

### Backup & Recovery

#### Database Backups
- Automated daily backups via Neon
- Manual backup: Export via Neon dashboard
- Restore: Contact Neon support or use backup restoration tools

#### Code Repository
- Version control via Git
- Replit automatic checkpoints
- Manual backups: Clone repository

---

## Contact & Support

For deployment issues or production emergencies:
1. Check this documentation first
2. Review Replit console logs
3. Check database connectivity
4. Verify environment variables
5. Review recent code changes

## Version History

### October 27, 2025
- Fixed critical mobile app production issue (hardcoded localhost URLs)
- Implemented centralized API configuration
- Added Mission Documents feature with security authorization
- Mobile app now production-ready for App Store deployment

### Previous Versions
- See replit.md for complete changelog
