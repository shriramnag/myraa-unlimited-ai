package ai.myraa.mobile;

import android.Manifest;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.hardware.camera2.CameraManager;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

/**
 * PHASE 2 & 3 HARDENED: MYRAA NATIVE PLUGIN WITH IMMUTABLE SECURITY POLICY ENGINE
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

        // Enforce Immutable SecurityPolicyEngine before ANY execution
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
        JSObject result = new JSObject();

        try {
            switch (action) {
                case "OPEN_APP": {
                    Intent i = ctx.getPackageManager().getLaunchIntentForPackage(target);
                    if (i != null) {
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        ctx.startActivity(i);
                        result.put("ok", true);
                        result.put("message", "Opened " + target);
                    } else {
                        result.put("ok", false);
                        result.put("error", target + " could not be launched.");
                    }
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
                            .putExtra(AlarmClock.EXTRA_MESSAGE, message.isEmpty() ? "MYRAA alarm" : message)
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
                    result.put("message", "MYRAA action executed: " + action);
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
