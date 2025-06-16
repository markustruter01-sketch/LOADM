# Fix Configuration Files for EAS Build

## The Problem
Your `eas.json` configuration has validation errors that prevent building.

## Solution: Create/Update These Files

### 1. Create correct `eas.json`
Create this file in your mobile-app folder:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "ios": {
        "distribution": "store"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2. Update `app.json`
Make sure your app.json looks like this:

```json
{
  "expo": {
    "name": "LOADMworkflow",
    "slug": "loadmworkflow-training",
    "version": "1.0.0",
    "orientation": "landscape",
    "userInterfaceStyle": "dark",
    "platforms": ["ios"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.loadmworkflow.training",
      "buildNumber": "1"
    }
  }
}
```

### 3. Commands to Run After Fixing Files

```bash
# Navigate to your mobile-app folder
cd C:\Users\User\Desktop\Digital Dynamics Group\Code\LOADMWorkflow\mobile-app

# Try init again
eas init --id 3c8e41cc-de68-4a98-8910-2e0v97abcc7e

# Then build
eas build --platform ios
```

## Quick Fix Steps:
1. Open your mobile-app folder
2. Find `eas.json` file and replace its contents with the code above
3. Find `app.json` file and update it
4. Run the commands again

This should resolve the validation errors!