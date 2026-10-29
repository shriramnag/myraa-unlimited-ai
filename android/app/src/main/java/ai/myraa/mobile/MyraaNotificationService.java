package ai.myraa.mobile;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.app.Notification;
import android.os.Bundle;
import java.util.ArrayList;
import java.util.List;

/**
 * PHASE 3 HARDENED: MYRAA NOTIFICATION SERVICE WITH PAYMENT & OTP SHIELD
 */
public class MyraaNotificationService extends NotificationListenerService {
    public static final List<NotificationEntry> recentNotifications = new ArrayList<>();

    public static class NotificationEntry {
        public final String packageName;
        public final String title;
        public final String text;
        public final long postTime;

        public NotificationEntry(String pkg, String t, String txt, long time) {
            this.packageName = pkg;
            this.title = t;
            this.text = txt;
            this.postTime = time;
        }
    }

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || sbn.getNotification() == null) return;
        String pkg = sbn.getPackageName();

        // Layer 1: Package-level Payment & Authenticator Shield
        if (SecurityPolicyEngine.isBlockedPackage(pkg)) {
            AuditLogManager.recordEvent("HIGH", "NOTIFICATION_SHIELD", "ON_NOTIFICATION_POSTED",
                "BLOCKED_BY_POLICY", "Ignored notification from financial/authenticator package.");
            return;
        }

        Notification n = sbn.getNotification();
        Bundle extras = n.extras;
        if (extras == null) return;

        String title = extras.getString(Notification.EXTRA_TITLE, "");
        CharSequence textSeq = extras.getCharSequence(Notification.EXTRA_TEXT);
        String text = textSeq != null ? textSeq.toString() : "";
        String combined = title + " " + text;

        // Layer 2: Bi-directional OTP, PIN, CVV, Card & Payment Keyword Shield
        if (SecurityPolicyEngine.containsSensitiveOtpOrPaymentData(combined)) {
            AuditLogManager.recordEvent("CRITICAL", "OTP_SHIELD", "ON_NOTIFICATION_POSTED",
                "BLOCKED_BY_POLICY", "Suppressed notification containing OTP or payment credential.");
            return;
        }

        synchronized (recentNotifications) {
            if (recentNotifications.size() >= 25) {
                recentNotifications.remove(0);
            }
            recentNotifications.add(new NotificationEntry(pkg, title, text, sbn.getPostTime()));
        }
    }
}
