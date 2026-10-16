/**
 * PHASE 10, 11 & 12 (UPDATED v6.0): MODEL ROUTER, CYBERSECURITY MONITOR & 6-CHARACTER 3D VIDEO AVATAR MANAGER
 * Supports Close-Up & Full-Body MP4 3D Animation Videos for all 6 Characters:
 * 1. MYRAA (Updated Pink-Haired AI Companion — Video #1 Close-up & Video #2 Full-body)
 * 2. CODEX (Coding Specialist — Video #3 Close-up & Video #4 Full-body)
 * 3. AURA (@MYRAA-Classic Blonde AI — Video #5 Close-up & Video #9 Full-body)
 * 4. SENTINEL (Cybersecurity Specialist — Video #6 Close-up & Video #10 Full-body)
 * 5. SAGE (Research & Planning Specialist — Video #7 Close-up & Video #8 Full-body)
 * 6. PIXEL / VORTEX (UI & Creative Cyber Specialist — Video #10 Full-body & Video #6 Close-up)
 */

(function initMyraaModelCyberAndAvatarSystems() {
  const MODEL_CATALOG = Object.freeze({
    "gemini-3.1-flash-live-preview": {
      id: "gemini-3.1-flash-live-preview",
      provider: "Google Gemini",
      category: "fast",
      supportsTools: true,
      supportsStreaming: true,
      supportsMultimodal: true,
      isPaid: false,
      isLocal: false,
      costDisclosure: "Free tier available via Google AI Studio key.",
    },
    "gemini-2.5-pro": {
      id: "gemini-2.5-pro",
      provider: "Google Gemini",
      category: "reasoning",
      supportsTools: true,
      supportsStreaming: true,
      supportsMultimodal: true,
      isPaid: true,
      isLocal: false,
      costDisclosure: "Paid usage may apply depending on token volume.",
    },
    "codex-kotlin-specialist": {
      id: "codex-kotlin-specialist",
      provider: "OpenAI-Compatible Coding Endpoint",
      category: "coding",
      supportsTools: true,
      supportsStreaming: true,
      supportsMultimodal: false,
      isPaid: false,
      isLocal: false,
      costDisclosure: "Configured coding specialist endpoint.",
    },
    "local-on-device-offline": {
      id: "local-on-device-offline",
      provider: "Local On-Device Engine",
      category: "offline",
      supportsTools: true,
      supportsStreaming: false,
      supportsMultimodal: false,
      isPaid: false,
      isLocal: true,
      costDisclosure: "100% Free & Offline on-device execution (zero cloud cost).",
    },
  });

  const modelConfig = {
    preferredModel: "gemini-3.1-flash-live-preview",
    fastModel: "gemini-3.1-flash-live-preview",
    reasoningModel: "gemini-2.5-pro",
    codingModel: "codex-kotlin-specialist",
    localFallbackModel: "local-on-device-offline",
    offlineMode: false,
  };

  function selectModelForTask({ taskCategory = "fast", allowPaid = false, allowCloudDataTransfer = true } = {}) {
    if (modelConfig.offlineMode || !allowCloudDataTransfer) {
      return {
        ok: true,
        selected: MODEL_CATALOG[modelConfig.localFallbackModel],
        reason: "Offline or local-privacy mode active; routed to local on-device model.",
      };
    }

    let targetId = modelConfig.preferredModel;
    if (taskCategory === "coding") targetId = modelConfig.codingModel;
    else if (taskCategory === "reasoning") targetId = modelConfig.reasoningModel;
    else if (taskCategory === "fast") targetId = modelConfig.fastModel;

    const candidate = MODEL_CATALOG[targetId] || MODEL_CATALOG[modelConfig.fastModel];
    if (candidate.isPaid && !allowPaid) {
      return {
        ok: false,
        status: "AWAITING_COST_APPROVAL",
        requiresCostApproval: true,
        provider: candidate.provider,
        costDisclosure: candidate.costDisclosure,
        fallbackSelected: MODEL_CATALOG[modelConfig.fastModel],
      };
    }

    return { ok: true, selected: candidate };
  }

  window.MyraaModelRouter = Object.freeze({
    MODEL_CATALOG,
    getConfig: () => ({ ...modelConfig }),
    configureModels: (updates) => Object.assign(modelConfig, updates || {}),
    selectModelForTask,
  });

  const SEVERITY = Object.freeze({
    INFO: "INFO",
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    CRITICAL: "CRITICAL",
  });

  const securityAlerts = [];
  const seenAlertKeys = new Set();

  function emitSecurityAlert({
    dedupeKey,
    severity = SEVERITY.MEDIUM,
    affectedTarget = "ShivAI / MYRAA App",
    observedEvidence = "",
    confidenceLevel = "HIGH",
    possibleImpact = "",
    recommendedAction = "",
    verified = true,
    userActionRequired = true,
  }) {
    const key = dedupeKey || `${severity}:${affectedTarget}:${observedEvidence}`;
    if (seenAlertKeys.has(key)) return { deduplicated: true };
    seenAlertKeys.add(key);

    const safeEvidence = window.MyraaSecurityPolicyEngine
      ? window.MyraaSecurityPolicyEngine.redactSensitiveText(String(observedEvidence))
      : String(observedEvidence);

    const alert = Object.freeze({
      id: "sec-alert-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      severity,
      timeDetected: new Date().toISOString(),
      affectedTarget,
      observedEvidence: safeEvidence,
      confidenceLevel,
      possibleImpact,
      recommendedAction,
      verified: Boolean(verified),
      userActionRequired: Boolean(userActionRequired),
    });

    securityAlerts.push(alert);
    return { deduplicated: false, alert };
  }

  function scanSourceOrConfig({ targetName, content }) {
    const txt = String(content || "");
    const findings = [];

    if (/\b(AIza[0-9A-Za-z\-_]{35}|ghp_[0-9A-Za-z]{30,}|sk-[0-9A-Za-z]{20,})\b/.test(txt)) {
      const res = emitSecurityAlert({
        dedupeKey: `secret:${targetName}`,
        severity: SEVERITY.CRITICAL,
        affectedTarget: targetName,
        observedEvidence: `Hardcoded API key or personal access token detected in ${targetName}: ${txt}`,
        confidenceLevel: "HIGH",
        possibleImpact: "Unauthorized third-party access to cloud APIs or repositories.",
        recommendedAction: "Revoke the exposed token immediately and move credentials to AndroidKeyStore or .env.",
        verified: true,
        userActionRequired: true,
      });
      if (res.alert) findings.push(res.alert);
    }

    if (/http:\/\/(?!localhost|127\.0\.0\.1)[a-zA-Z0-9\.\-]+/i.test(txt)) {
      const res = emitSecurityAlert({
        dedupeKey: `cleartext:${targetName}`,
        severity: SEVERITY.HIGH,
        affectedTarget: targetName,
        observedEvidence: `Cleartext non-TLS HTTP endpoint found in ${targetName}.`,
        confidenceLevel: "HIGH",
        possibleImpact: "Network traffic could be intercepted via MITM on untrusted networks.",
        recommendedAction: "Upgrade endpoint to HTTPS / WSS with TLS certificate validation.",
        verified: true,
        userActionRequired: true,
      });
      if (res.alert) findings.push(res.alert);
    }

    if (/android:debuggable\s*=\s*"true"/i.test(txt)) {
      const res = emitSecurityAlert({
        dedupeKey: `debuggable:${targetName}`,
        severity: SEVERITY.HIGH,
        affectedTarget: targetName,
        observedEvidence: `android:debuggable="true" enabled in manifest.`,
        confidenceLevel: "HIGH",
        possibleImpact: "Allows local debugger attachment and WebView inspection.",
        recommendedAction: 'Set android:debuggable="false" for production builds.',
        verified: true,
        userActionRequired: true,
      });
      if (res.alert) findings.push(res.alert);
    }

    return findings;
  }

  window.MyraaCybersecurityMonitor = Object.freeze({
    SEVERITY,
    emitSecurityAlert,
    scanSourceOrConfig,
    getAlerts: () => [...securityAlerts],
    clearAlertsForTest: () => {
      securityAlerts.length = 0;
      seenAlertKeys.clear();
    },
  });

  // =========================================================================
  // PHASE 12 (v6.0): 6-CHARACTER ANIMATED VIDEO AVATAR MANAGER (CLOSEUP + FULL)
  // =========================================================================
  const AVATAR_ROLES = Object.freeze({
    MYRAA: {
      role: "MYRAA",
      title: "Main Personal AI Assistant",
      closeupVideo: "./avatars/videos/myraa_closeup.mp4",
      fullVideo: "./avatars/videos/myraa_full.mp4",
      thumb: "./avatars/myraa.png",
      modelPath: "./characters/evelyn/model.pmx",
      fallbackVideos: { idle: "./idle.mp4", talking: "./talking.mp4", thinking: "./thinking.mp4" },
      themeColor: "rose",
      maxMemoryMb: 64,
    },
    CODEX: {
      role: "CODEX",
      title: "Coding & Software Specialist",
      closeupVideo: "./avatars/videos/codex_closeup.mp4",
      fullVideo: "./avatars/videos/codex_full.mp4",
      thumb: "./avatars/codex.png",
      modelPath: "./characters/evelyn/model.pmx",
      fallbackVideos: { idle: "./avatars/videos/codex_closeup.mp4", talking: "./avatars/videos/codex_closeup.mp4", thinking: "./avatars/videos/codex_full.mp4" },
      themeColor: "emerald",
      maxMemoryMb: 64,
    },
    AURA: {
      role: "AURA",
      title: "MYRAA Classic Blonde AI",
      closeupVideo: "./avatars/videos/aura_closeup.mp4",
      fullVideo: "./avatars/videos/aura_full.mp4",
      thumb: "./avatars/aura.png",
      modelPath: "./characters/evelyn/model.pmx",
      fallbackVideos: { idle: "./avatars/videos/aura_closeup.mp4", talking: "./avatars/videos/aura_closeup.mp4", thinking: "./avatars/videos/aura_full.mp4" },
      themeColor: "celestial",
      maxMemoryMb: 64,
    },
    SENTINEL: {
      role: "SENTINEL",
      title: "Cybersecurity Specialist",
      closeupVideo: "./avatars/videos/sentinel_closeup.mp4",
      fullVideo: "./avatars/videos/sentinel_full.mp4",
      thumb: "./avatars/sentinel.png",
      modelPath: "./characters/evelyn/model.pmx",
      fallbackVideos: { idle: "./avatars/videos/sentinel_closeup.mp4", talking: "./avatars/videos/sentinel_closeup.mp4", thinking: "./avatars/videos/sentinel_full.mp4" },
      themeColor: "crimson",
      maxMemoryMb: 64,
    },
    SAGE: {
      role: "SAGE",
      title: "Research & Planning Specialist",
      closeupVideo: "./avatars/videos/sage_closeup.mp4",
      fullVideo: "./avatars/videos/sage_full.mp4",
      thumb: "./avatars/sage.png",
      modelPath: "./characters/evelyn/model.pmx",
      fallbackVideos: { idle: "./avatars/videos/sage_closeup.mp4", talking: "./avatars/videos/sage_closeup.mp4", thinking: "./avatars/videos/sage_full.mp4" },
      themeColor: "violet",
      maxMemoryMb: 64,
    },
    PIXEL: {
      role: "PIXEL",
      title: "VORTEX / UI & Creative Specialist",
      closeupVideo: "./avatars/videos/vortex_closeup.mp4",
      fullVideo: "./avatars/videos/vortex_full.mp4",
      thumb: "./avatars/pixel.png",
      modelPath: "./characters/evelyn/model.pmx",
      fallbackVideos: { idle: "./avatars/videos/vortex_closeup.mp4", talking: "./avatars/videos/vortex_closeup.mp4", thinking: "./avatars/videos/vortex_full.mp4" },
      themeColor: "gold",
      maxMemoryMb: 64,
    },
  });

  let currentAvatar = AVATAR_ROLES.MYRAA;
  let cameraViewMode = "CLOSEUP"; // "CLOSEUP" or "FULL"
  let avatarAnimState = "IDLE";
  let usingFallbackMode = false;

  function selectAvatarForRole(roleName, viewMode = null) {
    const key = String(roleName || "MYRAA").toUpperCase();
    if (viewMode && ["CLOSEUP", "FULL"].includes(String(viewMode).toUpperCase())) {
      cameraViewMode = String(viewMode).toUpperCase();
    }
    if (!AVATAR_ROLES[key]) {
      usingFallbackMode = true;
      currentAvatar = AVATAR_ROLES.MYRAA;
      return { ok: true, avatar: currentAvatar, viewMode: cameraViewMode, fallbackUsed: true };
    }
    usingFallbackMode = false;
    currentAvatar = AVATAR_ROLES[key];
    return { ok: true, avatar: currentAvatar, viewMode: cameraViewMode, fallbackUsed: false };
  }

  function setCameraViewMode(mode) {
    const m = String(mode || "CLOSEUP").toUpperCase();
    cameraViewMode = m === "FULL" ? "FULL" : "CLOSEUP";
    return cameraViewMode;
  }

  function validateModelAsset({ sizeBytes = 2986453, format = "pmx" } = {}) {
    const maxBytes = currentAvatar.maxMemoryMb * 1024 * 1024;
    if (sizeBytes <= 0 || sizeBytes > maxBytes || !["pmx", "gltf", "glb", "vrm", "mp4"].includes(String(format).toLowerCase())) {
      usingFallbackMode = true;
      return { valid: false, fallbackActivated: true, fallbackVideos: currentAvatar.fallbackVideos };
    }
    return { valid: true, fallbackActivated: false };
  }

  function setAvatarAnimationState(state) {
    avatarAnimState = String(state || "IDLE").toUpperCase();
    return avatarAnimState;
  }

  window.MyraaAvatarManager = Object.freeze({
    AVATAR_ROLES,
    getCurrentAvatar: () => currentAvatar,
    getCameraViewMode: () => cameraViewMode,
    setCameraViewMode,
    getAnimationState: () => avatarAnimState,
    isFallbackActive: () => usingFallbackMode,
    selectAvatarForRole,
    validateModelAsset,
    setAvatarAnimationState,
  });
})();
