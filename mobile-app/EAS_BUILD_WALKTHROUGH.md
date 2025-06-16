# EAS Build Deployment Walkthrough

## Step-by-Step Guide to Deploy Your iPad App

### Prerequisites Setup

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login to Expo Account
```bash
eas login
```
If you don't have an Expo account, create one at expo.dev (it's free)

#### 3. Apple Developer Account Setup
- Sign up for Apple Developer Program ($99/year) at developer.apple.com
- Complete enrollment (may take 24-48 hours for approval)

### Project Configuration (Already Done ✅)

Your app is already configured with:
- `eas.json` - Build configuration
- `app.json` - App metadata
- iOS settings and permissions
- Bundle ID: `com.loadmworkflow.training`

### Deployment Process

#### Step 1: Navigate to Mobile App Directory
```bash
cd mobile-app
```

#### Step 2: Configure EAS Project
```bash
eas build:configure
```
- Select "iOS" when prompted
- Choose "Yes" to generate new project ID
- This creates build configuration if needed

#### Step 3: Start iOS Build
```bash
eas build --platform ios --profile production
```

**What happens during build:**
- EAS servers compile your React Native code
- Creates native iOS app bundle
- Handles all Xcode complexities automatically
- Takes 10-20 minutes typically

#### Step 4: Monitor Build Progress
- Build URL will be displayed in terminal
- Visit the URL to watch real-time progress
- You'll see compilation logs and any errors

#### Step 5: Download Build (Optional)
Once complete, you can:
```bash
eas build:list
```
- Shows all your builds
- Download .ipa file for testing

### App Store Submission

#### Option A: Direct EAS Submit (Easiest)
```bash
eas submit --platform ios
```
- Enter Apple ID credentials when prompted
- EAS uploads directly to App Store Connect
- Completely automated process

#### Option B: Manual Upload
- Download the .ipa file from build
- Open Xcode → Window → Organizer
- Drag .ipa file to upload to App Store

### App Store Connect Setup

#### 1. Complete App Information
Visit App Store Connect (appstoreconnect.apple.com):
- App description (already prepared)
- Screenshots (already created)
- Privacy policy URL
- Support URL
- Age rating (likely 4+ for training app)

#### 2. Set Pricing
- Free or paid (recommend free for military training)
- Availability regions

#### 3. Submit for Review
- Review app guidelines compliance
- Submit for Apple review (typically 24-48 hours)

### Build Configuration Details

Your `eas.json` is configured with:
```json
{
  "build": {
    "production": {
      "ios": {
        "buildType": "app-store",
        "bundleIdentifier": "com.loadmworkflow.training"
      }
    }
  }
}
```

### Common Issues & Solutions

#### Build Fails
```bash
# Clear cache and retry
eas build:cancel
eas build --platform ios --clear-cache
```

#### Apple Developer Credentials
- Ensure Apple Developer account is active
- EAS will prompt for credentials during submit
- Use App Store Connect API key for automation

#### Bundle ID Conflicts
- Your bundle ID is unique: `com.loadmworkflow.training`
- Register it in Apple Developer portal if needed

### Security Considerations for Military App

#### ITAR Compliance
- App configured for US-only distribution initially
- Can expand regions after security review
- Offline-first architecture reduces data transmission

#### Enterprise Distribution Alternative
If App Store isn't suitable:
```bash
eas build --platform ios --profile enterprise
```
- Requires Apple Enterprise Developer Program
- Direct device installation without App Store

### Timeline Expectations

- **EAS Build**: 10-20 minutes
- **App Store Upload**: 5-10 minutes
- **Apple Review**: 24-48 hours typically
- **Total Time to Live**: 1-3 days

### Testing Before Submission

#### Internal Testing
```bash
eas build --platform ios --profile preview
```
- Creates development build
- Install on test devices
- Verify all functionality works

#### TestFlight Beta
- Upload production build
- Add internal testers
- Get feedback before public release

### Cost Breakdown
- Apple Developer Program: $99/year
- EAS Build: Free (generous limits)
- App Store: No additional fees

### Next Steps After This Walkthrough
1. Set up Apple Developer account
2. Run the EAS build commands
3. Complete App Store Connect information
4. Submit for review
5. Monitor approval status

Your app is professionally configured and ready for this process!