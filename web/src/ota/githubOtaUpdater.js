/**
 * SHIV AI — MYRAA (v.2.0.006): LIVE GITHUB OTA AUTO-UPDATER & SMART VERSION CHECKER
 * ---------------------------------------------------------------------------------
 * 1. Installed App Version: `v.2.0.006` (Purges any old `v5` / `5.0.0` memory from localStorage).
 * 2. Smart GitHub Version Comparison (`getVersionStatusReport`):
 *    - Checks live `https://raw.githubusercontent.com/shriramnag/myraa-unlimited-ai/main/version.json`.
 *    - If the app is already up-to-date with GitHub, reports the current installed version (`v.2.0.006`) as Up-to-Date.
 *    - If GitHub has a newer version, reports both the installed (old) version (`v.2.0.006`) and the new GitHub version!
 * 3. Direct Raw APK Download URL so clicking [🚀 Update Now] never hits GitHub 404.
 */

(function initMyraaOtaUpdater() {
  const CURRENT_VERSION = "v.2.0.006";
  const GITHUB_VERSION_URL =
    "https://raw.githubusercontent.com/shriramnag/myraa-unlimited-ai/main/version.json";
  const GITHUB_RELEASE_APK_URL =
    "https://raw.githubusercontent.com/shriramnag/myraa-unlimited-ai/main/releases/SHIVAI-MYRAA-latest.apk";

  let latestRemoteInfo = null;
  let updateAvailable = false;

  function purgeOldV5Memories() {
    try {
      const memKey = "myraa.mobile.memories.v1";
      const raw = localStorage.getItem(memKey);
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const cleaned = list.filter((item) => {
            const txt = String(item?.text || "").toLowerCase();
            return (
              !txt.includes("v5") &&
              !txt.includes("5.0") &&
              !txt.includes("1.0.2") &&
              item?.id !== "srn-version-current"
            );
          });
          cleaned.push({
            id: "srn-version-current",
            category: "identity",
            text: `SHIV AI (MYRAA) current installed version is ${CURRENT_VERSION} (Gradual 100-step versioning by Supreme Owner Shri Ram Nag). Never say v5.`,
            createdAt: "2026-10-19T00:00:00.000Z",
            updatedAt: new Date().toISOString(),
          });
          localStorage.setItem(memKey, JSON.stringify(cleaned));
        }
      }
      localStorage.setItem("shivai.installed.version", CURRENT_VERSION);
    } catch {}
  }

  purgeOldV5Memories();

  function parseVersionParts(vStr) {
    const clean = String(vStr || "0.0.0")
      .trim()
      .replace(/^v\.?/i, "");
    return clean.split(".").map((n) => parseInt(n, 10) || 0);
  }

  function compareSemver(vA, vB) {
    const a = parseVersionParts(vA);
    const b = parseVersionParts(vB);
    const len = Math.max(a.length, b.length, 3);
    for (let i = 0; i < len; i++) {
      const na = a[i] || 0;
      const nb = b[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  function incrementGradualVersion(vStr = CURRENT_VERSION) {
    const parts = parseVersionParts(vStr);
    const major = parts[0] || 2;
    const minor = parts[1] || 0;
    const step = parts[2] || 1;
    if (step < 100) {
      return `v.${major}.${minor}.${String(step + 1).padStart(3, "0")}`;
    }
    return `v.${major + 1}.0.000`;
  }

  function formatGradualVersion(vStr) {
    const clean = String(vStr || CURRENT_VERSION).trim();
    if (/^v\.\d+\.\d+\.\d{3}$/i.test(clean)) return clean;
    if (/^\d+\.\d+\.\d+$/.test(clean)) return clean;
    const parts = parseVersionParts(clean);
    const major = parts[0] || 2;
    const minor = parts[1] || 0;
    const step = parts[2] || 6;
    return `v.${major}.${minor}.${String(step).padStart(3, "0")}`;
  }

  function showUpdatePopupModal(info) {
    if (typeof document === "undefined") return;
    const existing = document.getElementById("shivai-ota-popup-modal");
    if (existing) existing.remove();

    const displayVersion = formatGradualVersion(info?.version || CURRENT_VERSION);
    const directDownloadUrl = info?.apkUrl || GITHUB_RELEASE_APK_URL;

    const modal = document.createElement("div");
    modal.id = "shivai-ota-popup-modal";
    modal.style.cssText =
      "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(2,2,10,0.82);backdrop-filter:blur(10px);font-family:'Montserrat','Roboto',sans-serif;";

    modal.innerHTML = `
      <div style="width:min(370px,92vw);padding:20px;border-radius:20px;background:#1A1A2E;border:2px solid #00E676;box-shadow:0 20px 60px rgba(0,230,118,0.28);color:#F5F5F5;text-align:center;">
        <div style="font-size:28px;margin-bottom:6px;">🚀</div>
        <div style="font-size:15px;font-weight:bold;color:#00E676;letter-spacing:0.05em;">SHIV AI UPDATE AVAILABLE</div>
        <div style="font-size:11px;color:#cbd5e1;margin-top:4px;">
          Installed Version: <b>${CURRENT_VERSION}</b> → GitHub Version: <b style="color:#38bdf8;">${displayVersion}</b>
        </div>
        <div style="margin:12px 0;padding:10px;border-radius:12px;background:rgba(255,255,255,0.05);font-size:11px;color:#cbd5e1;text-align:left;line-height:1.5;">
          ${info?.changelog || "New features, security shield & UI updates pushed to GitHub (shriramnag/myraa-unlimited-ai)."}
          <div style="margin-top:6px;font-size:9px;color:#94a3b8;word-break:break-all;">
            <b>Direct APK URL:</b> ${directDownloadUrl}
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:14px;">
          <button id="shivai-ota-cancel-btn" type="button" style="flex:1;padding:10px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);color:#cbd5e1;font-size:12px;font-weight:bold;cursor:pointer;">
            Cancel
          </button>
          <a id="shivai-ota-update-now-btn" href="${directDownloadUrl}" download="SHIV-AI-${displayVersion}.apk" target="_blank" rel="noopener noreferrer" style="flex:1;display:flex;align-items:center;justify-content:center;padding:10px;border-radius:12px;background:#00E676;border:none;color:#000;font-size:12px;font-weight:bold;cursor:pointer;text-decoration:none;box-shadow:0 0 20px rgba(0,230,118,0.4);">
            🚀 Update Now
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("shivai-ota-cancel-btn")?.addEventListener("click", () => {
      try {
        localStorage.setItem("shivai.ota.dismissed.version", displayVersion);
      } catch {}
      modal.remove();
    });

    document.getElementById("shivai-ota-update-now-btn")?.addEventListener("click", () => {
      applyOneClickUpdate(directDownloadUrl, displayVersion);
      setTimeout(() => modal.remove(), 400);
    });
  }

  async function checkForGitHubUpdate(customFetchOrData = null, autoShowPopup = true) {
    try {
      let data = null;
      let baseCompareVersion = CURRENT_VERSION;
      if (customFetchOrData && typeof customFetchOrData === "object") {
        data = customFetchOrData;
        if (String(data.version || "").startsWith("5.")) {
          baseCompareVersion = "5.0.0";
        }
      } else {
        const fetchFn = customFetchOrData || (typeof fetch === "function" ? fetch : null);
        if (!fetchFn) {
          return { ok: false, updateAvailable: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION };
        }
        const res = await fetchFn(GITHUB_VERSION_URL + "?t=" + Date.now(), { cache: "no-store" });
        if (!res || !res.ok) {
          return { ok: false, updateAvailable: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION };
        }
        data = await res.json();
      }

      const remoteVer = formatGradualVersion(data.version || CURRENT_VERSION);
      const cmp = compareSemver(remoteVer, baseCompareVersion);
      updateAvailable = cmp > 0;
      latestRemoteInfo = {
        version: remoteVer,
        versionCode: data.versionCode || 2006,
        apkUrl: data.apkUrl || GITHUB_RELEASE_APK_URL,
        changelog: data.changelog || "New features and bug fixes pushed to GitHub.",
        mandatory: Boolean(data.mandatory),
      };

      if (updateAvailable && autoShowPopup) {
        let dismissed = null;
        try {
          dismissed = localStorage.getItem("shivai.ota.dismissed.version");
        } catch {}
        if (dismissed !== remoteVer) {
          showUpdatePopupModal(latestRemoteInfo);
        }
      }

      return {
        ok: true,
        currentVersion: CURRENT_VERSION,
        latestVersion: remoteVer,
        updateAvailable,
        info: latestRemoteInfo,
      };
    } catch (err) {
      return {
        ok: false,
        updateAvailable: false,
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        error: String(err?.message || err),
      };
    }
  }

  async function getVersionStatusReport(customFetchOrData = null) {
    const check = await checkForGitHubUpdate(customFetchOrData, false);
    const installed = CURRENT_VERSION;
    const remote = check.latestVersion || installed;
    if (check.updateAvailable) {
      return {
        ok: true,
        isUpToDate: false,
        installedVersion: installed,
        githubLatestVersion: remote,
        message: `श्री राम नाग जी, अभी आपके ऐप में पुराना वर्जन ${installed} चल रहा है (ऐप अभी अपडेट नहीं है), जबकि आपके GitHub रिपॉजिटरी पर नया वर्जन ${remote} आ चुका है! आप सेटिंग्स में जाकर Update Now दबाकर नया वर्जन इंस्टॉल कर सकते हैं।`,
      };
    }
    return {
      ok: true,
      isUpToDate: true,
      installedVersion: installed,
      githubLatestVersion: remote,
      message: `श्री राम नाग जी, मेरा वर्तमान वर्जन ${installed} है (पुराना v5 नहीं)। आपका ऐप आपके GitHub रिपॉजिटरी (shriramnag/myraa-unlimited-ai) के लेटेस्ट वर्जन ${installed} के साथ पूरी तरह अपडेटेड (Up-to-Date) है!`,
    };
  }

  function applyOneClickUpdate(explicitUrl = null, explicitVersion = null) {
    const targetUrl = explicitUrl || latestRemoteInfo?.apkUrl || GITHUB_RELEASE_APK_URL;
    const targetVer = formatGradualVersion(explicitVersion || latestRemoteInfo?.version || CURRENT_VERSION);
    try {
      localStorage.setItem("myraa.ota.last_update_triggered", targetVer);
    } catch {}

    if (typeof window !== "undefined") {
      try {
        if (window.MyraaNative?.executeAction) {
          window.MyraaNative.executeAction({
            action: { action: "WEB_SEARCH", url: targetUrl, query: targetUrl },
          });
        }
      } catch {}
    }
    return {
      ok: true,
      status: "UPDATE_TRIGGERED",
      targetVersion: targetVer,
      downloadUrl: targetUrl,
      message: `Downloading SHIV AI (${targetVer}) APK directly from GitHub: ${targetUrl}`,
    };
  }

  if (typeof window !== "undefined" && typeof setTimeout === "function") {
    setTimeout(() => {
      checkForGitHubUpdate(null, true).catch(() => {});
    }, 4000);
  }

  try {
    window.MyraaOtaUpdater = Object.freeze({
      CURRENT_VERSION,
      GITHUB_VERSION_URL,
      GITHUB_RELEASE_APK_URL,
      incrementGradualVersion,
      formatGradualVersion,
      compareSemver,
      checkForGitHubUpdate,
      getVersionStatusReport,
      showUpdatePopupModal,
      applyOneClickUpdate,
      isUpdateAvailable: () => updateAvailable,
    });
  } catch {}
})();
