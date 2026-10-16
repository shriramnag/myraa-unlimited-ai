import unittest
import subprocess
import json
import os

REPO_DIR = "/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo"
SEC_JS_PATH = os.path.join(REPO_DIR, "web/src/security/securityPolicyEngine.js")


class TestPhase2And3SecurityShield(unittest.TestCase):

    def run_node_script(self, js_code: str) -> dict:
        harness = f"""
        const storage = new Map();
        global.window = global;
        global.localStorage = {{
          getItem: (k) => storage.has(k) ? storage.get(k) : null,
          setItem: (k, v) => storage.set(k, String(v)),
          removeItem: (k) => storage.delete(k)
        }};
        
        (async () => {{
          await import({json.dumps(SEC_JS_PATH)});
          {js_code}
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node execution failed: {res.stderr}")
        return json.loads(res.stdout.strip())

    def test_01_deny_financial_upi_and_authenticator_packages(self):
        """Negative Test: Agent attempts to open or interact with UPI, banking, or authenticator apps."""
        out = self.run_node_script("""
          const eng = window.MyraaSecurityPolicyEngine;
          const targets = [
            "com.google.android.apps.nbu.paisa.user",
            "com.phonepe.app",
            "net.one97.paytm",
            "in.org.npci.upiapp",
            "com.sbi.lotusintouch",
            "com.x8bit.bitwarden",
            "com.google.android.apps.authenticator2",
            "Open Google Pay and check balance"
          ];
          const results = targets.map(t => eng.evaluateActionPolicy({ action: "OPEN_APP", target: t }));
          const safe = eng.evaluateActionPolicy({ action: "OPEN_SETTINGS", target: "android.settings.SETTINGS" });
          console.log(JSON.stringify({ results, safe, logs: eng.getAuditLogs() }));
        """)
        for r in out["results"]:
            self.assertFalse(r["allowed"])
            self.assertEqual(r["status"], "BLOCKED_BY_POLICY")
            self.assertEqual(r["severity"], "CRITICAL")
        self.assertTrue(out["safe"]["allowed"])
        self.assertGreaterEqual(len(out["logs"]), 8)

    def test_02_deny_otp_bidirectional_and_redact_audit_logs(self):
        """Negative Test: Agent attempts to inspect or transmit OTPs in any word order; audit logs must redact codes."""
        out = self.run_node_script("""
          const eng = window.MyraaSecurityPolicyEngine;
          const samples = [
            "Your login code is 482910 for account access",
            "849201 is your OTP for verification",
            "One-time password: 918273",
            "Security code 7741 for authentication"
          ];
          const decisions = samples.map(s => eng.evaluateActionPolicy({ action: "SEND_SMS", target: "9999999999", message: s }));
          const redactedSamples = samples.map(s => eng.redactSensitiveText(s));
          console.log(JSON.stringify({ decisions, redactedSamples, logs: eng.getAuditLogs() }));
        """)
        for d in out["decisions"]:
            self.assertFalse(d["allowed"])
            self.assertEqual(d["status"], "BLOCKED_BY_POLICY")

        # Verify raw OTP numbers are stripped in redacted output
        for red in out["redactedSamples"]:
            self.assertNotIn("482910", red)
            self.assertNotIn("849201", red)
            self.assertNotIn("918273", red)
            self.assertIn("[REDACTED_OTP_OR_PIN]", red)

    def test_03_deny_payment_pin_cvv_card_and_transaction_approval(self):
        """Negative Test: Agent attempts to enter UPI PIN, read CVV, or approve payment transactions."""
        out = self.run_node_script("""
          const eng = window.MyraaSecurityPolicyEngine;
          const actions = [
            { action: "SEND_WHATSAPP_MESSAGE", target: "12345", message: "My UPI PIN is 4321" },
            { action: "WEB_SEARCH", query: "Card 4532 0151 1283 0366 CVV 849" },
            { action: "OPEN_APP", target: "confirm payment and send money" },
            { action: "OPEN_APP", target: "disable payment shield" }
          ];
          const results = actions.map(a => eng.evaluateActionPolicy(a));
          console.log(JSON.stringify({ results }));
        """)
        for r in out["results"]:
            self.assertFalse(r["allowed"])
            self.assertEqual(r["status"], "BLOCKED_BY_POLICY")

    def test_04_immutability_model_cannot_override_or_disable_shield(self):
        """Negative Test: Model or script attempts to overwrite or mutate MyraaSecurityPolicyEngine."""
        out = self.run_node_script("""
          try { window.MyraaSecurityPolicyEngine = null; } catch {}
          try { window.MyraaSecurityPolicyEngine.evaluateActionPolicy = () => ({ allowed: true }); } catch {}
          try { window.MyraaSecurityPolicyEngine.BLOCKED_PACKAGES.pop(); } catch {}

          const eng = window.MyraaSecurityPolicyEngine;
          const check = eng.evaluateActionPolicy({ action: "OPEN_APP", target: "com.phonepe.app" });
          console.log(JSON.stringify({
            stillExists: !!eng,
            blockedPackagesCount: eng.BLOCKED_PACKAGES.length,
            phonePeBlocked: !check.allowed
          }));
        """)
        self.assertTrue(out["stillExists"])
        self.assertEqual(out["blockedPackagesCount"], 23)
        self.assertTrue(out["phonePeBlocked"])

    def test_05_memory_privacy_filter_blocks_secrets_and_otps(self):
        """Negative Test: Memory core rejects OTPs, PINs, and API tokens while keeping safe user facts."""
        out = self.run_node_script("""
          const eng = window.MyraaSecurityPolicyEngine;
          const candidateMemories = [
            { id: "1", category: "identity", text: "Shri Ram Nag is MYRAA's Creator and Supreme Owner." },
            { id: "2", category: "preference", text: "My UPI PIN is 9876 and OTP is 445566" },
            { id: "3", category: "project", text: "GitHub token ghp_1234567890abcdefghijklmnopqrstuvwx" },
            { id: "4", category: "goal", text: "Build multi-agent personal AI system on Android" }
          ];
          const sanitized = eng.sanitizeMemoryEntries(candidateMemories);
          console.log(JSON.stringify({ sanitized }));
        """)
        self.assertEqual(len(out["sanitized"]), 2)
        ids = [m["id"] for m in out["sanitized"]]
        self.assertEqual(ids, ["1", "4"])

    def test_06_notification_shield_suppresses_otp_and_banking_alerts(self):
        """Negative Test: Notification filter suppresses banking packages and OTP messages."""
        out = self.run_node_script("""
          const eng = window.MyraaSecurityPolicyEngine;
          const incoming = [
            { packageName: "com.phonepe.app", title: "Payment", text: "Paid Rs 500" },
            { packageName: "com.google.android.apps.messaging", title: "Bank", text: "Use 654321 as your login code" },
            { packageName: "com.google.android.calendar", title: "Meeting", text: "Project review at 5 PM" }
          ];
          const safe = eng.filterSafeNotifications(incoming);
          console.log(JSON.stringify({ safe }));
        """)
        self.assertEqual(len(out["safe"]), 1)
        self.assertEqual(out["safe"][0]["packageName"], "com.google.android.calendar")


if __name__ == "__main__":
    unittest.main(verbosity=2)
