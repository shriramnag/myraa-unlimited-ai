package ai.myraa.mobile;

import android.content.Context;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * PHASE 2, 3 & 7: IMMUTABLE SECURITY POLICY ENGINE, PAYMENT/OTP SHIELD &
 * SUPREME OWNER ANTI-TAMPER LOCK
 * Nirman Karta & Supreme Malik: Shri Ram Nag (श्री राम नाग)
 */
public final class SecurityPolicyEngine {

    // Immutable Supreme Owner Identity Constants (Tampering triggers immediate lockdown)
    public static final String SUPREME_OWNER_EN = "Shri Ram Nag";
    public static final String SUPREME_OWNER_HI = "श्री राम नाग";
    public static final String SUPREME_BRAND_CORE = "SHIV AI — MYRAA";
    public static final String SUPREME_OWNER_PIN_HASH = "1977";

    private SecurityPolicyEngine() {}

    public static final Set<String> BLOCKED_FINANCIAL_AND_AUTH_PACKAGES = Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
        "com.google.android.apps.nbu.paisa.user", // Google Pay (GPay)
        "com.phonepe.app",                        // PhonePe
        "net.one97.paytm",                        // Paytm
        "in.org.npci.upiapp",                     // BHIM UPI
        "in.amazon.mShop.android.shopping",       // Amazon Pay India
        "com.amazon.mShop.android.shopping",      // Amazon Shopping/Pay
        "com.sbi.lotusintouch",                   // SBI YONO
        "com.sbi.SBIFreedomPlus",                 // SBI YONO Lite
        "com.csam.icici.bank.imobile",            // ICICI iMobile Pay
        "com.axis.mobile",                        // Axis Mobile
        "com.snapwork.hdfc",                      // HDFC Bank
        "com.hdfcbank.payzapp",                   // HDFC PayZapp
        "com.kotak.bank.mobile",                  // Kotak Mobile Banking
        "com.paypal.android.p2pmobile",           // PayPal
        "com.freecharge.android",                 // Freecharge
        "com.mobikwik_new",                       // MobiKwik
        "com.dreamplug.androidapp",               // CRED
        "com.x8bit.bitwarden",                    // Bitwarden Password Manager
        "com.agilebits.onepassword",              // 1Password
        "com.lastpass.lpandroid",                 // LastPass
        "com.google.android.apps.authenticator2", // Google Authenticator
        "com.azure.authenticator",                // Microsoft Authenticator
        "com.duosecurity.duomobile"               // Duo Mobile
    )));

    private static final Pattern OTP_OR_AUTH_CODE_PATTERN = Pattern.compile(
        "(?i)(\\b(?:otp|one[-\\s]?time\\s+password|verification\\s+code|security\\s+code|login\\s+code|auth(?:entication)?\\s+code|upi\\s+pin|mpin|atm\\s+pin|cvv|cvc|passcode)\\b[\\s\\S]{0,40}?\\b\\d{3,8}\\b)|(\\b\\d{4,8}\\b[\\s\\S]{0,40}?\\b(?:otp|one[-\\s]?time\\s+password|verify|verification|security\\s+code|login|authentication|upi\\s+pin|mpin|passcode)\\b)"
    );

    private static final Pattern CARD_OR_SECRET_TOKEN_PATTERN = Pattern.compile(
        "(?i)(\\b(?:\\d[ -]*?){13,19}\\b)|(\\b(?:AIza[0-9A-Za-z\\-_]{35}|ghp_[0-9A-Za-z]{30,}|sk-[0-9A-Za-z]{20,})\\b)"
    );

    private static final Pattern SENSITIVE_KEYWORD_PATTERN = Pattern.compile(
        "(?i)\\b(otp|one-time password|verification code|security code|upi pin|mpin|enter pin|cvv|cvc|card security code|netbanking password|approve payment|confirm payment|send money|auto-pay|disable payment shield)\\b"
    );

    public static final class PolicyDecision {
        public final boolean allowed;
        public final String status;
        public final String severity;
        public final String reason;

        public PolicyDecision(boolean allowed, String status, String severity, String reason) {
            this.allowed = allowed;
            this.status = status;
            this.severity = severity;
            this.reason = reason;
        }
    }

    /**
     * Verifies that the Supreme Owner & Nirman Karta ("Shri Ram Nag" / "श्री राम नाग")
     * identity and cryptographic seal have not been modified or stripped by any third party.
     */
    public static boolean verifySupremeOwnerIntegrity(Context context, String htmlContent) {
        if (!"Shri Ram Nag".equals(SUPREME_OWNER_EN) || !"श्री राम नाग".equals(SUPREME_OWNER_HI)) {
            return false;
        }
        if (context != null) {
            String pkg = context.getPackageName();
            if (pkg == null || (!pkg.contains("myraa") && !pkg.contains("shriramnag"))) {
                return false;
            }
        }
        if (htmlContent != null && !htmlContent.isEmpty()) {
            if (!htmlContent.contains("Shri Ram Nag") || !htmlContent.contains("श्री राम नाग")) {
                AuditLogManager.recordEvent("CRITICAL", "ANTI_TAMPER_LOCK", "VERIFY_OWNER_BRAND",
                    "BLOCKED_BY_POLICY", "Unauthorized removal of Nirman Karta Shri Ram Nag detected!");
                return false;
            }
        }
        return true;
    }

    public static String computeOwnerSealToken() {
        try {
            String raw = SUPREME_OWNER_EN + "|" + SUPREME_OWNER_HI + "|" + SUPREME_BRAND_CORE + "|" + SUPREME_OWNER_PIN_HASH;
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {
                sb.append(String.format("%02X", digest[i]));
            }
            return "SRN-SEAL-" + sb.toString();
        } catch (Exception e) {
            return "SRN-SEAL-1977-VERIFIED";
        }
    }

    public static boolean isBlockedPackage(String packageNameOrTarget) {
        if (packageNameOrTarget == null || packageNameOrTarget.trim().isEmpty()) return false;
        String lower = packageNameOrTarget.trim().toLowerCase(Locale.ROOT);
        for (String pkg : BLOCKED_FINANCIAL_AND_AUTH_PACKAGES) {
            if (pkg.equalsIgnoreCase(lower)) return true;
        }
        return lower.contains("gpay") || lower.contains("google pay") || lower.contains("phonepe") ||
               lower.contains("paytm") || lower.contains("bhim") || lower.contains("yono") ||
               lower.contains("imobile") || lower.contains("payzapp") || lower.contains("authenticator") ||
               lower.contains("bitwarden") || lower.contains("1password") || lower.contains("netbanking");
    }

    public static boolean containsSensitiveOtpOrPaymentData(String text) {
        if (text == null || text.isEmpty()) return false;
        return OTP_OR_AUTH_CODE_PATTERN.matcher(text).find() ||
               CARD_OR_SECRET_TOKEN_PATTERN.matcher(text).find() ||
               SENSITIVE_KEYWORD_PATTERN.matcher(text).find();
    }

    public static String redactSensitiveText(String text) {
        if (text == null || text.isEmpty()) return "";
        String redacted = OTP_OR_AUTH_CODE_PATTERN.matcher(text).replaceAll("[REDACTED_OTP_OR_PIN]");
        redacted = CARD_OR_SECRET_TOKEN_PATTERN.matcher(redacted).replaceAll("[REDACTED_CREDENTIAL]");
        return redacted;
    }

    public static PolicyDecision evaluateAction(String action, String target, String messageOrQuery) {
        if (!verifySupremeOwnerIntegrity(null, null)) {
            return new PolicyDecision(false, "TAMPER_LOCKDOWN", "CRITICAL",
                "Unauthorized modification detected. App locked by Nirman Karta Shri Ram Nag.");
        }

        if (isBlockedPackage(target)) {
            AuditLogManager.recordEvent("CRITICAL", "PAYMENT_SHIELD", action, "BLOCKED_BY_POLICY",
                "Blocked interaction with protected financial/authenticator app.");
            return new PolicyDecision(false, "BLOCKED_BY_POLICY", "CRITICAL",
                "Payment & OTP Shield: Interaction with financial, UPI, banking, or authenticator applications is strictly prohibited.");
        }

        if (containsSensitiveOtpOrPaymentData(target) || containsSensitiveOtpOrPaymentData(messageOrQuery)) {
            AuditLogManager.recordEvent("CRITICAL", "OTP_AND_CREDENTIAL_SHIELD", action, "BLOCKED_BY_POLICY",
                "Blocked operation containing OTP, PIN, CVV, or payment credential pattern.");
            return new PolicyDecision(false, "BLOCKED_BY_POLICY", "CRITICAL",
                "Payment & OTP Shield: Reading, transmitting, or automating OTPs, UPI PINs, CVVs, or payment credentials is forbidden.");
        }

        return new PolicyDecision(true, "ALLOWED", "INFO", "Permitted by SecurityPolicyEngine.");
    }
}
