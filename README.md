# 👑 SHIV AI — MYRAA (निर्माण कर्ता एवं मालिक: श्री राम नाग | Creator & Owner: Shri Ram Nag)

**निर्माण कर्ता एवं मालिक (Creator & Owner):** **Shri Ram Nag (श्री राम नाग)**  
**आर्किटेक्चर (Architecture):** React 18 + TypeScript + Vite + Tailwind + `@google/genai` (Gemini Live & TTS)  
**वर्ज़न (Version):** `v7.0.65` (Code: 7065)  

---

## 🌟 Overview & Key Features

MYRAA is a Voice-First AI Companion, Real-Time Gemini Live Audio Assistant, and On-Device Memory Hub engineered for **Shri Ram Nag**:

1. **Voice-First Holographic Avatar Stage**:
   - 6 Specialist Characters with Gemini Voices:
     - 🌸 **MYRAA**: Voice Companion & Android Orchestration (`Kore`)
     - ✨ **AURA**: Creative Synthesis & Design (`Aoede`)
     - 🎬 **PIXEL**: Media, Scripts & Creator Specialist (`Despina`)
     - 💻 **CODEX**: Software Engineering & Debugging (`Puck`)
     - 🛡️ **SENTINEL**: Security & Privacy Guardian (`Fenrir`)
     - 🔬 **SAGE**: Deep Research & Strategic Analysis (`Charon`)
   - Closeup & Full view modes with real-time mic-level ring and output `AnalyserNode` waveform bars.

2. **Real-Time Gemini Live Audio (`src/voice/`)**:
   - Continuous bidirectional audio via `@google/genai` (`gemini-3.8-live` with automatic model fallback).
   - 16 kHz mono PCM16 microphone streaming via `AudioWorklet` (with `ScriptProcessor` fallback).
   - Gapless 24 kHz PCM16 Web Audio playback through a single persistent `AudioContext` (`GainNode` → `AnalyserNode` → `destination`) with instant barge-in interruption.
   - Read-aloud TTS via `gemini-3.8-flash-tts` (with fallback).

3. **Real Allowlisted Tools (`src/voice/ToolRegistry.ts` & `DeviceActions.ts`)**:
   - `openApp`, `openWhatsApp`, `openUrl` (`https://` validated), `makeCall` (with on-screen confirmation), `callContact` (honest lookup), `toggleFlashlight`, `saveMemory`, `searchMemory`, `deepResearch` (Google Search grounding with sources), `rewriteText`, and `openPanel`.

4. **On-Device Brain Database**:
   - Local private memory store (`IDENTITY`, `PREFERENCE`, `FACT`, `PROJECT`, `HABIT`, `RELATIONSHIP`) with instant search and JSON backup export/import.

5. **Admin Vault & Security Shield**:
   - First-run user-defined passcode hashed with SHA-256 via Web Crypto (`crypto.subtle.digest`).
   - Audit log inspection and Payment & OTP Shield (GPay, PhonePe, Paytm, Banking apps shielded).
