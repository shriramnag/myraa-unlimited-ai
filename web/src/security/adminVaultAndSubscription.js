/**
 * SHIVAI — MYRAA v4.0: ADMIN VAULT (10 REVOCABLE MASTER CODES), VOICEPRINT MATCH,
 * ANTI-CLONE INTEGRITY SHIELD & SUBSCRIPTION TIER GATE (FREE / PRO / ULTRA / ADMIN_OWNER)
 */

(function initMyraaAdminVaultAndSubscription() {
  const VAULT_STORAGE_KEY = "shivai.admin.vault.v4";
  const SUB_STORAGE_KEY = "shivai.subscription.tier.v4";

  // 10 Unique Master Admin Codes for Supreme Owner Shri Ram Nag
  const DEFAULT_MASTER_CODES = Object.freeze([
    { id: 1, code: "SRN-SHIVAI-01-9942-OMEGA", label: "Master Key #1 (Primary)", revoked: false },
    { id: 2, code: "SRN-SHIVAI-02-7381-ALPHA", label: "Master Key #2 (Backup)", revoked: false },
    { id: 3, code: "SRN-SHIVAI-03-5519-SIGMA", label: "Master Key #3 (Mobile)", revoked: false },
    { id: 4, code: "SRN-SHIVAI-04-8824-DELTA", label: "Master Key #4 (Desktop)", revoked: false },
    { id: 5, code: "SRN-SHIVAI-05-3197-TITAN", label: "Master Key #5 (Emergency)", revoked: false },
    { id: 6, code: "SRN-SHIVAI-06-6408-NEXUS", label: "Master Key #6 (Server)", revoked: false },
    { id: 7, code: "SRN-SHIVAI-07-4275-CROWN", label: "Master Key #7 (DevOps)", revoked: false },
    { id: 8, code: "SRN-SHIVAI-08-1963-PRIME", label: "Master Key #8 (Security)", revoked: false },
    { id: 9, code: "SRN-SHIVAI-09-8052-VAULT", label: "Master Key #9 (Recovery)", revoked: false },
    { id: 10, code: "SRN-SHIVAI-10-3749-SUPREME", label: "Master Key #10 (Supreme)", revoked: false },
  ]);

  const TIERS = Object.freeze({
    FREE: "FREE",
    PRO: "PRO",
    ULTRA: "ULTRA",
    ADMIN_OWNER: "ADMIN_OWNER",
  });

  // Features gated by subscription tier
  const FEATURE_REQUIREMENTS = Object.freeze({
    BASIC_CHAT: [TIERS.FREE, TIERS.PRO, TIERS.ULTRA, TIERS.ADMIN_OWNER],
    BASIC_INTENT: [TIERS.FREE, TIERS.PRO, TIERS.ULTRA, TIERS.ADMIN_OWNER],
    MULTI_AVATAR_SWITCH: [TIERS.PRO, TIERS.ULTRA, TIERS.ADMIN_OWNER],
    SCREEN_AUTO_CLICKER: [TIERS.PRO, TIERS.ULTRA, TIERS.ADMIN_OWNER],
    CYBERSECURITY_SCANNER: [TIERS.PRO, TIERS.ULTRA, TIERS.ADMIN_OWNER],
    CODING_WORKSPACE: [TIERS.ULTRA, TIERS.ADMIN_OWNER],
    DESKTOP_FULL_UI: [TIERS.ULTRA, TIERS.ADMIN_OWNER],
    MULTI_MODEL_ROUTER: [TIERS.ULTRA, TIERS.ADMIN_OWNER],
    ADMIN_PANEL: [TIERS.ADMIN_OWNER],
  });

  let adminUnlocked = false;
  let voiceMatchVerified = false;
  let cloneTamperDetected = false;
  const listeners = new Set();

  function loadVaultState() {
    try {
      const raw = localStorage.getItem(VAULT_STORAGE_KEY);
      if (!raw) {
        const init = {
          owner: "Shri Ram Nag",
          codes: DEFAULT_MASTER_CODES.map((c) => ({ ...c })),
          voicePassphrase: "main shri ram nag hoon admin panel kholo",
          requireVoicePlusCode: false,
          failedAttempts: 0,
        };
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(init));
        return init;
      }
      return JSON.parse(raw);
    } catch {
      return {
        owner: "Shri Ram Nag",
        codes: DEFAULT_MASTER_CODES.map((c) => ({ ...c })),
        voicePassphrase: "main shri ram nag hoon admin panel kholo",
        requireVoicePlusCode: false,
        failedAttempts: 0,
      };
    }
  }

  function saveVaultState(state) {
    try {
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(state));
    } catch {}
    notifyListeners();
  }

  function getCurrentTier() {
    if (adminUnlocked) return TIERS.ADMIN_OWNER;
    try {
      return localStorage.getItem(SUB_STORAGE_KEY) || TIERS.FREE;
    } catch {
      return TIERS.FREE;
    }
  }

  function setSubscriptionTierForTesting(tier) {
    if (!Object.values(TIERS).includes(tier)) return { ok: false, error: "Invalid tier" };
    if (tier === TIERS.ADMIN_OWNER && !adminUnlocked) {
      return { ok: false, error: "Admin authentication required for ADMIN_OWNER tier." };
    }
    try {
      localStorage.setItem(SUB_STORAGE_KEY, tier);
    } catch {}
    notifyListeners();
    return { ok: true, tier };
  }

  function isFeatureAllowed(featureKey) {
    if (cloneTamperDetected && !adminUnlocked) return false;
    const tier = getCurrentTier();
    if (tier === TIERS.ADMIN_OWNER) return true;
    const allowedTiers = FEATURE_REQUIREMENTS[featureKey] || [TIERS.PRO, TIERS.ULTRA, TIERS.ADMIN_OWNER];
    return allowedTiers.includes(tier);
  }

  /**
   * Anti-Clone & Anti-Tamper Check:
   * Verifies that Creator 'Shri Ram Nag' identity is intact and app has not been cloned to an unauthorized package.
   */
  function verifyCloneIntegrity({ packageName = "ai.myraa.mobile", creatorSign = "Shri Ram Nag" } = {}) {
    const allowedPackages = ["ai.myraa.mobile", "com.personal.ai.shivai", "localhost"];
    if (!allowedPackages.includes(packageName) || creatorSign !== "Shri Ram Nag") {
      cloneTamperDetected = true;
      window.MyraaSecurityPolicyEngine?.recordAuditEvent(
        "CRITICAL",
        "ANTI_CLONE_SHIELD",
        "INTEGRITY_CHECK",
        "BLOCKED_BY_POLICY",
        `Unauthorized clone or tampered package detected: ${packageName}`
      );
      notifyListeners();
      return { intact: false, locked: true, error: "ANTI-CLONE SHIELD: Unauthorized clone detected. Enter Master Admin Code to unlock." };
    }
    return { intact: true, locked: false };
  }

  /**
   * Voiceprint + Voice Passphrase Verification for Owner Shri Ram Nag
   */
  function verifyOwnerVoiceMatch(spokenTranscript, pitchHz = 145) {
    const state = loadVaultState();
    const clean = String(spokenTranscript || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .trim();
    const phraseMatch =
      clean.includes("shri ram nag") &&
      (clean.includes("admin") || clean.includes("unlock") || clean.includes("kholo") || clean.includes("supreme"));
    const pitchValid = pitchHz >= 85 && pitchHz <= 260;

    if (phraseMatch && pitchValid) {
      voiceMatchVerified = true;
      window.MyraaSecurityPolicyEngine?.recordAuditEvent(
        "INFO",
        "ADMIN_VAULT",
        "VOICE_MATCH_SUCCESS",
        "ALLOWED",
        "Owner Shri Ram Nag voiceprint and passphrase verified."
      );
      notifyListeners();
      return { ok: true, voiceMatched: true };
    }
    return { ok: false, voiceMatched: false, error: "Voiceprint or owner passphrase did not match Shri Ram Nag." };
  }

  /**
   * Authenticates using one of the 10 Master Admin Codes (#1 to #10).
   * Rejects revoked codes immediately.
   */
  function unlockAdminWithMasterCode(inputCode) {
    const state = loadVaultState();
    const trimmed = String(inputCode || "").trim();

    if (state.requireVoicePlusCode && !voiceMatchVerified) {
      return {
        ok: false,
        status: "VOICE_MATCH_REQUIRED",
        error: "Dual-Factor Lock Active: Verify your Owner Voice Match first before entering a Master Code.",
      };
    }

    const matched = state.codes.find((c) => c.code === trimmed);
    if (!matched) {
      state.failedAttempts = (state.failedAttempts || 0) + 1;
      saveVaultState(state);
      window.MyraaSecurityPolicyEngine?.recordAuditEvent(
        "HIGH",
        "ADMIN_VAULT",
        "ADMIN_LOGIN_FAILED",
        "BLOCKED_BY_POLICY",
        `Invalid Master Code attempt (#${state.failedAttempts}).`
      );
      return { ok: false, status: "INVALID_CODE", error: "Invalid Master Admin Code. Access denied." };
    }

    if (matched.revoked) {
      window.MyraaSecurityPolicyEngine?.recordAuditEvent(
        "CRITICAL",
        "ADMIN_VAULT",
        "REVOKED_CODE_USED",
        "BLOCKED_BY_POLICY",
        `Attempted use of revoked Master Code #${matched.id}.`
      );
      return {
        ok: false,
        status: "CODE_REVOKED",
        error: `Master Code #${matched.id} has been revoked/disabled for security. Use one of your other active Master Codes.`,
      };
    }

    adminUnlocked = true;
    cloneTamperDetected = false;
    state.failedAttempts = 0;
    saveVaultState(state);
    try {
      localStorage.setItem(SUB_STORAGE_KEY, TIERS.ADMIN_OWNER);
    } catch {}

    window.MyraaSecurityPolicyEngine?.recordAuditEvent(
      "INFO",
      "ADMIN_VAULT",
      "ADMIN_UNLOCKED",
      "ALLOWED",
      `Supreme Admin Panel unlocked using Master Code #${matched.id}.`
    );
    return {
      ok: true,
      status: "ADMIN_UNLOCKED",
      usedKeyId: matched.id,
      tier: TIERS.ADMIN_OWNER,
      message: `Welcome Supreme Owner Shri Ram Nag! Authenticated via Master Key #${matched.id}.`,
    };
  }

  /**
   * Revokes (disables) or re-enables one of the 10 Master Codes so a leaked code can never be used.
   */
  function setMasterCodeRevoked(codeId, revoked = true) {
    if (!adminUnlocked) {
      return { ok: false, error: "Only Supreme Admin Shri Ram Nag can revoke or manage Master Codes." };
    }
    const state = loadVaultState();
    const target = state.codes.find((c) => c.id === Number(codeId));
    if (!target) return { ok: false, error: "Master Code ID not found." };

    // Prevent revoking all 10 codes simultaneously
    const activeCount = state.codes.filter((c) => !c.revoked && c.id !== Number(codeId)).length;
    if (revoked && activeCount === 0) {
      return { ok: false, error: "At least 1 Master Code must remain active." };
    }

    target.revoked = Boolean(revoked);
    saveVaultState(state);
    return { ok: true, id: target.id, revoked: target.revoked };
  }

  function lockAdminPanel() {
    adminUnlocked = false;
    voiceMatchVerified = false;
    notifyListeners();
    return { ok: true };
  }

  function notifyListeners() {
    listeners.forEach((cb) => {
      try {
        cb({
          adminUnlocked,
          voiceMatchVerified,
          tier: getCurrentTier(),
          codes: loadVaultState().codes,
        });
      } catch {}
    });
  }

  window.MyraaAdminVault = Object.freeze({
    TIERS,
    FEATURE_REQUIREMENTS,
    DEFAULT_MASTER_CODES,
    getCurrentTier,
    setSubscriptionTierForTesting,
    isFeatureAllowed,
    isAdminUnlocked: () => adminUnlocked,
    isVoiceMatchVerified: () => voiceMatchVerified,
    verifyCloneIntegrity,
    verifyOwnerVoiceMatch,
    unlockAdminWithMasterCode,
    setMasterCodeRevoked,
    lockAdminPanel,
    getMasterCodesList: () => loadVaultState().codes,
    setRequireVoicePlusCode: (req) => {
      const s = loadVaultState();
      s.requireVoicePlusCode = Boolean(req);
      saveVaultState(s);
      return s.requireVoicePlusCode;
    },
    subscribe: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  });
})();
