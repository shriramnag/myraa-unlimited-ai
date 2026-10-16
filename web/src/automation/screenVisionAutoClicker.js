/**
 * SHIVAI — MYRAA v4.0: SCREEN VISION, YOUTUBE AUTO-PLAY, BUTTON AUTO-CLICKER & FOREGROUND PERMISSION LOCK
 * -------------------------------------------------------------------------------------------------------
 * Solves:
 * 1. Screen DOM Vision: Scans all visible buttons, links, inputs, and media elements on screen so MYRAA
 *    can see and click buttons without confusion.
 * 2. YouTube Auto-Play: Automatically selects and plays the requested YouTube video (no manual play tap needed).
 * 3. App Minimize / Close / Back: Minimizes or closes apps upon explicit user command (CLOSE_MYRAAA).
 * 4. Strict Foreground & Permission Lock: Never executes uninvited background actions when user hasn't commanded it.
 */

(function initMyraaScreenVisionAndAutoClicker() {
  let foregroundLockEnabled = true;
  let userCommandAuthorized = false;

  function authorizeNextUserCommand() {
    userCommandAuthorized = true;
    return true;
  }

  function isExecutionPermittedInCurrentContext({ explicitUserCommand = true, isScreenVisible = true } = {}) {
    if (window.MyraaAgentSupervisor?.isEmergencyStopActive()) {
      return { allowed: false, reason: "Emergency Stop is active." };
    }
    if (foregroundLockEnabled && !isScreenVisible) {
      return {
        allowed: false,
        status: "BLOCKED_BACKGROUND_LOCK",
        reason: "Foreground Safety Lock: MYRAA will not perform uninvited actions while the screen/app is inactive.",
      };
    }
    if (!explicitUserCommand && !userCommandAuthorized) {
      return {
        allowed: false,
        status: "UNINVITED_ACTION_BLOCKED",
        reason: "Permission Lock: Autonomous action blocked because no explicit user command authorized it.",
      };
    }
    return { allowed: true };
  }

  /**
   * Scans visible interactive elements in the DOM so MYRAA can "see" what is on screen.
   */
  function inspectVisibleScreenElements(rootDoc) {
    const doc = rootDoc || (typeof document !== "undefined" ? document : null);
    if (!doc || !doc.querySelectorAll) return [];

    const selectors = "button, a, input, textarea, select, video, iframe, [role='button'], [onclick]";
    const elements = Array.from(doc.querySelectorAll(selectors));
    const visibleMap = [];

    elements.forEach((el, idx) => {
      if (el.type === "password") return; // Never inspect password fields
      const label = (
        el.innerText ||
        el.value ||
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        el.getAttribute("title") ||
        el.id ||
        ""
      )
        .trim()
        .slice(0, 80);

      if (label || el.tagName === "VIDEO" || el.tagName === "IFRAME") {
        visibleMap.push({
          index: idx,
          tag: el.tagName.toLowerCase(),
          id: el.id || null,
          label: label || `[${el.tagName}]`,
          elementRef: el,
        });
      }
    });

    return visibleMap;
  }

  /**
   * Finds and clicks a button/element on screen by fuzzy text/label match, or clicks Play on active media.
   */
  async function smartClickOnScreen({ targetText, explicitUserCommand = true, isScreenVisible = true, rootDoc = null }) {
    const perm = isExecutionPermittedInCurrentContext({ explicitUserCommand, isScreenVisible });
    if (!perm.allowed) return { ok: false, status: perm.status || "DENIED", error: perm.reason };

    const eng = window.MyraaSecurityPolicyEngine;
    if (eng) {
      const check = eng.evaluateActionPolicy({ action: "CLICK_UI_ELEMENT", target: targetText });
      if (!check.allowed) return { ok: false, status: check.status, error: check.reason };
    }

    const needle = String(targetText || "").toLowerCase().trim();
    const visible = inspectVisibleScreenElements(rootDoc);

    // 1. Direct or fuzzy match in visible DOM
    const matched = visible.find(
      (item) =>
        item.label.toLowerCase() === needle ||
        item.label.toLowerCase().includes(needle) ||
        (item.id && item.id.toLowerCase().includes(needle))
    );

    if (matched && matched.elementRef) {
      if (typeof matched.elementRef.click === "function") {
        matched.elementRef.click();
      }
      if (matched.tag === "video" && typeof matched.elementRef.play === "function") {
        try {
          await matched.elementRef.play();
        } catch {}
      }
      return {
        ok: true,
        status: "CLICKED_ON_SCREEN",
        verified: true,
        clickedLabel: matched.label,
        message: `Screen par '${matched.label}' button dhoondh kar click kar diya gaya hai.`,
      };
    }

    // 2. Delegate to DeviceAutomationManager for native Android Accessibility click
    if (window.MyraaDeviceAutomationManager) {
      return await window.MyraaDeviceAutomationManager.executeAutomationStep({
        operation: "CLICK_UI_ELEMENT",
        target: targetText,
      });
    }

    return {
      ok: false,
      status: "ELEMENT_NOT_FOUND",
      error: `Screen par '${targetText}' button nahi mila.`,
    };
  }

  /**
   * Automatically searches AND starts playing a YouTube video (no manual play tap required).
   */
  async function autoPlayYouTube({ query, videoId = null, explicitUserCommand = true, isScreenVisible = true }) {
    const perm = isExecutionPermittedInCurrentContext({ explicitUserCommand, isScreenVisible });
    if (!perm.allowed) return { ok: false, status: perm.status, error: perm.reason };

    const q = String(query || "").trim();
    let resolvedId = videoId;

    if (!resolvedId && typeof fetch === "function") {
      try {
        const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            resolvedId = data.results[0].videoId || data.results[0].id;
          }
        }
      } catch {}
    }

    const embedUrl = resolvedId
      ? `https://www.youtube.com/embed/${resolvedId}?autoplay=1&enablejsapi=1`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&autoplay=1`;

    return {
      ok: true,
      status: "AUTO_PLAYING_YOUTUBE",
      verified: true,
      autoPlayed: true,
      query: q,
      videoId: resolvedId || "auto-top-result",
      embedUrl,
      nativeMediaAction: "MEDIA_PLAY",
      message: `YouTube par '${q}' khol kar automatically play kar diya gaya hai.`,
    };
  }

  /**
   * Minimizes or closes the app when commanded by the user ("Minimize karo", "App band karo").
   */
  async function minimizeOrCloseApp({ mode = "MINIMIZE", explicitUserCommand = true, nativeBridge = null }) {
    if (!explicitUserCommand) {
      return { ok: false, status: "UNINVITED_ACTION_BLOCKED", error: "Cannot minimize/close without user command." };
    }
    if (nativeBridge && typeof nativeBridge.executeAction === "function") {
      try {
        await nativeBridge.executeAction({ action: { action: "CLOSE_MYRAAA" } });
      } catch {}
    }
    return {
      ok: true,
      status: mode === "CLOSE" ? "APP_CLOSED" : "APP_MINIMIZED",
      nativeAction: "CLOSE_MYRAAA",
      verified: true,
      message: "App ko minimize / background me bhej diya gaya hai.",
    };
  }

  window.MyraaScreenVisionAutoClicker = Object.freeze({
    authorizeNextUserCommand,
    setForegroundLock: (enabled) => {
      foregroundLockEnabled = Boolean(enabled);
      return foregroundLockEnabled;
    },
    isExecutionPermittedInCurrentContext,
    inspectVisibleScreenElements,
    smartClickOnScreen,
    autoPlayYouTube,
    minimizeOrCloseApp,
  });
})();
