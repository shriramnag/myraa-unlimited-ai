package ai.myraa.mobile.model

enum class CharacterRole(
    val roleName: String,
    val hindiTitle: String,
    val specialty: String,
    val badge: String,
    val hexColor: String,
    val assetImage: String,
    val systemPersona: String
) {
    MYRAA(
        roleName = "शिव एआई • MYRAA",
        hindiTitle = "3D होलोग्राफिक AI साथी",
        specialty = "Voice Companion & Android Orchestration",
        badge = "🌸 MYRAA",
        hexColor = "#0A84FF",
        assetImage = "public/avatars/myraa.png",
        systemPersona = "Sweet, gentle anime heroine companion for Shri Ram Nag"
    ),
    CODEX(
        roleName = "शिव एआई • CODEX",
        hindiTitle = "SWE-Agent कोडिंग विशेषज्ञ",
        specialty = "Software Engineering & Bug Fixing",
        badge = "💻 CODEX",
        hexColor = "#00E676",
        assetImage = "public/avatars/codex.png",
        systemPersona = "Precise, intelligent autonomous software engineering specialist"
    ),
    AURA(
        roleName = "शिव एआई • AURA",
        hindiTitle = "क्लासिक ब्लोंड AI साथी",
        specialty = "Creative Synthesis & Design",
        badge = "✨ AURA",
        hexColor = "#F59E0B",
        assetImage = "public/avatars/aura.png",
        systemPersona = "Bright, creative and stylish anime companion"
    ),
    SENTINEL(
        roleName = "शिव एआई • SENTINEL",
        hindiTitle = "साइबर सुरक्षा मॉनिटर",
        specialty = "SkillSpector & App Integrity Shield",
        badge = "🛡️ SENTINEL",
        hexColor = "#FF6B6B",
        assetImage = "public/avatars/sentinel.png",
        systemPersona = "Vigilant cybersecurity and prompt injection guardian"
    ),
    SAGE(
        roleName = "शिव एआई • SAGE",
        hindiTitle = "डीप रिसर्च विशेषज्ञ",
        specialty = "gpt-researcher & Strategic Planning",
        badge = "🔬 SAGE",
        hexColor = "#6C63FF",
        assetImage = "public/avatars/sage.png",
        systemPersona = "Scholarly, analytical deep research and intelligence specialist"
    ),
    PIXEL(
        roleName = "शिव एआई • PIXEL / VORTEX",
        hindiTitle = "मीडिया व PPT विशेषज्ञ",
        specialty = "Video-Use & Interactive UI",
        badge = "🎬 PIXEL",
        hexColor = "#F59E0B",
        assetImage = "public/avatars/pixel.png",
        systemPersona = "Dynamic media, slide deck, and UI graphics engineer"
    )
}

enum class TaskState(val label: String, val badgeColor: String) {
    CREATED("Created", "#64748B"),
    PLANNING("Planning", "#8B5CF6"),
    AWAITING_APPROVAL("Awaiting Approval", "#F59E0B"),
    EXECUTING("Executing", "#0EA5E9"),
    VERIFYING("Verifying", "#6366F1"),
    RECOVERING("Recovering", "#F97316"),
    COMPLETED("Verified & Done", "#00E676"),
    FAILED("Failed", "#F43F5E"),
    CANCELLED("Cancelled", "#475569"),
    BLOCKED_BY_POLICY("Blocked by Policy", "#DC2626")
}

data class TaskRecord(
    val taskId: String,
    val title: String,
    val actionName: String,
    val activeAgent: String,
    val activeAgentLabel: String,
    val avatarRole: CharacterRole,
    val selectedModel: String = "Google Gemini Live",
    var state: TaskState = TaskState.CREATED,
    var currentStep: String = "Task created",
    val completedSteps: MutableList<String> = mutableListOf(),
    val remainingSteps: MutableList<String> = mutableListOf("Security Policy Check", "Execute Tool/Action", "Verify Outcome"),
    val errors: MutableList<String> = mutableListOf(),
    var verified: Boolean = false,
    val createdAt: String,
    var updatedAt: String
)

data class SpecialistAgent(
    val id: String,
    val label: String,
    val avatar: CharacterRole
)

data class ShivAiTool(
    val id: String,
    val index: Int,
    val name: String,
    val category: String,
    val iconEmoji: String,
    val upstreamRepo: String,
    val hindiDesc: String,
    val keywords: List<String>
)

data class BrainMemory(
    val id: String,
    val category: String, // IDENTITY, PREFERENCE, FACT, PROJECT, HABIT, RELATIONSHIP
    val key: String,
    val content: String,
    val timestamp: String,
    val tags: List<String>
)

data class AuditLogEntry(
    val id: String,
    val timestampMs: Long,
    val severity: String,
    val subsystem: String,
    val action: String,
    val status: String,
    val details: String
)

data class AndroidAppItem(
    val packageName: String,
    val appName: String,
    val category: String,
    val iconName: String
)
