package ai.myraa.mobile;

import android.accessibilityservice.AccessibilityService;
import android.os.Bundle;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * PHASE 7: SAFE ANDROID ACCESSIBILITY SERVICE WITH NON-NEGOTIABLE PAYMENT & PASSWORD SHIELD
 * Never inspects or interacts with financial apps, password fields, OTP screens, or CAPTCHAs.
 */
public class MyraaAccessibilityService extends AccessibilityService {

    private static volatile MyraaAccessibilityService instance;

    public static MyraaAccessibilityService getInstance() {
        return instance;
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        AuditLogManager.recordEvent("INFO", "ACCESSIBILITY_SERVICE", "SERVICE_CONNECTED", "ALLOWED",
            "MyraaAccessibilityService connected by user.");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getPackageName() == null) return;
        String pkg = event.getPackageName().toString();
        // Immediately ignore events from financial, UPI, banking, or authenticator packages
        if (SecurityPolicyEngine.isBlockedPackage(pkg)) {
            return;
        }
    }

    @Override
    public void onInterrupt() {
        AuditLogManager.recordEvent("INFO", "ACCESSIBILITY_SERVICE", "SERVICE_INTERRUPTED", "CANCELLED",
            "MyraaAccessibilityService interrupted.");
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    /**
     * Checks if the active screen belongs to a blocked package, contains a password field,
     * CAPTCHA challenge, or payment/OTP prompt. Fails closed if uncertain.
     */
    public SecurityPolicyEngine.PolicyDecision verifyScreenSafeForAutomation(AccessibilityNodeInfo root) {
        if (root == null) {
            return new SecurityPolicyEngine.PolicyDecision(false, "FAILED", "LOW",
                "No active window content available for inspection.");
        }
        String pkg = root.getPackageName() != null ? root.getPackageName().toString() : "";
        if (SecurityPolicyEngine.isBlockedPackage(pkg)) {
            AuditLogManager.recordEvent("CRITICAL", "ACCESSIBILITY_SHIELD", "SCREEN_INSPECTION",
                "BLOCKED_BY_POLICY", "Blocked UI inspection on protected financial/authenticator package: " + pkg);
            return new SecurityPolicyEngine.PolicyDecision(false, "BLOCKED_BY_POLICY", "CRITICAL",
                "Payment & OTP Shield: UI inspection and automation are strictly prohibited in financial or authenticator apps.");
        }
        if (containsPasswordOrChallengeNode(root)) {
            AuditLogManager.recordEvent("CRITICAL", "ACCESSIBILITY_SHIELD", "SENSITIVE_SCREEN_DETECTED",
                "BLOCKED_BY_POLICY", "Blocked UI automation due to password/PIN/OTP/CAPTCHA field on screen.");
            return new SecurityPolicyEngine.PolicyDecision(false, "BLOCKED_BY_POLICY", "CRITICAL",
                "Payment & OTP Shield: Active screen contains a password, PIN, OTP, or security challenge field. Automation halted.");
        }
        return new SecurityPolicyEngine.PolicyDecision(true, "ALLOWED", "INFO", "Screen verified safe.");
    }

    private boolean containsPasswordOrChallengeNode(AccessibilityNodeInfo node) {
        if (node == null) return false;
        if (node.isPassword()) return true;

        CharSequence text = node.getText();
        CharSequence desc = node.getContentDescription();
        String combined = (text != null ? text.toString() : "") + " " + (desc != null ? desc.toString() : "");
        String lower = combined.toLowerCase(Locale.ROOT);

        if (SecurityPolicyEngine.containsSensitiveOtpOrPaymentData(combined)) return true;
        if (lower.contains("captcha") || lower.contains("i am not a robot") || lower.contains("verify you are human")) {
            return true;
        }

        for (int i = 0; i < node.getChildCount(); i++) {
            if (containsPasswordOrChallengeNode(node.getChild(i))) return true;
        }
        return false;
    }

    public boolean performSafeClick(String targetLabel) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        SecurityPolicyEngine.PolicyDecision check = verifyScreenSafeForAutomation(root);
        if (!check.allowed) return false;

        List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(targetLabel);
        if (matches != null) {
            for (AccessibilityNodeInfo node : matches) {
                if (node.isPassword()) continue;
                AccessibilityNodeInfo clickable = findClickableParent(node);
                if (clickable != null && clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                    AuditLogManager.recordEvent("INFO", "ACCESSIBILITY_AUTOMATION", "CLICK_NODE", "ALLOWED",
                        "Clicked permitted UI element: " + targetLabel);
                    return true;
                }
            }
        }
        return false;
    }

    public boolean performSafeTextEntry(String targetLabel, String textToEnter) {
        if (SecurityPolicyEngine.containsSensitiveOtpOrPaymentData(textToEnter)) {
            AuditLogManager.recordEvent("CRITICAL", "ACCESSIBILITY_SHIELD", "ENTER_TEXT",
                "BLOCKED_BY_POLICY", "Blocked entering sensitive OTP/PIN/payment text.");
            return false;
        }
        AccessibilityNodeInfo root = getRootInActiveWindow();
        SecurityPolicyEngine.PolicyDecision check = verifyScreenSafeForAutomation(root);
        if (!check.allowed) return false;

        List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(targetLabel);
        if (matches != null) {
            for (AccessibilityNodeInfo node : matches) {
                if (node.isPassword()) continue;
                if (node.isEditable()) {
                    Bundle args = new Bundle();
                    args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToEnter);
                    if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                        AuditLogManager.recordEvent("INFO", "ACCESSIBILITY_AUTOMATION", "ENTER_TEXT", "ALLOWED",
                            "Entered text into permitted field: " + targetLabel);
                        return true;
                    }
                }
            }
        }
        return false;
    }

    public boolean performSafeScroll(boolean forward) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        SecurityPolicyEngine.PolicyDecision check = verifyScreenSafeForAutomation(root);
        if (!check.allowed) return false;

        AccessibilityNodeInfo scrollable = findScrollableNode(root);
        if (scrollable != null) {
            int action = forward ? AccessibilityNodeInfo.ACTION_SCROLL_FORWARD : AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD;
            return scrollable.performAction(action);
        }
        return false;
    }

    public boolean performSafeGlobalBack() {
        return performGlobalAction(GLOBAL_ACTION_BACK);
    }

    private AccessibilityNodeInfo findClickableParent(AccessibilityNodeInfo node) {
        AccessibilityNodeInfo cur = node;
        while (cur != null) {
            if (cur.isClickable()) return cur;
            cur = cur.getParent();
        }
        return null;
    }

    private AccessibilityNodeInfo findScrollableNode(AccessibilityNodeInfo node) {
        if (node == null) return null;
        if (node.isScrollable()) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo found = findScrollableNode(node.getChild(i));
            if (found != null) return found;
        }
        return null;
    }
}
