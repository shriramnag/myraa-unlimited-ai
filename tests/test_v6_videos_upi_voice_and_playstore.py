import json
import subprocess
import unittest
from pathlib import Path

REPO_ROOT = Path("/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo")
SEC_JS = str(REPO_ROOT / "web/src/security/securityPolicyEngine.js")
VAULT_JS = str(REPO_ROOT / "web/src/security/adminVaultAndSubscription.js")
DB_JS = str(REPO_ROOT / "web/src/database/googleSheetsUserDb.js")
UPI_JS = str(REPO_ROOT / "web/src/database/googleAuthAndUpiGateway.js")
VB_JS = str(REPO_ROOT / "web/src/voice/voiceBiometricsAndAudioDucker.js")
DC_JS = str(REPO_ROOT / "web/src/automation/fullDeviceAndPlayStoreController.js")
MCA_JS = str(REPO_ROOT / "web/src/models/modelCyberAvatarManager.js")


class TestShivaiV6VideosUpiVoiceAndPlayStore(unittest.TestCase):
    def run_node_esm(self, js_code: str) -> str:
        harness = f"""
        const storage = new Map();
        global.window = global;
        global.navigator = {{ userAgent: "Android Test" }};
        global.localStorage = {{
          getItem: (k) => storage.has(k) ? storage.get(k) : null,
          setItem: (k, v) => storage.set(k, String(v)),
          removeItem: (k) => storage.delete(k)
        }};
        (async () => {{
          await import({json.dumps(SEC_JS)});
          await import({json.dumps(VAULT_JS)});
          await import({json.dumps(DB_JS)});
          await import({json.dumps(UPI_JS)});
          await import({json.dumps(VB_JS)});
          await import({json.dumps(DC_JS)});
          await import({json.dumps(MCA_JS)});
          {js_code}
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node failed: {res.stderr}")
        return res.stdout

    def test_01_all_10_character_videos_exist_in_public_and_dist(self):
        expected_videos = [
            "myraa_closeup.mp4",
            "myraa_full.mp4",
            "codex_closeup.mp4",
            "codex_full.mp4",
            "aura_closeup.mp4",
            "aura_full.mp4",
            "sentinel_closeup.mp4",
            "sentinel_full.mp4",
            "sage_closeup.mp4",
            "sage_full.mp4",
            "vortex_closeup.mp4",
            "vortex_full.mp4",
        ]
        for v in expected_videos:
            pub_p = REPO_ROOT / "web/public/avatars/videos" / v
            dist_p = REPO_ROOT / "web/dist/avatars/videos" / v
            self.assertTrue(pub_p.exists(), f"Missing public video {v}")
            self.assertTrue(dist_p.exists(), f"Missing dist video {v}")
            self.assertGreater(pub_p.stat().st_size, 40_000, f"Video {v} is unexpectedly small")

    def test_02_avatar_manager_supports_6_characters_and_closeup_full_toggle(self):
        out = self.run_node_esm("""
          const mgr = window.MyraaAvatarManager;
          const roles = Object.keys(mgr.AVATAR_ROLES);
          if (roles.length < 6) throw new Error("Expected 6 characters, got " + roles.length);
          const myraaClose = mgr.selectAvatarForRole("MYRAA", "CLOSEUP");
          if (!myraaClose.avatar.closeupVideo.includes("myraa_closeup.mp4")) throw new Error("MYRAA closeup video mismatch");
          const modeFull = mgr.setCameraViewMode("FULL");
          if (modeFull !== "FULL" || !myraaClose.avatar.fullVideo.includes("myraa_full.mp4")) throw new Error("MYRAA full video mismatch");
          const aura = mgr.selectAvatarForRole("AURA", "CLOSEUP");
          if (!aura.avatar.closeupVideo.includes("aura_closeup.mp4")) throw new Error("AURA closeup video mismatch");
          console.log("AVATAR_VIDEO_OK");
        """)
        self.assertIn("AVATAR_VIDEO_OK", out)

    def test_03_google_signin_and_upi_payment_gateway(self):
        out = self.run_node_esm("""
          const g = window.MyraaGoogleAuthAndUpi;
          const bad = await g.signInWithGoogleAccount({ googleName: "Test", googleEmail: "invalid-email" });
          if (bad.ok) throw new Error("Invalid email should fail");

          const login = await g.signInWithGoogleAccount({ googleName: "Rohan Kumar", googleEmail: "rohan@gmail.com" });
          if (!login.ok || !login.verified) throw new Error("Google sign-in failed");

          for (const app of ["GPAY", "PHONEPE", "PAYTM", "BHIM"]) {
            const p = g.buildUpiPaymentIntent({ app, plan: "ULTRA" });
            if (!p.ok || !p.deepLink.includes("pa=")) throw new Error("UPI link failed for " + app);
          }

          window.MyraaAdminVault.unlockAdminWithMasterCode("SRN-SHIVAI-01-9942-OMEGA");
          const cfgUpd = g.updatePaymentConfigByAdmin({ upiId: "shriramnag@okaxis" });
          if (!cfgUpd.ok || cfgUpd.config.upiId !== "shriramnag@okaxis") throw new Error("Admin UPI update failed");
          console.log("GOOGLE_UPI_OK");
        """)
        self.assertIn("GOOGLE_UPI_OK", out)

    def test_04_voice_biometrics_and_background_media_ducking(self):
        out = self.run_node_esm("""
          const vb = window.MyraaVoiceBiometrics;
          const en = vb.enrollSpeakerVoiceprint({
            role: "USER",
            speakerName: "Rohan",
            avgPitchHz: 170,
            samplePhrase: "Myraa Open YouTube And Play Music"
          });
          if (!en.ok) throw new Error("User voice enrollment failed");

          const matchOk = vb.verifySpeakerAndFilterNoise({
            pitchHz: 175,
            rmsLevel: 0.15,
            transcript: "Myraa open YouTube"
          });
          if (!matchOk.accepted) throw new Error("Enrolled user voice should pass verification");

          const stranger = vb.verifySpeakerAndFilterNoise({
            pitchHz: 280,
            rmsLevel: 0.15,
            transcript: "Myraa open settings"
          });
          if (stranger.accepted) throw new Error("Crowd/stranger voice should be rejected");

          const duck = await vb.setListeningMediaDucking(true);
          if (!duck.ok || !duck.ducked || duck.targetVolume !== 15) throw new Error("Media ducking failed");
          const rest = await vb.setListeningMediaDucking(false);
          if (!rest.ok || rest.ducked) throw new Error("Media restore failed");

          console.log("VOICE_AND_DUCKING_OK");
        """)
        self.assertIn("VOICE_AND_DUCKING_OK", out)

    def test_05_playstore_install_single_update_uninstall_and_screen_overlay(self):
        out = self.run_node_esm("""
          const dc = window.MyraaFullDeviceController;
          const blockedFin = await dc.installAppFromPlayStore("com.google.android.apps.nbu.paisa.user");
          if (blockedFin.ok) throw new Error("Should block financial package automation");

          const inst = await dc.installAppFromPlayStore("Instagram");
          if (!inst.ok || inst.packageName !== "com.instagram.android") throw new Error("Play Store install failed");

          const bulk = await dc.updateSingleAppFromPlayStore("all");
          if (bulk.ok) throw new Error("Should block bulk update of all apps at once");

          const singleUpd = await dc.updateSingleAppFromPlayStore("WhatsApp");
          if (!singleUpd.ok || !singleUpd.singleAppOnly) throw new Error("Single app update failed");

          const uninst = await dc.uninstallAppOnCommand("Facebook", true);
          if (!uninst.ok) throw new Error("App uninstall failed");

          const chain = await dc.runChainedAppWorkflow([
            { type: "OPEN_APP", target: "YouTube" },
            { type: "READ_AND_CLICK", target: "Play" },
            { type: "CLOSE_APP", target: "YouTube" },
            { type: "OPEN_APP", target: "WhatsApp" }
          ]);
          if (!chain.ok || chain.stepsCompleted !== 4) throw new Error("Chained multi-app workflow failed");

          console.log("PLAYSTORE_CONTROLLER_OK");
        """)
        self.assertIn("PLAYSTORE_CONTROLLER_OK", out)


if __name__ == "__main__":
    unittest.main()
