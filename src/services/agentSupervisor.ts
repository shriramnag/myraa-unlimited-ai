import { CharacterRole, TaskRecord, TaskState } from "../types";

export const SPECIALIST_AGENTS = [
  { id: "MainOrchestratorAgent", label: "Main Orchestrator", avatar: "MYRAA" as CharacterRole },
  { id: "PlanningAgent", label: "Planning Agent", avatar: "SAGE" as CharacterRole },
  { id: "AndroidDevAgent", label: "Android Automation Agent", avatar: "MYRAA" as CharacterRole },
  { id: "SoftwareEngAgent", label: "Software Engineering Agent", avatar: "CODEX" as CharacterRole },
  { id: "DebuggingAgent", label: "Debugging Agent", avatar: "CODEX" as CharacterRole },
  { id: "TestingAgent", label: "Verification Agent", avatar: "CODEX" as CharacterRole },
  { id: "CybersecurityAgent", label: "Security & Privacy Agent", avatar: "SENTINEL" as CharacterRole },
  { id: "ResearchAgent", label: "Deep Research Agent", avatar: "SAGE" as CharacterRole },
  { id: "DocumentationAgent", label: "Writing & Rewrite Agent", avatar: "AURA" as CharacterRole },
  { id: "MemoryContextAgent", label: "Brain Memory Agent", avatar: "MYRAA" as CharacterRole },
  { id: "UserInterfaceAgent", label: "Media & UI Agent", avatar: "PIXEL" as CharacterRole },
];

class AgentSupervisorService {
  private tasks: Map<string, TaskRecord> = new Map();
  private listeners: Set<(tasks: TaskRecord[]) => void> = new Set();
  private emergencyStopEngaged: boolean = false;
  private activeAvatarRole: CharacterRole = "MYRAA";

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
    if (name.includes("memory") || name.includes("brain") || name.includes("याद")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "MemoryContextAgent")!;
    }
    if (name.includes("research") || name.includes("search") || name.includes("रिसर्च")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "ResearchAgent")!;
    }
    if (name.includes("rewrite") || name.includes("writing") || name.includes("slop")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "DocumentationAgent")!;
    }
    if (name.includes("security") || name.includes("shield") || name.includes("vault")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "CybersecurityAgent")!;
    }
    if (name.includes("code") || name.includes("bug")) {
      return SPECIALIST_AGENTS.find((a) => a.id === "SoftwareEngAgent")!;
    }
    return SPECIALIST_AGENTS.find((a) => a.id === "AndroidDevAgent")!;
  }

  public createTask({
    title,
    actionName,
    avatarRole,
    model = "gemini-3.8-live",
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
      remainingSteps: ["Policy Check", "Execute Tool", "Verify Outcome"],
      errors: [],
      recoveryAttempts: 0,
      maxRetries: 1,
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

  public verifyAndCompleteTask(
    taskId: string,
    result: { ok?: boolean; success?: boolean; message?: string; error?: string }
  ) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    const isSuccess = Boolean(result.success ?? result.ok);
    this.transitionState(taskId, "VERIFYING", "Verifying execution outcome...");

    if (!isSuccess) {
      const reason = result.error || result.message || "Execution failed";
      task.verificationStatus = "FAILED";
      task.verified = false;
      task.errors.push(reason);
      this.transitionState(taskId, "FAILED", reason);
      return;
    }

    task.verified = true;
    task.verificationStatus = "VERIFIED";
    task.completedSteps.push("Verify Outcome");
    if (task.remainingSteps.length > 0) task.remainingSteps.shift();
    this.transitionState(taskId, "COMPLETED", result.message || "Task verified and completed.");
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
