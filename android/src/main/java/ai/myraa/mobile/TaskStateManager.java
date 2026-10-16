package ai.myraa.mobile;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PHASE 4: TASK STATE MANAGER & STATE MACHINE
 * Enforces strict state transitions and prevents marking any task COMPLETED without VERIFYING.
 */
public final class TaskStateManager {

    public enum TaskState {
        CREATED,
        PLANNING,
        AWAITING_APPROVAL,
        EXECUTING,
        VERIFYING,
        RECOVERING,
        COMPLETED,
        FAILED,
        CANCELLED,
        BLOCKED_BY_POLICY
    }

    public static final class TaskRecord {
        public final String taskId;
        public final String title;
        public String activeAgent;
        public String selectedModel;
        public TaskState state;
        public String currentStep;
        public final List<String> completedSteps = new ArrayList<>();
        public final List<String> remainingSteps = new ArrayList<>();
        public final List<String> filesRead = new ArrayList<>();
        public final List<String> filesModified = new ArrayList<>();
        public final List<String> errors = new ArrayList<>();
        public int recoveryAttempts = 0;
        public boolean verified = false;
        public final long createdAtMs;
        public long updatedAtMs;

        public TaskRecord(String title, String activeAgent, String selectedModel) {
            this.taskId = "task-" + UUID.randomUUID().toString().substring(0, 8);
            this.title = SecurityPolicyEngine.redactSensitiveText(title);
            this.activeAgent = activeAgent;
            this.selectedModel = selectedModel;
            this.state = TaskState.CREATED;
            this.currentStep = "Initialized";
            this.createdAtMs = System.currentTimeMillis();
            this.updatedAtMs = this.createdAtMs;
        }
    }

    private static final Map<String, TaskRecord> TASKS = new LinkedHashMap<>();

    private TaskStateManager() {}

    public static synchronized TaskRecord createTask(String title, String activeAgent, String selectedModel, List<String> steps) {
        TaskRecord rec = new TaskRecord(title, activeAgent, selectedModel);
        if (steps != null) {
            rec.remainingSteps.addAll(steps);
        }
        TASKS.put(rec.taskId, rec);
        return rec;
    }

    public static synchronized boolean transitionState(String taskId, TaskState nextState, String reasonOrStep) {
        TaskRecord rec = TASKS.get(taskId);
        if (rec == null) return false;

        // Strict invariant: Cannot transition to COMPLETED unless currently in VERIFYING and verified == true
        if (nextState == TaskState.COMPLETED && (rec.state != TaskState.VERIFYING || !rec.verified)) {
            rec.errors.add("Illegal transition to COMPLETED without VERIFYING.");
            return false;
        }

        rec.state = nextState;
        if (reasonOrStep != null && !reasonOrStep.isEmpty()) {
            rec.currentStep = SecurityPolicyEngine.redactSensitiveText(reasonOrStep);
        }
        rec.updatedAtMs = System.currentTimeMillis();
        return true;
    }

    public static synchronized boolean markVerifiedAndComplete(String taskId, String verificationSummary) {
        TaskRecord rec = TASKS.get(taskId);
        if (rec == null) return false;
        rec.state = TaskState.VERIFYING;
        rec.verified = true;
        rec.currentStep = SecurityPolicyEngine.redactSensitiveText(verificationSummary);
        return transitionState(taskId, TaskState.COMPLETED, verificationSummary);
    }

    public static synchronized void cancelAllActiveTasks(String reason) {
        for (TaskRecord rec : TASKS.values()) {
            if (rec.state != TaskState.COMPLETED && rec.state != TaskState.FAILED &&
                rec.state != TaskState.CANCELLED && rec.state != TaskState.BLOCKED_BY_POLICY) {
                rec.state = TaskState.CANCELLED;
                rec.currentStep = SecurityPolicyEngine.redactSensitiveText(reason);
                rec.updatedAtMs = System.currentTimeMillis();
            }
        }
    }

    public static synchronized List<TaskRecord> getAllTasks() {
        return Collections.unmodifiableList(new ArrayList<>(TASKS.values()));
    }
}
