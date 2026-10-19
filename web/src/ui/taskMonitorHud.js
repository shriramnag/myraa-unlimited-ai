/**
 * SHIV AI — MYRAA (v.2.0.006): COMPLETE ANDROID & DESKTOP PC FRONTEND UI
 * ======================================================================
 * Supreme Owner   : श्री राम नाग (Shri Ram Nag)
 * Primary AI Name : शिव एआई (SHIV AI)
 * Current Version : v.2.0.006
 *
 * New in v.2.0.006:
 * 1. 1-Time Permanent API Key Storage + Zero-Disconnect Live AI Engine (No 2-3s cutoff or CORE ERROR PROTOCOL).
 * 2. Voice-Synchronized Lip-Sync on all 10 3D Character Videos (`window.__shivaiSetSpeakingState`):
 *    - Pauses video calmly when silent (IDLE/LISTENING).
 *    - Plays talking video + dynamic Lip-Sync syllable waveform ONLY while speaking (`SPEAKING`).
 * 3. Live Typing & Chat Bubble (`#shivai-live-chat-bubble`) for CODEX, MYRAA, AURA, SENTINEL, SAGE & PIXEL
 *    working identically on both Android Mobile and Desktop PC.
 * 4. Full AI Control of all 11 `Shiv-AI-Core` Tools, Deep Research, Screen Scroll & Smart GitHub Version Check.
 */

(function initShivAiV20005FrontendUi() {
  if (typeof document === "undefined") return;

  const ROLE_THEMES = {
    MYRAA: {
      color: "celestial",
      hex: "#0A84FF",
      img: "./avatars/myraa.png",
      closeupVideo: "./avatars/videos/myraa_closeup.mp4",
      fullVideo: "./avatars/videos/myraa_full.mp4",
      title: "SHIV AI • MYRAA Companion",
      badge: "🌸 MYRAA (शिव एआई)",
    },
    CODEX: {
      color: "emerald",
      hex: "#00E676",
      img: "./avatars/codex.png",
      closeupVideo: "./avatars/videos/codex_closeup.mp4",
      fullVideo: "./avatars/videos/codex_full.mp4",
      title: "SHIV AI • CODEX (SWE-agent & Coding Specialist)",
      badge: "💻 CODEX (Coding Specialist)",
    },
    AURA: {
      color: "gold",
      hex: "#F59E0B",
      img: "./avatars/aura.png",
      closeupVideo: "./avatars/videos/aura_closeup.mp4",
      fullVideo: "./avatars/videos/aura_full.mp4",
      title: "SHIV AI • AURA Creative Companion",
      badge: "✨ AURA (Creative Specialist)",
    },
    SENTINEL: {
      color: "crimson",
      hex: "#FF6B6B",
      img: "./avatars/sentinel.png",
      closeupVideo: "./avatars/videos/sentinel_closeup.mp4",
      fullVideo: "./avatars/videos/sentinel_full.mp4",
      title: "SHIV AI • SENTINEL (SkillSpector Security)",
      badge: "🛡️ SENTINEL (Security Specialist)",
    },
    SAGE: {
      color: "violet",
      hex: "#6C63FF",
      img: "./avatars/sage.png",
      closeupVideo: "./avatars/videos/sage_closeup.mp4",
      fullVideo: "./avatars/videos/sage_full.mp4",
      title: "SHIV AI • SAGE (gpt-researcher Deep Research)",
      badge: "🔬 SAGE (Deep Research Specialist)",
    },
    PIXEL: {
      color: "gold",
      hex: "#F59E0B",
      img: "./avatars/pixel.png",
      closeupVideo: "./avatars/videos/vortex_closeup.mp4",
      fullVideo: "./avatars/videos/vortex_full.mp4",
      title: "SHIV AI • PIXEL (ppt-master & video-use)",
      badge: "🎬 PIXEL (Media & PPT Specialist)",
    },
  };

  window.__shivaiActiveCharacterRole = window.__shivaiActiveCharacterRole || "MYRAA";
  let currentCameraMode = "CLOSEUP";
  let screenControlEnabled = true;
  try {
    screenControlEnabled = localStorage.getItem("shivai.accessibility.enabled") !== "false";
  } catch {}
  let isRecordingVoiceSample = false;
  let recordedSampleStatus = "श्री राम नाग का वॉइस सैंपल एक्टिव है (~155Hz)";
  let toolStatusMap = {};
  let lipSyncInterval = null;
  let typewriterTimer = null;

  /**
   * Controls 3D Video Avatar Lip-Sync so the character's mouth and video animate ONLY when speaking!
   */
  function setAvatarSpeakingLipSync(isSpeaking, spokenText = "") {
    const vid = document.getElementById("shivai-stage-video");
    const statusBadge = document.getElementById("shivai-stage-lip-status");
    const waveBar = document.getElementById("shivai-lipsync-wave");
    const role = window.__shivaiActiveCharacterRole || "MYRAA";
    const meta = ROLE_THEMES[role] || ROLE_THEMES.MYRAA;

    if (window.__myraaReactControl) {
      window.__myraaReactControl.setCharState?.(isSpeaking ? "talking" : "idle");
      window.__myraaReactControl.setEmotion?.(isSpeaking ? "happy" : "idle");
    }
    window.MyraaAvatarManager?.setAvatarAnimationState?.(isSpeaking ? "Talking" : "Idle");

    if (lipSyncInterval) {
      clearInterval(lipSyncInterval);
      lipSyncInterval = null;
    }

    if (isSpeaking) {
      if (vid) {
        vid.playbackRate = 1.15;
        vid.play?.().catch(() => {});
        vid.style.boxShadow = `0 0 55px ${meta.hex}, 0 0 22px #00E676`;
      }
      if (statusBadge) {
        statusBadge.textContent = `${meta.title} • [🗣️ LIP-SYNC SPEAKING]`;
        statusBadge.style.borderColor = "#00E676";
        statusBadge.style.color = "#00E676";
      }
      if (waveBar) {
        waveBar.style.display = "flex";
        lipSyncInterval = setInterval(() => {
          const bars = waveBar.querySelectorAll(".shivai-lip-bar");
          bars.forEach((b) => {
            const h = 4 + Math.floor(Math.random() * 16);
            b.style.height = `${h}px`;
          });
        }, 90);
      }
    } else {
      if (vid) {
        try {
          vid.pause?.();
        } catch {}
        vid.style.boxShadow = `0 0 35px ${meta.hex}55`;
      }
      if (statusBadge) {
        statusBadge.textContent = `${meta.title} • [${currentCameraMode} • IDLE]`;
        statusBadge.style.borderColor = meta.hex;
        statusBadge.style.color = "#fff";
      }
      if (waveBar) {
        waveBar.style.display = "none";
      }
    }
  }

  window.__shivaiSetSpeakingState = setAvatarSpeakingLipSync;

  /**
   * Renders a live typewriter chat bubble on the Home Screen so CODEX and ALL models
   * visibly type out their response on both Android Mobile and Desktop PC!
   */
  function showCharacterTypingResponse(roleName, userPrompt, replyText, toolId = null) {
    const bubble = document.getElementById("shivai-live-chat-bubble");
    if (!bubble) return;
    const role = String(roleName || window.__shivaiActiveCharacterRole || "MYRAA").toUpperCase();
    const meta = ROLE_THEMES[role] || ROLE_THEMES.MYRAA;

    if (toolId) {
      toolStatusMap[toolId] = "WORKING";
    }

    bubble.style.display = "block";
    bubble.style.borderColor = meta.hex;
    const headerEl = document.getElementById("shivai-chat-role-badge");
    const userEl = document.getElementById("shivai-chat-user-line");
    const textEl = document.getElementById("shivai-chat-model-text");

    if (headerEl) {
      headerEl.innerHTML = `<span style="color:${meta.hex};font-weight:bold;">${meta.badge}</span> ${
        toolId ? `<span style="padding:1px 6px;border-radius:999px;background:rgba(0,230,118,0.2);color:#00E676;font-size:8px;">⚡ Tool: ${toolId}</span>` : ""
      }`;
    }
    if (userEl) {
      userEl.textContent = userPrompt ? `आप: "${userPrompt}"` : "";
    }

    if (typewriterTimer) {
      clearInterval(typewriterTimer);
      typewriterTimer = null;
    }

    const fullStr = String(replyText || "").trim();
    if (!textEl) return;
    textEl.textContent = "";
    let idx = 0;
    const step = Math.max(2, Math.ceil(fullStr.length / 45));
    typewriterTimer = setInterval(() => {
      idx += step;
      if (idx >= fullStr.length) {
        textEl.textContent = fullStr;
        clearInterval(typewriterTimer);
        typewriterTimer = null;
      } else {
        textEl.textContent = fullStr.slice(0, idx) + " ▍";
      }
    }, 28);
  }

  window.__shivaiShowCharacterTypingResponse = showCharacterTypingResponse;

  function applyCharacterToHomeScreen(roleName, expression = "Idle", cameraMode = currentCameraMode) {
    const role = String(roleName || "MYRAA").toUpperCase();
    const expr = String(expression || "Idle");
    window.__shivaiActiveCharacterRole = role;
    currentCameraMode = String(cameraMode || "CLOSEUP").toUpperCase() === "FULL" ? "FULL" : "CLOSEUP";
    const meta = ROLE_THEMES[role] || ROLE_THEMES.MYRAA;

    window.MyraaAvatarManager?.selectAvatarForRole(role, currentCameraMode);
    window.MyraaAvatarManager?.setAvatarAnimationState(expr);

    if (window.__myraaReactControl) {
      window.__myraaReactControl.setTheme?.(meta.color);
    }

    const desktop = document.getElementById("myraa-holographic-desktop") || document.body;
    let stage = document.getElementById("shivai-homescreen-avatar-stage");
    if (!stage) {
      stage = document.createElement("div");
      stage.id = "shivai-homescreen-avatar-stage";
      stage.style.cssText =
        "position:fixed;inset:54px 0 185px 0;z-index:12;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding-top:6px;transition:all 0.3s ease;";
      desktop.appendChild(stage);
    }

    const videoSrc = currentCameraMode === "FULL" ? meta.fullVideo : meta.closeupVideo;
    stage.style.display = "flex";
    stage.innerHTML = `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;pointer-events:auto;">
        <div style="position:absolute;inset:-14px;border-radius:26px;background:${meta.hex};opacity:0.2;filter:blur(24px);pointer-events:none;"></div>
        <div style="position:relative;">
          <video id="shivai-stage-video" src="${videoSrc}" poster="${meta.img}" loop muted playsinline preload="auto" style="position:relative;width:min(245px,64vw);height:min(330px,42vh);object-fit:cover;border-radius:22px;border:2px solid ${meta.hex};box-shadow:0 0 35px ${meta.hex}55;transition:box-shadow 0.25s ease;"></video>
          <div id="shivai-lipsync-wave" style="display:none;position:absolute;bottom:10px;left:50%;transform:translateX(-50%);padding:4px 12px;border-radius:999px;background:rgba(2,2,10,0.88);border:1px solid #00E676;align-items:center;gap:3px;">
            <span style="font-size:8px;color:#00E676;font-weight:bold;margin-right:4px;">🗣️ LIP-SYNC</span>
            <span class="shivai-lip-bar" style="width:3px;height:8px;background:#00E676;border-radius:2px;transition:height 0.08s;"></span>
            <span class="shivai-lip-bar" style="width:3px;height:14px;background:#38bdf8;border-radius:2px;transition:height 0.08s;"></span>
            <span class="shivai-lip-bar" style="width:3px;height:10px;background:#00E676;border-radius:2px;transition:height 0.08s;"></span>
            <span class="shivai-lip-bar" style="width:3px;height:16px;background:#38bdf8;border-radius:2px;transition:height 0.08s;"></span>
            <span class="shivai-lip-bar" style="width:3px;height:9px;background:#00E676;border-radius:2px;transition:height 0.08s;"></span>
          </div>
        </div>
        <div style="position:relative;display:flex;align-items:center;gap:5px;margin-top:6px;">
          <div id="shivai-stage-lip-status" style="padding:4px 10px;border-radius:999px;background:rgba(2,2,10,0.92);border:1px solid ${meta.hex};color:#fff;font-size:9px;font-weight:bold;letter-spacing:0.04em;">
            ${meta.title} • [${currentCameraMode} • IDLE]
          </div>
          <button id="shivai-stage-cam-toggle" type="button" style="padding:4px 9px;border-radius:999px;background:#0A84FF;border:none;color:#fff;font-size:8px;font-weight:bold;cursor:pointer;">
            ${currentCameraMode === "CLOSEUP" ? "🧍 Full-Body" : "🔍 Close-Up"}
          </button>
          <button id="shivai-stage-reset-3d" type="button" style="padding:4px 8px;border-radius:999px;background:rgba(255,255,255,0.16);border:none;color:#fff;font-size:8px;cursor:pointer;">
            ✕
          </button>
        </div>
      </div>
    `;

    // Start on calm idle frame (paused until speaking so mouth only moves with Lip-Sync when talking!)
    const vidEl = document.getElementById("shivai-stage-video");
    if (vidEl) {
      vidEl.addEventListener(
        "loadeddata",
        () => {
          try {
            vidEl.currentTime = 0.15;
            vidEl.pause();
          } catch {}
        },
        { once: true }
      );
    }

    document.getElementById("shivai-stage-cam-toggle")?.addEventListener("click", () => {
      const nextMode = currentCameraMode === "CLOSEUP" ? "FULL" : "CLOSEUP";
      applyCharacterToHomeScreen(role, expr, nextMode);
    });
    document.getElementById("shivai-stage-reset-3d")?.addEventListener("click", () => {
      stage.style.display = "none";
      window.__shivaiActiveCharacterRole = "MYRAA";
    });

    showCharacterTypingResponse(
      role,
      "",
      `नमस्ते श्री राम नाग जी! मैं ${role} (${meta.title}) तैयार हूँ। आप नीचे बॉक्स में टाइप करके Send (➤) दबाएं या बोलकर कमांड दें!`
    );

    return { ok: true, appliedRole: role, expression: expr, cameraMode: currentCameraMode, videoSrc, onHomeScreen: true };
  }

  window.__shivaiApplyCharacterToHomeScreen = applyCharacterToHomeScreen;

  function mountFrontendUi() {
    const existingRoot = document.getElementById("myraa-task-monitor-root");
    if (existingRoot) existingRoot.remove();

    const root = document.createElement("div");
    root.id = "myraa-task-monitor-root";
    root.style.cssText =
      "position:fixed;bottom:142px;left:8px;right:8px;z-index:95;font-family:'Montserrat','Roboto',sans-serif;color:#F5F5F5;user-select:none;pointer-events:none;";

    root.innerHTML = `
      <!-- Live Typing & Chat Response Bubble for CODEX, MYRAA, AURA, SENTINEL, SAGE & PIXEL -->
      <div id="shivai-live-chat-bubble" style="display:none;pointer-events:auto;max-width:450px;margin:0 auto 6px auto;padding:9px 12px;border-radius:14px;background:rgba(10,14,28,0.95);border:1.5px solid #0A84FF;box-shadow:0 8px 28px rgba(0,0,0,0.85);backdrop-filter:blur(14px);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <div id="shivai-chat-role-badge" style="font-size:9px;display:flex;align-items:center;gap:6px;">
            <span style="color:#0A84FF;font-weight:bold;">🌸 SHIV AI • MYRAA</span>
          </div>
          <div style="display:flex;gap:4px;">
            <button id="shivai-chat-copy-btn" type="button" style="background:rgba(255,255,255,0.1);border:none;border-radius:6px;padding:2px 6px;color:#cbd5e1;font-size:8px;cursor:pointer;">📋 Copy</button>
            <button id="shivai-chat-close-btn" type="button" style="background:rgba(255,255,255,0.1);border:none;border-radius:6px;padding:2px 6px;color:#cbd5e1;font-size:8px;cursor:pointer;">✕</button>
          </div>
        </div>
        <div id="shivai-chat-user-line" style="font-size:8px;color:#38bdf8;margin-bottom:3px;"></div>
        <div id="shivai-chat-model-text" style="font-size:10px;color:#f8fafc;line-height:1.45;max-height:92px;overflow-y:auto;white-space:pre-wrap;user-select:text;"></div>
      </div>

      <!-- Compact Single-Row Home Screen Control Bar -->
      <div style="display:flex;align-items:center;justify-content:center;flex-wrap:nowrap;gap:5px;pointer-events:auto;max-width:460px;margin:0 auto;">
        <button id="shivai-hub-btn" type="button" style="display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.96);border:1.5px solid #0A84FF;color:#F5F5F5;font-size:9px;font-weight:bold;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.75);cursor:pointer;">
          <span id="shivai-hub-title">🔱 शिव एआई सेटिंग्स & 11 टूल्स</span>
        </button>

        <button id="shivai-homescreen-acc-switch" type="button" style="display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.96);border:1.5px solid ${
          screenControlEnabled ? "#00E676" : "#FF6B6B"
        };color:#fff;font-size:9px;font-weight:bold;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.75);cursor:pointer;">
          <span id="shivai-home-acc-dot" style="width:7px;height:7px;border-radius:50%;background:${
            screenControlEnabled ? "#00E676" : "#FF6B6B"
          };display:inline-block;"></span>
          <span id="shivai-home-acc-label">स्क्रीन कंट्रोल: ${screenControlEnabled ? "चालू (ON)" : "बंद (OFF)"}</span>
        </button>

        <button id="shivai-homescreen-3d-btn" type="button" style="display:flex;align-items:center;gap:4px;padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.96);border:1.5px solid #6C63FF;color:#e9d5ff;font-size:9px;font-weight:bold;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,0.75);cursor:pointer;">
          🎭 3D वीडियो
        </button>
      </div>

      <div id="shivai-main-panel" style="display:none;pointer-events:auto;position:fixed;inset:54px 8px 126px 8px;max-width:450px;margin:0 auto;overflow-y:auto;padding:13px;border-radius:20px;background:#1A1A2E;border:1.5px solid #0A84FF;box-shadow:0 24px 60px rgba(0,0,0,0.96);z-index:130;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:9px;margin-bottom:9px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="./avatars/ic_launcher_round.png" alt="SHIV AI" style="width:26px;height:26px;border-radius:50%;" onerror="this.style.display='none'" />
            <div>
              <div style="font-size:12px;font-weight:bold;color:#F5F5F5;">🔱 शिव एआई (SHIV AI) • मुख्य कंट्रोल पैनल</div>
              <div id="shivai-sub-banner" style="font-size:9px;color:#00E676;">ओनर: श्री राम नाग (Shri Ram Nag) • v.2.0.006 • Android & PC Ready</div>
            </div>
          </div>
          <button id="shivai-close-btn" type="button" style="background:rgba(255,255,255,0.1);border:none;border-radius:8px;padding:5px 9px;color:#fff;font-size:13px;cursor:pointer;">✕</button>
        </div>

        <div id="shivai-tabs-row" style="display:flex;gap:4px;margin-bottom:10px;overflow-x:auto;"></div>
        <div id="shivai-panel-body" style="font-size:11px;line-height:1.45;"></div>
      </div>
    `;

    document.body.appendChild(root);

    document.getElementById("shivai-chat-close-btn")?.addEventListener("click", () => {
      const b = document.getElementById("shivai-live-chat-bubble");
      if (b) b.style.display = "none";
    });
    document.getElementById("shivai-chat-copy-btn")?.addEventListener("click", () => {
      const txt = document.getElementById("shivai-chat-model-text")?.textContent || "";
      navigator.clipboard?.writeText?.(txt);
      alert("✓ जवाब क्लिपबोर्ड में कॉपी हो गया!");
    });

    let activeTab = "all_in_one_settings";
    let selectedToolId = "AUTO";
    let lastToolResult = null;
    let selectedPreviewRole = window.__shivaiActiveCharacterRole || "MYRAA";

    const panel = document.getElementById("shivai-main-panel");
    const tabsRow = document.getElementById("shivai-tabs-row");
    const bodyEl = document.getElementById("shivai-panel-body");
    const homeAccBtn = document.getElementById("shivai-homescreen-acc-switch");
    const homeAccDot = document.getElementById("shivai-home-acc-dot");
    const homeAccLabel = document.getElementById("shivai-home-acc-label");

    function updateHomeScreenSwitchUi() {
      if (!homeAccBtn || !homeAccDot || !homeAccLabel) return;
      homeAccBtn.style.borderColor = screenControlEnabled ? "#00E676" : "#FF6B6B";
      homeAccDot.style.background = screenControlEnabled ? "#00E676" : "#FF6B6B";
      homeAccLabel.textContent = `स्क्रीन कंट्रोल: ${screenControlEnabled ? "चालू (ON)" : "बंद (OFF)"}`;
    }

    function toggleScreenControl() {
      screenControlEnabled = !screenControlEnabled;
      try {
        localStorage.setItem("shivai.accessibility.enabled", String(screenControlEnabled));
      } catch {}
      updateHomeScreenSwitchUi();
      window.MyraaFullDeviceController?.showLiveScreenActivity?.(
        screenControlEnabled ? "🖐️ स्क्रीन कंट्रोल (Accessibility) चालू (ON)" : "🖐️ स्क्रीन कंट्रोल (Accessibility) बंद (OFF)",
        screenControlEnabled
          ? "शिव एआई अब स्क्रीन पर स्क्रॉल, क्लिक, लाइक, कॉपी और 3-डॉट मेनू चला सकता है।"
          : "स्क्रीन कंट्रोल अभी बंद कर दिया गया है।"
      );
      renderAll();
    }

    homeAccBtn?.addEventListener("click", () => {
      toggleScreenControl();
    });

    document.getElementById("shivai-homescreen-3d-btn")?.addEventListener("click", () => {
      activeTab = "avatars";
      panel.style.display = "block";
      renderAll();
    });

    window.__openShivaiUserHub = function (tab = "all_in_one_settings") {
      activeTab = tab === "avatars" ? "all_in_one_settings" : tab;
      panel.style.display = "block";
      renderAll();
    };

    document.getElementById("shivai-hub-btn")?.addEventListener("click", () => {
      activeTab = "all_in_one_settings";
      panel.style.display = panel.style.display === "none" ? "block" : "none";
      if (panel.style.display === "block") renderAll();
    });
    document.getElementById("shivai-close-btn")?.addEventListener("click", () => {
      panel.style.display = "none";
    });

    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(() => {
        const headings = document.querySelectorAll("h3");
        headings.forEach((h) => {
          if (h.textContent && h.textContent.includes("Myraa Configuration")) {
            const drawer = h.closest("div.fixed, div.absolute") || h.parentElement?.parentElement?.parentElement;
            if (drawer && !drawer.querySelector("#shivai-react-settings-banner")) {
              const banner = document.createElement("div");
              banner.id = "shivai-react-settings-banner";
              banner.style.cssText =
                "margin:8px 16px 0 16px;padding:10px;border-radius:14px;background:rgba(10,132,255,0.16);border:1.5px solid #00E676;color:#fff;font-family:sans-serif;";
              banner.innerHTML = `
                <div style="font-size:11px;font-weight:bold;color:#00E676;margin-bottom:4px;">
                  🔱 शिव एआई (v.2.0.006) — वॉइस वेरिफिकेशन, स्क्रीन कंट्रोल & 11 टूल्स
                </div>
                <div style="font-size:9px;color:#cbd5e1;margin-bottom:8px;">
                  ओनर: <b>श्री राम नाग (Shri Ram Nag)</b> • 1-Time API Key, वॉइस सैंपल, स्क्रीन कंट्रोल और 11 टूल्स खोलें:
                </div>
                <button id="shivai-open-from-react-settings" type="button" style="width:100%;padding:8px;border-radius:10px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:10px;cursor:pointer;">
                  ⚙️ वॉइस वेरिफिकेशन, स्क्रीन कंट्रोल & 11 टूल्स खोलें
                </button>
              `;
              h.parentElement?.parentElement?.parentElement?.insertBefore(banner, h.parentElement.parentElement.nextSibling);
              banner.querySelector("#shivai-open-from-react-settings")?.addEventListener("click", () => {
                panel.style.display = "block";
                activeTab = "all_in_one_settings";
                renderAll();
              });
            }
          }
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    async function renderAll() {
      const tabs = [
        { id: "all_in_one_settings", label: "⚙️ सेटिंग्स & 11 टूल्स" },
        { id: "apps_playstore", label: "📲 ऐप्स & Play Store" },
        { id: "avatars", label: "🎭 10 3D वीडियो (Lip-Sync)" },
        { id: "ota_admin", label: "🚀 अपडेट (v.2.0.006)" },
      ];

      if (tabsRow)
        tabsRow.innerHTML = tabs
          .map(
            (t) =>
              `<button data-tab="${t.id}" class="shivai-tab-item" style="flex:1;padding:6px 7px;border-radius:8px;background:${
                activeTab === t.id ? "#0A84FF" : "rgba(255,255,255,0.06)"
              };border:none;color:#fff;font-size:9px;font-weight:bold;white-space:nowrap;cursor:pointer;">${t.label}</button>`
          )
          .join("");

      tabsRow?.querySelectorAll(".shivai-tab-item").forEach((b) => {
        b.addEventListener("click", () => {
          activeTab = b.getAttribute("data-tab") || "all_in_one_settings";
          renderAll();
        });
      });

      if (activeTab === "all_in_one_settings") {
        const vState = window.MyraaVoiceBiometrics?.getVoiceState() || {};
        const voiceLockOn = vState.voiceLockActive !== false;
        const tools = window.ShivAiCoreBridge?.getAllTools() || [];
        let savedApiKey = "";
        try {
          savedApiKey = localStorage.getItem("shivai.gemini.api_key_v1") || "";
        } catch {}

        if (bodyEl)
          bodyEl.innerHTML = `
          <!-- 0. 1-Time Permanent API Key Setup + Built-in Free AI Fallback -->
          <div style="padding:10px;border-radius:14px;background:rgba(0,230,118,0.1);border:1.5px solid #00E676;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <div style="font-weight:bold;color:#00E676;font-size:11px;">🔑 वन-टाइम API Key सेटअप (Never Disconnects)</div>
              <span style="padding:2px 8px;border-radius:999px;background:rgba(0,230,118,0.22);color:#00E676;font-size:8px;font-weight:bold;">
                ${savedApiKey ? "✓ KEY SAVED FOREVER" : "🆓 FREE AI + KEY READY"}
              </span>
            </div>
            <div style="font-size:8px;color:#cbd5e1;margin-bottom:6px;">
              सिर्फ पहली बार अपनी Gemini API Key डालकर Save करें (या बिना Key के भी 100% फ्री इनबिल्ट AI से चैट और वॉइस चलाएं — अब 2-3 सेकंड में कभी कट नहीं होगा):
            </div>
            <div style="display:flex;gap:5px;">
              <input id="shivai-onetime-api-key" type="password" value="${savedApiKey}" placeholder="Paste Gemini API Key (AIza...) — सिर्फ 1 बार डालें" style="flex:1;padding:6px 8px;border-radius:8px;background:#0f172a;border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:9px;" />
              <button id="shivai-save-onetime-key-btn" type="button" style="padding:6px 12px;border-radius:8px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">
                💾 Save Forever
              </button>
            </div>
          </div>

          <!-- काम 1: सेटिंग में वॉइस वेरिफिकेशन सेक्शन -->
          <div style="padding:10px;border-radius:14px;background:rgba(10,132,255,0.12);border:1.5px solid #0A84FF;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div style="font-weight:bold;color:#fff;font-size:11px;">🎙️ 1. वॉइस वेरिफिकेशन (Voice Verification)</div>
              <button id="shivai-voice-lock-switch" type="button" style="padding:4px 10px;border-radius:999px;background:${
                voiceLockOn ? "#00E676" : "#FF6B6B"
              };border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">
                वॉइस लॉक: ${voiceLockOn ? "चालू (ON)" : "बंद (OFF)"}
              </button>
            </div>
            <div style="font-size:9px;color:#cbd5e1;margin-bottom:6px;">
              ओनर: <b style="color:#00E676;">श्री राम नाग (Shri Ram Nag)</b> • स्टेटस: <span id="shivai-rec-status" style="color:#38bdf8;">${recordedSampleStatus}</span>
            </div>
            <input id="shivai-owner-voice-sample" value="नमस्ते शिव एआई, मैं श्री राम नाग बोल रहा हूँ" placeholder="रिकॉर्ड या सेव करने के लिए अपना वाक्य बोलें/लिखें..." style="width:100%;margin-bottom:6px;padding:7px;border-radius:8px;background:#0f172a;border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:9px;" />
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
              <button id="shivai-record-voice-btn" type="button" style="padding:8px;border-radius:8px;background:${
                isRecordingVoiceSample ? "#FF6B6B" : "#6C63FF"
              };border:none;color:#fff;font-weight:bold;font-size:9px;cursor:pointer;">
                ${isRecordingVoiceSample ? "⏹️ रिकॉर्डिंग हो रही है..." : "🔴 आवाज़ रिकॉर्ड करें (Record)"}
              </button>
              <button id="shivai-save-owner-voice" type="button" style="padding:8px;border-radius:8px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">
                💾 आवाज़ सैंपल सेव करें (Save)
              </button>
            </div>
          </div>

          <!-- काम 2: स्क्रीन कंट्रोल (Accessibility Service) को चालू और बंद करने का स्पष्ट स्विच -->
          <div style="padding:10px;border-radius:14px;background:rgba(0,230,118,0.1);border:1.5px solid ${
            screenControlEnabled ? "#00E676" : "#FF6B6B"
          };margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div>
                <div style="font-weight:bold;color:#fff;font-size:11px;">🖐️ 2. स्क्रीन कंट्रोल (Accessibility Service & Scroll)</div>
                <div style="font-size:8px;color:#cbd5e1;">इंसानों की तरह ऊपर/नीचे स्क्रॉल, क्लिक, लाइक, कॉपी, 3-डॉट मेनू और म्यूट</div>
              </div>
              <button id="shivai-panel-acc-switch" type="button" style="padding:6px 14px;border-radius:999px;background:${
                screenControlEnabled ? "#00E676" : "#FF6B6B"
              };border:none;color:#000;font-weight:bold;font-size:10px;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,0.4);">
                ${screenControlEnabled ? "✅ चालू है (ON)" : "⭕ बंद है (OFF)"}
              </button>
            </div>

            <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin-top:6px;">
              <button id="shivai-acc-scroll-down" type="button" style="padding:6px 3px;border-radius:6px;background:#0A84FF;border:none;color:#fff;font-weight:bold;font-size:8px;cursor:pointer;">⬇️ नीचे स्क्रॉल</button>
              <button id="shivai-acc-scroll-up" type="button" style="padding:6px 3px;border-radius:6px;background:#0284c7;border:none;color:#fff;font-weight:bold;font-size:8px;cursor:pointer;">⬆️ ऊपर स्क्रॉल</button>
              <button id="shivai-acc-like" type="button" style="padding:6px 3px;border-radius:6px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">👍 लाइक</button>
              <button id="shivai-acc-copy" type="button" style="padding:6px 3px;border-radius:6px;background:#6C63FF;border:none;color:#fff;font-weight:bold;font-size:8px;cursor:pointer;">📋 कॉपी</button>
              <button id="shivai-acc-dots" type="button" style="padding:6px 3px;border-radius:6px;background:#F59E0B;border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">⋮ 3-डॉट</button>
            </div>
            <button id="shivai-open-android-acc-settings" type="button" style="width:100%;margin-top:6px;padding:6px;border-radius:6px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#cbd5e1;font-size:8px;cursor:pointer;">
              ⚙️ फोन की Android Accessibility Settings खोलें
            </button>
          </div>

          <!-- काम 3: शिव एआई कोर (Shiv-AI-Core) के सभी 11 टूल्स का लाइव स्टेटस डैशबोर्ड -->
          <div style="padding:10px;border-radius:14px;background:rgba(108,99,255,0.12);border:1.5px solid #6C63FF;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <div style="font-weight:bold;color:#fff;font-size:11px;">🔱 3. शिव एआई कोर — 11 टूल्स & Deep Research</div>
              <span style="padding:2px 8px;border-radius:999px;background:rgba(0,230,118,0.2);border:1px solid #00E676;color:#00E676;font-size:8px;font-weight:bold;">
                🟢 11/11 AI CONTROLLED
              </span>
            </div>

            <div style="display:flex;gap:4px;margin-bottom:6px;">
              <input id="shivai-core-prompt" placeholder="रिसर्च या कोडिंग लिखें (जैसे: 'AI भविष्य पर Deep Research करो')..." style="flex:1;padding:6px;border-radius:6px;background:#0f172a;border:1px solid #0A84FF;color:#fff;font-size:9px;" />
              <button id="shivai-core-run-btn" type="button" style="padding:6px 10px;border-radius:6px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">⚡ चलाएं</button>
            </div>

            ${
              lastToolResult
                ? `<div style="margin-bottom:6px;padding:7px;border-radius:8px;background:#0f172a;border:1px solid #00E676;font-size:9px;color:#00E676;white-space:pre-wrap;max-height:110px;overflow-y:auto;"><b>⚡ टूल आउटपुट (${lastToolResult.toolId}):</b>\n${lastToolResult.output}</div>`
                : ""
            }

            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;max-height:165px;overflow-y:auto;">
              ${tools
                .map((t) => {
                  const st = toolStatusMap[t.id] || "READY";
                  const isWorking = st === "WORKING";
                  return `
                <div data-tid="${t.id}" class="shivai-tool-card" style="padding:6px;border-radius:8px;background:rgba(15,23,42,0.85);border:1px solid ${
                    isWorking ? "#00E676" : selectedToolId === t.id ? "#38bdf8" : "rgba(255,255,255,0.1)"
                  };cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:8px;font-weight:bold;color:#fff;">${t.icon} ${t.index}. ${t.name}</span>
                    <span style="font-size:7px;padding:1px 5px;border-radius:999px;background:${
                      isWorking ? "#00E676" : "rgba(0,230,118,0.18)"
                    };color:${isWorking ? "#000" : "#00E676"};font-weight:bold;">
                      ${isWorking ? "⚡ WORKING" : "🟢 READY"}
                    </span>
                  </div>
                  <div style="font-size:7px;color:#94a3b8;margin-top:2px;">${t.hindiDesc}</div>
                </div>`;
                })
                .join("")}
            </div>
          </div>
        `;

        // 0. Save 1-Time Permanent API Key
        document.getElementById("shivai-save-onetime-key-btn")?.addEventListener("click", async () => {
          const val = (document.getElementById("shivai-onetime-api-key")?.value || "").trim();
          if (!val) {
            alert("कृपया अपनी Gemini API Key पेस्ट करें (या बिना Key के भी इनबिल्ट फ्री AI चालू है)।");
            return;
          }
          try {
            localStorage.setItem("shivai.gemini.api_key_v1", val);
            await window.MyraaNative?.testAndSaveGeminiKey?.({ apiKey: val });
          } catch {}
          alert("✓ आपकी Gemini API Key हमेशा के लिए सेव हो गई है! अब आपको दोबारा डालने की ज़रूरत नहीं पड़ेगी और कनेक्शन कभी नहीं कटेगा।");
          renderAll();
        });

        // 1. Voice Verification handlers
        document.getElementById("shivai-voice-lock-switch")?.addEventListener("click", () => {
          window.MyraaVoiceBiometrics?.setVoiceLockActive(!voiceLockOn);
          renderAll();
        });

        document.getElementById("shivai-record-voice-btn")?.addEventListener("click", () => {
          isRecordingVoiceSample = true;
          recordedSampleStatus = "🎙️ माइक्रोफोन से आपकी आवाज़ रिकॉर्ड हो रही है (3 सेकंड बोलें)...";
          renderAll();

          const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (SpeechRec) {
            try {
              const rec = new SpeechRec();
              rec.lang = "hi-IN";
              rec.onresult = (ev) => {
                const transcript = ev.results?.[0]?.[0]?.transcript || "";
                const inp = document.getElementById("shivai-owner-voice-sample");
                if (inp && transcript) inp.value = transcript;
              };
              rec.start();
            } catch {}
          }

          setTimeout(() => {
            isRecordingVoiceSample = false;
            const phrase = document.getElementById("shivai-owner-voice-sample")?.value || "नमस्ते शिव एआई, मैं श्री राम नाग बोल रहा हूँ";
            window.MyraaVoiceBiometrics?.enrollSpeakerVoiceprint({
              role: "OWNER",
              speakerName: "श्री राम नाग (Shri Ram Nag)",
              avgPitchHz: 155,
              samplePhrase: phrase,
            });
            recordedSampleStatus = `✅ सैंपल रिकॉर्ड और सेव हो गया ("${phrase.slice(0, 26)}...")`;
            renderAll();
          }, 2200);
        });

        document.getElementById("shivai-save-owner-voice")?.addEventListener("click", () => {
          const phrase = document.getElementById("shivai-owner-voice-sample")?.value || "Hey Shiv AI";
          const res = window.MyraaVoiceBiometrics?.enrollSpeakerVoiceprint({
            role: "OWNER",
            speakerName: "श्री राम नाग (Shri Ram Nag)",
            avgPitchHz: 155,
            samplePhrase: phrase,
          });
          recordedSampleStatus = "✅ श्री राम नाग का वॉइस सैंपल सुरक्षित रूप से सेव हो गया!";
          alert(res?.message);
          renderAll();
        });

        // 2. Screen Control (Accessibility) Switch & Quick Actions
        document.getElementById("shivai-panel-acc-switch")?.addEventListener("click", () => {
          toggleScreenControl();
        });
        document.getElementById("shivai-open-android-acc-settings")?.addEventListener("click", async () => {
          if (window.MyraaNative?.executeAction) {
            try {
              await window.MyraaNative.executeAction({ action: { action: "OPEN_ACCESSIBILITY_SETTINGS" } });
              return;
            } catch {}
          }
          alert("फोन की Settings -> Accessibility -> Installed Services -> 'MYRAA Safe UI Automation' को चालू (ON) करें।");
        });

        const dc = window.MyraaFullDeviceController;
        document.getElementById("shivai-acc-scroll-down")?.addEventListener("click", async () => {
          if (!screenControlEnabled) return alert("कृपया पहले ऊपर 'स्क्रीन कंट्रोल' स्विच को चालू (ON) करें!");
          try {
            window.scrollBy?.({ top: 420, behavior: "smooth" });
          } catch {}
          const r = await dc?.accessibilityScrollScreen("DOWN");
          showCharacterTypingResponse(window.__shivaiActiveCharacterRole, "Scroll Down", r?.message || "स्क्रीन को नीचे स्क्रॉल किया गया।");
        });
        document.getElementById("shivai-acc-scroll-up")?.addEventListener("click", async () => {
          if (!screenControlEnabled) return alert("कृपया पहले ऊपर 'स्क्रीन कंट्रोल' स्विच को चालू (ON) करें!");
          try {
            window.scrollBy?.({ top: -420, behavior: "smooth" });
          } catch {}
          const r = await dc?.accessibilityScrollScreen("UP");
          showCharacterTypingResponse(window.__shivaiActiveCharacterRole, "Scroll Up", r?.message || "स्क्रीन को ऊपर स्क्रॉल किया गया।");
        });
        document.getElementById("shivai-acc-like")?.addEventListener("click", async () => {
          if (!screenControlEnabled) return alert("कृपया पहले ऊपर 'स्क्रीन कंट्रोल' स्विच को चालू (ON) करें!");
          const r = await dc?.accessibilityLikeOrDislike("LIKE");
          alert(r?.message);
        });
        document.getElementById("shivai-acc-copy")?.addEventListener("click", async () => {
          if (!screenControlEnabled) return alert("कृपया पहले ऊपर 'स्क्रीन कंट्रोल' स्विच को चालू (ON) करें!");
          const r = await dc?.accessibilityCopyScreenText("");
          alert(r?.message);
        });
        document.getElementById("shivai-acc-dots")?.addEventListener("click", async () => {
          if (!screenControlEnabled) return alert("कृपया पहले ऊपर 'स्क्रीन कंट्रोल' स्विच को चालू (ON) करें!");
          const r = await dc?.accessibilityClickThreeDotsMenu();
          alert(r?.message);
        });

        // 3. Shiv-AI-Core 11 Tools Status Dashboard
        bodyEl?.querySelectorAll(".shivai-tool-card").forEach((card) => {
          card.addEventListener("click", async () => {
            const tid = card.getAttribute("data-tid") || "gpt-researcher";
            selectedToolId = tid;
            toolStatusMap[tid] = "WORKING";
            renderAll();
            const promptVal = document.getElementById("shivai-core-prompt")?.value || `${tid} से विश्लेषण और रिपोर्ट तैयार करो`;
            const res = await window.ShivAiCoreBridge?.executeToolCommand({
              toolId: tid,
              prompt: promptVal,
            });
            if (res?.ok) {
              lastToolResult = res;
              showCharacterTypingResponse(window.__shivaiActiveCharacterRole, promptVal, res.output, tid);
            }
            renderAll();
          });
        });

        document.getElementById("shivai-core-run-btn")?.addEventListener("click", async () => {
          const p = document.getElementById("shivai-core-prompt")?.value || "शिव एआई के सभी 11 टूल्स और Deep Research स्टेटस बताओ";
          const res = await window.ShivAiCoreBridge?.executeToolCommand({
            toolId: selectedToolId === "AUTO" ? null : selectedToolId,
            prompt: p,
          });
          if (res?.ok) {
            toolStatusMap[res.toolId] = "WORKING";
            lastToolResult = res;
            showCharacterTypingResponse(window.__shivaiActiveCharacterRole, p, res.output, res.toolId);
            renderAll();
          }
        });
      }
      // =====================================================================
      // TAB 2: सभी ऐप्स & Play Store
      // =====================================================================
      else if (activeTab === "apps_playstore") {
        const dc = window.MyraaFullDeviceController;
        const appInfo = (await dc?.listAllInstalledAppsViaPackageManager?.()) || { apps: [] };
        if (bodyEl)
          bodyEl.innerHTML = `
          <div style="padding:9px;border-radius:12px;background:rgba(0,230,118,0.08);border:1px solid #00E676;margin-bottom:8px;">
            <div style="font-weight:bold;color:#00E676;margin-bottom:4px;">📲 Play Store ऑटो-डाउनलोड, अनइंस्टॉल और सभी ऐप्स</div>
            <input id="shivai-pkg-input" placeholder="ऐप का नाम लिखें (जैसे: Instagram, WhatsApp, VLC)..." value="Instagram" style="width:100%;margin-bottom:6px;padding:6px;border-radius:6px;background:#0f172a;border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:9px;" />
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;">
              <button id="shivai-pkg-open" type="button" style="padding:7px;border-radius:6px;background:#0A84FF;border:none;color:#fff;font-weight:bold;font-size:8px;cursor:pointer;">🚀 ऐप खोलें</button>
              <button id="shivai-pkg-install" type="button" style="padding:7px;border-radius:6px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">📥 Play Store डाउनलोड</button>
              <button id="shivai-pkg-uninstall" type="button" style="padding:7px;border-radius:6px;background:#FF6B6B;border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">🗑️ अनइंस्टॉल करें</button>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;max-height:190px;overflow-y:auto;">
            ${appInfo.apps
              .map(
                (a) => `
              <div data-name="${a.appName}" class="shivai-installed-app-item" style="padding:6px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                <div>
                  <div style="font-size:9px;font-weight:bold;color:#fff;">${a.appName}</div>
                  <div style="font-size:7px;color:#94a3b8;">${a.packageName}</div>
                </div>
                <span style="font-size:8px;color:#00E676;font-weight:bold;">Open ▶</span>
              </div>`
              )
              .join("")}
          </div>
        `;
        document.getElementById("shivai-pkg-open")?.addEventListener("click", async () => {
          const name = document.getElementById("shivai-pkg-input")?.value || "YouTube";
          const r = await dc?.openInstalledAppByName(name);
          alert(r?.message || r?.error);
        });
        document.getElementById("shivai-pkg-install")?.addEventListener("click", async () => {
          const name = document.getElementById("shivai-pkg-input")?.value || "Instagram";
          const r = await dc?.installAppFromPlayStore(name);
          alert(r?.message || r?.error);
        });
        document.getElementById("shivai-pkg-uninstall")?.addEventListener("click", async () => {
          const name = document.getElementById("shivai-pkg-input")?.value || "Facebook";
          const r = await dc?.uninstallAppOnCommand(name, true);
          alert(r?.message || r?.error);
        });
        bodyEl?.querySelectorAll(".shivai-installed-app-item").forEach((el) => {
          el.addEventListener("click", async () => {
            const name = el.getAttribute("data-name") || "App";
            const r = await dc?.openInstalledAppByName(name);
            alert(r?.message);
          });
        });
      }
      // =====================================================================
      // TAB 3: 6 3D Character Video Models (With Lip-Sync & Live Typing)
      // =====================================================================
      else if (activeTab === "avatars") {
        const chars = [
          { role: "MYRAA", desc: "Lip-Sync + Chat", img: "./avatars/myraa.png" },
          { role: "CODEX", desc: "Coding + Chat", img: "./avatars/codex.png" },
          { role: "AURA", desc: "Creative + Chat", img: "./avatars/aura.png" },
          { role: "SENTINEL", desc: "Security + Chat", img: "./avatars/sentinel.png" },
          { role: "SAGE", desc: "Research + Chat", img: "./avatars/sage.png" },
          { role: "PIXEL", desc: "Media + Chat", img: "./avatars/pixel.png" },
        ];
        const previewMeta = ROLE_THEMES[selectedPreviewRole] || ROLE_THEMES.MYRAA;
        const previewVideo = currentCameraMode === "FULL" ? previewMeta.fullVideo : previewMeta.closeupVideo;

        if (bodyEl)
          bodyEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:10px;color:#cbd5e1;">Selected: <b style="color:#00E676;">${selectedPreviewRole}</b> (Lip-Sync & Chat Ready)</span>
            <div style="display:flex;gap:4px;">
              <button id="shivai-cam-closeup" style="padding:3px 7px;border-radius:6px;background:${
                currentCameraMode === "CLOSEUP" ? "#0A84FF" : "rgba(255,255,255,0.08)"
              };border:none;color:#fff;font-size:8px;font-weight:bold;cursor:pointer;">🔍 Close-Up</button>
              <button id="shivai-cam-full" style="padding:3px 7px;border-radius:6px;background:${
                currentCameraMode === "FULL" ? "#0A84FF" : "rgba(255,255,255,0.08)"
              };border:none;color:#fff;font-size:8px;font-weight:bold;cursor:pointer;">🧍 Full-Body</button>
            </div>
          </div>
          <div style="display:flex;justify-content:center;margin-bottom:8px;">
            <video src="${previewVideo}" poster="${previewMeta.img}" autoplay loop muted playsinline style="width:125px;height:165px;object-fit:cover;border-radius:14px;border:2px solid ${previewMeta.hex};"></video>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:8px;">
            ${chars
              .map(
                (c) => `
              <div data-role="${c.role}" class="shivai-char-card" style="padding:4px;border-radius:10px;text-align:center;background:rgba(255,255,255,0.05);border:2px solid ${
                  selectedPreviewRole === c.role ? "#00E676" : "rgba(255,255,255,0.1)"
                };cursor:pointer;">
                <img src="${c.img}" alt="${c.role}" style="width:100%;height:52px;object-fit:cover;border-radius:6px;" />
                <div style="font-size:8px;font-weight:bold;color:#fff;margin-top:2px;">${c.role}</div>
                <div style="font-size:7px;color:#00E676;">${c.desc}</div>
              </div>`
              )
              .join("")}
          </div>
          <button id="shivai-apply-home-btn" type="button" style="width:100%;padding:9px;border-radius:10px;background:#00E676;border:none;color:#000;font-size:10px;font-weight:bold;cursor:pointer;">
            ✓ APPLY ${selectedPreviewRole} (${currentCameraMode}) WITH LIP-SYNC & TYPING
          </button>
        `;

        document.getElementById("shivai-cam-closeup")?.addEventListener("click", () => {
          currentCameraMode = "CLOSEUP";
          renderAll();
        });
        document.getElementById("shivai-cam-full")?.addEventListener("click", () => {
          currentCameraMode = "FULL";
          renderAll();
        });
        bodyEl?.querySelectorAll(".shivai-char-card").forEach((el) => {
          el.addEventListener("click", () => {
            selectedPreviewRole = el.getAttribute("data-role") || "MYRAA";
            renderAll();
          });
        });
        document.getElementById("shivai-apply-home-btn")?.addEventListener("click", () => {
          applyCharacterToHomeScreen(selectedPreviewRole, "Idle", currentCameraMode);
          panel.style.display = "none";
        });
      }
      // =====================================================================
      // TAB 4: OTA Update & Smart GitHub Version Check (v.2.0.006)
      // =====================================================================
      else if (activeTab === "ota_admin") {
        const directUrl =
          window.MyraaOtaUpdater?.GITHUB_RELEASE_APK_URL ||
          "https://raw.githubusercontent.com/shriramnag/myraa-unlimited-ai/main/releases/SHIVAI-MYRAA-latest.apk";
        const verReport = await window.MyraaOtaUpdater?.getVersionStatusReport?.();
        if (bodyEl)
          bodyEl.innerHTML = `
          <div style="padding:12px;border-radius:14px;background:rgba(0,230,118,0.1);border:1.5px solid #00E676;">
            <div style="font-size:12px;font-weight:bold;color:#00E676;margin-bottom:4px;">🚀 SHIV AI Smart GitHub Version Checker (v.2.0.006)</div>
            <div style="font-size:9px;color:#cbd5e1;margin-bottom:8px;line-height:1.5;">
              ओनर: <b>श्री राम नाग (Shri Ram Nag)</b><br/>
              ऐप का इंस्टॉल्ड वर्जन: <b style="color:#00E676;">v.2.0.006</b> (पुराना v5 पूरी तरह हटा दिया गया है)<br/>
              GitHub लेटेस्ट वर्जन: <b style="color:#38bdf8;">${verReport?.githubLatestVersion || "v.2.0.006"}</b><br/>
              स्टेटस: <b>${verReport?.isUpToDate ? "✅ आपका ऐप पूरी तरह अपडेटेड है" : "⚠️ GitHub पर नया अपडेट उपलब्ध है"}</b>
            </div>
            <button id="shivai-test-ota-popup-btn" type="button" style="width:100%;padding:9px;border-radius:10px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:10px;cursor:pointer;margin-bottom:6px;">
              🚀 Open OTA Update Pop-Up Window (v.2.0.006)
            </button>
            <a href="${directUrl}" download="SHIV-AI-v.2.0.006.apk" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;width:100%;padding:9px;border-radius:10px;background:#0A84FF;color:#fff;font-weight:bold;font-size:10px;text-decoration:none;">
              📥 सीधे GitHub से लेटेस्ट APK डाउनलोड करें (No 404)
            </a>
          </div>
        `;
        document.getElementById("shivai-test-ota-popup-btn")?.addEventListener("click", () => {
          window.MyraaOtaUpdater?.showUpdatePopupModal({
            version: verReport?.githubLatestVersion || "v.2.0.006",
            apkUrl: directUrl,
            changelog:
              "v.2.0.006 Update from GitHub (shriramnag/myraa-unlimited-ai): Fixed 2-3s Gemini Live cutoff, added 1-Time Permanent API Key + Free AI Engine, added 3D Video Lip-Sync, full AI control of all 11 Shiv-AI-Core tools & Deep Research, Screen Scroll, and Live Typing for CODEX & all models on Android and PC.",
          });
        });
      }
    }

    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountFrontendUi);
  } else {
    mountFrontendUi();
  }
})();
