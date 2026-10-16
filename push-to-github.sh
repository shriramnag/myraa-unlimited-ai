#!/usr/bin/env bash
set -e

echo "======================================================================"
echo "  SHIVAI MYRAA v6.0 - Auto Push to shriramnag/myraa-unlimited-ai"
echo "  Owner: Shri Ram Nag"
echo "======================================================================"

REPO_URL="https://github.com/shriramnag/myraa-unlimited-ai.git"
echo "Target Repository: ${REPO_URL}"

echo "[1/6] Removing any .github workflow folder to prevent PAT scope error..."
rm -rf .github

echo "[2/6] Initializing Git repository & setting Owner identity..."
git init
git config user.name "Shri Ram Nag"
git config user.email "shriramnag@users.noreply.github.com"
git config http.postBuffer 524288000

echo "[3/6] Staging all SHIVAI MYRAA v6.0 files (10 MP4 Models, UPI, Voice ID, OTA)..."
git rm -r --cached .github 2>/dev/null || true
git add -A

echo "[4/6] Creating v6.0 release commit..."
git commit -m "feat: SHIVAI MYRAA v6.0 - 10 3D Videos, Google Sign-In, UPI Gateway, Voice ID & Play Store Control" || true

echo "[5/6] Configuring main branch and remote origin..."
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "${REPO_URL}"

echo "[6/6] Pushing v6.0 code to GitHub (triggers OTA Update 6.0.0 in app)..."
git push -u origin main --force

echo "======================================================================"
echo "  SUCCESS! SHIVAI MYRAA v6.0 is now live on:"
echo "  https://github.com/shriramnag/myraa-unlimited-ai"
echo "======================================================================"
