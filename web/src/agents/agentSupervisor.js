/**
 * PHASE 4 & 5: TASK STATE MANAGER, AGENT SUPERVISOR, PLANNER, TOOL REGISTRY & VISIBLE TASK MONITOR HUD
 * ----------------------------------------------------------------------------------------------------
 * Implements:
 * 1. Strict 10-State Task State Machine:
 *    CREATED -> PLANNING -> AWAITING_APPROVAL -> EXECUTING -> VERIFYING -> RECOVERING ->
 *    COMPLETED | FAILED | CANCELLED | BLOCKED_BY_POLICY
 * 2. Invariant Enforcement: A task CANNOT be marked COMPLETED unless it passes through VERIFYING.
 * 3. 12 Specialist Agents + 5 Avatar Roles (MYRAA, CODEX, SENTINEL, SAGE, PIXEL).
 * 4. Bounded Recovery Manager (configurable maxRetries) & Verification Engine.
 * 5. Emergency Stop Control (stopAllAgents) + Live Collapsible Task Monitor HUD.
 */

(function initMyraaAgentSupervisorSystem() {
  const TASK_STORAGE_KEY = "myraa.tasks.history.v1";

  const TASK_STATES = Object.freeze({
    CREATED: "CREATED",
    PLANNING: "PLANNING",
    AWAITING_APPROVAL: "AWAITING_APPROVAL",
    EXECUTING: "EXECUTING",
    VERIFYING: "VERIFYING",
    RECOVERING: "RECOVERING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    CANCELLED: "CANCELLED",
    BLOCKED_BY_POLICY: "BLOCKED_BY_POLICY",
  });

  const SPECIALIST_AGENTS = Object.freeze({
    MAIN_ORCHESTRATOR: { id: "MainOrchestratorAgent", label: "Main Orchestrator", avatar: "MYRAA" },
    PLANNING: { id: "PlanningAgent", label: "Planning Agent", avatar: "SAGE" },
    ANDROID_DEV: { id: "AndroidDevelopmentAgent", label: "Android Automation & Dev Agent", avatar: "MYRAA" },
    SOFTWARE_ENG: { id: "SoftwareEngineeringAgent", label: "Software Engineering Agent", avatar: "CODEX" },
    DEBUGGING: { id: "DebuggingAgent", label: "Debugging Agent", avatar: "CODEX" },
    TESTING_VERIFICATION: { id: "TestingVerificationAgent", label: "Testing & Verification Agent", avatar: "CODEX" },
    CYBERSECURITY: { id: "CybersecurityAgent", label: "Cybersecurity Monitor Agent", avatar: "SENTINEL" },
    RESEARCH: { id: "ResearchAgent", label: "Research & Web Agent", avatar: "SAGE" },
    DOCUMENTATION: { id: "DocumentationAgent", label: "Documentation Agent", avatar: "SAGE" },
    GITHUB_DEVOPS: { id: "GitHubDevOpsAgent", label: "GitHub & DevOps Agent", avatar: "CODEX" },
    MEMORY_CONTEXT: { id: "MemoryContextAgent", label: "Memory & Context Agent", avatar: "MYRAA" },
    USER_INTERFACE: { id: "UserInterfaceAgent", label: "3D Avatar & UI Agent", avatar: "PIXEL" },
  });

  const GATED_APPROVAL_ACTIONS = new Set([
    "CALL_CONTACT",
    "SEND_SMS",
    "SEND_WHATSAPP_MESSAGE",
    "CREATE_REMINDER",
    "CREATE_CALENDAR_EVENT",
  ]);

  const tasksMap = new Map();
  const listeners = new Set();
  let emergencyStopEngaged = false;
  let activeAvatarRole = "MYRAA";

  function redact(text) {
    if (window.MyraaSecurityPolicyEngine?.redactSensitiveText) {
      return window.MyraaSecurityPolicyEngine.redactSensitiveText(String(text || ""));
    }
    return String(text || "");
  }

  function notifyTaskListeners() {
    const snapshot = getAllTasks();
    try {
      localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(snapshot.slice(-50)));
    } catch {}
    listeners.forEach((fn) => {
      try {
        fn(snapshot, { emergencyStopEngaged, activeAvatarRole });
      } catch {}
    });
  }

  function routeIntentToSpecialist(actionOrToolName, payload) {
    const name = String(actionOrToolName || "").toUpperCase();
    const text = String(payload?.query || payload?.message || payload?.text || "").toLowerCase();

    if (name === "SAVECUSTOMMEMORY" || name.includes("MEMORY")) {
      return SPECIALIST_AGENTS.MEMORY_CONTEXT;
    }
    if (name === "CHANGEBACKGROUND" || name === "CONTROL_3D_CAMERA") {
      return SPECIALIST_AGENTS.USER_INTERFACE;
    }
    if (name.includes("BROWSER") || name === "WEB_SEARCH" || name === "YOUTUBE_SEARCH" || name === "OPEN_MAPS") {
      return SPECIALIST_AGENTS.RESEARCH;
    }
    if (name === "READ_NOTIFICATION" || text.includes("security") || text.includes("scan")) {
      return SPECIALIST_AGENTS.CYBERSECURITY;
    }
    if (text.includes("code") || text.includes("kotlin") || text.includes("gradle") || text.includes("python")) {
      return SPECIALIST_AGENTS.SOFTWARE_ENG;
    }
    if (text.includes("git") || text.includes("github") || text.includes("deploy")) {
      return SPECIALIST_AGENTS.GITHUB_DEVOPS;
    }
    return SPECIALIST_AGENTS.ANDROID_DEV;
  }

  function createTask({ title, actionName, payload, model = "gemini-3.1-flash-live" }) {
    const specialist = routeIntentToSpecialist(actionName, payload);
    activeAvatarRole = specialist.avatar;
    const taskId = "task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    const record = {
      taskId,
      title: redact(title || `Execute ${actionName}`),
      actionName: String(actionName || "TASK"),
      activeAgent: specialist.id,
      activeAgentLabel: specialist.label,
      avatarRole: specialist.avatar,
      selectedModel: model,
      state: TASK_STATES.CREATED,
      currentStep: "Task created",
      completedSteps: [],
      remainingSteps: ["Plan & Policy Check", "Execute Tool", "Verify Outcome"],
      filesRead: [],
      filesModified: [],
      terminalStatus: "IDLE",
      testStatus: "NOT_RUN",
      buildStatus: "READY",
      errors: [],
      recoveryAttempts: 0,
      maxRetries: 2,
      approvalRequests: [],
      verificationStatus: "PENDING",
      verified: false,
      paused: false,
      createdAt: now,
      updatedAt: now,
    };

    tasksMap.set(taskId, record);
    notifyTaskListeners();
    return record;
  }

  function transitionTaskState(taskId, nextState, stepDescription) {
    const rec = tasksMap.get(taskId);
    if (!rec) return { ok: false, error: "Task not found" };

    // Enforce strict state machine invariant: Cannot mark COMPLETED unless currently in VERIFYING and verified === true
    if (nextState === TASK_STATES.COMPLETED) {
      if (rec.state !== TASK_STATES.VERIFYING || !rec.verified) {
        const err = "State invariant violation: Task cannot be marked COMPLETED before VERIFYING.";
        rec.errors.push(err);
        notifyTaskListeners();
        return { ok: false, error: err };
      }
    }

    rec.state = nextState;
    if (stepDescription) {
      rec.currentStep = redact(stepDescription);
    }
    rec.updatedAt = new Date().toISOString();
    notifyTaskListeners();
    return { ok: true, task: rec };
  }

  function completeStep(taskId, stepName) {
    const rec = tasksMap.get(taskId);
    if (!rec) return;
    const clean = redact(stepName);
    rec.completedSteps.push(clean);
    if (rec.remainingSteps.length > 0) {
      rec.remainingSteps.shift();
    }
    rec.updatedAt = new Date().toISOString();
    notifyTaskListeners();
  }

  function verifyAndCompleteTask(taskId, toolResult) {
    const rec = tasksMap.get(taskId);
    if (!rec) return { ok: false, error: "Task not found" };

    transitionTaskState(taskId, TASK_STATES.VERIFYING, "Verifying execution outcome...");

    const isSuccess =
      toolResult &&
      toolResult.ok !== false &&
      toolResult.status !== "BLOCKED_BY_POLICY" &&
      !toolResult.error;

    if (!isSuccess) {
      rec.verificationStatus = "FAILED";
      const errMsg = redact(toolResult?.error || "Verification failed.");
      rec.errors.push(errMsg);
      transitionTaskState(taskId, TASK_STATES.FAILED, errMsg);
      return { ok: false, task: rec };
    }

    rec.verified = true;
    rec.verificationStatus = "VERIFIED";
    completeStep(taskId, "Verify Outcome");
    return transitionTaskState(
      taskId,
      TASK_STATES.COMPLETED,
      redact(toolResult.message || toolResult.result || "Verified and completed.")
    );
  }

  async function superviseExecution({ title, actionName, payload, executorFn, maxRetries = 2 }) {
    if (emergencyStopEngaged) {
      return {
        ok: false,
        status: "CANCELLED",
        error: "Emergency Stop is active. Resume agents in the Task Monitor before executing new actions.",
      };
    }

    const task = createTask({ title, actionName, payload });
    task.maxRetries = maxRetries;

    // Step 1: Planning & Security Policy Check
    transitionTaskState(task.taskId, TASK_STATES.PLANNING, "Checking security policy and permissions...");
    if (window.MyraaSecurityPolicyEngine) {
      const decision = window.MyraaSecurityPolicyEngine.evaluateActionPolicy({
        action: actionName,
        ...(payload || {}),
      });
      if (!decision.allowed) {
        task.verificationStatus = "BLOCKED_BY_POLICY";
        task.errors.push(decision.reason);
        transitionTaskState(task.taskId, TASK_STATES.BLOCKED_BY_POLICY, decision.reason);
        return { ok: false, status: "BLOCKED_BY_POLICY", error: decision.reason, taskId: task.taskId };
      }
    }
    completeStep(task.taskId, "Plan & Policy Check");

    // Step 2: Check if user approval is required
    const actUpper = String(payload?.action || actionName || "").toUpperCase();
    if (GATED_APPROVAL_ACTIONS.has(actUpper) && !payload?.confirmed) {
      task.approvalRequests.push(`User confirmation required for ${actUpper}`);
      transitionTaskState(task.taskId, TASK_STATES.AWAITING_APPROVAL, `Awaiting user confirmation for ${actUpper}`);
      const res = await executorFn();
      return { ...res, taskId: task.taskId };
    }

    // Step 3: Execute with bounded recovery retries
    let attempt = 0;
    while (attempt <= task.maxRetries) {
      if (emergencyStopEngaged || task.state === TASK_STATES.CANCELLED) {
        transitionTaskState(task.taskId, TASK_STATES.CANCELLED, "Cancelled during execution.");
        return { ok: false, status: "CANCELLED", error: "Task cancelled.", taskId: task.taskId };
      }

      if (attempt > 0) {
        task.recoveryAttempts = attempt;
        transitionTaskState(task.taskId, TASK_STATES.RECOVERING, `Recovery attempt ${attempt} of ${task.maxRetries}...`);
      } else {
        transitionTaskState(task.taskId, TASK_STATES.EXECUTING, `Executing via ${task.activeAgent}...`);
      }

      try {
        const result = await executorFn();
        if (result && result.status === "BLOCKED_BY_POLICY") {
          task.verificationStatus = "BLOCKED_BY_POLICY";
          task.errors.push(result.error || "Blocked by policy");
          transitionTaskState(task.taskId, TASK_STATES.BLOCKED_BY_POLICY, result.error || "Blocked by policy");
          return { ...result, taskId: task.taskId };
        }
        if (result && result.status === "confirmation_required") {
          task.approvalRequests.push(`Confirmation token issued for ${actUpper}`);
          transitionTaskState(task.taskId, TASK_STATES.AWAITING_APPROVAL, `Waiting for user tap confirmation`);
          return { ...result, taskId: task.taskId };
        }
        if (result && result.ok === false && attempt < task.maxRetries) {
          attempt++;
          continue;
        }
        completeStep(task.taskId, "Execute Tool");
        verifyAndCompleteTask(task.taskId, result || { ok: true });
        return { ...(result || { ok: true }), taskId: task.taskId };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (attempt < task.maxRetries) {
          attempt++;
          continue;
        }
        task.errors.push(redact(msg));
        transitionTaskState(task.taskId, TASK_STATES.FAILED, `Failed after ${attempt + 1} attempts: ${msg}`);
        return { ok: false, error: msg, taskId: task.taskId };
      }
    }
  }

  function pauseTask(taskId) {
    const rec = tasksMap.get(taskId);
    if (!rec) return false;
    rec.paused = !rec.paused;
    rec.currentStep = rec.paused ? "Paused by user" : "Resumed by user";
    notifyTaskListeners();
    return rec.paused;
  }

  function cancelTask(taskId) {
    const rec = tasksMap.get(taskId);
    if (!rec) return false;
    transitionTaskState(taskId, TASK_STATES.CANCELLED, "Cancelled by user.");
    return true;
  }

  function emergencyStopAll() {
    emergencyStopEngaged = true;
    for (const rec of tasksMap.values()) {
      if (
        rec.state !== TASK_STATES.COMPLETED &&
        rec.state !== TASK_STATES.FAILED &&
        rec.state !== TASK_STATES.CANCELLED &&
        rec.state !== TASK_STATES.BLOCKED_BY_POLICY
      ) {
        rec.state = TASK_STATES.CANCELLED;
        rec.currentStep = "Halted by Emergency Stop";
        rec.updatedAt = new Date().toISOString();
      }
    }
    if (window.MyraaSecurityPolicyEngine) {
      window.MyraaSecurityPolicyEngine.recordAuditEvent(
        "HIGH",
        "AGENT_SUPERVISOR",
        "EMERGENCY_STOP",
        "CANCELLED",
        "User triggered Emergency Stop; all active tasks halted."
      );
    }
    try {
      window.speechSynthesis?.cancel();
    } catch {}
    notifyTaskListeners();
    return true;
  }

  function resumeFromEmergencyStop() {
    emergencyStopEngaged = false;
    notifyTaskListeners();
    return true;
  }

  function getAllTasks() {
    return Array.from(tasksMap.values());
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  const supervisorApi = Object.freeze({
    TASK_STATES,
    SPECIALIST_AGENTS,
    createTask,
    transitionTaskState,
    completeStep,
    verifyAndCompleteTask,
    superviseExecution,
    routeIntentToSpecialist,
    pauseTask,
    cancelTask,
    emergencyStopAll,
    resumeFromEmergencyStop,
    isEmergencyStopActive: () => emergencyStopEngaged,
    getActiveAvatarRole: () => activeAvatarRole,
    getAllTasks,
    subscribe,
  });

  window.MyraaAgentSupervisor = supervisorApi;
})();
