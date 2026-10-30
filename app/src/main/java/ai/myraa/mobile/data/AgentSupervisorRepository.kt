package ai.myraa.mobile.data

import ai.myraa.mobile.model.CharacterRole
import ai.myraa.mobile.model.SpecialistAgent
import ai.myraa.mobile.model.TaskRecord
import ai.myraa.mobile.model.TaskState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class AgentSupervisorRepository {
    private val specialistAgents = listOf(
        SpecialistAgent("MainOrchestratorAgent", "Main Orchestrator", CharacterRole.MYRAA),
        SpecialistAgent("PlanningAgent", "Planning Agent", CharacterRole.SAGE),
        SpecialistAgent("AndroidDevAgent", "Android Automation Agent", CharacterRole.MYRAA),
        SpecialistAgent("SoftwareEngAgent", "SWE Software Agent", CharacterRole.CODEX),
        SpecialistAgent("DebuggingAgent", "Debugging Agent", CharacterRole.CODEX),
        SpecialistAgent("TestingAgent", "Testing & Verification Agent", CharacterRole.CODEX),
        SpecialistAgent("CybersecurityAgent", "Cybersecurity Monitor Agent", CharacterRole.SENTINEL),
        SpecialistAgent("ResearchAgent", "Research & Web Agent", CharacterRole.SAGE),
        SpecialistAgent("DocumentationAgent", "Documentation Agent", CharacterRole.SAGE),
        SpecialistAgent("GitHubDevOpsAgent", "GitHub DevOps Agent", CharacterRole.CODEX),
        SpecialistAgent("MemoryContextAgent", "Memory & Context Agent", CharacterRole.MYRAA),
        SpecialistAgent("UserInterfaceAgent", "3D Avatar & UI Agent", CharacterRole.PIXEL)
    )

    private val _tasks = MutableStateFlow<List<TaskRecord>>(emptyList())
    val tasks: StateFlow<List<TaskRecord>> = _tasks.asStateFlow()

    private val _isEmergencyStopActive = MutableStateFlow(false)
    val isEmergencyStopActive: StateFlow<Boolean> = _isEmergencyStopActive.asStateFlow()

    init {
        createInitialWelcomeTask()
    }

    private fun createInitialWelcomeTask() {
        val now = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val initialTask = TaskRecord(
            taskId = "task-boot-01",
            title = "System Boot & Holographic Sync",
            actionName = "SYSTEM_BOOT",
            activeAgent = "MainOrchestratorAgent",
            activeAgentLabel = "Main Orchestrator",
            avatarRole = CharacterRole.MYRAA,
            state = TaskState.VERIFYING,
            currentStep = "All 43 Native Android actions & 11 tools ready",
            completedSteps = mutableListOf("Initialize Memory", "Load Audio Engine", "Verify Security Shield"),
            remainingSteps = mutableListOf("Verify Outcome"),
            errors = mutableListOf(),
            verified = true,
            createdAt = now,
            updatedAt = now
        )
        initialTask.state = TaskState.COMPLETED
        _tasks.value = listOf(initialTask)
    }

    fun routeIntentToSpecialist(query: String): SpecialistAgent {
        val lower = query.lowercase(Locale.ROOT)
        return when {
            lower.contains("memory") || lower.contains("brain") || lower.contains("याद") ->
                specialistAgents.first { it.id == "MemoryContextAgent" }
            lower.contains("research") || lower.contains("search") || lower.contains("खोज") || lower.contains("रिसर्च") ->
                specialistAgents.first { it.id == "ResearchAgent" }
            lower.contains("security") || lower.contains("shield") || lower.contains("सुरक्षा") || lower.contains("scan") ->
                specialistAgents.first { it.id == "CybersecurityAgent" }
            lower.contains("code") || lower.contains("bug") || lower.contains("patch") || lower.contains("बग") || lower.contains("गिट") ->
                specialistAgents.first { it.id == "SoftwareEngAgent" }
            lower.contains("ui") || lower.contains("video") || lower.contains("avatar") || lower.contains("कैमरा") || lower.contains("पिक") ->
                specialistAgents.first { it.id == "UserInterfaceAgent" }
            else -> specialistAgents.first { it.id == "AndroidDevAgent" }
        }
    }

    fun createTask(title: String, actionName: String, explicitRole: CharacterRole? = null): TaskRecord {
        val specialist = routeIntentToSpecialist(actionName)
        val role = explicitRole ?: specialist.avatar
        val now = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        val task = TaskRecord(
            taskId = "task-" + UUID.randomUUID().toString().take(6),
            title = title,
            actionName = actionName,
            activeAgent = specialist.id,
            activeAgentLabel = specialist.label,
            avatarRole = role,
            state = TaskState.CREATED,
            currentStep = "Task created by user instruction",
            createdAt = now,
            updatedAt = now
        )
        val updated = _tasks.value.toMutableList()
        updated.add(0, task)
        _tasks.value = updated
        return task
    }

    fun transitionState(taskId: String, nextState: TaskState, stepDescription: String? = null) {
        val currentList = _tasks.value.toMutableList()
        val index = currentList.indexOfFirst { it.taskId == taskId }
        if (index != -1) {
            val task = currentList[index]

            // Invariant: cannot jump directly to COMPLETED without passing through VERIFYING
            if (nextState == TaskState.COMPLETED && (!task.verified || task.state != TaskState.VERIFYING)) {
                task.errors.add("Invariant violation: Cannot complete without prior verification.")
                task.state = TaskState.FAILED
                task.currentStep = "Verification check failed"
            } else {
                task.state = nextState
                if (stepDescription != null) {
                    task.currentStep = stepDescription
                }
            }
            task.updatedAt = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
            currentList[index] = task
            _tasks.value = currentList
        }
    }

    fun verifyAndCompleteTask(taskId: String, isOk: Boolean, message: String) {
        val currentList = _tasks.value.toMutableList()
        val index = currentList.indexOfFirst { it.taskId == taskId }
        if (index != -1) {
            val task = currentList[index]
            task.state = TaskState.VERIFYING
            task.currentStep = "Verifying outcome..."
            if (isOk) {
                task.verified = true
                task.completedSteps.add("Verify Outcome")
                task.state = TaskState.COMPLETED
                task.currentStep = message
            } else {
                task.verified = false
                task.errors.add(message)
                task.state = TaskState.FAILED
                task.currentStep = message
            }
            task.updatedAt = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
            currentList[index] = task
            _tasks.value = currentList
        }
    }

    fun emergencyStop() {
        _isEmergencyStopActive.value = true
        val currentList = _tasks.value.toMutableList()
        val now = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date())
        currentList.forEachIndexed { i, task ->
            if (task.state !in listOf(TaskState.COMPLETED, TaskState.FAILED, TaskState.CANCELLED)) {
                task.state = TaskState.CANCELLED
                task.currentStep = "Halted immediately by Emergency Stop"
                task.updatedAt = now
                currentList[i] = task
            }
        }
        _tasks.value = currentList
    }

    fun resumeAgents() {
        _isEmergencyStopActive.value = false
    }
}
