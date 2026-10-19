# 🌌 MYRAA v3.0 — Personal AI Assistant (Creator: Shri Ram Nag)

<p align="center">
  <b>Nirman Karta (Creator, Architect & Owner): Shri Ram Nag (श्री राम नाग)</b><br/>
  <i>3D Holographic AI Companion with Long-Term Brain Database, Smart SMS/WhatsApp Automation & 100% Personal Privacy Control</i>
</p>

---

## 👑 Creator & Ownership
- **Nirman Karta / Developer / Owner:** **Shri Ram Nag**
- **Digital APK Signature:** `CN=Shri Ram Nag, O=MYRAA AI, C=IN`
- **Data & Privacy Control:** 100% Local on-device (`IndexedDB` + `LocalStorage` + `AndroidKeyStore` AES-256). Zero third-party server telemetry.

---

## 🧠 Core Capabilities (v3.0 Shri Ram Nag Edition)

1. **Long-Term Brain & Memory Database (`MyraaBrainDatabase_ShriRamNag`):**
   - Dual-layer persistent database (`IndexedDB` + `LocalStorage`) that remembers personal facts, identity, preferences, goals, projects, relationships, and habits permanently.
   - Built-in **1-Click Backup Brain DB (JSON Export)** and **Restore Brain DB (JSON Import)** inside the **About Myraa** settings panel.
2. **Smart SMS, WhatsApp & Call Automation:**
   - Compose and prepare SMS (`PREPARE_SMS`, `SEND_SMS`) and WhatsApp (`PREPARE_WHATSAPP_MESSAGE`, `SEND_WHATSAPP_MESSAGE`) in Hindi, Hinglish, or English via voice command.
   - Voice-controlled Contact Calling (`CALL_CONTACT`) with safety confirmation.
3. **43 Native Android Hardware & Productivity Controls:**
   - Alarms (`CREATE_ALARM`), Timers (`START_TIMER`), Reminders (`CREATE_REMINDER`), Calendar Events (`CREATE_CALENDAR_EVENT`).
   - Flashlight/Torch (`FLASHLIGHT_ON`/`OFF`), Media Playback, Volume, Screen Brightness, Google Maps Navigation (`START_NAVIGATION`), and App Launcher (`OPEN_APP`).
4. **3D Anime Avatar (Evelyn PMX) + Background Voice Wake Mode:**
   - Real-time Three.js MMD 3D rendering with custom toon shaders and foreground service wake-word listening.

---

## 🔄 Auto-Rewrite & Update to GitHub (Termux 1-Command)
Whenever you update files or extract a new version into `~/myraa-unlimited-ai`, run:
```bash
bash update-github.sh
```
