/**
 * SHIVAI — MYRAA v5.0: USER LOGIN SYSTEM & GOOGLE SHEETS DATABASE INTEGRATION
 * ---------------------------------------------------------------------------
 * 1. Free / Pro / Ultra User Login & Registration (Name, Email, Phone/Plan)
 * 2. Automatic Google Sheets Database Sync (via Google Apps Script Web App Webhook)
 *    + Local Persistent User Table + 1-Click CSV Export for Google Sheets
 * 3. Built-in Google Apps Script Template for Shri Ram Nag's Google Sheet
 */

(function initMyraaGoogleSheetsUserDb() {
  const CURRENT_USER_KEY = "shivai.current_user.v5";
  const USERS_DB_KEY = "shivai.users_table.v5";
  const SHEETS_WEBHOOK_KEY = "shivai.google_sheets_webhook.v5";

  const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Paste this in Google Sheets -> Extensions -> Apps Script -> Deploy as Web App (Anyone)
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Timestamp", "UserID", "Name", "Email", "Tier", "Device", "Status"]);
  }
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([new Date(), data.userId, data.name, data.email, data.tier, data.device, data.status]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}`;

  function getWebhookUrl() {
    try {
      return localStorage.getItem(SHEETS_WEBHOOK_KEY) || "";
    } catch {
      return "";
    }
  }

  function setWebhookUrl(url) {
    try {
      if (!url) localStorage.removeItem(SHEETS_WEBHOOK_KEY);
      else localStorage.setItem(SHEETS_WEBHOOK_KEY, String(url).trim());
      return { ok: true, webhookUrl: getWebhookUrl() };
    } catch {
      return { ok: false };
    }
  }

  function getAllUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_DB_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveAllUsers(users) {
    try {
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    } catch {}
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function syncUserToGoogleSheets(userRecord) {
    const webhook = getWebhookUrl();
    if (!webhook || typeof fetch !== "function") {
      return { syncedToCloud: false, storedLocally: true };
    }
    try {
      await fetch(webhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userRecord),
      });
      return { syncedToCloud: true, storedLocally: true };
    } catch {
      return { syncedToCloud: false, storedLocally: true };
    }
  }

  async function registerOrLoginUser({ name, email, tier = "FREE" }) {
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanName || !cleanEmail || !cleanEmail.includes("@")) {
      return { ok: false, error: "Kripya apna sahi Naam aur Email ID darj karein." };
    }

    const users = getAllUsers();
    let existing = users.find((u) => u.email === cleanEmail);
    const now = new Date().toISOString();

    if (existing) {
      existing.name = cleanName;
      existing.lastLoginAt = now;
    } else {
      existing = {
        userId: "usr-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
        name: cleanName,
        email: cleanEmail,
        tier: tier || "FREE",
        device: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 60) : "Android",
        status: "ACTIVE",
        createdAt: now,
        lastLoginAt: now,
      };
      users.push(existing);
    }

    saveAllUsers(users);
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(existing));
      if (!window.MyraaAdminVault?.isAdminUnlocked()) {
        localStorage.setItem("shivai.subscription.tier.v4", existing.tier);
      }
    } catch {}

    const syncRes = await syncUserToGoogleSheets(existing);
    return {
      ok: true,
      user: existing,
      syncedToGoogleSheets: syncRes.syncedToCloud,
      message: `Welcome ${existing.name}! Aapka account (${existing.tier} Plan) activate ho gaya hai.`,
    };
  }

  function updateUserTierByAdmin(email, newTier) {
    if (!window.MyraaAdminVault?.isAdminUnlocked()) {
      return { ok: false, error: "Only Supreme Admin Shri Ram Nag can change user subscription tiers." };
    }
    const users = getAllUsers();
    const target = users.find((u) => u.email === String(email || "").trim().toLowerCase());
    if (!target) return { ok: false, error: "User email not found in database." };

    target.tier = newTier;
    saveAllUsers(users);

    const cur = getCurrentUser();
    if (cur && cur.email === target.email) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(target));
    }
    syncUserToGoogleSheets(target);
    return { ok: true, user: target };
  }

  function exportUsersToCsv() {
    const users = getAllUsers();
    const header = "UserID,Name,Email,Tier,Status,CreatedAt,LastLoginAt";
    const rows = users.map(
      (u) =>
        `"${u.userId}","${(u.name || "").replace(/"/g, '""')}","${u.email}","${u.tier}","${u.status}","${u.createdAt}","${u.lastLoginAt}"`
    );
    return [header, ...rows].join("\n");
  }

  window.MyraaGoogleSheetsDb = Object.freeze({
    GOOGLE_APPS_SCRIPT_TEMPLATE,
    getWebhookUrl,
    setWebhookUrl,
    getAllUsers,
    getCurrentUser,
    registerOrLoginUser,
    updateUserTierByAdmin,
    exportUsersToCsv,
  });
})();
