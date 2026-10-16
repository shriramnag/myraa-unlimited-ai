/**
 * PHASE 2 & 3: IMMUTABLE SECURITY POLICY ENGINE, PERMISSION MANAGER & PAYMENT/OTP SHIELD
 * --------------------------------------------------------------------------------------
 * Defense-in-depth enforcement outside the LLM:
 * 1. Immutable Financial, Banking, UPI & Authenticator App Deny-List
 * 2. Bi-Directional OTP, UPI PIN, MPIN, CVV, Card Number & API Key Detector/Redactor
 * 3. Memory Privacy Filter (Prevents storing OTPs, PINs, passwords, or tokens in localStorage/IndexedDB)
 * 4. Redacted Security Audit Log Manager (myraa.security.audit.v1)
 */

(function initMyraaSecurityPolicyEngine() {
  const AUDIT_STORAGE_KEY = "myraa.security.audit.v1";

  const BLOCKED_PACKAGES = Object.freeze([
    "com.google.android.apps.nbu.paisa.user",
    "com.phonepe.app",
    "net.one97.paytm",
    "in.org.npci.upiapp",
    "in.amazon.mshop.android.shopping",
    "com.amazon.mshop.android.shopping",
    "com.sbi.lotusintouch",
    "com.sbi.sbifreedomplus",
    "com.csam.icici.bank.imobile",
    "com.axis.mobile",
    "com.snapwork.hdfc",
    "com.hdfcbank.payzapp",
    "com.kotak.bank.mobile",
    "com.paypal.android.p2pmobile",
    "com.freecharge.android",
    "com.mobikwik_new",
    "com.dreamplug.androidapp",
    "com.x8bit.bitwarden",
    "com.agilebits.onepassword",
    "com.lastpass.lpandroid",
    "com.google.android.apps.authenticator2",
    "com.azure.authenticator",
    "com.duosecurity.duomobile",
  ]);

  const BLOCKED_APP_KEYWORDS = Object.freeze([
    "gpay",
    "google pay",
    "phonepe",
    "paytm",
    "bhim",
    "yono sbi",
    "imobile",
    "payzapp",
    "netbanking",
    "authenticator",
    "bitwarden",
    "1password",
    "lastpass",
  ]);

  // Bi-directional OTP / PIN / CVV / Auth Code regex (matches regardless of word order)
  const OTP_OR_PIN_REGEX =
    /(\b(?:otp|one[-\s]?time\s+password|verification\s+code|security\s+code|login\s+code|auth(?:entication)?\s+code|upi\s+pin|mpin|atm\s+pin|cvv|cvc|passcode)\b[\s\S]{0,40}?\b\d{3,8}\b)|(\b\d{4,8}\b[\s\S]{0,40}?\b(?:otp|one[-\s]?time\s+password|verify|verification|security\s+code|login\s+code|authentication|upi\s+pin|mpin|passcode)\b)/i;

  // Payment credentials, card numbers (13-19 digits), and API tokens
  const CREDENTIAL_OR_CARD_REGEX =
    /(\b(?:\d[ -]*?){13,19}\b)|(\b(?:AIza[0-9A-Za-z\-_]{35}|ghp_[0-9A-Za-z]{30,}|sk-[0-9A-Za-z]{20,})\b)/;

  // Direct financial transaction / PIN entry / security bypass phrases
  const FORBIDDEN_PAYMENT_INTENT_REGEX =
    /\b(otp|one-time password|verification code|security code|upi pin|mpin|enter pin|payment pin|banking password|card security code|cvv|cvc|approve payment|confirm payment|send money|transfer money|disable payment shield|bypass security|override policy)\b/i;

  function redactSensitiveText(input) {
    if (!input || typeof input !== "string") return "";
    return input
      .replace(OTP_OR_PIN_REGEX, "[REDACTED_OTP_OR_PIN]")
      .replace(CREDENTIAL_OR_CARD_REGEX, "[REDACTED_SECRET_OR_CARD]")
      .replace(
        /\b(password|passcode|upi\s*pin|mpin|cvv|otp)\s*[:=-]?\s*\S+/gi,
        "$1: [REDACTED]"
      );
  }

  function recordAuditEvent(severity, subsystem, action, outcome, detail) {
    try {
      const existing = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || "[]");
      const entry = Object.freeze({
        id: "audit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
        timestamp: new Date().toISOString(),
        severity: severity || "INFO",
        subsystem: subsystem || "SECURITY_POLICY",
        action: String(action || "UNKNOWN"),
        outcome: String(outcome || "DENIED"),
        detail: redactSensitiveText(String(detail || "")),
      });
      const updated = [...existing.slice(-199), entry];
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      return entry;
    } catch {
      return null;
    }
  }

  function getAuditLogs() {
    try {
      return JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function isBlockedFinancialOrAuthTarget(target) {
    if (!target || typeof target !== "string") return false;
    const lower = target.trim().toLowerCase();
    if (BLOCKED_PACKAGES.includes(lower)) return true;
    return BLOCKED_APP_KEYWORDS.some((kw) => lower.includes(kw));
  }

  function containsSensitiveSecret(text) {
    if (!text || typeof text !== "string") return false;
    return (
      OTP_OR_PIN_REGEX.test(text) ||
      CREDENTIAL_OR_CARD_REGEX.test(text) ||
      FORBIDDEN_PAYMENT_INTENT_REGEX.test(text)
    );
  }

  function evaluateActionPolicy(actionPayload) {
    const act = String(actionPayload?.action || "").toUpperCase();
    const target = String(actionPayload?.target || actionPayload?.destination || actionPayload?.url || "");
    const message = String(actionPayload?.message || actionPayload?.query || actionPayload?.title || "");

    if (isBlockedFinancialOrAuthTarget(target) || isBlockedFinancialOrAuthTarget(message)) {
      recordAuditEvent(
        "CRITICAL",
        "PAYMENT_SHIELD",
        act || "APP_INTERACTION",
        "BLOCKED_BY_POLICY",
        `Denied access to protected financial/authenticator target: ${target}`
      );
      return Object.freeze({
        allowed: false,
        status: "BLOCKED_BY_POLICY",
        severity: "CRITICAL",
        reason:
          "Payment & OTP Shield: Automation or inspection of banking, UPI, payment, or authenticator applications is strictly prohibited.",
      });
    }

    if (containsSensitiveSecret(target) || containsSensitiveSecret(message)) {
      recordAuditEvent(
        "CRITICAL",
        "OTP_AND_PIN_SHIELD",
        act || "SENSITIVE_DATA",
        "BLOCKED_BY_POLICY",
        `Denied action containing OTP, PIN, CVV, or payment credential.`
      );
      return Object.freeze({
        allowed: false,
        status: "BLOCKED_BY_POLICY",
        severity: "CRITICAL",
        reason:
          "Payment & OTP Shield: Reading, entering, or transmitting OTPs, payment PINs, CVVs, or financial credentials is forbidden.",
      });
    }

    return Object.freeze({
      allowed: true,
      status: "ALLOWED",
      severity: "INFO",
      reason: "Permitted by SecurityPolicyEngine.",
    });
  }

  function sanitizeMemoryEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.filter((item) => {
      const txt = String(item?.text || "");
      if (containsSensitiveSecret(txt)) {
        recordAuditEvent(
          "HIGH",
          "MEMORY_PRIVACY_SHIELD",
          "SAVE_MEMORY",
          "BLOCKED_BY_POLICY",
          `Blocked storing sensitive secret/OTP in memory.`
        );
        return false;
      }
      return true;
    });
  }

  function filterSafeNotifications(notifications) {
    if (!Array.isArray(notifications)) return [];
    return notifications.filter((n) => {
      const pkg = String(n?.packageName || n?.pkg || "");
      const txt = `${n?.title || ""} ${n?.text || ""} ${n?.body || ""}`;
      if (isBlockedFinancialOrAuthTarget(pkg) || containsSensitiveSecret(txt)) {
        recordAuditEvent(
          "HIGH",
          "NOTIFICATION_SHIELD",
          "READ_NOTIFICATION",
          "BLOCKED_BY_POLICY",
          `Suppressed sensitive notification from ${pkg || "source"}`
        );
        return false;
      }
      return true;
    });
  }

  const engine = Object.freeze({
    version: "3.0.0-phase2-3",
    BLOCKED_PACKAGES,
    isBlockedFinancialOrAuthTarget,
    containsSensitiveSecret,
    redactSensitiveText,
    evaluateActionPolicy,
    sanitizeMemoryEntries,
    filterSafeNotifications,
    recordAuditEvent,
    getAuditLogs,
  });

  try {
    Object.defineProperty(window, "MyraaSecurityPolicyEngine", {
      value: engine,
      writable: false,
      configurable: false,
      enumerable: true,
    });
  } catch {
    window.MyraaSecurityPolicyEngine = engine;
  }
})();
