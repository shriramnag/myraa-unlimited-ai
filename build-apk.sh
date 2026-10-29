#!/usr/bin/env bash
set -e

echo "=========================================================="
echo "🔱 SHIV AI — MYRAA v3.0 (Owner: Shri Ram Nag)"
echo "📦 Automated Android APK Builder"
echo "=========================================================="

echo "[1/4] Building Web Frontend Bundle (dist/)..."
npm run build

echo "[2/4] Syncing Web Assets into Android Native WebView (assets/public/)..."
mkdir -p android/app/src/main/assets/public
cp -r dist/* android/app/src/main/assets/public/

echo "[3/4] Writing Capacitor Config..."
cat > android/app/src/main/assets/capacitor.config.json << 'EOF'
{
  "appId": "ai.myraa.mobile",
  "appName": "MYRAA",
  "webDir": "dist",
  "bundledWebRuntime": false,
  "server": {
    "androidScheme": "https"
  }
}
EOF

cat > android/app/src/main/assets/capacitor.plugins.json << 'EOF'
[
  {
    "pkg": "MyraaNative",
    "classpath": "ai.myraa.mobile.MyraaNativePlugin"
  }
]
EOF

echo "[4/4] Compiling Android APK with Gradle..."
cd android
if command -v gradle >/dev/null 2>&1; then
  gradle assembleDebug
elif [ -f "./gradlew" ]; then
  chmod +x ./gradlew
  ./gradlew assembleDebug
else
  echo "⚠️ Note: Gradle is not installed in this container. Open '/android' in Android Studio or push to GitHub Actions to compile app-debug.apk!"
  exit 0
fi

echo "✅ APK Build Complete: android/app/build/outputs/apk/debug/app-debug.apk"
