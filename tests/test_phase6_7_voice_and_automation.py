import unittest
import subprocess
import json
import os

REPO_DIR = "/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo"
SEC_JS_PATH = os.path.join(REPO_DIR, "web/src/security/securityPolicyEngine.js")
SUP_JS_PATH = os.path.join(REPO_DIR, "web/src/agents/agentSupervisor.js")
VOICE_JS_PATH = os.path.join(REPO_DIR, "web/src/voice/voiceInteractionManager.js")
AUTO_JS_PATH = os.path.join(REPO_DIR, "web/src/automation/deviceAutomationManager.js")


class TestPhase6And7VoiceAndAutomation(unittest.TestCase):

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
          await import({json.dumps(SEC_JS_PATH)});
          await import({json.dumps(SUP_JS_PATH)});
          await import({json.dumps(VOICE_JS_PATH)});
          await import({json.dumps(AUTO_JS_PATH)});
          {js_code}
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node execution failed: {res.stderr}")
        return json.loads(res.stdout.strip())

    def test_01_voice_commands_hindi_hinglish_english_and_emergency_stop(self):
        """VoiceInteractionManager must parse English, Hindi, and Hinglish commands and trigger Emergency Stop."""
        out = self.run_node_script("""
          const v = window.MyraaVoiceInteractionManager;
          const c1 = v.parseVoiceCommand("MYRAA, open Settings");
          const c2 = v.parseVoiceCommand("Go back");
          const c3 = v.parseVoiceCommand("Niche scroll karo");
          const c4 = v.parseVoiceCommand("Create a new Kotlin file");
          const c5 = v.parseVoiceCommand("Explain what you are doing");
          const c6 = v.parseVoiceCommand("Stop all actions");
          console.log(JSON.stringify({
            c1, c2, c3, c4, c5, c6,
            stopped: window.MyraaAgentSupervisor.isEmergencyStopActive()
          }));
        """)
        self.assertEqual(out["c1"]["action"], "OPEN_SETTINGS")
        self.assertEqual(out["c2"]["action"], "NAVIGATE_BACK")
        self.assertEqual(out["c3"]["action"], "SCROLL_SCREEN")
        self.assertEqual(out["c3"]["direction"], "DOWN")
        self.assertEqual(out["c4"]["action"], "CREATE_KOTLIN_FILE")
        self.assertEqual(out["c4"]["avatar"], "CODEX")
        self.assertEqual(out["c5"]["type"], "EXPLAIN_STATUS")
        self.assertEqual(out["c6"]["type"], "EMERGENCY_STOP")
        self.assertTrue(out["stopped"])

    def test_02_voice_state_machine_and_push_to_talk(self):
        """VoiceInteractionManager must transition cleanly across IDLE, LISTENING, THINKING, SPEAKING, EXECUTING."""
        out = self.run_node_script("""
          const v = window.MyraaVoiceInteractionManager;
          const initial = v.getState();
          v.startPushToTalk();
          const afterPttStart = v.getState();
          v.stopPushToTalk();
          const afterPttStop = v.getState();
          v.setVoiceState(v.VOICE_STATES.SPEAKING);
          v.interruptSpeech();
          const afterInterrupt = v.getState();
          console.log(JSON.stringify({ initial, afterPttStart, afterPttStop, afterInterrupt }));
        """)
        self.assertEqual(out["initial"], "IDLE")
        self.assertEqual(out["afterPttStart"], "LISTENING")
        self.assertEqual(out["afterPttStop"], "THINKING")
        self.assertEqual(out["afterInterrupt"], "IDLE")

    def test_03_automation_succeeds_and_verifies_on_permitted_screen(self):
        """DeviceAutomationManager must click, type, scroll, and verify UI state on permitted screens."""
        out = self.run_node_script("""
          const auto = window.MyraaDeviceAutomationManager;
          auto.setAccessibilityServiceStatus(true);
          const clickRes = await auto.executeAutomationStep({ operation: "CLICK_UI_ELEMENT", target: "Settings" });
          const typeRes = await auto.executeAutomationStep({ operation: "ENTER_TEXT_FIELD", target: "Search query", text: "Kotlinoutines" });
          const scrollRes = await auto.executeAutomationStep({ operation: "SCROLL_SCREEN", direction: "DOWN" });
          console.log(JSON.stringify({ clickRes, typeRes, scrollRes }));
        """)
        self.assertTrue(out["clickRes"]["ok"])
        self.assertTrue(out["clickRes"]["verified"])
        self.assertTrue(out["typeRes"]["ok"])
        self.assertTrue(out["typeRes"]["verified"])
        self.assertTrue(out["scrollRes"]["ok"])
        self.assertEqual(out["scrollRes"]["scrollOffset"], 300)

    def test_04_negative_automation_blocked_on_password_and_captcha_screens(self):
        """Negative Test: DeviceAutomationManager must fail closed on screens with password fields or CAPTCHAs."""
        out = self.run_node_script("""
          const auto = window.MyraaDeviceAutomationManager;
          auto.setAccessibilityServiceStatus(true);

          // 1. Screen with password field
          auto.setMockUiContextForVerification({
            packageName: "com.example.portal",
            screenTitle: "Login",
            hasPasswordField: true
          });
          const pwdAttempt = await auto.executeAutomationStep({ operation: "CLICK_UI_ELEMENT", target: "Submit" });

          // 2. Screen with CAPTCHA challenge
          auto.setMockUiContextForVerification({
            packageName: "com.example.portal",
            screenTitle: "Security Check",
            hasPasswordField: false,
            hasCaptchaChallenge: true
          });
          const captchaAttempt = await auto.executeAutomationStep({ operation: "CLICK_UI_ELEMENT", target: "Continue" });

          console.log(JSON.stringify({ pwdAttempt, captchaAttempt }));
        """)
        self.assertFalse(out["pwdAttempt"]["ok"])
        self.assertEqual(out["pwdAttempt"]["status"], "BLOCKED_BY_POLICY")
        self.assertFalse(out["captchaAttempt"]["ok"])
        self.assertEqual(out["captchaAttempt"]["status"], "BLOCKED_BY_POLICY")

    def test_05_negative_automation_blocked_on_financial_and_otp_screens(self):
        """Negative Test: DeviceAutomationManager must refuse UI reading or clicking on UPI/banking apps or OTP screens."""
        out = self.run_node_script("""
          const auto = window.MyraaDeviceAutomationManager;
          auto.setAccessibilityServiceStatus(true);

          auto.setMockUiContextForVerification({
            packageName: "com.google.android.apps.nbu.paisa.user",
            screenTitle: "Google Pay",
            hasPasswordField: false,
            hasCaptchaChallenge: false
          });
          const gpayRead = await auto.executeAutomationStep({ operation: "READ_UI_STATE" });
          const gpayClick = await auto.executeAutomationStep({ operation: "CLICK_UI_ELEMENT", target: "Pay" });

          console.log(JSON.stringify({ gpayRead, gpayClick }));
        """)
        self.assertFalse(out["gpayRead"]["ok"])
        self.assertEqual(out["gpayRead"]["status"], "BLOCKED_BY_POLICY")
        self.assertFalse(out["gpayClick"]["ok"])
        self.assertEqual(out["gpayClick"]["status"], "BLOCKED_BY_POLICY")

    def test_06_honest_restriction_reporting_when_accessibility_disabled(self):
        """When AccessibilityService is disabled, report exact platform restriction instead of vague failure."""
        out = self.run_node_script("""
          const auto = window.MyraaDeviceAutomationManager;
          auto.setAccessibilityServiceStatus(false);
          auto.setMockUiContextForVerification({
            packageName: "ai.myraa.mobile",
            screenTitle: "Home",
            hasPasswordField: false,
            hasCaptchaChallenge: false
          });
          const res = await auto.executeAutomationStep({ operation: "CLICK_UI_ELEMENT", target: "Settings" });
          console.log(JSON.stringify({ res }));
        """)
        self.assertFalse(out["res"]["ok"])
        self.assertEqual(out["res"]["status"], "RESTRICTION_REPORTED")
        self.assertTrue(out["res"]["requiresAccessibility"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
