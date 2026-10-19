#!/usr/bin/env bash
echo "========================================================"
echo "  MYRAA v3.0 (Creator: Shri Ram Nag) - Auto-Rewrite Push"
echo "========================================================"

rm -rf .github
git add -A
git commit -m "update: MYRAA v3.0 Creator Shri Ram Nag Edition (Brain + Long-Term Memory DB + SMS/WhatsApp)" || echo "No new changes to commit"
git branch -M main
git push -u origin main --force

echo "========================================================"
echo "  SUCCESS! GitHub Repo Rewritten & Updated Successfully!"
echo "========================================================"
