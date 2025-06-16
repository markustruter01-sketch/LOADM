# Connect Your Mobile App to Expo Profile

## Commands to Run Locally

Since you need to authenticate with your Expo account, run these commands on your local machine:

### 1. Install EAS CLI (if not already installed)
```bash
npm install -g eas-cli
```

### 2. Login to Your Expo Account
```bash
eas login
```
Enter your Expo email/username and password when prompted.

### 3. Navigate to Mobile App Directory
```bash
cd mobile-app
```

### 4. Initialize EAS Project
```bash
eas init
```
This will:
- Connect your app to your Expo account
- Generate a unique project ID
- Create the necessary configuration

### 5. Verify Project Setup
```bash
eas project:info
```
This shows your project details and confirms it's linked to your account.

## Alternative: Update app.json Manually

If you prefer to configure manually, update your `app.json`:

```json
{
  "expo": {
    "name": "LOADMworkflow",
    "slug": "loadmworkflow-training",
    "owner": "your-expo-username",
    "version": "1.0.0",
    ...
  }
}
```

Replace `"your-expo-username"` with your actual Expo username.

## What Happens After Setup

Once connected to your Expo profile:
- Your app appears in your Expo dashboard
- You can monitor builds and deployments
- Team members can be added to the project
- Build history is tracked under your account

## Next Steps After Connection

1. **Start your first build:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Monitor progress:**
   - Visit the build URL shown in terminal
   - Check your Expo dashboard at expo.dev

3. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

Your mobile app is already properly configured - you just need to connect it to your Expo account with these commands!