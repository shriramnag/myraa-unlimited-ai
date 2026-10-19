import unittest
import subprocess
import json
import os

REPO_DIR = "/working_dir/c_0f9e1b55fa423ed5/MYRAA-GitHub-Repo"
SEC_JS_PATH = os.path.join(REPO_DIR, "web/src/security/securityPolicyEngine.js")
SUP_JS_PATH = os.path.join(REPO_DIR, "web/src/agents/agentSupervisor.js")


class TestPhase4And5AgentSupervisor(unittest.TestCase):

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
          await import({json.dumps(SUP_JS_PATH)});
          {js_code}
        }})().catch(e => {{ console.error(e); process.exit(1); }});
        """
        res = subprocess.run(["node", "-e", harness], capture_output=True, text=True)
        self.assertEqual(res.returncode, 0, f"Node execution failed: {res.stderr}")
        return json.loads(res.stdout.strip())

    def test_01_state_machine_forbids_completed_without_verifying(self):
        """TaskStateManager must reject transitioning directly from CREATED or EXECUTING to COMPLETED."""
        out = self.run_node_script("""
          const sup = window.MyraaAgentSupervisor;
          const t = sup.createTask({ title: "Open Settings", actionName: "OPEN_SETTINGS", payload: {} });
          sup.transitionTaskState(t.taskId, sup.TASK_STATES.EXECUTING, "Running");
          const illegal = sup.transitionTaskState(t.taskId, sup.TASK_STATES.COMPLETED, "Skip verification");
          const legal = sup.verifyAndCompleteTask(t.taskId, { ok: true, message: "Settings opened" });
          console.log(JSON.stringify({ illegal, legal, finalState: t.state, verified: t.verified }));
        """)
        self.assertFalse(out["illegal"]["ok"])
        self.assertIn("invariant violation", out["illegal"]["error"])
        self.assertTrue(out["legal"]["ok"])
        self.assertEqual(out["finalState"], "COMPLETED")
        self.assertTrue(out["verified"])

    def test_02_specialist_agent_and_avatar_role_routing(self):
        """IntentRouter must route tasks to the correct specialist agent and avatar role."""
        out = self.run_node_script("""
          const sup = window.MyraaAgentSupervisor;
          const r1 = sup.routeIntentToSpecialist("OPEN_SETTINGS", {});
          const r2 = sup.routeIntentToSpecialist("TASK", { query: "Fix Kotlin gradle build error" });
          const r3 = sup.routeIntentToSpecialist("READ_NOTIFICATION", { query: "security scan" });
          const r4 = sup.routeIntentToSpecialist("YOUTUBE_SEARCH", { query: "AI news" });
          const r5 = sup.routeIntentToSpecialist("CONTROL_3D_CAMERA", {});
          console.log(JSON.stringify({ r1, r2, r3, r4, r5 }));
        """)
        self.assertEqual(out["r1"]["id"], "AndroidDevelopmentAgent")
        self.assertEqual(out["r1"]["avatar"], "MYRAA")
        self.assertEqual(out["r2"]["id"], "SoftwareEngineeringAgent")
        self.assertEqual(out["r2"]["avatar"], "CODEX")
        self.assertEqual(out["r3"]["id"], "CybersecurityAgent")
        self.assertEqual(out["r3"]["avatar"], "SENTINEL")
        self.assertEqual(out["r4"]["id"], "ResearchAgent")
        self.assertEqual(out["r4"]["avatar"], "SAGE")
        self.assertEqual(out["r5"]["id"], "UserInterfaceAgent")
        self.assertEqual(out["r5"]["avatar"], "PIXEL")

    def test_03_supervised_execution_blocks_forbidden_financial_task(self):
        """AgentSupervisor must transition forbidden tasks to BLOCKED_BY_POLICY before executing."""
        out = self.run_node_script("""
          const sup = window.MyraaAgentSupervisor;
          let executed = false;
          const res = await sup.superviseExecution({
            title: "Open PhonePe",
            actionName: "OPEN_APP",
            payload: { action: "OPEN_APP", target: "com.phonepe.app" },
            executorFn: async () => { executed = true; return { ok: true }; }
          });
          const task = sup.getAllTasks().find(t => t.taskId === res.taskId);
          console.log(JSON.stringify({ res, executed, state: task.state, verificationStatus: task.verificationStatus }));
        """)
        self.assertFalse(out["executed"], "Forbidden financial action must never invoke executorFn")
        self.assertEqual(out["res"]["status"], "BLOCKED_BY_POLICY")
        self.assertEqual(out["state"], "BLOCKED_BY_POLICY")

    def test_04_bounded_recovery_retries_on_transient_failure(self):
        """AgentSupervisor must retry transient failures up to maxRetries and then complete after verification."""
        out = self.run_node_script("""
          const sup = window.MyraaAgentSupervisor;
          let calls = 0;
          const res = await sup.superviseExecution({
            title: "Turn on Flashlight",
            actionName: "FLASHLIGHT_ON",
            payload: { action: "FLASHLIGHT_ON" },
            maxRetries: 2,
            executorFn: async () => {
              calls++;
              if (calls < 2) throw new Error("Transient camera busy");
              return { ok: true, message: "Flashlight turned on" };
            }
          });
          const task = sup.getAllTasks().find(t => t.taskId === res.taskId);
          console.log(JSON.stringify({ calls, state: task.state, retries: task.recoveryAttempts, verified: task.verified }));
        """)
        self.assertEqual(out["calls"], 2)
        self.assertEqual(out["retries"], 1)
        self.assertEqual(out["state"], "COMPLETED")
        self.assertTrue(out["verified"])

    def test_05_gated_actions_transition_to_awaiting_approval(self):
        """Unconfirmed gated actions (CALL_CONTACT, SEND_SMS, SEND_WHATSAPP_MESSAGE) must enter AWAITING_APPROVAL."""
        out = self.run_node_script("""
          const sup = window.MyraaAgentSupervisor;
          const res = await sup.superviseExecution({
            title: "Call Contact",
            actionName: "CALL_CONTACT",
            payload: { action: "CALL_CONTACT", target: "9876543210", confirmed: false },
            executorFn: async () => ({ ok: false, status: "confirmation_required", confirmationToken: "tok-123" })
          });
          const task = sup.getAllTasks().find(t => t.taskId === res.taskId);
          console.log(JSON.stringify({ state: task.state, approvals: task.approvalRequests }));
        """)
        self.assertEqual(out["state"], "AWAITING_APPROVAL")
        self.assertGreaterEqual(len(out["approvals"]), 1)

    def test_06_emergency_stop_halts_active_tasks_and_blocks_new_tasks(self):
        """Emergency Stop must cancel running tasks and prevent new executions until resumed."""
        out = self.run_node_script("""
          const sup = window.MyraaAgentSupervisor;
          const t1 = sup.createTask({ title: "Long Task", actionName: "WEB_SEARCH", payload: {} });
          sup.transitionTaskState(t1.taskId, sup.TASK_STATES.EXECUTING, "Searching...");
          sup.emergencyStopAll();
          const blockedNew = await sup.superviseExecution({
            title: "Blocked while stopped",
            actionName: "OPEN_SETTINGS",
            payload: {},
            executorFn: async () => ({ ok: true })
          });
          sup.resumeFromEmergencyStop();
          const afterResume = await sup.superviseExecution({
            title: "Allowed after resume",
            actionName: "OPEN_SETTINGS",
            payload: {},
            executorFn: async () => ({ ok: true, message: "Opened" })
          });
          console.log(JSON.stringify({
            t1State: t1.state,
            blockedNewStatus: blockedNew.status,
            afterResumeOk: afterResume.ok
          }));
        """)
        self.assertEqual(out["t1State"], "CANCELLED")
        self.assertEqual(out["blockedNewStatus"], "CANCELLED")
        self.assertTrue(out["afterResumeOk"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
