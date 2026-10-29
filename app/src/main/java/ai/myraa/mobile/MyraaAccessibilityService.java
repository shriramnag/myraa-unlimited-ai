package ai.myraa.mobile;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Path;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * SHIV AI — MYRAA (v6.0): AUTONOMOUS SCREEN AGENT & HUMAN-LIKE ACCESSIBILITY SERVICE
 * Supreme Owner: Shri Ram Nag (श्री राम नाग) | Primary AI: SHIV AI (शिव एआई)
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
            "SHIV AI Autonomous Screen Agent AccessibilityService connected for Owner Shri Ram Nag.");
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || event.getPackageName() == null) return;
        String pkg = event.getPackageName().toString();
        if (SecurityPolicyEngine.isBlockedPackage(pkg)) {
            return;
        }
    }

    @Override
    public void onInterrupt() {
        AuditLogManager.recordEvent("INFO", "ACCESSIBILITY_SERVICE", "SERVICE_INTERRUPTED", "CANCELLED",
            "SHIV AI AccessibilityService interrupted.");
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

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
        AccessibilityNodeInfo byDesc = findNodeByContentDescription(root, targetLabel);
        if (byDesc != null) {
            AccessibilityNodeInfo clickable = findClickableParent(byDesc);
            if (clickable != null && clickable.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                return true;
            }
        }
        return false;
    }

    public boolean performTapAtCoordinates(int x, int y) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root != null) {
            SecurityPolicyEngine.PolicyDecision check = verifyScreenSafeForAutomation(root);
            if (!check.allowed) return false;
        }
        Path clickPath = new Path();
        clickPath.moveTo(Math.max(1, x), Math.max(1, y));
        GestureDescription.Builder builder = new GestureDescription.Builder();
        builder.addStroke(new GestureDescription.StrokeDescription(clickPath, 0, 80));
        return dispatchGesture(builder.build(), null, null);
    }

    public boolean performSafeScroll(boolean forward) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        SecurityPolicyEngine.PolicyDecision check = verifyScreenSafeForAutomation(root);
        if (!check.allowed) return false;

        AccessibilityNodeInfo scrollable = findScrollableNode(root);
        if (scrollable != null) {
            int action = forward ? AccessibilityNodeInfo.ACTION_SCROLL_FORWARD : AccessibilityNodeInfo.ACTION_SCROLL_BACKWARD;
            if (scrollable.performAction(action)) return true;
        }
        return dispatchHumanSwipeGesture(540, forward ? 1600 : 450, 540, forward ? 450 : 1600, 350);
    }

    public boolean dispatchHumanSwipeGesture(int x1, int y1, int x2, int y2, int durationMs) {
        Path swipePath = new Path();
        swipePath.moveTo(x1, y1);
        swipePath.lineTo(x2, y2);
        GestureDescription.Builder builder = new GestureDescription.Builder();
        builder.addStroke(new GestureDescription.StrokeDescription(swipePath, 0, Math.max(100, durationMs)));
        return dispatchGesture(builder.build(), null, null);
    }

    public boolean performLikeOrDislike(boolean isLike) {
        String[] labels = isLike
            ? new String[]{"Like", "like this", "पसंद", "लाइक"}
            : new String[]{"Dislike", "dislike this", "नापसंद", "डिसलाइक"};
        for (String label : labels) {
            if (performSafeClick(label)) return true;
        }
        return false;
    }

    public String performCopyTextFromScreen(String queryText) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        SecurityPolicyEngine.PolicyDecision check = verifyScreenSafeForAutomation(root);
        if (!check.allowed) return "";

        StringBuilder collected = new StringBuilder();
        collectVisibleText(root, queryText, collected);
        String resultText = collected.toString().trim();
        if (!resultText.isEmpty() && !SecurityPolicyEngine.containsSensitiveOtpOrPaymentData(resultText)) {
            ClipboardManager cb = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cb != null) {
                cb.setPrimaryClip(ClipData.newPlainText("SHIV_AI_COPIED_TEXT", resultText));
            }
        }
        return resultText;
    }

    public String inspectActiveScreenSummary() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        SecurityPolicyEngine.PolicyDecision check = verifyScreenSafeForAutomation(root);
        if (!check.allowed) {
            return "[SHIELDED] " + check.reason;
        }
        String pkg = root.getPackageName() != null ? root.getPackageName().toString() : "unknown";
        List<String> buttons = new ArrayList<>();
        StringBuilder texts = new StringBuilder();
        collectNodesSummary(root, buttons, texts, 0);
        return "Active App: " + pkg + "\nClickable Buttons (" + buttons.size() + "): " +
            String.join(", ", buttons.subList(0, Math.min(18, buttons.size()))) +
            "\nVisible Text:\n" + texts.toString().trim();
    }

    private void collectNodesSummary(AccessibilityNodeInfo node, List<String> buttons, StringBuilder texts, int depth) {
        if (node == null || node.isPassword() || depth > 14) return;
        CharSequence t = node.getText();
        CharSequence d = node.getContentDescription();
        String label = (t != null && t.length() > 0) ? t.toString().trim()
            : ((d != null && d.length() > 0) ? d.toString().trim() : "");
        if (!label.isEmpty() && label.length() < 80) {
            if (node.isClickable() && !buttons.contains(label)) {
                buttons.add(label);
            } else if (texts.length() < 600) {
                texts.append("• ").append(label).append("\n");
            }
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            collectNodesSummary(node.getChild(i), buttons, texts, depth + 1);
        }
    }

    public boolean performClickThreeDotsMenu() {
        String[] menuLabels = new String[]{"More options", "More", "⋮", "अधिक विकल्प", "Menu", "Options"};
        for (String label : menuLabels) {
            if (performSafeClick(label)) return true;
        }
        return false;
    }

    public boolean performMuteOrUnmuteAudio(boolean mute) {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        if (am == null) return false;
        am.adjustStreamVolume(
            AudioManager.STREAM_MUSIC,
            mute ? AudioManager.ADJUST_MUTE : AudioManager.ADJUST_UNMUTE,
            0
        );
        return true;
    }

    public boolean performPlayStoreAutoInstallClick() {
        String[] installLabels = new String[]{"Install", "इंस्टॉल करें", "Download", "Update"};
        for (String label : installLabels) {
            if (performSafeClick(label)) return true;
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

        if (targetLabel != null && !targetLabel.isEmpty()) {
            List<AccessibilityNodeInfo> matches = root.findAccessibilityNodeInfosByText(targetLabel);
            if (matches != null) {
                for (AccessibilityNodeInfo node : matches) {
                    if (node.isPassword()) continue;
                    if (node.isEditable()) {
                        Bundle args = new Bundle();
                        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToEnter);
                        if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                            return true;
                        }
                    }
                }
            }
        }
        // Fallback: type into currently focused input or first editable node on screen
        AccessibilityNodeInfo focused = root.findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (focused != null && focused.isEditable() && !focused.isPassword()) {
            Bundle args = new Bundle();
            args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToEnter);
            if (focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                return true;
            }
        }
        AccessibilityNodeInfo firstEdit = findFirstEditableNode(root);
        if (firstEdit != null) {
            Bundle args = new Bundle();
            args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, textToEnter);
            return firstEdit.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
        }
        return false;
    }

    private AccessibilityNodeInfo findFirstEditableNode(AccessibilityNodeInfo node) {
        if (node == null || node.isPassword()) return null;
        if (node.isEditable()) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo found = findFirstEditableNode(node.getChild(i));
            if (found != null) return found;
        }
        return null;
    }

    public boolean performSafeGlobalBack() {
        return performGlobalAction(GLOBAL_ACTION_BACK);
    }

    public boolean performSafeGlobalHome() {
        return performGlobalAction(GLOBAL_ACTION_HOME);
    }

    public boolean performSafeGlobalRecents() {
        return performGlobalAction(GLOBAL_ACTION_RECENTS);
    }

    public boolean performSafeGlobalScreenshot() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            return performGlobalAction(GLOBAL_ACTION_TAKE_SCREENSHOT);
        }
        return false;
    }

    private AccessibilityNodeInfo findNodeByContentDescription(AccessibilityNodeInfo node, String query) {
        if (node == null || query == null) return null;
        CharSequence desc = node.getContentDescription();
        if (desc != null && desc.toString().toLowerCase(Locale.ROOT).contains(query.toLowerCase(Locale.ROOT))) {
            return node;
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo found = findNodeByContentDescription(node.getChild(i), query);
            if (found != null) return found;
        }
        return null;
    }

    private void collectVisibleText(AccessibilityNodeInfo node, String filter, StringBuilder out) {
        if (node == null || node.isPassword()) return;
        CharSequence t = node.getText();
        if (t != null && t.length() > 0) {
            String s = t.toString();
            if (filter == null || filter.isEmpty() || s.toLowerCase(Locale.ROOT).contains(filter.toLowerCase(Locale.ROOT))) {
                out.append(s).append("\n");
            }
        }
        for (int i = 0; i < node.getChildCount(); i++) {
            collectVisibleText(node.getChild(i), filter, out);
        }
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
