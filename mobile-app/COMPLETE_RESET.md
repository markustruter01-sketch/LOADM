# Complete Reset Instructions

The old project ID is cached in your local Expo configuration. Here's how to completely reset:

## Step 1: Clear All Expo Cache
```bash
# In your mobile-app directory
rm -rf .expo
rm -rf node_modules
rm -rf ~/.expo
npx expo logout
```

## Step 2: Fresh Install
```bash
npm install
npx expo login
```

## Step 3: Initialize Fresh Project
```bash
npx create-expo-app --template blank-typescript LOADMworkflowNew
```

## Step 4: Copy Files
Copy your src/ folder from the current mobile-app into the new LOADMworkflowNew folder.

## Alternative: Use Different Slug
I've changed the app slug to "loadmworkflow-training-new" and bundle ID to "com.loadmworkflow.training.new" to avoid conflicts.

Try running:
```bash
npx eas build:configure
```

The new slug should create a completely fresh project without ID conflicts.