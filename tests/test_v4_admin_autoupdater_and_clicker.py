import unittest
import subprocess
import json
import os

REPO_DIR = "/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo"
SEC_JS = os.path.join(REPO_DIR, "web/src/security/securityPolicyEngine.js")
VAULT_JS = os.path.join(REPO_DIR, "web/src/security/adminVaultAndSubscription.js")
SUP_JS = os.path.join(REPO_DIR, "web/src/agents/agentSupervisor.js")
VOICE_JS = os.path.join(REPO_DIR, "web/src/voice/voiceInteractionManager.js")
AUTO_JS = os.path.join(REPO_DIR, "web/src/automation/deviceAutomationManager.js")
CLICK_JS = os.path.join(REPO_DIR, "web/src/automation/screenVisionAutoClicker.js")
OTA_JS = os.path.join(REPO_DIR, "web/src/ota/githubOtaUpdater.js")


class TestV4AdminAutoClickerAndOta(unittest.TestCase):

    def run_node_script(self, js_code: str) -> dict:
        harness = f"""
        const storage = new Map();
        global.window = global;
        global.localStorage = {{
          getItem: (k) => storage.has(k) ? storage.get(k) : null,
          setItem: (k, v) => storage.set(k, String(v)),
          removeItem: (k) => storage.delete(k)
        }};
        global.speechSynthesis = {{ cancel: () => {{}} }};
        (async () => {{
          await import({json.dumps(SEC_JS)});
          await import({json.dumps(VAULT_JS)});
          await import({json.dumps(SUP_JS)});
          await import({json.dumps(VOICE_JS)});
          await import({json.dumps(AUTO_JS)});
          await import({json.dumps(CLICK_JS)});
          await import({json.dumps(OTA_JS)});
          {js_code}
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node execution failed: {res.stderr}")
        return json.loads(res.stdout.strip())

    def test_01_ten_master_codes_and_revocation_on_leak(self):
        """Verify all 10 Master Admin Codes work and revoking leaked Code #1 blocks it while Code #2 still works."""
        out = self.run_node_script("""
          const v = window.MyraaAdminVault;
          const codes = v.getMasterCodesList();
          const u1 = v.unlockAdminWithMasterCode("SRN-SHIVAI-01-9942-OMEGA");
          // Revoke Code #1 (simulating a leaked password)
          const rev1 = v.setMasterCodeRevoked(1, true);
          v.lockAdminPanel();
          // Try logging in with leaked/revoked Code #1 -> must fail!
          const failRevoked = v.unlockAdminWithMasterCode("SRN-SHIVAI-01-9942-OMEGA");
          // Log in with backup Code #2 -> must succeed!
          const u2 = v.unlockAdminWithMasterCode("SRN-SHIVAI-02-7381-ALPHA");
          console.log(JSON.stringify({ totalCodes: codes.length, u1, rev1, failRevoked, u2 }));
        """)
        self.assertEqual(out["totalCodes"], 10)
        self.assertTrue(out["u1"]["ok"])
        self.assertTrue(out["rev1"]["ok"])
        self.assertFalse(out["failRevoked"]["ok"])
        self.assertEqual(out["failRevoked"]["status"], "CODE_REVOKED")
        self.assertTrue(out["u2"]["ok"])
        self.assertEqual(out["u2"]["usedKeyId"], 2)

    def test_02_subscription_tier_gate_free_vs_pro_vs_admin(self):
        """Free users cannot access Pro/Ultra tools; Supreme Admin Shri Ram Nag can access everything."""
        out = self.run_node_script("""
          const v = window.MyraaAdminVault;
          const freeChat = v.isFeatureAllowed("BASIC_CHAT");
          const freeCoding = v.isFeatureAllowed("CODING_WORKSPACE");
          const freeAvatars = v.isFeatureAllowed("MULTI_AVATAR_SWITCH");
          v.unlockAdminWithMasterCode("SRN-SHIVAI-03-5519-SIGMA");
          const adminCoding = v.isFeatureAllowed("CODING_WORKSPACE");
          const adminAvatars = v.isFeatureAllowed("MULTI_AVATAR_SWITCH");
          console.log(JSON.stringify({ freeChat, freeCoding, freeAvatars, adminCoding, adminAvatars }));
        """)
        self.assertTrue(out["freeChat"])
        self.assertFalse(out["freeCoding"])
        self.assertFalse(out["freeAvatars"])
        self.assertTrue(out["adminCoding"])
        self.assertTrue(out["adminAvatars"])

    def test_03_anti_clone_and_voiceprint_verification(self):
        """Anti-Clone shield blocks unauthorized package clones; Owner Voice Match verifies Shri Ram Nag."""
        out = self.run_node_script("""
          const v = window.MyraaAdminVault;
          const badClone = v.verifyCloneIntegrity({ packageName: "com.hacker.cloned.app", creatorSign: "Hacker" });
          const blockedFeature = v.isFeatureAllowed("BASIC_CHAT");
          const badVoice = v.verifyOwnerVoiceMatch("Hello open admin", 140);
          const goodVoice = v.verifyOwnerVoiceMatch("Main Shri Ram Nag hoon, Admin Panel kholo", 142);
          console.log(JSON.stringify({ badClone, blockedFeature, badVoice, goodVoice }));
        """)
        self.assertFalse(out["badClone"]["intact"])
        self.assertTrue(out["badClone"]["locked"])
        self.assertFalse(out["blockedFeature"])
        self.assertFalse(out["badVoice"]["ok"])
        self.assertTrue(out["goodVoice"]["ok"])

    def test_04_screen_auto_clicker_youtube_autoplay_and_foreground_lock(self):
        """ScreenVisionAutoClicker auto-plays YouTube, clicks DOM buttons, minimizes app, and blocks uninvited background actions."""
        out = self.run_node_script("""
          const sc = window.MyraaScreenVisionAutoClicker;
          // 1. Block uninvited background action
          const bgBlocked = await sc.autoPlayYouTube({ query: "Arijit Singh", explicitUserCommand: true, isScreenVisible: false });
          const uninvitedBlocked = await sc.autoPlayYouTube({ query: "Arijit Singh", explicitUserCommand: false, isScreenVisible: true });
          // 2. Authorized foreground YouTube Auto-Play
          const ytPlay = await sc.autoPlayYouTube({ query: "Hanuman Chalisa", videoId: "AETFvQonfV8", explicitUserCommand: true, isScreenVisible: true });
          // 3. App Minimize command
          const minRes = await sc.minimizeOrCloseApp({ mode: "MINIMIZE", explicitUserCommand: true });
          console.log(JSON.stringify({ bgBlocked, uninvitedBlocked, ytPlay, minRes }));
        """)
        self.assertFalse(out["bgBlocked"]["ok"])
        self.assertEqual(out["bgBlocked"]["status"], "BLOCKED_BACKGROUND_LOCK")
        self.assertFalse(out["uninvitedBlocked"]["ok"])
        self.assertTrue(out["ytPlay"]["ok"])
        self.assertTrue(out["ytPlay"]["autoPlayed"])
        self.assertIn("autoplay=1", out["ytPlay"]["embedUrl"])
        self.assertTrue(out["minRes"]["ok"])
        self.assertEqual(out["minRes"]["nativeAction"], "CLOSE_MYRAAA")

    def test_05_github_ota_auto_updater_detection(self):
        """MyraaOtaUpdater detects newer version in GitHub version.json and triggers 1-click update."""
        out = self.run_node_script("""
          const ota = window.MyraaOtaUpdater;
          const sameVer = await ota.checkForGitHubUpdate({ version: "5.0.0" });
          const newerVer = await ota.checkForGitHubUpdate({
            version: "5.1.0",
            changelog: "Added new voice gestures",
            apkUrl: "https://github.com/shriramnag/myraa-unlimited-ai/raw/main/releases/SHIVAI-MYRAA-latest.apk"
          });
          const applied = await ota.applyOneClickUpdate();
          console.log(JSON.stringify({ sameVer, newerVer, applied }));
        """)
        self.assertFalse(out["sameVer"]["updateAvailable"])
        self.assertTrue(out["newerVer"]["updateAvailable"])
        self.assertEqual(out["newerVer"]["latestVersion"], "5.1.0")
        self.assertTrue(out["applied"]["ok"])
        self.assertEqual(out["applied"]["targetVersion"], "5.1.0")


if __name__ == "__main__":
    unittest.main(verbosity=2)
