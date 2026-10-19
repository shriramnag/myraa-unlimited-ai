import unittest
import subprocess
import json
import os

REPO_DIR = "/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo"
SEC_JS = os.path.join(REPO_DIR, "web/src/security/securityPolicyEngine.js")
VAULT_JS = os.path.join(REPO_DIR, "web/src/security/adminVaultAndSubscription.js")
DB_JS = os.path.join(REPO_DIR, "web/src/database/googleSheetsUserDb.js")
MCA_JS = os.path.join(REPO_DIR, "web/src/models/modelCyberAvatarManager.js")
OTA_JS = os.path.join(REPO_DIR, "web/src/ota/githubOtaUpdater.js")


class TestV5GoogleSheetsDbAndAvatarStage(unittest.TestCase):

    def run_node_script(self, js_code: str) -> dict:
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
          await import({json.dumps(MCA_JS)});
          await import({json.dumps(OTA_JS)});
          {js_code}
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node execution failed: {res.stderr}")
        return json.loads(res.stdout.strip())

    def test_01_free_user_login_and_google_sheets_csv_export(self):
        """Free user login must store Name, Email, and Tier and export cleanly to CSV for Google Sheets."""
        out = self.run_node_script("""
          const db = window.MyraaGoogleSheetsDb;
          const bad = await db.registerOrLoginUser({ name: "", email: "invalid" });
          const u1 = await db.registerOrLoginUser({ name: "Rahul Sharma", email: "rahul@example.com", tier: "FREE" });
          const csv = db.exportUsersToCsv();
          console.log(JSON.stringify({ bad, u1, csv }));
        """)
        self.assertFalse(out["bad"]["ok"])
        self.assertTrue(out["u1"]["ok"])
        self.assertEqual(out["u1"]["user"]["tier"], "FREE")
        self.assertIn("rahul@example.com", out["csv"])

    def test_02_admin_can_upgrade_user_to_ultra_in_database(self):
        """Supreme Admin Shri Ram Nag can upgrade a registered user from FREE to ULTRA in the database."""
        out = self.run_node_script("""
          const db = window.MyraaGoogleSheetsDb;
          const vault = window.MyraaAdminVault;
          await db.registerOrLoginUser({ name: "Priya", email: "priya@example.com", tier: "FREE" });
          const deniedNonAdmin = db.updateUserTierByAdmin("priya@example.com", "ULTRA");
          vault.unlockAdminWithMasterCode("SRN-SHIVAI-05-3197-TITAN");
          const upgraded = db.updateUserTierByAdmin("priya@example.com", "ULTRA");
          console.log(JSON.stringify({ deniedNonAdmin, upgraded }));
        """)
        self.assertFalse(out["deniedNonAdmin"]["ok"])
        self.assertTrue(out["upgraded"]["ok"])
        self.assertEqual(out["upgraded"]["user"]["tier"], "ULTRA")


if __name__ == "__main__":
    unittest.main(verbosity=2)
