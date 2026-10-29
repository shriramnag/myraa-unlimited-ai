# MYRAA Android Native Architecture & Plugin Guide

## 1. Native Components Overview
The Android application (`ai.myraa.mobile`) consists of three primary native components:
1. `MainActivity` (`ai.myraa.mobile.MainActivity`): Subclasses Capacitor's `BridgeActivity` and registers `MyraaNativePlugin`.
2. `MyraaNativePlugin` (`ai.myraa.mobile.MyraaNativePlugin`): The main Capacitor bridge that connects the React frontend to Android native APIs.
3. `MyraaBackgroundService` (`ai.myraa.mobile.MyraaBackgroundService`): A foreground service with continuous microphone listening (`RECORD_AUDIO`, `FOREGROUND_SERVICE_MICROPHONE`).
4. `MyraaNotificationService` (`ai.myraa.mobile.MyraaNotificationService`): A `NotificationListenerService` that safely intercepts notifications.

---

## 2. All Supported Bridge Methods (Capacitor Calls)

| Method Name | Description |
|---|---|
| `getApiStatus` | Returns whether Gemini API key is configured and keystore status |
| `testAndSaveGeminiKey` | Tests Gemini API key against Google endpoint and encrypts it into Android Keystore |
| `deleteGeminiKey` | Wipes encrypted API key from keystore |
| `openOfficialApiPage` | Opens Google AI Studio / Gemini API key generation URL in browser |
| `completeApiSetup` | Marks onboarding API setup complete |
| `startGemini` | Connects to Gemini Live Realtime session (WebSocket) |
| `stopGemini` | Closes Gemini Live session |
| `sendGeminiText` | Streams text input to active Gemini session |
| `sendGeminiAudio` | Streams PCM/base64 audio input chunk to active Gemini session |
| `sendGeminiVideo` | Streams camera frame JPEG/base64 to active Gemini session |
| `sendToolResponse` | Returns function calling tool output back to Gemini |
| `startBackgroundMode` | Launches `MyraaBackgroundService` with persistent foreground notification |
| `stopBackgroundMode` | Stops `MyraaBackgroundService` |
| `requestMicrophonePermission` | Native prompt for audio recording permission |
| `executeAction` | Executes an Android system or app action (see Action Catalog below) |
| `createConfirmation` | Gated action confirmation modal with token expiration |
| `consolidateMemories` | Triggers memory summarization / local sync |
| `readClipboard` | Reads current system clipboard text |

---

## 3. Action Catalog (43 Actions Supported by `executeAction`)

### Device & Settings Controls:
- `OPEN_APP`: Resolves package name and launches installed application
- `OPEN_CAMERA`: Launches camera capture intent (`android.media.action.IMAGE_CAPTURE`)
- `OPEN_GALLERY`: Opens device photo gallery
- `OPEN_SETTINGS`: Opens Android Main Settings
- `OPEN_WIFI_SETTINGS`: Opens Wi-Fi settings
- `OPEN_BLUETOOTH_SETTINGS`: Opens Bluetooth settings
- `OPEN_BATTERY_SETTINGS`: Opens Battery saver & usage settings
- `OPEN_DISPLAY_SETTINGS`: Opens Display & brightness settings
- `OPEN_STORAGE_SETTINGS`: Opens Storage settings
- `OPEN_HOTSPOT_SETTINGS`: Opens Tethering & Portable Hotspot settings
- `OPEN_ACCESSIBILITY_SETTINGS`: Opens Accessibility settings
- `OPEN_NOTIFICATION_SETTINGS`: Opens App Notification management settings
- `OPEN_DND_SETTINGS`: Opens Do Not Disturb settings
- `CHANGE_BRIGHTNESS`: Adjusts system screen brightness
- `FLASHLIGHT_ON` / `FLASHLIGHT_OFF`: Controls camera torch mode
- `CHANGE_MEDIA_VOLUME`: Adjusts audio stream volume (up/down/mute)
- `CLOSE_MYRAAA`: Minimizes or closes app

### Navigation & Web:
- `OPEN_MAPS`: Opens Google Maps with coordinates or query
- `START_NAVIGATION`: Launches turn-by-turn navigation via `google.navigation:q=...`
- `WEB_SEARCH`: Launches web search intent (`android.intent.action.WEB_SEARCH`)
- `YOUTUBE_SEARCH`: Launches YouTube search intent

### Media Playback Controls:
- `MEDIA_PLAY`: Sends play command to active media session
- `MEDIA_PAUSE`: Sends pause command to active media session
- `MEDIA_NEXT`: Skips to next track
- `MEDIA_PREVIOUS`: Rewinds to previous track

### Personal Productivity (Confirmation Gated):
- `CALL_CONTACT`: Resolves contact name against `ContactsContract.CommonDataKinds.Phone`, opens dialer
- `PREPARE_SMS` / `SEND_SMS`: Prepares SMS intent with recipient and message body
- `PREPARE_WHATSAPP_MESSAGE` / `SEND_WHATSAPP_MESSAGE`: Formats `https://api.whatsapp.com/send` or intent to `com.whatsapp`
- `CREATE_ALARM`: Sets system clock alarm via `AlarmClock.ACTION_SET_ALARM`
- `START_TIMER`: Sets countdown timer via `AlarmClock.ACTION_SET_TIMER`
- `CREATE_CALENDAR_EVENT`: Inserts calendar event via `Intent.ACTION_INSERT`
- `CREATE_REMINDER`: Creates system reminder or alarm

### Privacy & Background Services:
- `READ_NOTIFICATION`: Queries safe recent notifications collected by `MyraaNotificationService`
- `START_BACKGROUND_MODE`: Starts `MyraaBackgroundService`
- `STOP_BACKGROUND_MODE`: Halts `MyraaBackgroundService`
- `CANCEL_PENDING_ACTION`: Cancels any unconfirmed gated action
