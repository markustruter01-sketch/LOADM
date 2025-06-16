# LOADMworkflow Mobile App Setup Instructions

## Quick Setup Guide

### Prerequisites
1. Install Node.js 18+ on your local machine
2. Install Expo CLI globally: `npm install -g @expo/cli`
3. Create an Expo account at https://expo.dev
4. Install EAS CLI: `npm install -g eas-cli`

### Step 1: Download and Setup
1. Download the mobile-app folder from Replit to your local machine
2. Open terminal/command prompt in the mobile-app directory
3. Run: `npm install`

### Step 2: Configure EAS
1. Login to EAS: `eas login`
2. Initialize project: `eas build:configure`
3. Create development build: `eas build --platform ios --profile development`

### Step 3: Test on Device
1. Install Expo Go app on your iPad from App Store
2. Run: `expo start`
3. Scan QR code with your iPad to test the app

## Build Commands

### Development Build
```bash
eas build --platform ios --profile development
```

### Production Build
```bash
eas build --platform ios --profile production
```

## Troubleshooting

### Common Issues
1. **Bundle identifier error**: The bundle ID is configured in app.json, not eas.json
2. **Missing dependencies**: Run `npm install` in the mobile-app directory
3. **EAS authentication**: Make sure you're logged in with `eas login`

### Security Vulnerabilities
The npm audit warnings you see are for development dependencies and don't affect the production build. You can ignore them or run `npm audit fix` if needed.

## File Structure
- `app.json` - Main Expo configuration
- `eas.json` - EAS Build configuration (now fixed)
- `package.json` - Dependencies and scripts
- `src/` - Source code for the mobile app

## Important Notes
- This mobile app is designed specifically for iPad in landscape mode
- All placeholder values have been removed from the configuration
- The app uses offline-first architecture with local SQLite database
- Visual design matches the web application exactly

## Next Steps
1. Test the development build on your iPad
2. Make any necessary adjustments
3. Create production build for App Store submission
4. Follow Apple's review guidelines for military applications