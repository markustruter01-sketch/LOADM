# Download Mobile App Files Locally

## Step 1: Download Your Mobile App Folder

You need to get the `mobile-app` folder from Replit to your local machine.

### Option A: Download as ZIP
1. In Replit, click the three dots menu (⋯) next to the `mobile-app` folder
2. Select "Download as ZIP"
3. Extract the ZIP file to your desired location

### Option B: Git Clone (if you have Git)
```bash
# Clone the entire project
git clone [your-replit-git-url]
cd [project-name]/mobile-app
```

### Option C: Manual File Copy
1. Select all files in the `mobile-app` folder in Replit
2. Copy and paste them to a local folder on your computer

## Step 2: Open Terminal in Mobile App Folder

Navigate to where you downloaded the mobile-app folder:
```bash
cd path/to/your/mobile-app
```

## Step 3: Install Dependencies
```bash
npm install
```

## Step 4: Initialize with Your Expo Account
```bash
eas init
```

This will connect your local mobile app files to your Expo profile.

## Step 5: Start Building
```bash
eas build --platform ios --profile production
```

## Important Files Already Configured

Your mobile app folder contains:
- `app.json` - App configuration
- `eas.json` - Build settings  
- `package.json` - Dependencies
- `src/` - All your app code
- iOS configuration files

Everything is ready - you just need the files locally to run the EAS commands!