# LOADMworkflow Mobile App Update Guide
**Last Updated:** January 28, 2026

## Overview
This guide documents updates made to sync the mobile app with the current web app state (January 2026).

---

## ✅ Completed Updates

### 1. Database Schema (Nov 4, 2025)
**File:** `mobile-app/src/contexts/DatabaseContext.tsx`

Added new tables to match web app schema:

```sql
-- User onboarding tracking
ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN rank TEXT;

-- User qualifications/currencies
CREATE TABLE IF NOT EXISTS user_qualifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  expiry_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Flight records
CREATE TABLE IF NOT EXISTS flight_records (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  date DATE NOT NULL,
  callsign TEXT,
  departure TEXT NOT NULL,
  arrival TEXT NOT NULL,
  captain TEXT NOT NULL,
  passengers_carried INTEGER DEFAULT 0,
  cargo_weight REAL DEFAULT 0,
  night_hours REAL DEFAULT 0,
  day_hours REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
```

**Status:** ✅ COMPLETE

---

### 2. Leadership Role Support (Jan 28, 2026)
**File:** `mobile-app/src/contexts/AuthContext.tsx`

Added support for the new Leadership role:
- Added `leadership` to LicenseType union
- Added `isReadOnlyMode` computed property (true for leadership/readonly users)
- Added `isLeadershipRole` computed property
- Added `rank` field to User interface
- Added `completeOnboarding()` method

**Status:** ✅ COMPLETE

---

### 3. API Configuration Update (Jan 28, 2026)
**File:** `mobile-app/src/config/api.ts`

Updated with all current web app API endpoints:

```typescript
export const API_ENDPOINTS = {
  // Authentication (Isolated Auth System)
  AUTH_LOGIN, AUTH_LOGOUT, AUTH_USER, AUTH_REGISTER, COMPLETE_ONBOARDING,
  
  // Quizzes (Unified endpoints)
  QUIZZES, QUIZ_BY_ID, QUIZ_QUESTIONS, QUIZ_SUBMISSIONS,
  
  // Scenarios
  SCENARIOS, SCENARIO_BY_ID, SCENARIO_SUBMISSIONS,
  
  // Documents
  DOCUMENTS, DOCUMENT_BY_ID,
  
  // User Profile & Qualifications
  USER_PROFILE, USER_QUALIFICATIONS, USER_QUALIFICATION_BY_ID,
  
  // Flight Records
  FLIGHT_RECORDS, FLIGHT_RECORD_BY_ID, FLIGHT_STATISTICS,
  
  // Safety Records
  SAFETY_RECORDS,
  
  // Chat, Load Plans, Checklists, Training Modules, Users, Analytics
  // ... (all endpoints documented in api.ts)
};
```

Added helper functions:
- `getAuthHeaders()` - Returns headers with session token

**Status:** ✅ COMPLETE

---

### 4. OfflineDataService Methods (Jan 28, 2026)
**File:** `mobile-app/src/services/OfflineDataService.ts`

Added complete CRUD methods for:

#### User Qualifications
```typescript
getUserQualifications(userId: number): Promise<Qualification[]>
saveQualification(qualification: Qualification): Promise<number>
updateQualification(id: number, qualification: Partial<Qualification>): Promise<void>
deleteQualification(id: number): Promise<void>
getExpiringQualifications(userId: number, daysThreshold: number): Promise<Qualification[]>
```

#### Flight Records
```typescript
getUserFlightRecords(userId: number): Promise<FlightRecord[]>
saveFlightRecord(record: FlightRecord): Promise<number>
updateFlightRecord(id: number, record: Partial<FlightRecord>): Promise<void>
deleteFlightRecord(id: number): Promise<void>
getFlightStatistics(userId: number): Promise<FlightStatistics>
```

#### Sync Queue Support
```typescript
getPendingQualifications(userId: number): Promise<any[]>
getPendingFlightRecords(userId: number): Promise<any[]>
markQualificationSynced(id: number): Promise<void>
markFlightRecordSynced(id: number): Promise<void>
```

**Status:** ✅ COMPLETE

---

### 5. SyncContext Updates (Jan 28, 2026)
**File:** `mobile-app/src/contexts/SyncContext.tsx`

Added bidirectional sync support for new tables:

```typescript
syncUserQualifications() - Upload pending & download latest qualifications
syncFlightRecords() - Upload pending & download latest flight records
```

Updated `syncData()` to call new sync functions.

**Status:** ✅ COMPLETE

---

### 6. User Profile Screen (Jan 28, 2026)
**File:** `mobile-app/src/screens/UserProfileScreen.tsx` (NEW)

Created comprehensive profile screen matching web app features:

#### Features Implemented:
- **Three-tab interface:**
  - Qualifications Tab (with add/view, status indicators)
  - Activity History Tab (all recent activities)
  - Flight Records Tab (with statistics dashboard)

- **Qualifications Management:**
  - List all qualifications with expiry dates
  - Add qualifications with modal form
  - Status indicators: Active (green), Expiring Soon (amber), Expired (red)
  - "No End Date" toggle for permanent qualifications

- **Flight Records Management:**
  - List all flight records
  - Add flight records with modal form
  - Display: date, callsign, departure, arrival, captain, passengers, cargo, night/day hours

- **Flight Statistics Dashboard:**
  - Total Flight Hours (auto-calculated)
  - Night Hours and Day Hours
  - Total Cargo Carried (with tons conversion)
  - Total Passengers Carried
  - Total Missions Flown (count)

- **Read-Only Mode Support:**
  - Add buttons hidden for Leadership users
  - Visual indicator when in read-only mode

**Status:** ✅ COMPLETE

---

### 7. Tools Screen (Jan 28, 2026)
**File:** `mobile-app/src/screens/ToolsScreen.tsx` (NEW)

Created tools and calculators navigation screen:

#### Features Implemented:
- **Quick Actions Bar:**
  - Load Plan, Manuals, Scenarios, Quizzes quick access

- **Calculator Tools:**
  - Fuel Calculator
  - WAM Calculator
  - Restraint Calculator
  - Vehicle CGFA Calculator
  - Box/Drum/Tire PSI Calculators
  - Pallet Builder

- **Checklists Section:**
  - Pre-Flight Checklist (placeholder)
  - Cargo Inspection (placeholder)
  - Safety Checklist (placeholder)

- **Leadership Mode:**
  - Read-only banner for Leadership users
  - Placeholder alerts for calculator interactions

**Status:** ✅ COMPLETE (UI ready, calculator logic pending)

---

### 8. Navigation Updates (Jan 28, 2026)
**File:** `mobile-app/App.tsx`

Registered new screens:
```typescript
<Stack.Screen name="Profile" component={UserProfileScreen} />
<Stack.Screen name="Tools" component={ToolsScreen} />
```

**Status:** ✅ COMPLETE

---

### 9. HomeScreen Updates (Jan 28, 2026)
**File:** `mobile-app/src/screens/HomeScreen.tsx`

Added new features:
- **Leadership Mode Banner:** Yellow warning banner for read-only users
- **Quick Access Bar:** Profile, Tools, Docs, Chat buttons at top
- **Profile Menu Item:** Navigate to profile with qualifications, records, activity
- **Tools Menu Item:** Navigate to tools and calculators
- **Avatar Integration:** Shows user initial with tap-to-profile navigation
- **Role Display:** Shows "Leadership (Read-Only)" for leadership users

**Status:** ✅ COMPLETE

---

## 🔄 Remaining Updates (Low Priority)

### 10. Onboarding Tour
**File:** `mobile-app/src/components/OnboardingTour.tsx` (NEW)

Create mobile-friendly onboarding tour similar to web app. Lower priority as functionality is complete.

**Estimated Time:** 3-4 hours  
**Priority:** LOW

---

### 11. Calculator Logic Implementation
**Files:** Individual calculator screens

Implement actual calculator logic for:
- Fuel Calculator
- WAM Calculator
- Restraint Calculator
- PSI Calculators

**Estimated Time:** 8-12 hours  
**Priority:** LOW (calculators can be phased release)

---

### 12. PDF Viewer Enhancement
**File:** `mobile-app/src/screens/DocumentsScreen.tsx`

Enhanced PDF viewing for iPad:
- Offline PDF caching
- Download progress indicator
- Better zoom controls

**Estimated Time:** 2-3 hours  
**Priority:** MEDIUM

---

## Testing Checklist

### ✅ Offline Functionality
- [x] Qualifications CRUD works offline
- [x] Flight records CRUD works offline
- [x] Data syncs when connection restored
- [ ] Conflict resolution testing needed

### ✅ User Profile
- [x] Statistics calculate correctly
- [x] Add qualifications
- [x] Add flight records
- [x] Tab navigation works
- [ ] Edit/delete functionality

### ✅ Leadership Mode
- [x] Read-only banner displays
- [x] Add buttons hidden for leadership
- [x] Alert shown on restricted actions
- [x] Profile visible in read-only mode

### ✅ Navigation
- [x] Profile screen accessible from Home
- [x] Tools screen accessible from Home
- [x] Quick access bar works
- [x] Back navigation works

---

## API Endpoints Verified

All endpoints added to `api.ts` match web app routes:

```
✅ POST   /auth-isolated/login
✅ POST   /auth-isolated/logout
✅ GET    /auth-isolated/user
✅ POST   /auth-isolated/complete-onboarding

✅ GET    /api/quizzes
✅ GET    /api/quiz/:id
✅ POST   /api/quiz/submissions

✅ GET    /api/scenarios
✅ POST   /api/scenario-submissions

✅ GET    /api/user-qualifications
✅ POST   /api/user-qualifications
✅ DELETE /api/user-qualifications/:id

✅ GET    /api/flight-records
✅ POST   /api/flight-records
✅ DELETE /api/flight-records/:id
✅ GET    /api/flight-statistics
```

---

## Deployment Notes

### Pre-Deployment Checklist
1. ✅ Update database schema with new tables
2. ✅ Implement Leadership role support
3. ✅ Add all API endpoints
4. ✅ Create UserProfileScreen
5. ✅ Create ToolsScreen
6. ✅ Update navigation
7. 🔄 Update PRODUCTION_API_URL (before App Store submission)
8. 🔄 Test with production server
9. 🔄 Build production IPA

### Production API URL
**Before App Store submission, update:**
```typescript
const PRODUCTION_API_URL = 'https://your-production-domain.replit.app';
// OR custom domain
const PRODUCTION_API_URL = 'https://api.loadmworkflow.com';
```

---

## Summary of January 2026 Updates

| Component | Status | Files Changed |
|-----------|--------|---------------|
| Leadership Role | ✅ Complete | AuthContext.tsx |
| API Endpoints | ✅ Complete | api.ts |
| Offline Service | ✅ Complete | OfflineDataService.ts |
| Sync Context | ✅ Complete | SyncContext.tsx |
| User Profile Screen | ✅ Complete | UserProfileScreen.tsx (NEW) |
| Tools Screen | ✅ Complete | ToolsScreen.tsx (NEW) |
| Navigation | ✅ Complete | App.tsx |
| Home Screen | ✅ Complete | HomeScreen.tsx |

**Total New Lines of Code:** ~1,400 lines
**Time Taken:** Systematic update session

---

**Next Steps:**
1. Test on physical iPad device
2. Verify sync functionality with production server
3. Update production API URL
4. Submit to App Store for review

**Contact:** Refer to web app implementation for additional UI/UX patterns
