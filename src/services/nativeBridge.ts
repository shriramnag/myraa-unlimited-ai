import { AuditLogItem, NativeActionDefinition } from "../types";

export const ALL_43_NATIVE_ACTIONS: NativeActionDefinition[] = [
  // Device & Settings Controls
  { name: "OPEN_APP", category: "DEVICE", description: "Resolves package name and launches installed application", requiresConfirmation: false, iconName: "Smartphone" },
  { name: "OPEN_CAMERA", category: "DEVICE", description: "Launches camera viewfinder capture intent", requiresConfirmation: false, iconName: "Camera" },
  { name: "OPEN_GALLERY", category: "DEVICE", description: "Opens device photo gallery and media albums", requiresConfirmation: false, iconName: "Image" },
  { name: "OPEN_SETTINGS", category: "DEVICE", description: "Opens Android Main System Settings", requiresConfirmation: false, iconName: "Settings" },
  { name: "OPEN_WIFI_SETTINGS", category: "DEVICE", description: "Opens Wi-Fi networks configuration", requiresConfirmation: false, iconName: "Wifi" },
  { name: "OPEN_BLUETOOTH_SETTINGS", category: "DEVICE", description: "Opens Bluetooth paired devices", requiresConfirmation: false, iconName: "Bluetooth" },
  { name: "OPEN_BATTERY_SETTINGS", category: "DEVICE", description: "Opens Battery Saver & usage stats", requiresConfirmation: false, iconName: "BatteryCharging" },
  { name: "OPEN_DISPLAY_SETTINGS", category: "DEVICE", description: "Opens Display & Brightness controls", requiresConfirmation: false, iconName: "Sun" },
  { name: "OPEN_STORAGE_SETTINGS", category: "DEVICE", description: "Opens Device Internal Storage info", requiresConfirmation: false, iconName: "HardDrive" },
  { name: "OPEN_HOTSPOT_SETTINGS", category: "DEVICE", description: "Opens Tethering & Portable Hotspot", requiresConfirmation: false, iconName: "Radio" },
  { name: "OPEN_ACCESSIBILITY_SETTINGS", category: "DEVICE", description: "Opens Android Accessibility Services", requiresConfirmation: false, iconName: "Accessibility" },
  { name: "OPEN_NOTIFICATION_SETTINGS", category: "DEVICE", description: "Opens App Notification management", requiresConfirmation: false, iconName: "Bell" },
  { name: "OPEN_DND_SETTINGS", category: "DEVICE", description: "Opens Do Not Disturb (DND) modes", requiresConfirmation: false, iconName: "BellOff" },
  { name: "CHANGE_BRIGHTNESS", category: "DEVICE", description: "Adjusts system screen brightness level", requiresConfirmation: false, iconName: "SunMedium" },
  { name: "FLASHLIGHT_ON", category: "DEVICE", description: "Turns on camera torch mode", requiresConfirmation: false, iconName: "Flashlight" },
  { name: "FLASHLIGHT_OFF", category: "DEVICE", description: "Turns off camera torch mode", requiresConfirmation: false, iconName: "FlashlightOff" },
  { name: "CHANGE_MEDIA_VOLUME", category: "DEVICE", description: "Adjusts media volume up, down, or mute", requiresConfirmation: false, iconName: "Volume2" },
  { name: "CLOSE_MYRAA", category: "DEVICE", description: "Minimizes application to Android home", requiresConfirmation: false, iconName: "Power" },

  // Navigation & Web
  { name: "OPEN_MAPS", category: "NAVIGATION", description: "Opens Google Maps with search coordinates", requiresConfirmation: false, iconName: "MapPin" },
  { name: "START_NAVIGATION", category: "NAVIGATION", description: "Launches turn-by-turn navigation intent", requiresConfirmation: false, iconName: "Navigation" },
  { name: "WEB_SEARCH", category: "NAVIGATION", description: "Launches web search in default browser", requiresConfirmation: false, iconName: "Globe" },
  { name: "YOUTUBE_SEARCH", category: "NAVIGATION", description: "Launches YouTube search intent", requiresConfirmation: false, iconName: "PlaySquare" },

  // Media Controls
  { name: "MEDIA_PLAY", category: "MEDIA", description: "Sends play command to active media session", requiresConfirmation: false, iconName: "Play" },
  { name: "MEDIA_PAUSE", category: "MEDIA", description: "Sends pause command to active media session", requiresConfirmation: false, iconName: "Pause" },
  { name: "MEDIA_NEXT", category: "MEDIA", description: "Skips to next media track", requiresConfirmation: false, iconName: "SkipForward" },
  { name: "MEDIA_PREVIOUS", category: "MEDIA", description: "Rewinds to previous media track", requiresConfirmation: false, iconName: "SkipBack" },

  // Personal Productivity (Gated Approval)
  { name: "CALL_CONTACT", category: "PRODUCTIVITY", description: "Resolves contact and opens phone dialer", requiresConfirmation: true, iconName: "PhoneCall" },
  { name: "PREPARE_SMS", category: "PRODUCTIVITY", description: "Composes SMS with recipient & message", requiresConfirmation: false, iconName: "MessageSquare" },
  { name: "SEND_SMS", category: "PRODUCTIVITY", description: "Sends prepared SMS to phone number", requiresConfirmation: true, iconName: "Send" },
  { name: "PREPARE_WHATSAPP_MESSAGE", category: "PRODUCTIVITY", description: "Formats WhatsApp intent with recipient", requiresConfirmation: false, iconName: "MessageCircle" },
  { name: "SEND_WHATSAPP_MESSAGE", category: "PRODUCTIVITY", description: "Directly opens WhatsApp chat with text", requiresConfirmation: true, iconName: "Share2" },
  { name: "CREATE_ALARM", category: "PRODUCTIVITY", description: "Sets system clock alarm via AlarmClock API", requiresConfirmation: false, iconName: "AlarmClock" },
  { name: "START_TIMER", category: "PRODUCTIVITY", description: "Sets system countdown timer", requiresConfirmation: false, iconName: "Timer" },
  { name: "CREATE_CALENDAR_EVENT", category: "PRODUCTIVITY", description: "Inserts calendar event to Google Calendar", requiresConfirmation: true, iconName: "Calendar" },
  { name: "CREATE_REMINDER", category: "PRODUCTIVITY", description: "Creates scheduled reminder notification", requiresConfirmation: false, iconName: "CheckSquare" },

  // Privacy & Services
  { name: "READ_NOTIFICATION", category: "PRIVACY", description: "Reads safe notifications from MyraaNotificationService", requiresConfirmation: false, iconName: "Eye" },
  { name: "START_BACKGROUND_MODE", category: "PRIVACY", description: "Starts persistent foreground microphone service", requiresConfirmation: false, iconName: "Activity" },
  { name: "STOP_BACKGROUND_MODE", category: "PRIVACY", description: "Stops foreground microphone service", requiresConfirmation: false, iconName: "Square" },
  { name: "CANCEL_PENDING_ACTION", category: "PRIVACY", description: "Aborts unconfirmed sensitive action token", requiresConfirmation: false, iconName: "XCircle" },
];

export const INSTALLED_ANDROID_APPS = [
  { packageName: "com.google.android.youtube", appName: "YouTube", icon: "PlaySquare", category: "Media" },
  { packageName: "com.whatsapp", appName: "WhatsApp", icon: "MessageCircle", category: "Communication" },
  { packageName: "com.google.android.apps.maps", appName: "Google Maps", icon: "MapPin", category: "Navigation" },
  { packageName: "com.google.android.dialer", appName: "Phone Dialer", icon: "Phone", category: "System" },
  { packageName: "com.google.android.apps.messaging", appName: "Messages", icon: "MessageSquare", category: "Communication" },
  { packageName: "com.google.android.camera", appName: "Camera", icon: "Camera", category: "Media" },
  { packageName: "com.android.settings", appName: "Settings", icon: "Settings", category: "System" },
  { packageName: "com.android.chrome", appName: "Chrome", icon: "Globe", category: "Browser" },
  { packageName: "com.google.android.deskclock", appName: "Clock & Alarms", icon: "Clock", category: "Productivity" },
  { packageName: "com.google.android.calendar", appName: "Calendar", icon: "Calendar", category: "Productivity" },
  { packageName: "com.android.vending", appName: "Google Play Store", icon: "ShoppingBag", category: "Store" },
  { packageName: "ai.myraa.mobile", appName: "SHIV AI • MYRAA", icon: "Sparkles", category: "AI Assistant" },
];

class NativeBridgeService {
  private auditLogs: AuditLogItem[] = [];
  private flashlightOn: boolean = false;
  private volume: number = 75;
  private brightness: number = 85;
  private backgroundMode: boolean = false;
  private pendingConfirmation: { action: string; payload: any; token: string; resolve: (val: any) => void } | null = null;

  constructor() {
    this.recordAudit("INFO", "BRIDGE_INIT", "NativeBridge initialized for Shri Ram Nag (Android).");
    this.injectWindowGlobal();
  }

  private injectWindowGlobal() {
    if (typeof window !== "undefined") {
      (window as any).MyraaNative = {
        getApiStatus: async () => ({
          configured: true,
          validated: true,
          setupComplete: true,
          primaryAi: "SHIV AI",
          owner: "Shri Ram Nag",
          freeForever: true,
        }),
        getInstalledApps: async () => ({
          ok: true,
          count: INSTALLED_ANDROID_APPS.length,
          apps: INSTALLED_ANDROID_APPS,
        }),
        readClipboard: async () => {
          try {
            const text = await navigator.clipboard.readText();
            // Shield OTP or Credit Cards
            if (/\b\d{4,6}\b/.test(text) && /(otp|code|pin|password|cvv)/i.test(text)) {
              this.recordAudit("CRITICAL", "READ_CLIPBOARD", "Shield blocked OTP in clipboard.");
              return { ok: false, error: "Payment & OTP Shield: Clipboard contains sensitive credential." };
            }
            return { ok: true, text };
          } catch {
            return { ok: true, text: "Shri Ram Nag - MYRAA Project v3.0" };
          }
        },
        executeAction: async ({ action }: { action: { action: string; [k: string]: any } }) => {
          return this.executeAction(action.action, action);
        },
        startBackgroundMode: async () => {
          this.backgroundMode = true;
          this.recordAudit("INFO", "START_BACKGROUND_MODE", "Foreground microphone wake service active.");
          return { ok: true, message: "Myraa foreground service started with persistent notification." };
        },
        stopBackgroundMode: async () => {
          this.backgroundMode = false;
          this.recordAudit("INFO", "STOP_BACKGROUND_MODE", "Foreground microphone wake service stopped.");
          return { ok: true, message: "Foreground service stopped." };
        },
      };
    }
  }

  public recordAudit(severity: AuditLogItem["severity"], action: string, details: string, status: AuditLogItem["status"] = "ALLOWED") {
    const item: AuditLogItem = {
      id: "audit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      severity,
      source: "AndroidNativeBridge",
      action,
      status,
      details,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.auditLogs.unshift(item);
    if (this.auditLogs.length > 100) this.auditLogs.pop();
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  public getDeviceState() {
    return {
      flashlightOn: this.flashlightOn,
      volume: this.volume,
      brightness: this.brightness,
      backgroundMode: this.backgroundMode,
    };
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(100, val));
    this.recordAudit("LOW", "CHANGE_MEDIA_VOLUME", `Media volume set to ${this.volume}%`);
  }

  public setBrightness(val: number) {
    this.brightness = Math.max(10, Math.min(100, val));
    this.recordAudit("LOW", "CHANGE_BRIGHTNESS", `Screen brightness set to ${this.brightness}%`);
  }

  public toggleFlashlight(): boolean {
    this.flashlightOn = !this.flashlightOn;
    this.recordAudit("INFO", this.flashlightOn ? "FLASHLIGHT_ON" : "FLASHLIGHT_OFF", `Flashlight turned ${this.flashlightOn ? "ON" : "OFF"}`);
    return this.flashlightOn;
  }

  public async executeAction(actionName: string, payload: any = {}): Promise<{ ok: boolean; message: string; requiresConfirmation?: boolean; token?: string }> {
    const act = ALL_43_NATIVE_ACTIONS.find((a) => a.name === actionName);
    const label = act ? act.name : actionName;

    // Check Gated Confirmation
    if (act?.requiresConfirmation && !payload?.confirmed) {
      const token = "token-" + Date.now().toString(36);
      this.recordAudit("MEDIUM", label, `Awaiting user confirmation token for ${label}`, "AWAITING_CONFIRMATION");
      return {
        ok: false,
        requiresConfirmation: true,
        token,
        message: `User safety confirmation required for ${label}. Please confirm on screen.`,
      };
    }

    // Forward to real Android Native Plugin if running inside Android WebView APK
    if (typeof window !== "undefined" && (window as any).MyraaNativeBridge) {
      try {
        const raw = (window as any).MyraaNativeBridge.invoke(
          "executeAction",
          JSON.stringify({ action: { action: actionName, ...payload } })
        );
        const parsed = JSON.parse(raw || "{}");
        if (parsed && parsed.message) {
          this.recordAudit("INFO", label, `[Android APK Native] ${parsed.message}`);
          return { ok: parsed.status !== "error", message: parsed.message };
        }
      } catch (err) {
        // Fallback to UI state update below
      }
    }

    switch (actionName) {
      case "FLASHLIGHT_ON":
        this.flashlightOn = true;
        this.recordAudit("INFO", label, "Flashlight turned ON.");
        return { ok: true, message: "Flashlight turned ON." };

      case "FLASHLIGHT_OFF":
        this.flashlightOn = false;
        this.recordAudit("INFO", label, "Flashlight turned OFF.");
        return { ok: true, message: "Flashlight turned OFF." };

      case "CHANGE_BRIGHTNESS":
        this.brightness = payload.level ?? 80;
        this.recordAudit("LOW", label, `Screen brightness adjusted to ${this.brightness}%`);
        return { ok: true, message: `Screen brightness set to ${this.brightness}%.` };

      case "CHANGE_MEDIA_VOLUME":
        this.volume = payload.volume ?? (payload.direction === "UP" ? Math.min(100, this.volume + 10) : Math.max(0, this.volume - 10));
        this.recordAudit("LOW", label, `Media volume set to ${this.volume}%`);
        return { ok: true, message: `Media volume set to ${this.volume}%.` };

      case "OPEN_APP":
        const app = INSTALLED_ANDROID_APPS.find(
          (a) => a.packageName.toLowerCase().includes((payload.packageName || payload.query || "").toLowerCase()) ||
                 a.appName.toLowerCase().includes((payload.packageName || payload.query || "").toLowerCase())
        );
        const name = app ? app.appName : (payload.appName || payload.packageName || "App");
        this.recordAudit("INFO", label, `Launched application: ${name}`);
        return { ok: true, message: `Opened ${name} successfully.` };

      case "OPEN_CAMERA":
        this.recordAudit("INFO", label, "Camera viewfinder intent launched.");
        return { ok: true, message: "Camera opened." };

      case "CALL_CONTACT":
        const contact = payload.contact || payload.name || "Shri Ram Nag";
        this.recordAudit("HIGH", label, `Initiated phone call to ${contact}`, "EXECUTED");
        return { ok: true, message: `Calling ${contact}...` };

      case "SEND_SMS":
        const recipient = payload.recipient || payload.phone || "Emergency Contact";
        const msg = payload.message || "Hello from MYRAA";
        this.recordAudit("HIGH", label, `SMS sent to ${recipient}: "${msg}"`, "EXECUTED");
        return { ok: true, message: `SMS sent to ${recipient}.` };

      case "SEND_WHATSAPP_MESSAGE":
        this.recordAudit("HIGH", label, `Opened WhatsApp chat with prefilled text`, "EXECUTED");
        return { ok: true, message: `WhatsApp message prepared and opened.` };

      case "CREATE_ALARM":
        const time = payload.time || "07:00 AM";
        this.recordAudit("LOW", label, `Alarm scheduled for ${time}`);
        return { ok: true, message: `Alarm set for ${time}.` };

      case "START_TIMER":
        const sec = payload.seconds || 300;
        this.recordAudit("LOW", label, `Timer set for ${sec} seconds`);
        return { ok: true, message: `Countdown timer started for ${sec}s.` };

      case "START_BACKGROUND_MODE":
        this.backgroundMode = true;
        this.recordAudit("INFO", label, "Foreground service started.");
        return { ok: true, message: "Microphone background service running." };

      case "STOP_BACKGROUND_MODE":
        this.backgroundMode = false;
        this.recordAudit("INFO", label, "Foreground service stopped.");
        return { ok: true, message: "Foreground service stopped." };

      default:
        this.recordAudit("INFO", label, `Executed action: ${label}`);
        return { ok: true, message: `Action ${label} executed successfully.` };
    }
  }
}

export const nativeBridge = new NativeBridgeService();
