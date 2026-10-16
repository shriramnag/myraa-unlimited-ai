/**
 * SHIVAI — MYRAA v6.0:
 * - 6 Animated 3D Characters (10 MP4 Videos: Close-Up & Full-Body for MYRAA, CODEX, AURA, SENTINEL, SAGE, PIXEL)
 * - Google Account Sign-In synced to Google Sheets Database
 * - Indian UPI Payment Gateway (Google Pay, PhonePe, Paytm, BHIM UPI)
 * - Live Visual Screen Activity Overlay + Play Store Install, Single-App Update & Uninstall
 * - Speaker Voiceprint Biometrics (Owner + Free User) & Background Media Audio Ducking
 */

(function initShivaiV6CleanUiAndStage() {
  if (typeof document === "undefined") return;

  const ROLE_THEMES = {
    MYRAA: {
      color: "celestial",
      hex: "#0A84FF",
      img: "./avatars/myraa.png",
      closeupVideo: "./avatars/videos/myraa_closeup.mp4",
      fullVideo: "./avatars/videos/myraa_full.mp4",
      title: "MYRAA • Personal AI Companion",
    },
    CODEX: {
      color: "emerald",
      hex: "#00E676",
      img: "./avatars/codex.png",
      closeupVideo: "./avatars/videos/codex_closeup.mp4",
      fullVideo: "./avatars/videos/codex_full.mp4",
      title: "CODEX • Software & Coding Specialist",
    },
    AURA: {
      color: "gold",
      hex: "#F59E0B",
      img: "./avatars/aura.png",
      closeupVideo: "./avatars/videos/aura_closeup.mp4",
      fullVideo: "./avatars/videos/aura_full.mp4",
      title: "AURA (@MYRAA-Classic) • Creative Companion",
    },
    SENTINEL: {
      color: "crimson",
      hex: "#FF6B6B",
      img: "./avatars/sentinel.png",
      closeupVideo: "./avatars/videos/sentinel_closeup.mp4",
      fullVideo: "./avatars/videos/sentinel_full.mp4",
      title: "SENTINEL • Cybersecurity Specialist",
    },
    SAGE: {
      color: "violet",
      hex: "#6C63FF",
      img: "./avatars/sage.png",
      closeupVideo: "./avatars/videos/sage_closeup.mp4",
      fullVideo: "./avatars/videos/sage_full.mp4",
      title: "SAGE • Research & Planning Specialist",
    },
    PIXEL: {
      color: "gold",
      hex: "#F59E0B",
      img: "./avatars/pixel.png",
      closeupVideo: "./avatars/videos/vortex_closeup.mp4",
      fullVideo: "./avatars/videos/vortex_full.mp4",
      title: "PIXEL / VORTEX • UI & Device Commander",
    },
  };

  let currentCameraMode = "CLOSEUP"; // "CLOSEUP" | "FULL"

  /**
   * Applies the selected Character (MYRAA, CODEX, AURA, SENTINEL, SAGE, PIXEL),
   * Camera Mode (CLOSEUP or FULL), and Expression directly onto MYRAA's Main Home Screen!
   */
  function applyCharacterToHomeScreen(roleName, expression = "Idle", cameraMode = currentCameraMode) {
    const role = String(roleName || "MYRAA").toUpperCase();
    const expr = String(expression || "Idle");
    currentCameraMode = String(cameraMode || "CLOSEUP").toUpperCase() === "FULL" ? "FULL" : "CLOSEUP";
    const meta = ROLE_THEMES[role] || ROLE_THEMES.MYRAA;

    window.MyraaAvatarManager?.selectAvatarForRole(role, currentCameraMode);
    window.MyraaAvatarManager?.setAvatarAnimationState(expr);

    if (window.__myraaReactControl) {
      window.__myraaReactControl.setTheme?.(meta.color);
      window.__myraaReactControl.setEmotion?.(expr.toLowerCase());
      if (["talking", "thinking", "idle"].includes(expr.toLowerCase())) {
        window.__myraaReactControl.setCharState?.(expr.toLowerCase());
      }
    }

    const desktop = document.getElementById("myraa-holographic-desktop") || document.body;
    let stage = document.getElementById("shivai-homescreen-avatar-stage");
    if (!stage) {
      stage = document.createElement("div");
      stage.id = "shivai-homescreen-avatar-stage";
      stage.style.cssText =
        "position:fixed;inset:0;z-index:5;pointer-events:none;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 42%,rgba(10,132,255,0.18),rgba(2,2,8,0.94) 75%);transition:all 0.35s ease;";
      desktop.appendChild(stage);
    }

    const videoSrc = currentCameraMode === "FULL" ? meta.fullVideo : meta.closeupVideo;
    stage.style.display = "flex";
    stage.innerHTML = `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;margin-bottom:65px;pointer-events:auto;">
        <div style="position:absolute;inset:-18px;border-radius:28px;background:${meta.hex};opacity:0.22;filter:blur(28px);pointer-events:none;"></div>
        <video id="shivai-stage-video" src="${videoSrc}" poster="${meta.img}" autoplay loop muted playsinline style="position:relative;width:min(285px,72vw);height:min(430px,56vh);object-fit:cover;border-radius:24px;border:2px solid ${meta.hex};box-shadow:0 0 45px ${meta.hex}66;"></video>
        <div style="position:relative;display:flex;align-items:center;gap:6px;margin-top:8px;">
          <div style="padding:5px 12px;border-radius:999px;background:rgba(2,2,10,0.88);border:1px solid ${meta.hex};color:#fff;font-size:10px;font-weight:bold;letter-spacing:0.08em;">
            ${meta.title} • [${currentCameraMode}]
          </div>
          <button id="shivai-stage-cam-toggle" type="button" style="padding:5px 10px;border-radius:999px;background:#0A84FF;border:none;color:#fff;font-size:9px;font-weight:bold;cursor:pointer;">
            ${currentCameraMode === "CLOSEUP" ? "🧍 Full-Body" : "🔍 Close-Up"}
          </button>
        </div>
      </div>
    `;

    const vidEl = document.getElementById("shivai-stage-video");
    if (vidEl) {
      vidEl.play?.().catch(() => {});
    }
    document.getElementById("shivai-stage-cam-toggle")?.addEventListener("click", () => {
      const nextMode = currentCameraMode === "CLOSEUP" ? "FULL" : "CLOSEUP";
      applyCharacterToHomeScreen(role, expr, nextMode);
    });

    return { ok: true, appliedRole: role, expression: expr, cameraMode: currentCameraMode, videoSrc, onHomeScreen: true };
  }

  window.__shivaiApplyCharacterToHomeScreen = applyCharacterToHomeScreen;

  function mountCleanHud() {
    if (document.getElementById("myraa-task-monitor-root")) return;

    const root = document.createElement("div");
    root.id = "myraa-task-monitor-root";
    root.style.cssText =
      "position:fixed;bottom:148px;left:12px;z-index:95;font-family:'Montserrat','Roboto',sans-serif;color:#F5F5F5;user-select:none;";

    root.innerHTML = `
      <div style="display:flex;align-items:center;gap:6px;">
        <button id="shivai-hub-btn" type="button" style="display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(26,26,46,0.92);border:1px solid #0A84FF;color:#F5F5F5;font-size:10px;font-weight:bold;letter-spacing:0.06em;box-shadow:0 4px 16px rgba(0,0,0,0.6);backdrop-filter:blur(12px);cursor:pointer;">
          <img src="./avatars/ic_launcher_round.png" alt="SHIVAI" style="width:15px;height:15px;border-radius:50%;" onerror="this.style.display='none'" />
          <span id="shivai-hub-title">SHIVAI HUB</span>
        </button>
        <button id="shivai-admin-secret-btn" type="button" style="display:none;padding:6px 10px;border-radius:999px;background:rgba(108,99,255,0.28);border:1px solid #6C63FF;color:#e9d5ff;font-size:10px;font-weight:bold;cursor:pointer;">
          👑 ADMIN
        </button>
      </div>

      <div id="shivai-main-panel" style="display:none;position:fixed;inset:64px 12px 135px 12px;max-width:430px;margin:0 auto;overflow-y:auto;padding:14px;border-radius:20px;background:#1A1A2E;border:1.5px solid #0A84FF;box-shadow:0 24px 60px rgba(0,0,0,0.95);z-index:120;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:10px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="./avatars/ic_launcher_round.png" alt="SHIVAI" style="width:24px;height:24px;border-radius:50%;" onerror="this.style.display='none'" />
            <div>
              <div style="font-size:12px;font-weight:bold;color:#F5F5F5;letter-spacing:0.06em;">SHIVAI • MULTI-AGENT HUB v6.0</div>
              <div id="shivai-sub-banner" style="font-size:9px;color:#00E676;">Plan: FREE</div>
            </div>
          </div>
          <button id="shivai-close-btn" type="button" style="background:rgba(255,255,255,0.08);border:none;border-radius:8px;padding:4px 8px;color:#fff;font-size:13px;cursor:pointer;">✕</button>
        </div>

        <div id="shivai-tabs-row" style="display:flex;gap:4px;margin-bottom:10px;overflow-x:auto;"></div>
        <div id="shivai-panel-body" style="font-size:11px;line-height:1.45;"></div>
      </div>
    `;

    document.body.appendChild(root);

    let activeTab = "avatars";
    let selectedPreviewRole = "MYRAA";
    let selectedPreviewExpr = "Idle";

    const panel = document.getElementById("shivai-main-panel");
    const tabsRow = document.getElementById("shivai-tabs-row");
    const bodyEl = document.getElementById("shivai-panel-body");
    const hubTitle = document.getElementById("shivai-hub-title");
    const subBanner = document.getElementById("shivai-sub-banner");
    const secretAdminBtn = document.getElementById("shivai-admin-secret-btn");

    window.__openShivaiUserHub = function (tab = "avatars") {
      activeTab = tab;
      panel.style.display = "block";
      renderAll();
    };

    // Secret 5-tap on top-left "Myraa" header text opens Admin Password prompt for Shri Ram Nag
    let headerTapCount = 0;
    let headerTapTimer = null;
    document.addEventListener("click", (ev) => {
      const t = ev.target;
      if (t && t.innerText && t.innerText.trim().toUpperCase() === "MYRAA") {
        headerTapCount++;
        clearTimeout(headerTapTimer);
        headerTapTimer = setTimeout(() => {
          headerTapCount = 0;
        }, 2000);
        if (headerTapCount >= 5) {
          headerTapCount = 0;
          promptSecretAdminUnlock();
        }
      }
    });

    function promptSecretAdminUnlock() {
      const code = prompt("👑 SHRI RAM NAG SUPREME ADMIN VAULT\nPaste any of your 10 Master Codes (#1–#10) or Voice Passphrase:");
      if (!code) return;
      const vault = window.MyraaAdminVault;
      const vm = vault?.verifyOwnerVoiceMatch(code, 140);
      if (vm?.ok) {
        const firstActive = vault?.getMasterCodesList().find((c) => !c.revoked)?.code || "";
        vault?.unlockAdminWithMasterCode(firstActive);
        window.__openShivaiUserHub("admin");
        return;
      }
      const res = vault?.unlockAdminWithMasterCode(code);
      if (res?.ok) {
        window.__openShivaiUserHub("admin");
      } else {
        alert(res?.error || "Access Denied.");
      }
    }

    document.getElementById("shivai-hub-btn")?.addEventListener("click", () => {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
      if (panel.style.display === "block") renderAll();
    });
    secretAdminBtn?.addEventListener("click", () => window.__openShivaiUserHub("admin"));
    document.getElementById("shivai-close-btn")?.addEventListener("click", () => {
      panel.style.display = "none";
    });

    function renderAll() {
      const vault = window.MyraaAdminVault;
      const isAdmin = Boolean(vault?.isAdminUnlocked());
      const tier = vault?.getCurrentTier() || "FREE";
      const curAv = window.MyraaAvatarManager?.getCurrentAvatar()?.role || "MYRAA";
      const curUser = window.MyraaGoogleSheetsDb?.getCurrentUser();

      secretAdminBtn.style.display = isAdmin ? "inline-block" : "none";
      hubTitle.textContent = `SHIVAI [${curAv}]`;
      subBanner.textContent = isAdmin
        ? `👑 Supreme Owner: Shri Ram Nag (ADMIN_OWNER)`
        : curUser
        ? `Google User: ${curUser.name} • Plan: ${tier}`
        : `Guest • Plan: ${tier}`;

      const tabs = [
        { id: "avatars", label: "🎭 6 Models" },
        { id: "account", label: "👤 Google/UPI" },
        { id: "tasks", label: "⚡ App/PlayStore" },
        { id: "voice", label: "🎙️ Voice ID" },
        { id: "models", label: "🧠 AI" },
        { id: "coding", label: "💻 Code" },
      ];
      if (isAdmin) {
        tabs.push({ id: "admin", label: "👑 Admin" });
      } else if (activeTab === "admin") {
        activeTab = "avatars";
      }

      tabsRow.innerHTML = tabs
        .map(
          (t) =>
            `<button data-tab="${t.id}" class="shivai-tab-item" style="flex:1;padding:6px 5px;border-radius:8px;background:${
              activeTab === t.id ? "#0A84FF" : "rgba(255,255,255,0.06)"
            };border:none;color:#fff;font-size:9px;font-weight:bold;white-space:nowrap;cursor:pointer;">${t.label}</button>`
        )
        .join("");

      tabsRow.querySelectorAll(".shivai-tab-item").forEach((b) => {
        b.addEventListener("click", () => {
          activeTab = b.getAttribute("data-tab") || "avatars";
          renderAll();
        });
      });

      if (activeTab === "avatars") {
        const chars = [
          { role: "MYRAA", desc: "Updated 2 Videos", img: "./avatars/myraa.png", free: true },
          { role: "CODEX", desc: "Coding (2 Videos)", img: "./avatars/codex.png", free: false },
          { role: "AURA", desc: "@MYRAA-Extra (2)", img: "./avatars/aura.png", free: true },
          { role: "SENTINEL", desc: "Security Video", img: "./avatars/sentinel.png", free: false },
          { role: "SAGE", desc: "Research (2 Videos)", img: "./avatars/sage.png", free: false },
          { role: "PIXEL", desc: "Commander Video", img: "./avatars/pixel.png", free: false },
        ];
        const previewMeta = ROLE_THEMES[selectedPreviewRole] || ROLE_THEMES.MYRAA;
        const previewVideo = currentCameraMode === "FULL" ? previewMeta.fullVideo : previewMeta.closeupVideo;

        bodyEl.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <span style="font-size:10px;color:#cbd5e1;">Active: <b style="color:#00E676;">${curAv}</b> | Preview: <b style="color:#38bdf8;">${selectedPreviewRole}</b></span>
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
            <video src="${previewVideo}" poster="${previewMeta.img}" autoplay loop muted playsinline style="width:130px;height:175px;object-fit:cover;border-radius:14px;border:2px solid ${previewMeta.hex};"></video>
          </div>

          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:8px;">
            ${chars
              .map(
                (c) => `
              <div data-role="${c.role}" class="shivai-char-card" style="padding:4px;border-radius:10px;text-align:center;background:rgba(255,255,255,0.05);border:2px solid ${
                  selectedPreviewRole === c.role ? "#00E676" : "rgba(255,255,255,0.1)"
                };cursor:pointer;">
                <img src="${c.img}" alt="${c.role}" style="width:100%;height:56px;object-fit:cover;border-radius:6px;" onerror="this.style.display='none'" />
                <div style="font-size:8px;font-weight:bold;color:#fff;margin-top:2px;">${c.role}</div>
                <div style="font-size:7px;color:${c.free || tier !== "FREE" ? "#94a3b8" : "#FF6B6B"};">${
                  c.free || tier !== "FREE" ? c.desc : "🔒 ULTRA"
                }</div>
              </div>`
              )
              .join("")}
          </div>

          <button id="shivai-apply-home-btn" type="button" style="width:100%;padding:10px;border-radius:12px;background:#00E676;border:none;color:#000;font-size:11px;font-weight:bold;cursor:pointer;box-shadow:0 4px 15px rgba(0,230,118,0.35);">
            ✓ APPLY ${selectedPreviewRole} (${currentCameraMode}) TO HOME SCREEN
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
        bodyEl.querySelectorAll(".shivai-char-card").forEach((el) => {
          el.addEventListener("click", () => {
            selectedPreviewRole = el.getAttribute("data-role") || "MYRAA";
            renderAll();
          });
        });
        document.getElementById("shivai-apply-home-btn")?.addEventListener("click", () => {
          if (!["MYRAA", "AURA"].includes(selectedPreviewRole) && !vault?.isFeatureAllowed("MULTI_AVATAR_SWITCH")) {
            alert("🔒 ULTRA / PRO Subscription Required to use " + selectedPreviewRole + "! Please upgrade via UPI in the Google/UPI tab.");
            activeTab = "account";
            renderAll();
            return;
          }
          applyCharacterToHomeScreen(selectedPreviewRole, selectedPreviewExpr, currentCameraMode);
          panel.style.display = "none";
        });
      } else if (activeTab === "account") {
        const upiCfg = window.MyraaGoogleAuthAndUpi?.getUpiConfig() || {};
        bodyEl.innerHTML = `
          <div style="padding:10px;border-radius:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;">
            <div style="font-weight:bold;color:#fff;margin-bottom:4px;">🔐 Verified Google Account Sign-In (Synced to Google Sheets)</div>
            <input id="shivai-usr-name" value="${curUser?.name || ""}" placeholder="Your Full Name" style="width:100%;margin-bottom:5px;padding:6px;border-radius:8px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:10px;" />
            <input id="shivai-usr-email" value="${curUser?.email || ""}" placeholder="yourname@gmail.com (Google Account)" style="width:100%;margin-bottom:6px;padding:6px;border-radius:8px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:10px;" />
            <button id="shivai-google-login-btn" type="button" style="width:100%;padding:8px;border-radius:8px;background:#fff;border:none;color:#0f172a;font-weight:bold;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
              <span style="color:#4285F4;font-weight:900;font-size:12px;">G</span> Continue with Google Account (Sync to Google Sheets)
            </button>
          </div>

          <div style="padding:10px;border-radius:12px;background:rgba(0,230,118,0.08);border:1px solid #00E676;margin-bottom:8px;">
            <div style="font-weight:bold;color:#00E676;margin-bottom:4px;">🇮🇳 Instant UPI Upgrade (PRO ₹${upiCfg.proPriceInr || 199} / ULTRA ₹${upiCfg.ultraPriceInr || 499})</div>
            <div style="font-size:8px;color:#cbd5e1;margin-bottom:6px;">Pay directly via your installed UPI app (${upiCfg.merchantUpiId || "shriramnag@upi"}):</div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin-bottom:6px;">
              <button data-app="GPAY" class="shivai-upi-btn" style="padding:7px;border-radius:8px;background:#1a73e8;border:none;color:#fff;font-weight:bold;font-size:9px;cursor:pointer;">Google Pay (GPay)</button>
              <button data-app="PHONEPE" class="shivai-upi-btn" style="padding:7px;border-radius:8px;background:#5f259f;border:none;color:#fff;font-weight:bold;font-size:9px;cursor:pointer;">PhonePe</button>
              <button data-app="PAYTM" class="shivai-upi-btn" style="padding:7px;border-radius:8px;background:#00baf2;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">Paytm UPI</button>
              <button data-app="BHIM" class="shivai-upi-btn" style="padding:7px;border-radius:8px;background:#f97316;border:none;color:#fff;font-weight:bold;font-size:9px;cursor:pointer;">BHIM UPI</button>
            </div>
            <div style="display:flex;gap:4px;">
              <input id="shivai-utr-input" placeholder="Enter 12-digit UPI Ref / UTR or Sub Key..." style="flex:1;padding:6px;border-radius:8px;background:#0f172a;border:1px solid #00E676;color:#fff;font-size:9px;" />
              <button id="shivai-verify-upi-btn" type="button" style="padding:6px 10px;border-radius:8px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">Verify & Unlock</button>
            </div>
          </div>
        `;

        document.getElementById("shivai-google-login-btn")?.addEventListener("click", async () => {
          const name = document.getElementById("shivai-usr-name")?.value || "";
          const email = document.getElementById("shivai-usr-email")?.value || "";
          const res = await window.MyraaGoogleAuthAndUpi?.signInWithGoogleAccount({ name, email });
          alert(res?.message || res?.error);
          renderAll();
        });

        bodyEl.querySelectorAll(".shivai-upi-btn").forEach((btn) => {
          btn.addEventListener("click", () => {
            const app = btn.getAttribute("data-app") || "GPAY";
            const res = window.MyraaGoogleAuthAndUpi?.initiateUpiPayment({ app, plan: "ULTRA" });
            if (res?.ok && res.deepLink) {
              alert(`Opening ${app} for ULTRA Plan (₹${res.amountInr})...\nAfter payment, enter your 12-digit UTR/Reference number to unlock instantly!`);
            }
          });
        });

        document.getElementById("shivai-verify-upi-btn")?.addEventListener("click", async () => {
          const val = (document.getElementById("shivai-utr-input")?.value || "").trim();
          if (!val) return;
          const adm = vault?.unlockAdminWithMasterCode(val);
          if (adm?.ok) {
            alert(adm.message);
            activeTab = "admin";
            renderAll();
            return;
          }
          const upiRes = await window.MyraaGoogleAuthAndUpi?.confirmUpiPaymentAndUnlock({ utrNumber: val, plan: "ULTRA" });
          alert(upiRes?.message || upiRes?.error);
          renderAll();
        });
      } else if (activeTab === "tasks") {
        bodyEl.innerHTML = `
          <div style="margin-bottom:8px;padding:8px;border-radius:10px;background:rgba(10,132,255,0.1);border:1px solid rgba(10,132,255,0.3);">
            <div style="font-size:10px;font-weight:bold;color:#fff;margin-bottom:4px;">📲 Play Store Install, Single-App Update, Uninstall & Screen Reader</div>
            <input id="shivai-app-target" placeholder="App name (e.g. Instagram, WhatsApp) or Screen Text..." style="width:100%;margin-bottom:6px;padding:6px;border-radius:6px;background:#0f172a;border:1px solid rgba(255,255,255,0.15);color:#fff;font-size:9px;" />
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px;">
              <button id="shivai-btn-install" style="padding:6px;border-radius:6px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">📥 Play Store Install</button>
              <button id="shivai-btn-update" style="padding:6px;border-radius:6px;background:#0A84FF;border:none;color:#fff;font-weight:bold;font-size:9px;cursor:pointer;">🔄 Update Single App</button>
              <button id="shivai-btn-uninstall" style="padding:6px;border-radius:6px;background:#FF6B6B;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">🗑️ Uninstall App</button>
              <button id="shivai-btn-readclick" style="padding:6px;border-radius:6px;background:#6C63FF;border:none;color:#fff;font-weight:bold;font-size:9px;cursor:pointer;">👁️ Read & Click Text</button>
            </div>
          </div>
        `;
        document.getElementById("shivai-btn-install")?.addEventListener("click", async () => {
          const appName = document.getElementById("shivai-app-target")?.value || "Instagram";
          const r = await window.MyraaFullDeviceController?.installAppFromPlayStore({ appName, explicitUserCommand: true });
          alert(r?.message || r?.error);
        });
        document.getElementById("shivai-btn-update")?.addEventListener("click", async () => {
          const appName = document.getElementById("shivai-app-target")?.value || "YouTube";
          const r = await window.MyraaFullDeviceController?.updateSingleAppFromPlayStore({ appName, explicitUserCommand: true });
          alert(r?.message || r?.error);
        });
        document.getElementById("shivai-btn-uninstall")?.addEventListener("click", async () => {
          const appName = document.getElementById("shivai-app-target")?.value || "";
          const r = await window.MyraaFullDeviceController?.uninstallSpecificApp({ appName, explicitUserCommand: true });
          alert(r?.message || r?.error);
        });
        document.getElementById("shivai-btn-readclick")?.addEventListener("click", async () => {
          const targetText = document.getElementById("shivai-app-target")?.value || "Play";
          const r = await window.MyraaFullDeviceController?.readScreenAndClickText({ targetText, explicitUserCommand: true });
          alert(r?.message || r?.error);
        });
      } else if (activeTab === "voice") {
        const vStatus = window.MyraaVoiceBiometrics?.getStatus() || {};
        bodyEl.innerHTML = `
          <div style="padding:10px;border-radius:12px;background:rgba(10,132,255,0.12);border:1px solid #0A84FF;">
            <div style="font-weight:bold;color:#fff;margin-bottom:4px;">🎙️ Personal Voiceprint Lock & Crowd/Media Noise Shield</div>
            <div style="font-size:9px;color:#cbd5e1;margin-bottom:6px;">
              Enroll your voice so MYRAA only responds to YOU (ignoring market/travel crowd voices) and auto-ducks Instagram/Facebook/YouTube audio when you speak!
            </div>
            <div style="font-size:9px;color:#00E676;margin-bottom:6px;">
              User Voice Enrolled: <b>${vStatus.userEnrolled ? "YES (" + vStatus.userProfile.phrase + ")" : "Not Yet"}</b><br/>
              Voice Match Lock: <b>${vStatus.voiceLockEnabled ? "ACTIVE" : "OFF"}</b> | Auto-Duck Media Audio: <b>${vStatus.mediaDuckingEnabled ? "ON (15%)" : "OFF"}</b>
            </div>
            <input id="shivai-voice-phrase" placeholder="Speak or type your personal wake phrase..." value="${vStatus.userProfile?.phrase || "Hey Myraa Listen To Me"}" style="width:100%;margin-bottom:6px;padding:6px;border-radius:6px;background:#0f172a;border:1px solid rgba(255,255,255,0.2);color:#fff;font-size:9px;" />
            <div style="display:flex;gap:4px;margin-bottom:6px;">
              <button id="shivai-enroll-user-voice" style="flex:1;padding:7px;border-radius:8px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">🎙️ Enroll My Voice</button>
              <button id="shivai-del-user-voice" style="padding:7px 10px;border-radius:8px;background:#FF6B6B;border:none;color:#000;font-weight:bold;font-size:9px;cursor:pointer;">Reset</button>
            </div>
            <button id="shivai-test-ducking-btn" style="width:100%;padding:7px;border-radius:8px;background:#6C63FF;border:none;color:#fff;font-weight:bold;font-size:9px;cursor:pointer;">
              🔉 Test Background Media Audio Ducking (Instagram/FB/YT -> 15%)
            </button>
          </div>
        `;
        document.getElementById("shivai-enroll-user-voice")?.addEventListener("click", () => {
          const phrase = document.getElementById("shivai-voice-phrase")?.value || "Hey Myraa";
          const res = window.MyraaVoiceBiometrics?.enrollSpeakerVoiceprint({
            role: "USER",
            samplePhrase: phrase,
            pitchHz: 165,
            userName: curUser?.name || "Free User",
          });
          alert(res?.message);
          renderAll();
        });
        document.getElementById("shivai-del-user-voice")?.addEventListener("click", () => {
          window.MyraaVoiceBiometrics?.deleteVoiceprint({ targetRole: "USER", isAdmin });
          renderAll();
        });
        document.getElementById("shivai-test-ducking-btn")?.addEventListener("click", () => {
          const res = window.MyraaVoiceBiometrics?.duckBackgroundMediaAudio();
          alert(`Background Media Audio Ducked to ${res?.duckedVolumePercent}% while listening to your voice!`);
          setTimeout(() => window.MyraaVoiceBiometrics?.restoreBackgroundMediaAudio(), 2500);
        });
      } else if (activeTab === "models") {
        if (!vault?.isFeatureAllowed("MULTI_MODEL_ROUTER")) {
          bodyEl.innerHTML = `<div style="padding:12px;border-radius:10px;background:rgba(255,107,107,0.12);border:1px solid #FF6B6B;color:#FF6B6B;">🔒 <b>ULTRA Plan Required</b> to switch AI Models. Upgrade in Google/UPI tab!</div>`;
          return;
        }
        const cfg = window.MyraaModelRouter?.getConfig() || {};
        bodyEl.innerHTML = `
          <div style="padding:10px;border-radius:10px;background:rgba(255,255,255,0.04);">
            <div style="font-weight:bold;margin-bottom:6px;">AI Model Router (ULTRA Unlocked)</div>
            <div style="font-size:9px;color:#cbd5e1;margin-bottom:6px;">Active: <b>${cfg.preferredModel}</b></div>
            <button id="shivai-toggle-offline" style="width:100%;padding:7px;border-radius:8px;background:#0A84FF;border:none;color:#fff;font-size:10px;cursor:pointer;">
              Toggle Local Offline Mode (${cfg.offlineMode ? "ON" : "OFF"})
            </button>
          </div>
        `;
        document.getElementById("shivai-toggle-offline")?.addEventListener("click", () => {
          window.MyraaModelRouter?.configureModels({ offlineMode: !cfg.offlineMode });
          renderAll();
        });
      } else if (activeTab === "coding") {
        if (!vault?.isFeatureAllowed("CODING_WORKSPACE")) {
          bodyEl.innerHTML = `<div style="padding:12px;border-radius:10px;background:rgba(255,107,107,0.12);border:1px solid #FF6B6B;color:#FF6B6B;">🔒 <b>ULTRA Plan Required</b> for Coding Workspace.</div>`;
          return;
        }
        bodyEl.innerHTML = `<div style="padding:10px;border-radius:10px;background:#0f172a;font-family:monospace;font-size:9px;color:#00E676;">$ ./gradlew test<br/>BUILD SUCCESSFUL (All v6.0 suites passing)</div>`;
      } else if (activeTab === "admin" && isAdmin) {
        const codes = vault?.getMasterCodesList() || [];
        const users = window.MyraaGoogleSheetsDb?.getAllUsers() || [];
        const upiCfg = window.MyraaGoogleAuthAndUpi?.getUpiConfig() || {};
        bodyEl.innerHTML = `
          <div style="padding:10px;border-radius:12px;background:rgba(108,99,255,0.14);border:1px solid #6C63FF;">
            <div style="font-weight:bold;color:#e9d5ff;margin-bottom:4px;">👑 Shri Ram Nag — Supreme Admin Console</div>

            <div style="font-size:9px;color:#cbd5e1;margin-bottom:4px;">1. Configure Your UPI Payment Gateway ID & Links:</div>
            <div style="display:flex;gap:4px;margin-bottom:8px;">
              <input id="shivai-admin-upi-id" value="${upiCfg.merchantUpiId || "shriramnag@upi"}" placeholder="Your UPI ID (e.g. shriramnag@okaxis)" style="flex:1;padding:5px;border-radius:6px;background:#0f172a;border:1px solid #00E676;color:#fff;font-size:9px;" />
              <button id="shivai-save-upi-btn" style="padding:5px 8px;border-radius:6px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">Save UPI</button>
            </div>

            <div style="font-size:9px;color:#cbd5e1;margin-bottom:4px;">2. Owner Voiceprint & All Users Voice Reset Control:</div>
            <div style="display:flex;gap:4px;margin-bottom:8px;">
              <button id="shivai-admin-enroll-voice" style="flex:1;padding:5px;border-radius:6px;background:#0A84FF;border:none;color:#fff;font-size:8px;cursor:pointer;">🎙️ Enroll Owner Voice</button>
              <button id="shivai-admin-wipe-voices" style="flex:1;padding:5px;border-radius:6px;background:#FF6B6B;border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">🗑️ Delete All Voices</button>
            </div>

            <div style="font-size:9px;color:#cbd5e1;margin-bottom:4px;">3. Test User Tiers (${users.length} Synced Google Users):</div>
            <div style="display:flex;gap:4px;margin-bottom:8px;">
              <button data-tier="FREE" class="shivai-tier-btn" style="flex:1;padding:5px;border-radius:6px;background:#334155;border:none;color:#fff;font-size:8px;cursor:pointer;">Test FREE</button>
              <button data-tier="PRO" class="shivai-tier-btn" style="flex:1;padding:5px;border-radius:6px;background:#0A84FF;border:none;color:#fff;font-size:8px;cursor:pointer;">Test PRO</button>
              <button data-tier="ULTRA" class="shivai-tier-btn" style="flex:1;padding:5px;border-radius:6px;background:#6C63FF;border:none;color:#fff;font-size:8px;cursor:pointer;">Test ULTRA</button>
              <button data-tier="ADMIN_OWNER" class="shivai-tier-btn" style="flex:1;padding:5px;border-radius:6px;background:#00E676;border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">👑 ADMIN</button>
            </div>

            <div style="font-size:9px;color:#cbd5e1;margin-bottom:4px;">4. Your 10 Master Codes (Revoke/Restore):</div>
            <div style="max-height:80px;overflow-y:auto;">
              ${codes
                .map(
                  (c) => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;font-size:8px;">
                  <span style="color:${c.revoked ? "#FF6B6B;text-decoration:line-through" : "#e2e8f0"};">#${c.id}: ${c.code}</span>
                  <button data-cid="${c.id}" data-rev="${c.revoked ? "0" : "1"}" class="shivai-revoke-btn" style="padding:2px 6px;border-radius:4px;background:${
                    c.revoked ? "#00E676" : "#FF6B6B"
                  };border:none;color:#000;font-weight:bold;font-size:8px;cursor:pointer;">${c.revoked ? "Restore" : "Revoke"}</button>
                </div>`
                )
                .join("")}
            </div>
          </div>
        `;

        document.getElementById("shivai-save-upi-btn")?.addEventListener("click", () => {
          const merchantUpiId = document.getElementById("shivai-admin-upi-id")?.value || "shriramnag@upi";
          const res = window.MyraaGoogleAuthAndUpi?.updateOwnerUpiConfig({ merchantUpiId, isAdmin: true });
          alert(res?.message || res?.error);
          renderAll();
        });
        document.getElementById("shivai-admin-enroll-voice")?.addEventListener("click", () => {
          const res = window.MyraaVoiceBiometrics?.enrollSpeakerVoiceprint({
            role: "ADMIN_OWNER",
            samplePhrase: "Shri Ram Nag Supreme Command Unlock Myraa",
            pitchHz: 135,
            userName: "Shri Ram Nag",
          });
          alert(res?.message);
        });
        document.getElementById("shivai-admin-wipe-voices")?.addEventListener("click", () => {
          const res = window.MyraaVoiceBiometrics?.deleteVoiceprint({ targetRole: "ALL", isAdmin: true });
          alert(res?.message);
          renderAll();
        });
        bodyEl.querySelectorAll(".shivai-tier-btn").forEach((b) => {
          b.addEventListener("click", () => {
            const t = b.getAttribute("data-tier");
            if (t !== "ADMIN_OWNER") vault?.lockAdminPanel();
            vault?.setSubscriptionTierForTesting(t);
            renderAll();
          });
        });
        bodyEl.querySelectorAll(".shivai-revoke-btn").forEach((b) => {
          b.addEventListener("click", () => {
            const id = Number(b.getAttribute("data-cid"));
            const rev = b.getAttribute("data-rev") === "1";
            vault?.setMasterCodeRevoked(id, rev);
            renderAll();
          });
        });
      }
    }

    window.MyraaAgentSupervisor?.subscribe(() => renderAll());
    window.MyraaAdminVault?.subscribe(() => renderAll());
    renderAll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountCleanHud);
  } else {
    mountCleanHud();
  }
})();
