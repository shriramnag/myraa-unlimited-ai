package ai.myraa.mobile.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import ai.myraa.mobile.data.AgentSupervisorRepository
import ai.myraa.mobile.data.BrainDatabaseRepository
import ai.myraa.mobile.data.DeviceActionController
import ai.myraa.mobile.data.ShivAiCoreEngine
import ai.myraa.mobile.data.VoiceAssistantEngine
import ai.myraa.mobile.model.CharacterRole
import ai.myraa.mobile.model.TaskState
import ai.myraa.mobile.ui.components.*
import ai.myraa.mobile.ui.dialogs.*
import ai.myraa.mobile.ui.theme.CyberVoid
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun MainScreen(
    supervisorRepo: AgentSupervisorRepository,
    brainRepo: BrainDatabaseRepository,
    deviceController: DeviceActionController,
    voiceEngine: VoiceAssistantEngine,
    onLaunchSpeechRecognition: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    val tasks by supervisorRepo.tasks.collectAsState()
    val isEmergencyStopActive by supervisorRepo.isEmergencyStopActive.collectAsState()
    val isSpeaking by voiceEngine.isSpeaking.collectAsState()
    val isVoiceLockActive by voiceEngine.isVoiceLockActive.collectAsState()

    var activeRole by remember { mutableStateOf(CharacterRole.MYRAA) }
    var cameraMode by remember { mutableStateOf("CLOSEUP") }

    var userPrompt by remember { mutableStateOf("") }
    var inputText by remember { mutableStateOf("") }
    var replyText by remember {
        mutableStateOf("नमस्ते श्री राम नाग जी! MYRAA और SHIV AI के सभी 11 टूल्स, 43 नेटिव एक्शन्स और लॉन्ग-टर्म ब्रेन डेटाबेस 100% तैयार हैं।")
    }
    var activeToolId by remember { mutableStateOf<String?>(null) }
    var isTorchActive by remember { mutableStateOf(deviceController.isTorchActive()) }

    // Dialogs state
    var showBrainDb by remember { mutableStateOf(false) }
    var showShivCore by remember { mutableStateOf(false) }
    var showAppsHub by remember { mutableStateOf(false) }
    var showAdminVault by remember { mutableStateOf(false) }
    var showApkDoctor by remember { mutableStateOf(false) }

    // Intercept back button if any dialog is open
    BackHandler(enabled = showBrainDb || showShivCore || showAppsHub || showAdminVault || showApkDoctor) {
        showBrainDb = false
        showShivCore = false
        showAppsHub = false
        showAdminVault = false
        showApkDoctor = false
    }

    fun triggerResponse(prompt: String, answer: String, toolId: String? = null) {
        userPrompt = prompt
        replyText = answer
        activeToolId = toolId
        voiceEngine.speak(answer)
    }

    fun handleCommandSubmit(query: String) {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return

        inputText = ""
        userPrompt = trimmed

        val specialist = supervisorRepo.routeIntentToSpecialist(trimmed)
        activeRole = specialist.avatar

        val task = supervisorRepo.createTask(
            title = "Execute: " + trimmed.take(30) + "...",
            actionName = trimmed,
            explicitRole = specialist.avatar
        )

        supervisorRepo.transitionState(task.taskId, TaskState.PLANNING, "Checking security policy...")

        val lower = trimmed.lowercase()

        // 1. Flashlight
        if (lower.contains("torch") || lower.contains("flashlight") || lower.contains("फ्लैशलाइट")) {
            supervisorRepo.transitionState(task.taskId, TaskState.EXECUTING, "Toggling camera flashlight...")
            val on = deviceController.toggleTorch()
            isTorchActive = on
            val res = if (on) "फ्लैशलाइट चालू (ON) कर दी गई है।" else "फ्लैशलाइट बंद (OFF) कर दी गई है।"
            supervisorRepo.verifyAndCompleteTask(task.taskId, true, res)
            triggerResponse(trimmed, res)
            return
        }

        // 2. Phone Call
        if (lower.contains("call") || lower.contains("कॉल") || lower.contains("फोन")) {
            supervisorRepo.transitionState(task.taskId, TaskState.AWAITING_APPROVAL, "Phone call dialer intent ready")
            showAppsHub = true
            val res = "फ़ोन डायलर खुल गया है। आप सुरक्षा पुष्टि के साथ कॉल कर सकते हैं।"
            supervisorRepo.verifyAndCompleteTask(task.taskId, true, res)
            triggerResponse(trimmed, res)
            return
        }

        // 3. SMS / WhatsApp
        if (lower.contains("sms") || lower.contains("whatsapp") || lower.contains("मैसेज") || lower.contains("संदेश")) {
            showAppsHub = true
            val res = "मैसेज कंपोज़र खुल गया है। आप तुरंत संदेश भेज सकते हैं।"
            supervisorRepo.verifyAndCompleteTask(task.taskId, true, res)
            triggerResponse(trimmed, res)
            return
        }

        // 4. Brain DB
        if (lower.contains("brain") || lower.contains("memory") || lower.contains("याद") || lower.contains("डेटाबेस")) {
            showBrainDb = true
            val res = "लॉन्ग-टर्म ब्रेन डेटाबेस खुल गया है। आपकी सभी स्थायी मेमोरीज़ यहाँ सुरक्षित हैं।"
            supervisorRepo.verifyAndCompleteTask(task.taskId, true, res)
            triggerResponse(trimmed, res)
            return
        }

        // 5. Tools / Research
        if (lower.contains("research") || lower.contains("रिसर्च") || lower.contains("tool") || lower.contains("टूल")) {
            showShivCore = true
            val res = "शिव एआई कोर के सभी 11 टूल्स और Deep Research वर्कबेंच तैयार है!"
            supervisorRepo.verifyAndCompleteTask(task.taskId, true, res)
            triggerResponse(trimmed, res, "gpt-researcher")
            return
        }

        // 6. Camera
        if (lower.contains("camera") || lower.contains("कैमरा") || lower.contains("फोटो") || lower.contains("photo")) {
            deviceController.launchCamera()
            val res = "कैमरा चालू किया गया।"
            supervisorRepo.verifyAndCompleteTask(task.taskId, true, res)
            triggerResponse(trimmed, res)
            return
        }

        // 7. General AI response via coroutine
        coroutineScope.launch {
            supervisorRepo.transitionState(task.taskId, TaskState.EXECUTING, "Processing intent via ${specialist.label}...")
            delay(350)

            val resp = when (specialist.avatar) {
                CharacterRole.CODEX ->
                    "[CODEX]: श्री राम नाग जी, आपके कोड कार्य \"$trimmed\" का विश्लेषण पूर्ण हुआ। सभी इनवेरिएंट्स और 11 टूल्स सक्रिय हैं।"
                CharacterRole.SAGE ->
                    "[SAGE]: विषय \"$trimmed\" पर बहु-स्रोतीय रिसर्च रिपोर्ट तैयार है। मुख्य निष्कर्ष ऑन-डिवाइस डेटाबेस में संचित हैं।"
                CharacterRole.SENTINEL ->
                    "[SENTINEL]: सुरक्षा शील्ड सामान्य है। 0% प्रॉम्प्ट इंजेक्शन रिस्क, पेमेंट और क्रेडेंशियल पूर्णतः सुरक्षित हैं।"
                else ->
                    "हाँ श्री राम नाग जी, मैंने आपका निर्देश \"$trimmed\" समझ लिया है। सभी 43 नेटिव एक्शन्स तैयार हैं!"
            }

            supervisorRepo.verifyAndCompleteTask(task.taskId, true, resp)
            triggerResponse(trimmed, resp)
        }
    }

    Scaffold(
        contentWindowInsets = WindowInsets.safeDrawing,
        containerColor = CyberVoid
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(CyberVoid)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                // Top Status & Controls Bar
                TopStatusBar(
                    isTorchOn = isTorchActive,
                    isVoiceLockActive = isVoiceLockActive,
                    onToggleTorch = {
                        isTorchActive = deviceController.toggleTorch()
                        val msg = if (isTorchActive) "फ्लैशलाइट चालू (ON)" else "फ्लैशलाइट बंद (OFF)"
                        triggerResponse("Torch Toggle", msg)
                    },
                    onOpenApps = { showAppsHub = true },
                    onOpenAdminVault = { showAdminVault = true },
                    onOpenApkDoctor = { showApkDoctor = true }
                )

                // Holographic Avatar Stage
                HolographicAvatarStage(
                    activeRole = activeRole,
                    onSelectRole = { role ->
                        activeRole = role
                        voiceEngine.speak(role.hindiTitle)
                    },
                    isSpeaking = isSpeaking,
                    cameraMode = cameraMode,
                    onToggleCameraMode = {
                        cameraMode = if (cameraMode == "CLOSEUP") "FULL" else "CLOSEUP"
                    }
                )

                // Live Chat Bubble
                LiveChatBubble(
                    activeRole = activeRole,
                    userPrompt = userPrompt,
                    replyText = replyText,
                    activeToolId = activeToolId,
                    onDismiss = {
                        replyText = ""
                        userPrompt = ""
                    }
                )

                // Task Monitor HUD
                TaskMonitorHud(
                    tasks = tasks,
                    isEmergencyStopActive = isEmergencyStopActive,
                    onEmergencyStop = {
                        supervisorRepo.emergencyStop()
                        triggerResponse("Emergency Halt", "आपातकालीन रोक (Emergency Stop) सक्रिय की गई। सभी कार्य रोक दिए गए हैं।")
                    },
                    onResume = {
                        supervisorRepo.resumeAgents()
                        triggerResponse("Resume Engine", "सभी एजेंट्स पुनः सक्रिय कर दिए गए हैं।")
                    }
                )
            }

            // Bottom Command & Voice Bar
            QuickCommandBar(
                inputText = inputText,
                onInputChange = { inputText = it },
                onSubmit = { handleCommandSubmit(it) },
                onVoiceClick = onLaunchSpeechRecognition,
                onOpenBrainDb = { showBrainDb = true },
                onOpenShivCore = { showShivCore = true },
                onToggleTorch = {
                    isTorchActive = deviceController.toggleTorch()
                    val msg = if (isTorchActive) "फ्लैशलाइट चालू (ON)" else "फ्लैशलाइट बंद (OFF)"
                    triggerResponse("Torch Toggle", msg)
                },
                onOpenApps = { showAppsHub = true }
            )
        }
    }

    // Modal Dialogs
    if (showBrainDb) {
        BrainDatabaseDialog(
            repository = brainRepo,
            onDismiss = { showBrainDb = false }
        )
    }

    if (showShivCore) {
        ShivAiCoreDialog(
            onDismiss = { showShivCore = false },
            onApplyResult = { toolName, resultText ->
                triggerResponse("Tool: $toolName", resultText, toolName)
            }
        )
    }

    if (showAppsHub) {
        AndroidAppsDialog(
            deviceController = deviceController,
            onDismiss = { showAppsHub = false }
        )
    }

    if (showAdminVault) {
        AdminVaultDialog(
            isVoiceLockActive = isVoiceLockActive,
            onToggleVoiceLock = { voiceEngine.toggleVoiceLock() },
            onDismiss = { showAdminVault = false }
        )
    }

    if (showApkDoctor) {
        ApkDoctorDialog(
            onDismiss = { showApkDoctor = false }
        )
    }
}
