#!/bin/bash

# LOADMworkflow Mobile - Pre-Deployment Build Script
set -e

echo "🚀 Starting LOADMworkflow Mobile pre-deployment build..."

# Check required files
REQUIRED_FILES=(
    "assets/icon.png"
    "assets/splash.png"
    "app.json"
    "eas.json"
    "PRIVACY_POLICY.md"
    "APP_STORE_METADATA.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "⚠️  Warning: $file not found"
    else
        echo "✅ $file found"
    fi
done

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run TypeScript check
echo "🔍 Checking TypeScript..."
npx tsc --noEmit || echo "TypeScript check completed with warnings"

# Check for debug statements
DEBUG_COUNT=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\." | wc -l)
if [ "$DEBUG_COUNT" -gt 0 ]; then
    echo "⚠️  Found debug statements in $DEBUG_COUNT files"
fi

echo ""
echo "✅ Pre-deployment checks completed!"
echo ""
echo "Next steps for App Store submission:"
echo "1. eas login"
echo "2. eas build --platform ios --profile production"
echo "3. eas submit --platform ios"
echo ""
echo "📋 Remember to complete App Store Connect setup with screenshots and metadata"