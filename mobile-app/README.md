# LOADMworkflow Mobile - iOS iPad App

This is the React Native mobile application for LOADMworkflow, designed specifically for iPad users and optimized for offline-first operation.

## Features

### Offline-First Architecture
- Complete offline functionality for all core features
- SQLite local database for data persistence
- Intelligent sync when internet connection is available
- Refresh button in header to manually sync latest data

### Core Features
- **Authentication**: Secure login with offline capability
- **Load Planning**: Create and manage aircraft load plans (C-130, C-17, C-27J, KC30A)
- **Quizzes**: Take training quizzes with offline support
- **Scenarios**: Practice with training scenarios
- **Documents**: View technical manuals and guides (PDF support)
- **Chat**: Real-time communication with offline message queuing

### Technology Stack
- React Native with Expo for iOS development
- TypeScript for type safety
- SQLite for local database
- Expo SecureStore for secure data storage
- React Navigation for screen navigation
- React Query for data management

## Project Structure

```
mobile-app/
├── src/
│   ├── contexts/           # React contexts for global state
│   │   ├── AuthContext.tsx        # Authentication management
│   │   ├── DatabaseContext.tsx    # SQLite database management
│   │   └── SyncContext.tsx        # Online/offline sync logic
│   ├── screens/           # App screens
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── LoadPlanningScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   ├── ScenariosScreen.tsx
│   │   ├── DocumentsScreen.tsx
│   │   └── ChatScreen.tsx
│   ├── components/        # Reusable UI components
│   ├── services/          # API and business logic
│   └── types/            # TypeScript type definitions
├── assets/               # Images and static assets
├── App.tsx              # Main app component
├── app.json             # Expo configuration
└── package.json         # Dependencies and scripts
```

## Database Schema

The mobile app uses SQLite with the following main tables:
- `users` - User authentication and profile data
- `quizzes` - Quiz definitions and metadata
- `quiz_questions` - Individual quiz questions
- `quiz_submissions` - User quiz attempts and scores
- `scenarios` - Training scenario definitions
- `scenario_submissions` - User scenario submissions
- `documents` - Document metadata and file paths
- `load_plans` - Aircraft load planning data
- `chat_messages` - Chat message history
- `sync_queue` - Pending sync operations

## Sync Strategy

### Online Mode
- Connects to existing Express.js backend at localhost:5000
- Real-time data synchronization
- Immediate server validation

### Offline Mode
- All data stored locally in SQLite
- Actions queued for later sync
- Full functionality maintained without internet

### Sync Process
1. User presses refresh button when online
2. Upload pending local changes (quiz submissions, chat messages, etc.)
3. Download latest data from server (new quizzes, scenarios, documents)
4. Update local database with server data
5. Clear sync queue for successfully uploaded items

## Authentication Flow

1. User enters credentials
2. Try online authentication first
3. If online fails or no internet, check local database
4. Store session securely using Expo SecureStore
5. Maintain session across app restarts

## Development Setup

1. Install Expo CLI globally:
   ```bash
   npm install -g @expo/cli
   ```

2. Install dependencies:
   ```bash
   cd mobile-app
   npm install
   ```

3. Start development server:
   ```bash
   npm start
   ```

4. Run on iOS simulator:
   ```bash
   npm run ios
   ```

5. For production builds:
   ```bash
   npm run build:ios
   ```

## Quick Start Guide

1. **Authentication**: Users can log in with existing credentials from the web platform
2. **Offline Mode**: All features work without internet connection
3. **Data Sync**: Press the refresh button in the header when online to sync data
4. **Quiz Taking**: Take training quizzes with automatic scoring and offline storage
5. **Load Planning**: Create aircraft load plans with real-time balance calculations
6. **Scenarios**: Complete training scenarios with form submissions
7. **Chat**: Send messages that queue for sync when back online

## Deployment

The app is configured for iOS App Store deployment:
- Bundle ID: `com.digitaldynamics.loadmworkflow`
- Target: iPad only
- Orientation: Landscape
- iOS version: 13.0+

## Integration with Web App

The mobile app connects to the existing web application backend:
- Shared API endpoints
- Compatible data structures
- Synchronized user authentication
- Cross-platform data consistency

## Key Design Decisions

1. **Offline-First**: All features work without internet connection
2. **iPad-Optimized**: Landscape orientation with tablet-friendly UI
3. **Data Sync**: Manual refresh for user control over data usage
4. **Secure Storage**: Sensitive data encrypted with Expo SecureStore
5. **Modular Architecture**: Separate contexts for different concerns
6. **Type Safety**: Full TypeScript implementation for reliability

This mobile app provides the complete LOADMworkflow experience on iPad with robust offline capabilities and seamless synchronization when online.