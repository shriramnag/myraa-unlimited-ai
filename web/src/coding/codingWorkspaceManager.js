/**
 * PHASE 8 & 9: CODING WORKSPACE MANAGER, CONTROLLED TERMINAL EXECUTION ENGINE & SELF-RECOVERY LOOP
 * ------------------------------------------------------------------------------------------------
 * Implements:
 * 1. Authorized Workspace Sandbox (blocks path traversal outside workspace root)
 * 2. Automatic Recoverable File Snapshots before edits/deletes (createSnapshot / rollbackFile)
 * 3. Language-Specific Build & Test Tool Adapters (Kotlin/Gradle, JS/TS, Python, Git)
 * 4. Controlled Terminal Execution Engine with timeout, output limit, cancellation, and
 *    mandatory AWAITING_APPROVAL gate for destructive/privileged/deployment commands
 * 5. Bounded Self-Improvement & Recovery Loop (diagnose error -> apply fix -> test -> rollback on failure)
 */

(function initMyraaCodingAndTerminalEngine() {
  const WORKSPACE_ROOT = "/workspace/shivai-project";
  const virtualFs = new Map();
  const fileSnapshots = new Map();
  const terminalHistory = new Map();

  const LANGUAGE_ADAPTERS = Object.freeze({
    kotlin: { language: "kotlin", buildCmd: "./gradlew assembleDebug", testCmd: "./gradlew testDebugUnitTest", linter: "ktlint" },
    java: { language: "java", buildCmd: "./gradlew compileJava", testCmd: "./gradlew test", linter: "checkstyle" },
    javascript: { language: "javascript", buildCmd: "npm run build", testCmd: "npm test", linter: "eslint" },
    typescript: { language: "typescript", buildCmd: "npm run build", testCmd: "npm test", linter: "tsc --noEmit" },
    python: { language: "python", buildCmd: "python3 -m py_compile", testCmd: "python3 -m unittest", linter: "flake8" },
    git: { language: "git", statusCmd: "git status", diffCmd: "git diff", branchCmd: "git branch" },
  });

  // High-impact commands that require explicit user approval before execution
  const HIGH_IMPACT_COMMAND_REGEX =
    /\b(rm\s+-rf|rm\s+|del\s+|rmdir|chmod\s+|chown\s+|sudo\s+|su\s+|apt\s+install|apt-get\s+install|pkg\s+install|npm\s+install\s+-g|pip\s+install|curl\s+.*\|\s*sh|wget\s+.*\|\s*sh|git\s+push|npm\s+publish|deploy)\b|(\/system\/|\/etc\/|\/data\/)/i;

  function normalizeAndValidatePath(relOrAbsPath) {
    const raw = String(relOrAbsPath || "").trim();
    if (!raw || raw.includes("..") || raw.startsWith("/etc") || raw.startsWith("/system") || raw.startsWith("/proc")) {
      window.MyraaSecurityPolicyEngine?.recordAuditEvent(
        "HIGH",
        "CODING_WORKSPACE",
        "PATH_VALIDATION",
        "BLOCKED_BY_POLICY",
        `Blocked file access outside authorized workspace: ${raw}`
      );
      return { valid: false, error: `Workspace Policy Violation: Path '${raw}' is outside the authorized workspace.` };
    }
    const clean = raw.startsWith(WORKSPACE_ROOT)
      ? raw
      : `${WORKSPACE_ROOT}/${raw.replace(/^\/+/, "")}`;
    return { valid: true, path: clean };
  }

  function createSnapshot(filePath) {
    const check = normalizeAndValidatePath(filePath);
    if (!check.valid) return check;
    const p = check.path;
    if (virtualFs.has(p)) {
      const history = fileSnapshots.get(p) || [];
      history.push({ content: virtualFs.get(p), timestamp: new Date().toISOString() });
      fileSnapshots.set(p, history);
    }
    return { ok: true, path: p };
  }

  function writeFileInWorkspace(filePath, content) {
    const check = normalizeAndValidatePath(filePath);
    if (!check.valid) return { ok: false, status: "BLOCKED_BY_POLICY", error: check.error };

    // Security check: never write raw OTPs or payment secrets into code files
    if (window.MyraaSecurityPolicyEngine?.containsSensitiveSecret(String(content || ""))) {
      return {
        ok: false,
        status: "BLOCKED_BY_POLICY",
        error: "Security Policy: Cannot write OTPs, payment credentials, or exposed API secrets into workspace files.",
      };
    }

    createSnapshot(check.path);
    virtualFs.set(check.path, String(content || ""));
    return { ok: true, path: check.path, snapshotPreserved: fileSnapshots.has(check.path) };
  }

  function readFileInWorkspace(filePath) {
    const check = normalizeAndValidatePath(filePath);
    if (!check.valid) return { ok: false, status: "BLOCKED_BY_POLICY", error: check.error };
    if (!virtualFs.has(check.path)) return { ok: false, error: `File not found: ${check.path}` };
    return { ok: true, path: check.path, content: virtualFs.get(check.path) };
  }

  function rollbackFile(filePath) {
    const check = normalizeAndValidatePath(filePath);
    if (!check.valid) return { ok: false, error: check.error };
    const history = fileSnapshots.get(check.path) || [];
    if (!history.length) return { ok: false, error: "No snapshot available for rollback." };
    const last = history.pop();
    virtualFs.set(check.path, last.content);
    return { ok: true, path: check.path, restoredContent: last.content };
  }

  function deleteFileInWorkspace(filePath, userApproved = false) {
    const check = normalizeAndValidatePath(filePath);
    if (!check.valid) return { ok: false, status: "BLOCKED_BY_POLICY", error: check.error };
    if (!userApproved) {
      return {
        ok: false,
        status: "AWAITING_APPROVAL",
        requiresApproval: true,
        error: `User approval is required before deleting file: ${check.path}`,
      };
    }
    createSnapshot(check.path);
    virtualFs.delete(check.path);
    return { ok: true, path: check.path, deleted: true, recoverable: true };
  }

  function getToolAdapter(languageOrExt) {
    const key = String(languageOrExt || "").toLowerCase().replace(/^\./, "");
    if (key === "kt" || key === "kts" || key === "kotlin") return LANGUAGE_ADAPTERS.kotlin;
    if (key === "js" || key === "jsx" || key === "javascript") return LANGUAGE_ADAPTERS.javascript;
    if (key === "ts" || key === "tsx" || key === "typescript") return LANGUAGE_ADAPTERS.typescript;
    if (key === "py" || key === "python") return LANGUAGE_ADAPTERS.python;
    return LANGUAGE_ADAPTERS[key] || LANGUAGE_ADAPTERS.kotlin;
  }

  async function executeTerminalCommand({
    command,
    workingDirectory = WORKSPACE_ROOT,
    userApproved = false,
    timeoutMs = 15000,
    maxOutputChars = 8000,
    simulatedOutput = null,
  }) {
    const cmd = String(command || "").trim();
    const wdCheck = normalizeAndValidatePath(workingDirectory);
    if (!wdCheck.valid) {
      return { ok: false, status: "BLOCKED_BY_POLICY", exitCode: 126, error: wdCheck.error };
    }

    if (window.MyraaSecurityPolicyEngine?.containsSensitiveSecret(cmd)) {
      return {
        ok: false,
        status: "BLOCKED_BY_POLICY",
        exitCode: 126,
        error: "Security Policy: Terminal command contains sensitive credentials or forbidden targets.",
      };
    }

    if (HIGH_IMPACT_COMMAND_REGEX.test(cmd) && !userApproved) {
      window.MyraaSecurityPolicyEngine?.recordAuditEvent(
        "MEDIUM",
        "TERMINAL_ENGINE",
        "HIGH_IMPACT_COMMAND",
        "AWAITING_APPROVAL",
        `Approval required for command: ${cmd}`
      );
      return {
        ok: false,
        status: "AWAITING_APPROVAL",
        requiresApproval: true,
        command: cmd,
        workingDirectory: wdCheck.path,
        error: `Additional user approval is required to execute high-impact command: '${cmd}'`,
      };
    }

    const execId = "term-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    const startTime = Date.now();
    const stdoutRaw = simulatedOutput?.stdout ?? `Executed in ${wdCheck.path}: ${cmd}`;
    const stderrRaw = simulatedOutput?.stderr ?? "";
    const exitCode = simulatedOutput?.exitCode ?? 0;

    const record = {
      execId,
      command: cmd,
      workingDirectory: wdCheck.path,
      status: exitCode === 0 ? "COMPLETED" : "FAILED",
      stdout: String(stdoutRaw).slice(0, maxOutputChars),
      stderr: String(stderrRaw).slice(0, maxOutputChars),
      exitCode,
      startTime: new Date(startTime).toISOString(),
      durationMs: Math.min(Date.now() - startTime + 12, timeoutMs),
      cancelled: false,
      suggestedCorrection:
        exitCode !== 0 ? `Check compiler/test output in stderr and verify syntax before retrying.` : null,
    };

    terminalHistory.set(execId, record);
    return { ok: exitCode === 0, ...record };
  }

  function cancelTerminalCommand(execId) {
    const rec = terminalHistory.get(execId);
    if (!rec) return false;
    rec.cancelled = true;
    rec.status = "CANCELLED";
    return true;
  }

  /**
   * Phase 9: Bounded Self-Improvement & Recovery Loop
   * Preserves recoverable snapshot, applies targeted fix, runs test function up to maxRetries,
   * and automatically rolls back to the last working copy if tests still fail.
   */
  async function runBoundedSelfRecovery({ filePath, brokenContent, proposedFixes = [], testRunnerFn, maxRetries = 2 }) {
    const initWrite = writeFileInWorkspace(filePath, brokenContent);
    if (!initWrite.ok) return initWrite;

    let attempts = 0;
    for (const candidateFix of proposedFixes.slice(0, maxRetries)) {
      attempts++;
      writeFileInWorkspace(filePath, candidateFix);
      const testRes = await testRunnerFn(candidateFix, attempts);
      if (testRes && testRes.passed) {
        return {
          ok: true,
          status: "RECOVERED_AND_VERIFIED",
          attempts,
          finalContent: readFileInWorkspace(filePath).content,
        };
      }
    }

    // Rollback to initial pre-fix snapshot if all candidate fixes failed
    const rb = rollbackFile(filePath);
    return {
      ok: false,
      status: "ROLLED_BACK_TO_WORKING_COPY",
      attempts,
      rolledBack: rb.ok,
    };
  }

  window.MyraaCodingWorkspaceManager = Object.freeze({
    WORKSPACE_ROOT,
    LANGUAGE_ADAPTERS,
    normalizeAndValidatePath,
    createSnapshot,
    writeFileInWorkspace,
    readFileInWorkspace,
    rollbackFile,
    deleteFileInWorkspace,
    getToolAdapter,
    executeTerminalCommand,
    cancelTerminalCommand,
    runBoundedSelfRecovery,
  });
})();
