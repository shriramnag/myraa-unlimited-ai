/**
 * PHASE 6: VOICE INTERACTION MANAGER (HINDI, HINGLISH & ENGLISH + INTERRUPTIBLE SPEECH + PUSH-TO-TALK)
 * ----------------------------------------------------------------------------------------------------
 * Implements:
 * 1. Explicit Voice State Machine: IDLE -> LISTENING -> THINKING -> SPEAKING -> EXECUTING
 * 2. Multi-language command understanding (Hindi, Hinglish, English)
 * 3. Instant local intent parser for navigation, coding, task explanation, and emergency stop
 * 4. Interruptible speech & Push-to-Talk fallback
 */

(function initMyraaVoiceInteractionManager() {
  const VOICE_STATES = Object.freeze({
    IDLE: "IDLE",
    LISTENING: "LISTENING",
    THINKING: "THINKING",
    SPEAKING: "SPEAKING",
    EXECUTING: "EXECUTING",
  });

  const SUPPORTED_LOCALES = Object.freeze(["hi-IN", "en-IN", "en-US"]);

  let currentState = VOICE_STATES.IDLE;
  let currentLocale = "hi-IN";
  let wakeWord = "hey myraa";
  let wakeWordEnabled = false;
  let pushToTalkActive = false;
  const conversationHistory = [];
  const stateListeners = new Set();

  function setVoiceState(nextState) {
    if (!Object.values(VOICE_STATES).includes(nextState)) return false;
    currentState = nextState;
    stateListeners.forEach((cb) => {
      try {
        cb(currentState);
      } catch {}
    });
    return true;
  }

  function interruptSpeech() {
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    if (currentState === VOICE_STATES.SPEAKING) {
      setVoiceState(VOICE_STATES.IDLE);
    }
    return true;
  }

  /**
   * Parses Hindi, Hinglish, and English voice instructions into structured agent commands.
   */
  function parseVoiceCommand(rawTranscript) {
    const raw = String(rawTranscript || "").trim();
    if (!raw) return { matched: false };

    // Strip optional wake word prefix ("myraa,", "hey myraa")
    const cleaned = raw.replace(/^(?:hey\s+myraa|myraa|hello\s+myraa|मायरा|हे\s+मायरा)[\s,:-]*/i, "").trim();
    const lower = cleaned.toLowerCase();

    // 1. Emergency Stop ("Stop all actions", "Sab roko", "Ruko")
    if (
      lower === "stop all actions" ||
      lower === "stop actions" ||
      lower === "sab roko" ||
      lower === "sab band karo" ||
      lower === "emergency stop"
    ) {
      interruptSpeech();
      window.MyraaAgentSupervisor?.emergencyStopAll();
      return {
        matched: true,
        type: "EMERGENCY_STOP",
        action: "CANCEL_PENDING_ACTION",
        agent: "MainOrchestratorAgent",
        response: "All running actions and agents have been stopped immediately.",
      };
    }

    // 2. Explain current task ("Explain what you are doing", "Kya kar rahi ho")
    if (
      lower.includes("explain what you are doing") ||
      lower.includes("what are you doing") ||
      lower.includes("kya kar rahi ho") ||
      lower.includes("abhi kya chal raha hai")
    ) {
      const tasks = window.MyraaAgentSupervisor?.getAllTasks() || [];
      const latest = tasks[tasks.length - 1];
      const summary = latest
        ? `Currently ${latest.activeAgent} is ${latest.state} on task '${latest.title}' (Step: ${latest.currentStep}).`
        : "I am currently idle and ready for your command.";
      return {
        matched: true,
        type: "EXPLAIN_STATUS",
        agent: "MainOrchestratorAgent",
        response: summary,
      };
    }

    // 3. Navigate Back ("Go back", "Piche jao", "Back karo")
    if (lower === "go back" || lower === "navigate back" || lower === "piche jao" || lower === "back karo") {
      return {
        matched: true,
        type: "DEVICE_AUTOMATION",
        action: "NAVIGATE_BACK",
        agent: "AndroidDevelopmentAgent",
      };
    }

    // 4. Open Settings ("Open Settings", "Setting kholo")
    if (lower === "open settings" || lower === "setting kholo" || lower === "settings kholo") {
      return {
        matched: true,
        type: "DEVICE_AUTOMATION",
        action: "OPEN_SETTINGS",
        target: "android.settings.SETTINGS",
        agent: "AndroidDevelopmentAgent",
      };
    }

    // 5. Scroll ("Scroll down", "Scroll up", "Niche scroll karo", "Upar scroll karo")
    if (lower === "scroll down" || lower === "niche scroll karo" || lower === "niche karo") {
      return {
        matched: true,
        type: "DEVICE_AUTOMATION",
        action: "SCROLL_SCREEN",
        direction: "DOWN",
        agent: "AndroidDevelopmentAgent",
      };
    }
    if (lower === "scroll up" || lower === "upar scroll karo" || lower === "upar karo") {
      return {
        matched: true,
        type: "DEVICE_AUTOMATION",
        action: "SCROLL_SCREEN",
        direction: "UP",
        agent: "AndroidDevelopmentAgent",
      };
    }

    // 6. Click allowed button ("Click [X]", "[X] par click karo")
    const clickEn = cleaned.match(/^(?:click|tap|press)\s+(?:on\s+)?(.+)$/i);
    const clickHi = cleaned.match(/^(.+?)\s+(?:par|pe)\s+(?:click|tap)\s+karo$/i);
    if (clickEn || clickHi) {
      const targetLabel = (clickEn ? clickEn[1] : clickHi[1]).trim();
      return {
        matched: true,
        type: "DEVICE_AUTOMATION",
        action: "CLICK_UI_ELEMENT",
        target: targetLabel,
        agent: "AndroidDevelopmentAgent",
      };
    }

    // 7. Coding Workspace & Software Factory commands
    if (
      lower.includes("open my coding project") ||
      lower.includes("create a new kotlin file") ||
      lower.includes("run the tests") ||
      lower.includes("find the build error and fix it") ||
      lower.includes("coding project kholo")
    ) {
      let codingTask = "OPEN_WORKSPACE";
      if (lower.includes("kotlin file")) codingTask = "CREATE_KOTLIN_FILE";
      else if (lower.includes("run the tests")) codingTask = "RUN_TESTS";
      else if (lower.includes("build error")) codingTask = "DIAGNOSE_AND_FIX_BUILD";

      return {
        matched: true,
        type: "CODING_TASK",
        action: codingTask,
        query: cleaned,
        agent: "SoftwareEngineeringAgent",
        avatar: "CODEX",
      };
    }

    return { matched: false, cleanedTranscript: cleaned };
  }

  function recordTurn(role, text) {
    const safeText = window.MyraaSecurityPolicyEngine
      ? window.MyraaSecurityPolicyEngine.redactSensitiveText(String(text || ""))
      : String(text || "");
    conversationHistory.push({
      role,
      text: safeText,
      timestamp: new Date().toISOString(),
    });
    if (conversationHistory.length > 100) {
      conversationHistory.shift();
    }
  }

  function startPushToTalk() {
    interruptSpeech();
    pushToTalkActive = true;
    setVoiceState(VOICE_STATES.LISTENING);
    return true;
  }

  function stopPushToTalk() {
    pushToTalkActive = false;
    setVoiceState(VOICE_STATES.THINKING);
    return true;
  }

  const voiceApi = Object.freeze({
    VOICE_STATES,
    SUPPORTED_LOCALES,
    getState: () => currentState,
    setVoiceState,
    getLocale: () => currentLocale,
    setLocale: (loc) => {
      if (SUPPORTED_LOCALES.includes(loc)) currentLocale = loc;
      return currentLocale;
    },
    getWakeWord: () => wakeWord,
    setWakeWord: (w) => {
      wakeWord = String(w || "hey myraa").toLowerCase().trim();
      return wakeWord;
    },
    isWakeWordEnabled: () => wakeWordEnabled,
    setWakeWordEnabled: (enabled) => {
      wakeWordEnabled = Boolean(enabled);
      return wakeWordEnabled;
    },
    isPushToTalkActive: () => pushToTalkActive,
    startPushToTalk,
    stopPushToTalk,
    interruptSpeech,
    parseVoiceCommand,
    recordTurn,
    getConversationHistory: () => [...conversationHistory],
    subscribeState: (cb) => {
      stateListeners.add(cb);
      return () => stateListeners.delete(cb);
    },
  });

  window.MyraaVoiceInteractionManager = voiceApi;
})();
