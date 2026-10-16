/**
 * SHIVAI — MYRAA v5.0: LIVE GITHUB OTA AUTO-UPDATER WITH POP-UP MODAL ([UPDATE NOW] / [CANCEL])
 * ---------------------------------------------------------------------------------------------
 * Automatically checks https://raw.githubusercontent.com/shriramnag/myraa-unlimited-ai/main/version.json
 * Displays an interactive Pop-Up Window with [Update Now] and [Cancel] buttons when a new version is pushed!
 */

(function initMyraaOtaUpdater() {
  const CURRENT_VERSION = "5.0.0";
  const GITHUB_VERSION_URL =
    "https://raw.githubusercontent.com/shriramnag/myraa-unlimited-ai/main/version.json";
  const GITHUB_RELEASE_APK_URL =
    "https://github.com/shriramnag/myraa-unlimited-ai/raw/main/releases/SHIVAI-MYRAA-latest.apk";

  let latestRemoteInfo = null;
  let updateAvailable = false;

  function compareSemver(vA, vB) {
    const a = String(vA || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
    const b = String(vB || "0.0.0").split(".").map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) {
      if ((b[i] || 0) > (a[i] || 0)) return 1;
      if ((b[i] || 0) < (a[i] || 0)) return -1;
    }
    return 0;
  }

  function showUpdatePopupModal(info) {
    if (typeof document === "undefined") return;
    let existing = document.getElementById("shivai-ota-popup-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "shivai-ota-popup-modal";
    modal.style.cssText =
      "position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(2,2,8,0.82);backdrop-filter:blur(12px);padding:16px;font-family:sans-serif;";

    modal.innerHTML = `
      <div style="width:100%;max-width:360px;padding:20px;border-radius:20px;background:#1A1A2E;border:1.5px solid #0A84FF;box-shadow:0 24px 60px rgba(0,0,0,0.9);color:#F5F5F5;text-align:center;">
        <div style="width:48px;height:48px;margin:0 auto 10px;border-radius:50%;background:rgba(0,230,118,0.15);border:1px solid #00E676;display:flex;align-items:center;justify-content:center;font-size:22px;">
          🚀
        </div>
        <div style="font-size:15px;font-weight:bold;color:#fff;">New Update Available! (v${info.version})</div>
        <div style="font-size:11px;color:#00E676;margin-top:4px;">Published by Nirman Karta: Shri Ram Nag</div>
        <div style="margin:12px 0;padding:10px;border-radius:12px;background:rgba(255,255,255,0.05);font-size:11px;color:#cbd5e1;text-align:left;max-height:110px;overflow-y:auto;">
          ${info.changelog || "New features, performance improvements, and security updates."}
        </div>
        <div style="display:flex;gap:8px;margin-top:14px;">
          <button id="shivai-ota-cancel-btn" type="button" style="flex:1;padding:10px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#cbd5e1;font-size:11px;font-weight:bold;cursor:pointer;">
            ✕ Cancel
          </button>
          <button id="shivai-ota-confirm-btn" type="button" style="flex:1;padding:10px;border-radius:12px;background:#00E676;border:none;color:#000;font-size:11px;font-weight:bold;cursor:pointer;">
            🚀 Update Now
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("shivai-ota-cancel-btn")?.addEventListener("click", () => {
      modal.remove();
    });
    document.getElementById("shivai-ota-confirm-btn")?.addEventListener("click", async () => {
      modal.remove();
      await applyOneClickUpdate();
    });
  }

  async function checkForGitHubUpdate(simulatedRemoteJson = null, autoShowPopup = true) {
    try {
      let data = simulatedRemoteJson;
      if (!data && typeof fetch === "function") {
        const res = await fetch(`${GITHUB_VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (res.ok) {
          data = await res.json();
        }
      }
      if (!data || !data.version) {
        return { ok: false, updateAvailable: false, currentVersion: CURRENT_VERSION };
      }

      latestRemoteInfo = data;
      updateAvailable = compareSemver(CURRENT_VERSION, data.version) > 0;
      if (updateAvailable && autoShowPopup) {
        showUpdatePopupModal(data);
      }
      return {
        ok: true,
        currentVersion: CURRENT_VERSION,
        latestVersion: data.version,
        updateAvailable,
        changelog: data.changelog || "New features and improvements from Shri Ram Nag.",
        apkDownloadUrl: data.apkUrl || GITHUB_RELEASE_APK_URL,
      };
    } catch (err) {
      return { ok: false, updateAvailable: false, currentVersion: CURRENT_VERSION, error: String(err) };
    }
  }

  async function applyOneClickUpdate() {
    if (!latestRemoteInfo) {
      await checkForGitHubUpdate(null, false);
    }
    const targetUrl = latestRemoteInfo?.apkUrl || GITHUB_RELEASE_APK_URL;
    try {
      localStorage.setItem("shivai.ota.last_updated_version", latestRemoteInfo?.version || CURRENT_VERSION);
    } catch {}
    if (typeof window !== "undefined" && typeof window.open === "function") {
      try {
        window.open(targetUrl, "_blank");
      } catch {}
    }
    return {
      ok: true,
      status: "UPDATE_TRIGGERED",
      targetVersion: latestRemoteInfo?.version || CURRENT_VERSION,
      downloadUrl: targetUrl,
      message: `Updating SHIVAI MYRAA to v${latestRemoteInfo?.version || CURRENT_VERSION} from GitHub...`,
    };
  }

  // Auto-check on boot after 4 seconds
  if (typeof document !== "undefined" && typeof setTimeout === "function") {
    setTimeout(() => {
      checkForGitHubUpdate(null, true).catch(() => {});
    }, 4000);
  }

  window.MyraaOtaUpdater = Object.freeze({
    CURRENT_VERSION,
    GITHUB_VERSION_URL,
    compareSemver,
    checkForGitHubUpdate,
    showUpdatePopupModal,
    applyOneClickUpdate,
    isUpdateAvailable: () => updateAvailable,
  });
})();
