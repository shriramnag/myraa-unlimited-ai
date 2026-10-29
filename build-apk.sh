#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🔱 SHIV AI — MYRAA v3.0 (Owner: Shri Ram Nag)"
echo "📦 Automated Android APK Builder"
echo "=========================================================="

if command -v npm >/dev/null 2>&1 && [ -d "node_modules" ]; then
  echo "[1/3] Building Web Frontend Bundle (dist/)..."
  npm run build
  mkdir -p app/src/main/assets/public
  cp -r dist/* app/src/main/assets/public/
else
  echo "[1/3] Using pre-bundled Web Assets in app/src/main/assets/public/..."
fi

echo "[2/3] Ensuring signing keystore..."
if [ ! -f debug.keystore ]; then
  keytool -genkeypair -v \
    -keystore debug.keystore \
    -storepass android \
    -alias androiddebugkey \
    -keypass android \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Shri Ram Nag,OU=SHIV AI,O=MYRAA,L=Jodhpur,ST=Rajasthan,C=IN"
fi

echo "[3/3] Compiling Android APK with Gradle..."
if command -v gradle >/dev/null 2>&1; then
  gradle assembleDebug
elif [ -f "./gradlew" ]; then
  chmod +x ./gradlew
  ./gradlew assembleDebug
else
  echo "⚠️ Gradle is not installed locally. Push to GitHub Actions to build app-debug.apk!"
  exit 0
fi

echo "✅ APK Build Complete: app/build/outputs/apk/debug/app-debug.apk"
