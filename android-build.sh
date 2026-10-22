#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " Arma Reforger FCS - Android APK Build Automation Script"
echo "=========================================================="

echo "[1/4] Building production web assets..."
npm run build

echo "[2/4] Syncing web assets with Capacitor Android..."
npx cap sync android

echo "[3/4] Checking Android build environment..."
if command -v ./gradlew &> /dev/null || [ -f "android/gradlew" ]; then
    echo "[4/4] Compiling Android APK with Gradle..."
    cd android
    chmod +x gradlew
    ./gradlew assembleDebug
    echo "=========================================================="
    echo " SUCCESS! Native Android APK compiled at:"
    echo " android/app/build/outputs/apk/debug/app-debug.apk"
    echo "=========================================================="
else
    echo "=========================================================="
    echo " Android project synced successfully!"
    echo " To compile the APK locally, open the 'android' folder"
    echo " in Android Studio or run './gradlew assembleDebug' with JDK 17+."
    echo " You can also push to GitHub to let GitHub Actions compile the APK automatically!"
    echo "=========================================================="
fi
