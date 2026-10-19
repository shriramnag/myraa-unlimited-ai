import unittest
import subprocess
import json
import os

REPO_DIR = "/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo"
SEC_JS = os.path.join(REPO_DIR, "web/src/security/securityPolicyEngine.js")
SUP_JS = os.path.join(REPO_DIR, "web/src/agents/agentSupervisor.js")
VOICE_JS = os.path.join(REPO_DIR, "web/src/voice/voiceInteractionManager.js")
AUTO_JS = os.path.join(REPO_DIR, "web/src/automation/deviceAutomationManager.js")
CODE_JS = os.path.join(REPO_DIR, "web/src/coding/codingWorkspaceManager.js")
MCA_JS = os.path.join(REPO_DIR, "web/src/models/modelCyberAvatarManager.js")


class TestPhase8To15CompleteSystem(unittest.TestCase):

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
          await import({json.dumps(SUP_JS)});
          await import({json.dumps(VOICE_JS)});
          await import({json.dumps(AUTO_JS)});
          await import({json.dumps(CODE_JS)});
          await import({json.dumps(MCA_JS)});
          {js_code}
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node execution failed: {res.stderr}")
        return json.loads(res.stdout.strip())

    def test_01_coding_workspace_path_traversal_and_snapshot_recovery(self):
        """Negative & Positive Test: Block outside-workspace edits and preserve snapshots for rollback."""
        out = self.run_node_script("""
          const cw = window.MyraaCodingWorkspaceManager;
          const traversal = cw.writeFileInWorkspace("../../etc/passwd", "hacked");
          const w1 = cw.writeFileInWorkspace("app/MainActivity.kt", "fun main() { println(1) }");
          const w2 = cw.writeFileInWorkspace("app/MainActivity.kt", "BROKEN_SYNTAX");
          const rb = cw.rollbackFile("app/MainActivity.kt");
          const finalRead = cw.readFileInWorkspace("app/MainActivity.kt");
          console.log(JSON.stringify({ traversal, w1, w2, rb, finalRead }));
        """)
        self.assertFalse(out["traversal"]["ok"])
        self.assertEqual(out["traversal"]["status"], "BLOCKED_BY_POLICY")
        self.assertTrue(out["w1"]["ok"])
        self.assertTrue(out["rb"]["ok"])
        self.assertEqual(out["finalRead"]["content"], "fun main() { println(1) }")

    def test_02_terminal_engine_requires_approval_for_destructive_commands(self):
        """Negative & Positive Test: Terminal requires explicit approval for rm/chmod/deploy/git push."""
        out = self.run_node_script("""
          const cw = window.MyraaCodingWorkspaceManager;
          const safeCmd = await cw.executeTerminalCommand({ command: "./gradlew testDebugUnitTest" });
          const blockedRm = await cw.executeTerminalCommand({ command: "rm -rf build/", userApproved: false });
          const approvedRm = await cw.executeTerminalCommand({ command: "rm -rf build/", userApproved: true });
          console.log(JSON.stringify({ safeCmd, blockedRm, approvedRm }));
        """)
        self.assertTrue(out["safeCmd"]["ok"])
        self.assertFalse(out["blockedRm"]["ok"])
        self.assertEqual(out["blockedRm"]["status"], "AWAITING_APPROVAL")
        self.assertTrue(out["approvedRm"]["ok"])

    def test_03_bounded_self_recovery_loop_and_rollback_on_failure(self):
        """Self-Recovery must fix broken code within retry limit or roll back to working copy if unfixable."""
        out = self.run_node_script("""
          const cw = window.MyraaCodingWorkspaceManager;
          cw.writeFileInWorkspace("src/Calc.kt", "fun add(a:Int,b:Int)=a+b");

          // Case 1: Recovery succeeds on 2nd fix
          const recSuccess = await cw.runBoundedSelfRecovery({
            filePath: "src/Calc.kt",
            brokenContent: "fun add(a:Int,b:Int)=BROKEN",
            proposedFixes: ["fun add(a:Int)=STILL_BROKEN", "fun add(a:Int,b:Int):Int = a + b"],
            testRunnerFn: async (code) => ({ passed: code.includes("a + b") }),
            maxRetries: 2
          });

          // Case 2: All fixes fail -> rolls back to previous snapshot
          const recRollback = await cw.runBoundedSelfRecovery({
            filePath: "src/Calc.kt",
            brokenContent: "fun add()=CRASH",
            proposedFixes: ["bad1", "bad2"],
            testRunnerFn: async () => ({ passed: false }),
            maxRetries: 2
          });
          const restored = cw.readFileInWorkspace("src/Calc.kt");
          console.log(JSON.stringify({ recSuccess, recRollback, restored }));
        """)
        self.assertTrue(out["recSuccess"]["ok"])
        self.assertEqual(out["recSuccess"]["status"], "RECOVERED_AND_VERIFIED")
        self.assertFalse(out["recRollback"]["ok"])
        self.assertEqual(out["recRollback"]["status"], "ROLLED_BACK_TO_WORKING_COPY")

    def test_04_model_router_cost_disclosure_and_offline_mode(self):
        """ModelRouter must disclose paid providers before switching and route to local model when offline."""
        out = self.run_node_script("""
          const mr = window.MyraaModelRouter;
          const paidBlocked = mr.selectModelForTask({ taskCategory: "reasoning", allowPaid: false });
          const paidAllowed = mr.selectModelForTask({ taskCategory: "reasoning", allowPaid: true });
          mr.configureModels({ offlineMode: true });
          const offlineSelected = mr.selectModelForTask({ taskCategory: "fast" });
          console.log(JSON.stringify({ paidBlocked, paidAllowed, offlineSelected }));
        """)
        self.assertFalse(out["paidBlocked"]["ok"])
        self.assertEqual(out["paidBlocked"]["status"], "AWAITING_COST_APPROVAL")
        self.assertTrue(out["paidAllowed"]["ok"])
        self.assertEqual(out["paidAllowed"]["selected"]["id"], "gemini-2.5-pro")
        self.assertTrue(out["offlineSelected"]["selected"]["isLocal"])

    def test_05_cybersecurity_monitor_detects_leaks_and_deduplicates_alerts(self):
        """CybersecurityMonitor must detect leaked tokens, redact evidence, and deduplicate repeated alerts."""
        out = self.run_node_script("""
          const sec = window.MyraaCybersecurityMonitor;
          sec.clearAlertsForTest();
          const leak1 = sec.scanSourceOrConfig({
            targetName: "config.js",
            content: "const token = 'ghp_1234567890abcdefghijklmnopqrstuvwx'; const url = 'http://insecure.example.com';"
          });
          // Duplicate scan should be deduplicated
          const leak2 = sec.scanSourceOrConfig({
            targetName: "config.js",
            content: "const token = 'ghp_1234567890abcdefghijklmnopqrstuvwx';"
          });
          const alerts = sec.getAlerts();
          console.log(JSON.stringify({ leak1Count: leak1.length, leak2Count: leak2.length, alerts }));
        """)
        self.assertEqual(out["leak1Count"], 2)
        self.assertEqual(out["leak2Count"], 0, "Duplicate alerts must be suppressed")
        # Ensure leaked token is redacted inside alert evidence
        self.assertNotIn("ghp_1234567890", out["alerts"][0]["observedEvidence"])

    def test_06_avatar_manager_roles_validation_and_fallback(self):
        """AvatarManager must switch across MYRAA, CODEX, SENTINEL, SAGE, PIXEL and fallback on invalid asset."""
        out = self.run_node_script("""
          const av = window.MyraaAvatarManager;
          const codex = av.selectAvatarForRole("CODEX");
          const sentinel = av.selectAvatarForRole("SENTINEL");
          const unknown = av.selectAvatarForRole("NON_EXISTENT_AVATAR");
          const badAsset = av.validateModelAsset({ sizeBytes: 999 * 1024 * 1024, format: "pmx" });
          console.log(JSON.stringify({ codex, sentinel, unknown, badAsset }));
        """)
        self.assertEqual(out["codex"]["avatar"]["role"], "CODEX")
        self.assertEqual(out["sentinel"]["avatar"]["role"], "SENTINEL")
        self.assertTrue(out["unknown"]["fallbackUsed"])
        self.assertEqual(out["unknown"]["avatar"]["role"], "MYRAA")
        self.assertFalse(out["badAsset"]["valid"])
        self.assertTrue(out["badAsset"]["fallbackActivated"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
