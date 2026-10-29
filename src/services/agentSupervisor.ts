import { CharacterRole, TaskRecord, TaskState } from "../types";

export const SPECIALIST_AGENTS = [
  { id: "MainOrchestratorAgent", label: "Main Orchestrator", avatar: "MYRAA" as CharacterRole },
  { id: "PlanningAgent", label: "Planning Agent", avatar: "SAGE" as CharacterRole },
  { id: "AndroidDevAgent", label: "Android Automation & Dev Agent", avatar: "MYRAA" as CharacterRole },
  { id: "SoftwareEngAgent", label: "Software Engineering Agent", avatar: "CODEX" as CharacterRole },
  { id: "DebuggingAgent", label: "Debugging Agent", avatar: "CODEX" as CharacterRole },
  { id: "TestingAgent", label: "Testing & Verification Agent", avatar: "CODEX" as CharacterRole },
  { id: "CybersecurityAgent", label: "Cybersecurity Monitor Agent", avatar: "SENTINEL" as CharacterRole },
  { id: "ResearchAgent", label: "Research & Web Agent", avatar: "SAGE" as CharacterRole },
  { id: "DocumentationAgent", label: "Documentation Agent", avatar: "SAGE" as CharacterRole },
  { id: "GitHubDevOpsAgent", label: "GitHub & DevOps Agent", avatar: "CODEX" as CharacterRole },
  { id: "MemoryContextAgent", label: "Memory & Context Agent", avatar: "MYRAA" as CharacterRole },
  { id: "UserInterfaceAgent", label: "3D Avatar & UI Agent", avatar: "PIXEL" as CharacterRole },
];

class AgentSupervisorService {
  private tasks: Map<string, TaskRecord> = new Map();
  private listeners: Set<(tasks: TaskRecord[]) => void> = new Set();
  private emergencyStopEngaged: boolean = false;
  private activeAvatarRole: CharacterRole = "MYRAA";

  constructor() {
    this.createInitialWelcomeTask();
  }

  private createInitialWelcomeTask() {
    const task = this.createTask({
      title: "System Initialization & Holographic Link",
      actionName: "SYSTEM_BOOT",
      avatarRole: "MYRAA",
      model: "Google Gemini Live",
    });
    this.transitionState(task.taskId, "EXECUTING", "Activating 3D avatar & voice engine...");
    this.transitionState(task.taskId, "VERIFYING", "Verifying on-device brain DB & Android bridge...");
    this.verifyAndCompleteTask(task.taskId, { ok: true, message: "MYRAA v3.0 / SHIV AI is online and ready for Shri Ram Nag." });
  }

  public subscribe(fn: (tasks: TaskRecord[]) => void) {
    this.listeners.add(fn);
    fn(this.getAllTasks());
    return () => this.listeners.delete(fn);
  }

  private notify() {
    const list = this.getAllTasks();
    this.listeners.forEach((fn) => fn(list));
  }

  public getAllTasks(): TaskRecord[] {
    return Array.from(this.tasks.values()).reverse();
  }

  public isEmergencyStopActive(): boolean {
    return this.emergencyStopEngaged;
  }

  public getActiveAvatarRole(): CharacterRole {
    return this.activeAvatarRole;
  }

  public routeIntentToSpecialist(actionOrToolName: string): (typeof SPECIALIST_AGENTS)[0] {
    const name = actionOrToolName.toLowerCase();
    if (name.includes("memory") || name.includes("brain") || name.includes("fact")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "MemoryContextAgent")!;
    }
    if (name.includes("research") || name.includes("search") || name.includes("browse")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "ResearchAgent")!;
    }
    if (name.includes("security") || name.includes("scan") || name.includes("shield")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "CybersecurityAgent")!;
    }
    if (name.includes("code") || name.includes("bug") || name.includes("git")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "SoftwareEngAgent")!;
    }
    if (name.includes("ui") || name.includes("camera") || name.includes("avatar")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "UserInterfaceAgent")!;
    }
    return SPECIALIST_AGENTS.find((a) => a.id === "AndroidDevAgent")!;
  }

  public createTask({
    title,
    actionName,
    avatarRole,
    model = "Google Gemini Live",
  }: {
    title: string;
    actionName: string;
    avatarRole?: CharacterRole;
    model?: string;
  }): TaskRecord {
    const specialist = this.routeIntentToSpecialist(actionName);
    const assignedRole = avatarRole || specialist.avatar;
    this.activeAvatarRole = assignedRole;

    const taskId = "task-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5);
    const now = new Date().toLocaleTimeString();

    const record: TaskRecord = {
      taskId,
      title,
      actionName,
      activeAgent: specialist.id,
      activeAgentLabel: specialist.label,
      avatarRole: assignedRole,
      selectedModel: model,
      state: "CREATED",
      currentStep: "Task created",
      completedSteps: [],
      remainingSteps: ["Security Policy Check", "Execute Tool/Action", "Verify Outcome"],
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

    this.tasks.set(taskId, record);
    this.notify();
    return record;
  }

  public transitionState(taskId: string, nextState: TaskState, stepDescription?: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // Invariant Enforcement: cannot be marked COMPLETED without passing through VERIFYING
    if (nextState === "COMPLETED") {
      if (task.state !== "VERIFYING" || !task.verified) {
        task.errors.push("Invariant violation: Cannot complete without verification step.");
        task.state = "FAILED";
        this.notify();
        return;
      }
    }

    task.state = nextState;
    if (stepDescription) {
      task.currentStep = stepDescription;
    }
    task.updatedAt = new Date().toLocaleTimeString();
    this.notify();
  }

  public verifyAndCompleteTask(taskId: string, result: { ok: boolean; message?: string; error?: string }) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    this.transitionState(taskId, "VERIFYING", "Verifying execution outcome...");

    if (!result.ok) {
      task.verificationStatus = "FAILED";
      task.errors.push(result.error || "Verification failed");
      this.transitionState(taskId, "FAILED", result.error || "Execution failed");
      return;
    }

    task.verified = true;
    task.verificationStatus = "VERIFIED";
    task.completedSteps.push("Verify Outcome");
    if (task.remainingSteps.length > 0) task.remainingSteps.shift();

    this.transitionState(taskId, "COMPLETED", result.message || "Task completed and verified.");
  }

  public emergencyStop() {
    this.emergencyStopEngaged = true;
    for (const task of this.tasks.values()) {
      if (!["COMPLETED", "FAILED", "CANCELLED"].includes(task.state)) {
        task.state = "CANCELLED";
        task.currentStep = "Halted by Emergency Stop";
        task.updatedAt = new Date().toLocaleTimeString();
      }
    }
    this.notify();
  }

  public resumeAgents() {
    this.emergencyStopEngaged = false;
    this.notify();
  }
}

export const agentSupervisor = new AgentSupervisorService();
