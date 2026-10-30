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
  // Personal Productivity
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
];

class NativeBridgeService {
  private flashlightState: boolean = false;
  private auditLogs: AuditLogItem[] = [];

  constructor() {
    this.recordAudit("INFO", "SYSTEM_BOOT", "INITIALIZE_BRIDGE", "ALLOWED", "Native bridge initialized for Shri Ram Nag");
  }

  public recordAudit(severity: AuditLogItem["severity"], source: string, action: string, status: AuditLogItem["status"], details: string) {
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

  public getDeviceState() {
    return {
      flashlightOn: this.flashlightState,
      batteryLevel: 98,
      network: "5G VoLTE",
      wifi: "Active / Secured",
    };
  }

  public toggleFlashlight(): boolean {
    this.flashlightState = !this.flashlightState;
    this.recordAudit(
      "INFO",
      "HARDWARE",
      this.flashlightState ? "FLASHLIGHT_ON" : "FLASHLIGHT_OFF",
      "EXECUTED",
      `Camera torch mode set to ${this.flashlightState}`
    );
    return this.flashlightState;
  }
}

export const nativeBridge = new NativeBridgeService();
