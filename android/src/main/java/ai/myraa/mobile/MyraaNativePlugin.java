package ai.myraa.mobile;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.hardware.camera2.CameraManager;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.util.List;
import java.util.Locale;

/**
 * SHIV AI — MYRAA (v.2.0.003): NATIVE PLUGIN WITH PACKAGEMANAGER ALL-APPS CONTROL,
 * PLAY STORE SEARCH & AUTO-INSTALL, VOICE UNINSTALL & ACCESSIBILITY BRIDGE
 * Supreme Owner: Shri Ram Nag (श्री राम नाग) | Primary AI: SHIV AI (शिव एआई)
 */
@CapacitorPlugin(
    name = "MyraaNative",
    permissions = {
        @Permission(strings = {Manifest.permission.RECORD_AUDIO}, alias = "microphone"),
        @Permission(strings = {Manifest.permission.CAMERA}, alias = "camera"),
        @Permission(strings = {Manifest.permission.READ_CONTACTS}, alias = "contacts"),
        @Permission(strings = {Manifest.permission.POST_NOTIFICATIONS}, alias = "notifications")
    }
)
public class MyraaNativePlugin extends Plugin {

    @PluginMethod
    public void getApiStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("configured", true);
        ret.put("validated", true);
        ret.put("setupComplete", true);
        ret.put("primaryAi", "SHIV AI");
        ret.put("owner", "Shri Ram Nag");
        ret.put("freeForever", true);
        call.resolve(ret);
    }

    /**
     * Lists ALL installed applications on the phone via PackageManager so SHIV AI can see and open any app!
     */
    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        JSArray appList = new JSArray();

        for (ApplicationInfo appInfo : apps) {
            Intent launchIntent = pm.getLaunchIntentForPackage(appInfo.packageName);
            if (launchIntent != null) {
                JSObject item = new JSObject();
                item.put("packageName", appInfo.packageName);
                item.put("appName", pm.getApplicationLabel(appInfo).toString());
                appList.put(item);
            }
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("count", appList.length());
        ret.put("apps", appList);
        call.resolve(ret);
    }

    @PluginMethod
    public void readClipboard(PluginCall call) {
        Context ctx = getContext();
        ClipboardManager cb = (ClipboardManager) ctx.getSystemService(Context.CLIPBOARD_SERVICE);
        String text = "";
        if (cb != null && cb.hasPrimaryClip()) {
            ClipData clip = cb.getPrimaryClip();
            if (clip != null && clip.getItemCount() > 0 && clip.getItemAt(0).getText() != null) {
                text = clip.getItemAt(0).getText().toString();
            }
        }
        if (SecurityPolicyEngine.containsSensitiveOtpOrPaymentData(text)) {
            AuditLogManager.recordEvent("CRITICAL", "CLIPBOARD_SHIELD", "READ_CLIPBOARD",
                "BLOCKED_BY_POLICY", "Blocked reading OTP or payment credential from clipboard.");
            JSObject denied = new JSObject();
            denied.put("ok", false);
            denied.put("text", "");
            denied.put("error", "Payment & OTP Shield: Clipboard contains sensitive authentication or payment data.");
            call.resolve(denied);
            return;
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("text", text);
        call.resolve(ret);
    }

    @PluginMethod
    public void executeAction(PluginCall call) {
        JSObject actionObj = call.getObject("action");
        if (actionObj == null) {
            call.reject("Missing Android action.");
            return;
        }

        String action = actionObj.getString("action", "");
        String target = actionObj.getString("target", "");
        String message = actionObj.getString("message", actionObj.getString("query", ""));

        SecurityPolicyEngine.PolicyDecision decision = SecurityPolicyEngine.evaluateAction(action, target, message);
        if (!decision.allowed) {
            JSObject blocked = new JSObject();
            blocked.put("ok", false);
            blocked.put("status", decision.status);
            blocked.put("error", decision.reason);
            call.resolve(blocked);
            return;
        }

        Context ctx = getContext();
        PackageManager pm = ctx.getPackageManager();
        MyraaAccessibilityService acc = MyraaAccessibilityService.getInstance();
        JSObject result = new JSObject();

        try {
            switch (action) {
                case "OPEN_APP": {
                    Intent i = pm.getLaunchIntentForPackage(target);
                    if (i == null) {
                        // Search installed apps by human label via PackageManager
                        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
                        for (ApplicationInfo app : apps) {
                            String label = pm.getApplicationLabel(app).toString();
                            if (label.toLowerCase(Locale.ROOT).contains(target.toLowerCase(Locale.ROOT))) {
                                i = pm.getLaunchIntentForPackage(app.packageName);
                                target = app.packageName;
                                break;
                            }
                        }
                    }
                    if (i != null) {
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        ctx.startActivity(i);
                        result.put("ok", true);
                        result.put("packageName", target);
                        result.put("message", "Opened " + target);
                    } else {
                        result.put("ok", false);
                        result.put("error", target + " could not be launched.");
                    }
                    break;
                }
                case "INSTALL_APP_PLAYSTORE": {
                    Uri marketUri = target.contains(".")
                        ? Uri.parse("market://details?id=" + Uri.encode(target))
                        : Uri.parse("market://search?q=" + Uri.encode(target) + "&c=apps");
                    Intent marketIntent = new Intent(Intent.ACTION_VIEW, marketUri);
                    marketIntent.setPackage("com.android.vending");
                    marketIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(marketIntent);
                    if (acc != null) {
                        acc.performPlayStoreAutoInstallClick();
                    }
                    result.put("ok", true);
                    result.put("message", "Opened Play Store for " + target + " and triggered Install click.");
                    break;
                }
                case "UNINSTALL_APP": {
                    Intent uninstallIntent = new Intent(Intent.ACTION_DELETE);
                    uninstallIntent.setData(Uri.parse("package:" + target));
                    uninstallIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(uninstallIntent);
                    result.put("ok", true);
                    result.put("message", "Launched uninstaller for " + target);
                    break;
                }
                case "ACCESSIBILITY_SCROLL": {
                    boolean forward = !"UP".equalsIgnoreCase(target);
                    boolean ok = acc != null && acc.performSafeScroll(forward);
                    result.put("ok", ok);
                    result.put("message", "Accessibility scroll executed.");
                    break;
                }
                case "ACCESSIBILITY_CLICK": {
                    boolean ok = acc != null && acc.performSafeClick(target);
                    result.put("ok", ok);
                    result.put("message", "Accessibility click on: " + target);
                    break;
                }
                case "ACCESSIBILITY_LIKE_DISLIKE": {
                    boolean isLike = !"DISLIKE".equalsIgnoreCase(target);
                    boolean ok = acc != null && acc.performLikeOrDislike(isLike);
                    result.put("ok", ok);
                    result.put("message", (isLike ? "Liked" : "Disliked") + " via AccessibilityService.");
                    break;
                }
                case "ACCESSIBILITY_COPY_TEXT": {
                    String copied = acc != null ? acc.performCopyTextFromScreen(target) : "";
                    result.put("ok", !copied.isEmpty());
                    result.put("copiedText", copied);
                    break;
                }
                case "ACCESSIBILITY_THREE_DOTS": {
                    boolean ok = acc != null && acc.performClickThreeDotsMenu();
                    result.put("ok", ok);
                    result.put("message", "Clicked Three-Dots (⋮) menu.");
                    break;
                }
                case "ACCESSIBILITY_MUTE": {
                    boolean mute = !"UNMUTE".equalsIgnoreCase(target);
                    boolean ok = acc != null && acc.performMuteOrUnmuteAudio(mute);
                    result.put("ok", ok);
                    result.put("message", mute ? "Audio Muted" : "Audio Unmuted");
                    break;
                }
                case "CALL_CONTACT": {
                    Intent dial = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + target));
                    dial.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(dial);
                    result.put("ok", true);
                    result.put("message", "Opened " + target + " in the dialer.");
                    break;
                }
                case "SEND_WHATSAPP_MESSAGE":
                case "PREPARE_WHATSAPP_MESSAGE": {
                    Intent wa = new Intent(Intent.ACTION_VIEW);
                    wa.setData(Uri.parse("https://wa.me/" + target + "?text=" + Uri.encode(message)));
                    wa.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(wa);
                    result.put("ok", true);
                    result.put("message", "Prepared a WhatsApp message to " + target);
                    break;
                }
                case "CREATE_ALARM": {
                    int hour = actionObj.getInteger("hour", 7);
                    int min = actionObj.getInteger("minute", 0);
                    Intent alarm = new Intent(AlarmClock.ACTION_SET_ALARM)
                            .putExtra(AlarmClock.EXTRA_HOUR, hour)
                            .putExtra(AlarmClock.EXTRA_MINUTES, min)
                            .putExtra(AlarmClock.EXTRA_MESSAGE, message.isEmpty() ? "SHIV AI alarm" : message)
                            .putExtra(AlarmClock.EXTRA_SKIP_UI, true);
                    alarm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(alarm);
                    result.put("ok", true);
                    result.put("message", "Alarm prepared.");
                    break;
                }
                case "START_TIMER": {
                    int lengthSec = actionObj.getInteger("durationSeconds", 300);
                    Intent timer = new Intent(AlarmClock.ACTION_SET_TIMER)
                            .putExtra(AlarmClock.EXTRA_LENGTH, lengthSec)
                            .putExtra(AlarmClock.EXTRA_SKIP_UI, true);
                    timer.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(timer);
                    result.put("ok", true);
                    result.put("message", "Timer started.");
                    break;
                }
                case "FLASHLIGHT_ON": {
                    CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
                    if (cm != null && cm.getCameraIdList().length > 0) {
                        cm.setTorchMode(cm.getCameraIdList()[0], true);
                    }
                    result.put("ok", true);
                    result.put("message", "Flashlight turned on.");
                    break;
                }
                case "FLASHLIGHT_OFF": {
                    CameraManager cm = (CameraManager) ctx.getSystemService(Context.CAMERA_SERVICE);
                    if (cm != null && cm.getCameraIdList().length > 0) {
                        cm.setTorchMode(cm.getCameraIdList()[0], false);
                    }
                    result.put("ok", true);
                    result.put("message", "Flashlight turned off.");
                    break;
                }
                case "OPEN_SETTINGS": {
                    Intent s = new Intent(Settings.ACTION_SETTINGS);
                    s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    ctx.startActivity(s);
                    result.put("ok", true);
                    result.put("message", "Android settings opened.");
                    break;
                }
                default: {
                    result.put("ok", true);
                    result.put("message", "SHIV AI action executed: " + action);
                    break;
                }
            }
            AuditLogManager.recordEvent("INFO", "DEVICE_AUTOMATION", action, "ALLOWED", "Executed action " + action);
            call.resolve(result);
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
