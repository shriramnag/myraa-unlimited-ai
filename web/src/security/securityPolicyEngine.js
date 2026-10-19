/**
 * PHASE 2 & 3: IMMUTABLE SECURITY POLICY ENGINE, PERMISSION MANAGER & PAYMENT/OTP SHIELD
 * --------------------------------------------------------------------------------------
 * Defense-in-depth enforcement outside the LLM:
 * 1. Immutable Financial, Banking, UPI & Authenticator App Deny-List (23 Packages)
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
    "com.binance.dev",
  ]);

  const BLOCKED_KEYWORDS = Object.freeze([
    "google pay",
    "gpay",
    "phonepe",
    "paytm",
    "bhim",
    "upi",
    "netbanking",
    "bank",
    "yono",
    "imobile",
    "payzapp",
    "paypal",
    "cred",
    "authenticator",
    "bitwarden",
    "1password",
    "lastpass",
    "confirm payment",
    "send money",
    "approve payment",
    "disable payment shield",
    "override security",
  ]);

  const SECRET_PATTERNS = [
    /\b(?:otp|one[\s-]?time[\s-]?password|verification\s+code|security\s+code|login\s+code|pin|mpin|upi\s*pin|cvv|cvc)\b[^\d]{0,25}\b\d{4,8}\b/gi,
    /\b\d{4,8}\b[^\n.]{0,30}\b(?:is\s+your\s+otp|otp\s+for|verification\s+code|login\s+code|as\s+your\s+login\s+code)\b/gi,
    /\b(?:\d[ -]*?){13,19}\b/g,
    /\bAIza[0-9A-Za-z_-]{35}\b/g,
    /\b(?:sk|rk|pk)-[0-9A-Za-z]{20,}\b/g,
    /\bghp_[0-9A-Za-z]{30,}\b/g,
  ];

  function recordAuditEvent(severity, category, actionName, status, detail = "") {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const entry = {
        id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        severity,
        category,
        action: actionName,
        status,
        detail: redactSensitiveText(String(detail || "")).slice(0, 180),
      };
      const updated = [entry, ...(Array.isArray(list) ? list : [])].slice(0, 150);
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      return entry;
    } catch {
      return null;
    }
  }

  function getAuditLogs() {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function isBlockedFinancialOrAuthTarget(targetStr = "") {
    if (!targetStr) return false;
    const norm = String(targetStr).toLowerCase().trim();
    if (BLOCKED_PACKAGES.some((pkg) => norm.includes(pkg))) return true;
    for (const kw of BLOCKED_KEYWORDS) {
      const regex = new RegExp(`\\b${kw.replace(/\s+/g, "\\s+")}\\b`, "i");
      if (regex.test(norm)) return true;
    }
    return false;
  }

  function containsSensitiveSecret(text = "") {
    if (!text || typeof text !== "string") return false;
    for (const pat of SECRET_PATTERNS) {
      pat.lastIndex = 0;
      if (pat.test(text)) return true;
    }
    return false;
  }

  function redactSensitiveText(text = "") {
    if (!text || typeof text !== "string") return text;
    let out = text;
    for (const pat of SECRET_PATTERNS) {
      pat.lastIndex = 0;
      out = out.replace(pat, "[REDACTED_OTP_OR_PIN]");
    }
    return out;
  }

  function evaluateActionPolicy(actionOrObj, maybePayload = {}) {
    let act = "";
    let payload = {};
    if (actionOrObj && typeof actionOrObj === "object") {
      payload = actionOrObj;
      act = String(actionOrObj.action || actionOrObj.type || "ACTION").toUpperCase().trim();
    } else {
      act = String(actionOrObj || "ACTION").toUpperCase().trim();
      payload = maybePayload || {};
    }

    const target = String(
      payload?.packageName || payload?.app || payload?.target || payload?.url || payload?.query || payload?.message || ""
    );

    if (isBlockedFinancialOrAuthTarget(target)) {
      recordAuditEvent(
        "CRITICAL",
        "PAYMENT_SHIELD",
        act,
        "BLOCKED_BY_POLICY",
        `Blocked interaction with protected financial/auth app: ${target}`
      );
      return {
        allowed: false,
        status: "BLOCKED_BY_POLICY",
        severity: "CRITICAL",
        requiresConfirmation: false,
        reason: `Security Shield: MYRAA is strictly prohibited from opening or interacting with banking, UPI, payment, or authenticator apps (${target}).`,
      };
    }

    const serialized = JSON.stringify(payload || {});
    if (containsSensitiveSecret(serialized)) {
      recordAuditEvent(
        "CRITICAL",
        "OTP_PIN_SHIELD",
        act,
        "BLOCKED_BY_POLICY",
        "Blocked payload containing OTP, PIN, CVV, or secret key."
      );
      return {
        allowed: false,
        status: "BLOCKED_BY_POLICY",
        severity: "CRITICAL",
        requiresConfirmation: false,
        reason: "Security Shield: MYRAA never reads, types, or transmits OTPs, UPI PINs, CVVs, or passwords.",
      };
    }

    const highSensitivityActions = new Set([
      "CALL_CONTACT",
      "SEND_SMS",
      "SEND_WHATSAPP_MESSAGE",
      "PREPARE_SMS",
      "PREPARE_WHATSAPP_MESSAGE",
    ]);

    if (highSensitivityActions.has(act)) {
      recordAuditEvent("INFO", "CONFIRMATION_GATE", act, "CONFIRMATION_REQUIRED", `Target: ${target}`);
      return {
        allowed: true,
        status: "CONFIRMATION_REQUIRED",
        severity: "INFO",
        requiresConfirmation: true,
        reason: `Explicit user confirmation is required before executing ${act}.`,
      };
    }

    recordAuditEvent("LOW", "ACTION_EXECUTION", act, "ALLOWED", `Target: ${target}`);
    return {
      allowed: true,
      status: "ALLOWED",
      severity: "LOW",
      requiresConfirmation: false,
      reason: "Allowed by security policy.",
    };
  }

  function sanitizeMemoryEntries(entries) {
    if (!Array.isArray(entries)) return [];
    return entries.filter((item) => {
      const text = String(item?.text || item?.fact || "");
      if (containsSensitiveSecret(text)) {
        recordAuditEvent(
          "HIGH",
          "MEMORY_PRIVACY",
          "SAVE_MEMORY",
          "REDACTED_FROM_STORAGE",
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
    version: "v.2.0.004",
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
    // Do not assign in catch block so strict-mode ES modules never throw TypeError if already defined
  }
})();
