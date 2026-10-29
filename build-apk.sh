#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🔱 SHIV AI — MYRAA v3.0 (Owner: Shri Ram Nag)"
echo "📦 Automated Android APK Builder"
echo "=========================================================="

echo "[1/3] Verifying pre-bundled Web Assets in app/src/main/assets/public/..."
mkdir -p app/src/main/assets/public
if [ -d "public/avatars" ]; then cp -rn public/avatars app/src/main/assets/public/ || true; fi
if [ -d "public/characters" ]; then cp -rn public/characters app/src/main/assets/public/ || true; fi

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
