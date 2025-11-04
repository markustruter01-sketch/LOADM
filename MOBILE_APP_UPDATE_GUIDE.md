# LOADMworkflow Mobile App Update Guide
**Last Updated:** November 4, 2025

## Overview
This guide documents updates needed to sync the mobile app with recent web app features.

---

## ✅ Completed Updates

### 1. Database Schema (Nov 4, 2025)
**File:** `mobile-app/src/contexts/DatabaseContext.tsx`

Added new tables to match web app schema:

```sql
-- User onboarding tracking
ALTER TABLE users ADD COLUMN has_completed_onboarding BOOLEAN DEFAULT 0;

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

**Status:** ✅ COMPLETE - Schema updated

---

## 🔄 Pending Updates

### 2. OfflineDataService Methods
**File:** `mobile-app/src/services/OfflineDataService.ts`

Add methods for managing qualifications and flight records:

```typescript
// User Qualifications Management
async getUserQualifications(userId: number): Promise<any[]>
async saveQualification(qualification: {...}): Promise<number>
async updateQualification(id: number, qualification: {...}): Promise<void>
async deleteQualification(id: number): Promise<void>

// Flight Records Management
async getUserFlightRecords(userId: number): Promise<any[]>
async saveFlightRecord(record: {...}): Promise<number>
async updateFlightRecord(id: number, record: {...}): Promise<void>
async deleteFlightRecord(id: number): Promise<void>

// Flight Statistics
async getFlightStatistics(userId: number): Promise<{...}>
```

**Estimated Time:** 30 minutes  
**Priority:** HIGH

---

### 3. User Profile Screen
**File:** `mobile-app/src/screens/UserProfileScreen.tsx` (NEW)

Create React Native screen matching web app's user profile features:

#### Features to Implement:
- **Three-tab interface:**
  - Qualifications Tab
  - Activity History Tab
  - Flight Records Tab

- **Qualifications Management:**
  - List all qualifications with expiry dates
  - Add/Edit/Delete qualifications
  - Status indicators (Current, Expiring Soon, Expired, No Expiry)
  - "No End Date" toggle for permanent qualifications

- **Flight Records Management:**
  - List all flight records
  - Add/Edit/Delete flight records
  - Display: date, callsign, departure, arrival, captain, passengers, cargo, night/day hours
  - Dual-unit cargo weight support (kg/lbs with conversion)

- **Flight Statistics Dashboard:**
  - Total Flight Hours (auto-calculated)
  - Night Hours and Day Hours
  - Total Cargo Carried (kg)
  - Total Passengers Carried
  - Total Missions Flown (count)

#### UI Components Needed:
```typescript
<Tabs>
  <Tab label="Qualifications">
    <QualificationsList />
    <AddQualificationButton />
  </Tab>
  <Tab label="Activity">
    <ActivityList />
  </Tab>
  <Tab label="Flight Records">
    <FlightStatistics />
    <FlightRecordsList />
    <AddFlightButton />
  </Tab>
</Tabs>
```

**Estimated Time:** 4-5 hours  
**Priority:** HIGH

---

### 4. Onboarding Tour
**File:** `mobile-app/src/components/OnboardingTour.tsx` (NEW)

Create mobile-friendly onboarding tour similar to web app:

#### Steps:
1. Welcome to LOADMworkflow
2. Navigation Overview
3. Training Scenarios
4. Airframe & Load Planning
5. Mission Documents
6. Your Profile & Records
7. Loadmaster Calculators
8. Offline Mode Benefits
9. Ready for Training!

#### Technical Notes:
- Use React Native Modal for tour display
- Implement spotlight effects using View with absolute positioning
- Store `has_completed_onboarding` in local database
- Sync onboarding status to server when online

**Estimated Time:** 3-4 hours  
**Priority:** MEDIUM

---

### 5. PDF Viewer Enhancement
**File:** `mobile-app/src/screens/DocumentsScreen.tsx`

Verify PDF viewing works correctly on iPad:

#### Recommended Libraries:
- `react-native-pdf` - For PDF rendering
- `expo-document-picker` - For file selection
- `expo-file-system` - For offline PDF storage

#### Features:
- View PDFs in full-screen mode
- Page navigation controls
- Zoom in/out functionality
- Offline PDF caching
- Download progress indicator

**Estimated Time:** 2-3 hours  
**Priority:** MEDIUM

---

### 6. Tools/Calculators Screen
**File:** `mobile-app/src/screens/ToolsScreen.tsx` (NEW)

Implement loadmaster calculator tools:

#### Priority Calculators:
1. **Weight & Balance:**
   - Restraint Calculator
   - WAM Calculator
   - Vehicle CGFA Calculator
   - Fuel Calculator

2. **PSI Calculators:**
   - Box PSI Calculator
   - Drum PSI Calculator
   - Skidded Box Calculator
   - Tire PSI Calculator

3. **Mission Analysis:**
   - Mission Complexity Analyzer

#### UI Design:
- Dark grey gradient cards matching web app (from-[#2a2a2a] to-[#1a1a1a])
- Orange accent colors (#f97316)
- Large, touch-friendly buttons for iPad
- Landscape orientation optimized

**Estimated Time:** 6-8 hours  
**Priority:** LOW (can be phased release)

---

### 7. API Configuration Update
**File:** `mobile-app/src/config/api.ts`

Update production API URL before App Store submission:

```typescript
// BEFORE (Dev URL)
const PRODUCTION_API_URL = 'https://46964af9-bf0d-46cd-84c7-e19697f9daab-00-17jq3m1pxsynh.worf.replit.dev';

// AFTER (Production URL)
const PRODUCTION_API_URL = 'https://your-production-domain.replit.app';
// OR custom domain
const PRODUCTION_API_URL = 'https://api.loadmworkflow.com';
```

**Estimated Time:** 5 minutes  
**Priority:** CRITICAL (before deployment)

---

### 8. Sync Context Updates
**File:** `mobile-app/src/contexts/SyncContext.tsx`

Add sync support for new tables:

```typescript
const syncUserQualifications = async () => {
  const pending = await db.getAllAsync(
    'SELECT * FROM user_qualifications WHERE synced = 0'
  );
  // Sync to server API
  // Mark as synced
};

const syncFlightRecords = async () => {
  const pending = await db.getAllAsync(
    'SELECT * FROM flight_records WHERE synced = 0'
  );
  // Sync to server API
  // Mark as synced
};
```

**Estimated Time:** 1-2 hours  
**Priority:** HIGH

---

## Development Workflow

### Step 1: Database & Services (Priority: HIGH)
1. ✅ Update DatabaseContext.tsx with new tables (DONE)
2. 🔄 Add methods to OfflineDataService.ts
3. 🔄 Update SyncContext.tsx with new sync functions
4. ✅ Test database migrations

### Step 2: User Profile (Priority: HIGH)
1. 🔄 Create UserProfileScreen.tsx
2. 🔄 Build qualification management UI
3. 🔄 Build flight records management UI
4. 🔄 Implement statistics dashboard
5. ✅ Test offline functionality

### Step 3: Onboarding & UX (Priority: MEDIUM)
1. 🔄 Create OnboardingTour component
2. 🔄 Implement spotlight effects for mobile
3. 🔄 Add tour triggers after first login
4. ✅ Test tour flow

### Step 4: Tools & Calculators (Priority: LOW)
1. 🔄 Create ToolsScreen.tsx
2. 🔄 Implement priority calculators
3. 🔄 Match web app design
4. ✅ Test calculations accuracy

### Step 5: Deployment Prep (Priority: CRITICAL)
1. 🔄 Update PRODUCTION_API_URL
2. ✅ Test with production server
3. ✅ Verify SSL/HTTPS
4. ✅ Test offline/online sync
5. ✅ Build production IPA

---

## Testing Checklist

### Offline Functionality
- [ ] Qualifications CRUD works offline
- [ ] Flight records CRUD works offline
- [ ] Data syncs when connection restored
- [ ] Conflict resolution works correctly

### User Profile
- [ ] Statistics calculate correctly
- [ ] Add/edit/delete qualifications
- [ ] Add/edit/delete flight records
- [ ] Cargo weight conversion (kg/lbs)
- [ ] Date pickers work correctly

### Onboarding Tour
- [ ] Tour triggers after first login
- [ ] All 9 steps display correctly
- [ ] Spotlight effects work on iPad
- [ ] Skip/complete buttons work
- [ ] Tour doesn't show again after completion

### API Integration
- [ ] User profile syncs to server
- [ ] Qualifications sync bidirectionally
- [ ] Flight records sync bidirectionally
- [ ] Production API URL works
- [ ] Authentication persists correctly

---

## API Endpoints to Verify

Ensure server has endpoints for:

```
GET    /api/user-qualifications
POST   /api/user-qualifications
PUT    /api/user-qualifications/:id
DELETE /api/user-qualifications/:id

GET    /api/flight-records
POST   /api/flight-records
PUT    /api/flight-records/:id
DELETE /api/flight-records/:id

GET    /api/flight-statistics
POST   /auth-isolated/complete-onboarding
```

---

## Deployment Timeline

### Phase 1 (ASAP) - Critical Updates
- Database schema ✅
- OfflineDataService methods
- User Profile Screen
- API configuration update

**Estimated:** 8-10 hours  
**Target:** Within 1 week

### Phase 2 (Short-term) - UX Enhancements
- Onboarding Tour
- PDF viewer verification
- Sync improvements

**Estimated:** 6-8 hours  
**Target:** Within 2 weeks

### Phase 3 (Optional) - Feature Parity
- Tools/Calculators screens
- Advanced analytics
- Performance optimizations

**Estimated:** 10-12 hours  
**Target:** Future release

---

## Notes

- All mobile app files use TypeScript and Expo SDK
- Offline-first architecture is core to mobile app
- iPad landscape orientation is primary use case
- Dark theme with DDG branding (orange accents)
- All data stored in SQLite for offline access
- Automatic sync when internet available

---

**Next Steps:**
1. Complete OfflineDataService methods
2. Build UserProfileScreen
3. Update production API URL
4. Test full offline/online workflow
5. Submit to App Store

**Contact:** Refer to web app implementation for UI/UX patterns
