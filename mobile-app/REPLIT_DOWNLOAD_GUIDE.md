# Download Mobile App from Replit

## Method 1: Download Entire Project (Recommended)

Since the right-click doesn't show download, use this approach:

1. **Go to your main Replit project page**
2. **Click the three dots (⋯) in the top toolbar** (next to Run, Share, etc.)
3. **Select "Download as zip"**
4. **Extract the ZIP file locally**
5. **Navigate to the mobile-app folder** inside the extracted project

## Method 2: Manual File Creation

If download doesn't work, you can recreate the structure:

### Create these files locally:

**package.json**
```json
{
  "name": "loadmworkflow-mobile",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "expo-sqlite": "~13.2.0",
    "expo-secure-store": "~12.8.0",
    "expo-network": "~5.8.0",
    "expo-status-bar": "~1.11.0",
    "react-query": "^3.39.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0"
  }
}
```

**app.json**
```json
{
  "expo": {
    "name": "LOADMworkflow",
    "slug": "loadmworkflow-training",
    "version": "1.0.0",
    "orientation": "landscape",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1e1e1e"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.loadmworkflow.training",
      "buildNumber": "1",
      "requireFullScreen": true
    },
    "plugins": ["expo-sqlite"],
    "platforms": ["ios"]
  }
}
```

**eas.json**
```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "buildType": "app-store"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Method 3: Git Clone (If Available)

If your Replit has Git enabled:
```bash
git clone [your-replit-git-url]
```

## After Getting Files Locally

1. **Navigate to mobile-app folder**
```bash
cd mobile-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize with Expo**
```bash
eas init
```

4. **Start building**
```bash
eas build --platform ios --profile production
```

The core configuration files above contain everything needed to build your app!