import { AuditLogItem, NativeActionDefinition } from "../types";

export interface RuntimeActionDefinition extends NativeActionDefinition {
  worksInBrowser: boolean;
}

export const ALL_43_NATIVE_ACTIONS: RuntimeActionDefinition[] = [
  { name: "OPEN_APP", category: "DEVICE", description: "Opens allowlisted app via Android bridge or web URL fallback", requiresConfirmation: false, iconName: "Smartphone", worksInBrowser: true },
  { name: "OPEN_CAMERA", category: "DEVICE", description: "Launches Android camera viewfinder intent (Android app required)", requiresConfirmation: false, iconName: "Camera", worksInBrowser: false },
  { name: "OPEN_GALLERY", category: "DEVICE", description: "Opens device photo gallery and media albums (Android app required)", requiresConfirmation: false, iconName: "Image", worksInBrowser: false },
  { name: "OPEN_SETTINGS", category: "DEVICE", description: "Opens Android Main System Settings (Android app required)", requiresConfirmation: false, iconName: "Settings", worksInBrowser: false },
  { name: "OPEN_WIFI_SETTINGS", category: "DEVICE", description: "Opens Wi-Fi networks configuration (Android app required)", requiresConfirmation: false, iconName: "Wifi", worksInBrowser: false },
  { name: "OPEN_BLUETOOTH_SETTINGS", category: "DEVICE", description: "Opens Bluetooth paired devices (Android app required)", requiresConfirmation: false, iconName: "Bluetooth", worksInBrowser: false },
  { name: "OPEN_BATTERY_SETTINGS", category: "DEVICE", description: "Opens Battery Saver & usage stats (Android app required)", requiresConfirmation: false, iconName: "BatteryCharging", worksInBrowser: false },
  { name: "OPEN_DISPLAY_SETTINGS", category: "DEVICE", description: "Opens Display & Brightness controls (Android app required)", requiresConfirmation: false, iconName: "Sun", worksInBrowser: false },
  { name: "OPEN_STORAGE_SETTINGS", category: "DEVICE", description: "Opens Device Internal Storage info (Android app required)", requiresConfirmation: false, iconName: "HardDrive", worksInBrowser: false },
  { name: "OPEN_HOTSPOT_SETTINGS", category: "DEVICE", description: "Opens Tethering & Portable Hotspot (Android app required)", requiresConfirmation: false, iconName: "Radio", worksInBrowser: false },
  { name: "OPEN_ACCESSIBILITY_SETTINGS", category: "DEVICE", description: "Opens Android Accessibility Services (Android app required)", requiresConfirmation: false, iconName: "Accessibility", worksInBrowser: false },
  { name: "OPEN_NOTIFICATION_SETTINGS", category: "DEVICE", description: "Opens App Notification management (Android app required)", requiresConfirmation: false, iconName: "Bell", worksInBrowser: false },
  { name: "OPEN_DND_SETTINGS", category: "DEVICE", description: "Opens Do Not Disturb (DND) modes (Android app required)", requiresConfirmation: false, iconName: "BellOff", worksInBrowser: false },
  { name: "CHANGE_BRIGHTNESS", category: "DEVICE", description: "Adjusts system screen brightness level (Android app required)", requiresConfirmation: false, iconName: "SunMedium", worksInBrowser: false },
  { name: "FLASHLIGHT_ON", category: "DEVICE", description: "Turns on camera torch via Android CameraManager", requiresConfirmation: false, iconName: "Flashlight", worksInBrowser: false },
  { name: "FLASHLIGHT_OFF", category: "DEVICE", description: "Turns off camera torch via Android CameraManager", requiresConfirmation: false, iconName: "FlashlightOff", worksInBrowser: false },
  { name: "CHANGE_MEDIA_VOLUME", category: "DEVICE", description: "Adjusts system media volume (Android app required)", requiresConfirmation: false, iconName: "Volume2", worksInBrowser: false },
  { name: "CLOSE_MYRAA", category: "DEVICE", description: "Minimizes application to Android home (Android app required)", requiresConfirmation: false, iconName: "Power", worksInBrowser: false },
  { name: "OPEN_MAPS", category: "NAVIGATION", description: "Opens Google Maps in app or web browser", requiresConfirmation: false, iconName: "MapPin", worksInBrowser: true },
  { name: "START_NAVIGATION", category: "NAVIGATION", description: "Launches turn-by-turn navigation in Maps", requiresConfirmation: false, iconName: "Navigation", worksInBrowser: true },
  { name: "WEB_SEARCH", category: "NAVIGATION", description: "Opens HTTPS web search or URL in browser", requiresConfirmation: false, iconName: "Globe", worksInBrowser: true },
  { name: "YOUTUBE_SEARCH", category: "NAVIGATION", description: "Opens YouTube search in app or browser", requiresConfirmation: false, iconName: "PlaySquare", worksInBrowser: true },
  { name: "MEDIA_PLAY", category: "MEDIA", description: "Sends play command to active Android media session", requiresConfirmation: false, iconName: "Play", worksInBrowser: false },
  { name: "MEDIA_PAUSE", category: "MEDIA", description: "Sends pause command to active Android media session", requiresConfirmation: false, iconName: "Pause", worksInBrowser: false },
  { name: "MEDIA_NEXT", category: "MEDIA", description: "Skips to next media track (Android app required)", requiresConfirmation: false, iconName: "SkipForward", worksInBrowser: false },
  { name: "MEDIA_PREVIOUS", category: "MEDIA", description: "Rewinds to previous media track (Android app required)", requiresConfirmation: false, iconName: "SkipBack", worksInBrowser: false },
  { name: "CALL_CONTACT", category: "PRODUCTIVITY", description: "Opens phone dialer after on-screen confirmation", requiresConfirmation: true, iconName: "PhoneCall", worksInBrowser: true },
  { name: "PREPARE_SMS", category: "PRODUCTIVITY", description: "Composes SMS via sms: URI or Android intent", requiresConfirmation: false, iconName: "MessageSquare", worksInBrowser: true },
  { name: "SEND_SMS", category: "PRODUCTIVITY", description: "Opens SMS app with recipient & message", requiresConfirmation: true, iconName: "Send", worksInBrowser: true },
  { name: "PREPARE_WHATSAPP_MESSAGE", category: "PRODUCTIVITY", description: "Formats WhatsApp deep link (wa.me)", requiresConfirmation: false, iconName: "MessageCircle", worksInBrowser: true },
  { name: "SEND_WHATSAPP_MESSAGE", category: "PRODUCTIVITY", description: "Opens WhatsApp chat with text via wa.me or native intent", requiresConfirmation: true, iconName: "Share2", worksInBrowser: true },
  { name: "CREATE_ALARM", category: "PRODUCTIVITY", description: "Sets system clock alarm via AlarmClock API (Android app required)", requiresConfirmation: false, iconName: "AlarmClock", worksInBrowser: false },
  { name: "START_TIMER", category: "PRODUCTIVITY", description: "Sets system countdown timer (Android app required)", requiresConfirmation: false, iconName: "Timer", worksInBrowser: false },
  { name: "CREATE_CALENDAR_EVENT", category: "PRODUCTIVITY", description: "Inserts calendar event to Google Calendar (Android app required)", requiresConfirmation: true, iconName: "Calendar", worksInBrowser: false },
  { name: "CREATE_REMINDER", category: "PRODUCTIVITY", description: "Creates scheduled reminder (Android app required)", requiresConfirmation: false, iconName: "CheckSquare", worksInBrowser: false },
  { name: "READ_NOTIFICATION", category: "PRIVACY", description: "Reads safe notifications (Android app required)", requiresConfirmation: false, iconName: "Eye", worksInBrowser: false },
  { name: "START_BACKGROUND_MODE", category: "PRIVACY", description: "Starts foreground service (Android app required)", requiresConfirmation: false, iconName: "Activity", worksInBrowser: false },
  { name: "STOP_BACKGROUND_MODE", category: "PRIVACY", description: "Stops foreground service (Android app required)", requiresConfirmation: false, iconName: "Square", worksInBrowser: false },
  { name: "CANCEL_PENDING_ACTION", category: "PRIVACY", description: "Aborts unconfirmed sensitive action token", requiresConfirmation: false, iconName: "XCircle", worksInBrowser: true },
];

export const ALLOWLISTED_APPS: Record<
  string,
  {
    id: string;
    appName: string;
    packageName: string;
    webFallbackUrl?: string;
    category: string;
  }
> = {
  whatsapp: {
    id: "whatsapp",
    appName: "WhatsApp",
    packageName: "com.whatsapp",
    webFallbackUrl: "https://web.whatsapp.com",
    category: "Communication",
  },
  youtube: {
    id: "youtube",
    appName: "YouTube",
    packageName: "com.google.android.youtube",
    webFallbackUrl: "https://www.youtube.com",
    category: "Media",
  },
  instagram: {
    id: "instagram",
    appName: "Instagram",
    packageName: "com.instagram.android",
    webFallbackUrl: "https://www.instagram.com",
    category: "Social",
  },
  maps: {
    id: "maps",
    appName: "Google Maps",
    packageName: "com.google.android.apps.maps",
    webFallbackUrl: "https://maps.google.com",
    category: "Navigation",
  },
  playstore: {
    id: "playstore",
    appName: "Google Play Store",
    packageName: "com.android.vending",
    webFallbackUrl: "https://play.google.com/store",
    category: "System",
  },
  camera: {
    id: "camera",
    appName: "Camera",
    packageName: "com.google.android.camera",
    category: "Media",
  },
  settings: {
    id: "settings",
    appName: "System Settings",
    packageName: "com.android.settings",
    category: "System",
  },
  chrome: {
    id: "chrome",
    appName: "Google Chrome",
    packageName: "com.android.chrome",
    webFallbackUrl: "https://www.google.com",
    category: "Browser",
  },
};

export const INSTALLED_ANDROID_APPS = Object.values(ALLOWLISTED_APPS);

const SHIELDED_PAYMENT_KEYWORDS = [
  "gpay",
  "google pay",
  "phonepe",
  "paytm",
  "bhim",
  "upi",
  "otp",
  "netbanking",
  "bank transfer",
];

export interface RealDeviceTelemetry {
  hasNativeBridge: boolean;
  flashlightOn: boolean;
  batteryLevel: number | null;
  isCharging: boolean | null;
  isOnline: boolean | null;
}

class NativeBridgeService {
  private flashlightState: boolean = false;
  private auditLogs: AuditLogItem[] = [];
  private batteryLevel: number | null = null;
  private isCharging: boolean | null = null;

  constructor() {
    this.recordAudit(
      "INFO",
      "SYSTEM_BOOT",
      "INITIALIZE_BRIDGE",
      "ALLOWED",
      `Runtime initialized (NativeBridge=${this.hasAndroidBridge() ? "detected" : "browser-mode"})`
    );
    this.initRealBatteryListener();
  }

  private initRealBatteryListener() {
    if (typeof navigator !== "undefined" && typeof (navigator as any).getBattery === "function") {
      (navigator as any)
        .getBattery()
        .then((battery: any) => {
          const update = () => {
            if (typeof battery.level === "number") {
              this.batteryLevel = Math.round(battery.level * 100);
            }
            if (typeof battery.charging === "boolean") {
              this.isCharging = battery.charging;
            }
          };
          update();
          battery.addEventListener?.("levelchange", update);
          battery.addEventListener?.("chargingchange", update);
        })
        .catch(() => {
          this.batteryLevel = null;
        });
    }
  }

  public hasAndroidBridge(): boolean {
    return Boolean(typeof window !== "undefined" && (window as any).MyraaNativeBridge);
  }

  public isBlockedByPaymentShield(input: string): boolean {
    const lower = input.toLowerCase();
    return SHIELDED_PAYMENT_KEYWORDS.some((kw) => lower.includes(kw));
  }

  public recordAudit(
    severity: AuditLogItem["severity"],
    source: string,
    action: string,
    status: AuditLogItem["status"],
    details: string
  ) {
    const item: AuditLogItem = {
      id: "log-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
      severity,
      source,
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

  public getDeviceState(): RealDeviceTelemetry {
    return {
      hasNativeBridge: this.hasAndroidBridge(),
      flashlightOn: this.flashlightState,
      batteryLevel: this.batteryLevel,
      isCharging: this.isCharging,
      isOnline: typeof navigator !== "undefined" && "onLine" in navigator ? navigator.onLine : null,
    };
  }

  public toggleFlashlight(desiredState?: boolean): {
    success: boolean;
    flashlightOn: boolean;
    message: string;
  } {
    const androidBridge = typeof window !== "undefined" ? (window as any).MyraaNativeBridge : null;
    if (!androidBridge || typeof androidBridge.toggleTorch !== "function") {
      this.recordAudit(
        "LOW",
        "HARDWARE",
        "FLASHLIGHT_TOGGLE",
        "BLOCKED_BY_POLICY",
        "Hardware flashlight unavailable: Android app bridge (MyraaNativeBridge) not present."
      );
      return {
        success: false,
        flashlightOn: false,
        message: "फ़्लैशलाइट केवल MYRAA Android ऐप में काम करती है (ब्राउज़र में हार्डवेयर टॉर्च उपलब्ध नहीं है)।",
      };
    }

    try {
      const nextState =
        typeof desiredState === "boolean"
          ? Boolean(androidBridge.setTorch ? androidBridge.setTorch(desiredState) : androidBridge.toggleTorch())
          : Boolean(androidBridge.toggleTorch());
      this.flashlightState = nextState;
      this.recordAudit(
        "INFO",
        "HARDWARE",
        this.flashlightState ? "FLASHLIGHT_ON" : "FLASHLIGHT_OFF",
        "EXECUTED",
        `Camera torch set to ${this.flashlightState}`
      );
      return {
        success: true,
        flashlightOn: this.flashlightState,
        message: this.flashlightState
          ? "फ़्लैशलाइट चालू कर दी गई है।"
          : "फ़्लैशलाइट बंद कर दी गई है।",
      };
    } catch (err: any) {
      const reason = err?.message || "CameraManager error";
      this.recordAudit("MEDIUM", "HARDWARE", "FLASHLIGHT_ERROR", "BLOCKED_BY_POLICY", reason);
      return {
        success: false,
        flashlightOn: this.flashlightState,
        message: `फ़्लैशलाइट चलाने में त्रुटि: ${reason}`,
      };
    }
  }

  public launchNativeDialer(phoneNumber: string): {
    success: boolean;
    mode: "native" | "tel_uri" | "failed";
    message: string;
  } {
    const cleaned = phoneNumber.replace(/[^\d+*#]/g, "");
    if (!cleaned || cleaned.length < 3) {
      return {
        success: false,
        mode: "failed",
        message: "अमान्य फ़ोन नंबर। कृपया सही नंबर बताएं।",
      };
    }

    const androidBridge = typeof window !== "undefined" ? (window as any).MyraaNativeBridge : null;
    if (androidBridge && typeof androidBridge.launchDialer === "function") {
      try {
        androidBridge.launchDialer(cleaned);
        this.recordAudit("MEDIUM", "TELEPHONY", "LAUNCH_DIALER", "EXECUTED", `Opened native dialer for ${cleaned}`);
        return {
          success: true,
          mode: "native",
          message: `नंबर ${cleaned} के लिए फ़ोन डायलर खोल दिया गया है।`,
        };
      } catch (e: any) {
        return {
          success: false,
          mode: "failed",
          message: `डायलर खोलने में त्रुटि: ${e?.message || "Unknown error"}`,
        };
      }
    }

    try {
      window.open(`tel:${cleaned}`, "_self");
      this.recordAudit("MEDIUM", "TELEPHONY", "TEL_URI_OPENED", "EXECUTED", `Triggered tel:${cleaned}`);
      return {
        success: true,
        mode: "tel_uri",
        message: `नंबर ${cleaned} डायलर लिंक में खोल दिया गया है (ब्राउज़र सीधे कॉल नहीं लगा सकता, कृपया डायलर पर कॉल दबाएं)।`,
      };
    } catch {
      return {
        success: false,
        mode: "failed",
        message: "ब्राउज़र से डायलर नहीं खोला जा सका। इसके लिए Android ऐप आवश्यक है।",
      };
    }
  }

  public launchAllowlistedApp(appKey: string): {
    success: boolean;
    mode: "native" | "web" | "failed";
    message: string;
  } {
    const normalized = appKey.trim().toLowerCase().replace(/\s+/g, "");
    if (this.isBlockedByPaymentShield(normalized)) {
      this.recordAudit(
        "CRITICAL",
        "PAYMENT_SHIELD",
        "OPEN_APP_BLOCKED",
        "BLOCKED_BY_POLICY",
        `Payment & OTP Shield blocked access to ${appKey}`
      );
      return {
        success: false,
        mode: "failed",
        message: "Payment & OTP Shield के कारण पेमेंट या बैंकिंग ऐप को ऑटोमैटिक खोलना प्रतिबंधित है।",
      };
    }

    const entry = ALLOWLISTED_APPS[normalized];
    if (!entry) {
      return {
        success: false,
        mode: "failed",
        message: `'${appKey}' अनुमति सूची (allowlist) में नहीं है। समर्थित ऐप्स: WhatsApp, YouTube, Instagram, Maps, Play Store, Camera, Settings, Chrome.`,
      };
    }

    const androidBridge = typeof window !== "undefined" ? (window as any).MyraaNativeBridge : null;
    if (androidBridge && typeof androidBridge.launchApp === "function") {
      try {
        const res = androidBridge.launchApp(entry.packageName);
        if (res !== false) {
          this.recordAudit("INFO", "APP_LAUNCHER", "OPEN_APP", "EXECUTED", `Launched ${entry.packageName}`);
          return {
            success: true,
            mode: "native",
            message: `${entry.appName} ऐप खोल दिया गया है।`,
          };
        }
      } catch {
        // Fall through to web fallback if available
      }
    }

    if (entry.webFallbackUrl && typeof window !== "undefined") {
      const win = window.open(entry.webFallbackUrl, "_blank", "noopener,noreferrer");
      if (win) {
        this.recordAudit("INFO", "WEB_FALLBACK", "OPEN_APP_WEB", "EXECUTED", `Opened ${entry.webFallbackUrl}`);
        return {
          success: true,
          mode: "web",
          message: `${entry.appName} का वेब पेज नए टैब में खोल दिया गया है।`,
        };
      }
      return {
        success: false,
        mode: "failed",
        message: `ब्राउज़र ने पॉप-अप रोक दिया या नेटिव ${entry.appName} के लिए Android ऐप आवश्यक है।`,
      };
    }

    return {
      success: false,
      mode: "failed",
      message: `${entry.appName} खोलने के लिए MYRAA Android ऐप आवश्यक है (ब्राउज़र में यह सिस्टम ऐप उपलब्ध नहीं है)।`,
    };
  }
}

export const nativeBridge = new NativeBridgeService();
