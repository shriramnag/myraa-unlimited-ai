package ai.myraa.mobile

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import ai.myraa.mobile.data.AgentSupervisorRepository
import ai.myraa.mobile.data.BrainDatabaseRepository
import ai.myraa.mobile.data.DeviceActionController
import ai.myraa.mobile.data.VoiceAssistantEngine
import ai.myraa.mobile.ui.MainScreen
import ai.myraa.mobile.ui.theme.MyraaTheme

class MainActivity : ComponentActivity() {
    private var voiceEngine: VoiceAssistantEngine? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        try {
            super.onCreate(savedInstanceState)
        } catch (e: Throwable) {
            Log.e("MainActivity", "Recovered from corrupted savedInstanceState on cold boot: ${e.message}", e)
            try {
                super.onCreate(null)
            } catch (ignored: Throwable) {}
        }

        // Edge-to-edge wrapped safely to prevent crashes on custom OEM ROMs
        try {
            enableEdgeToEdge()
        } catch (e: Throwable) {
            Log.w("MainActivity", "enableEdgeToEdge failed: ${e.message}")
        }

        // Lightweight container creation ONLY — NO hardware (Camera, Flashlight, TTS, AudioRecord) bound on UI thread during onCreate()
        val safeVoiceEngine = try {
            VoiceAssistantEngine(applicationContext).also { voiceEngine = it }
        } catch (e: Throwable) {
            Log.e("MainActivity", "Voice assistant container creation error: ${e.message}", e)
            VoiceAssistantEngine(this)
        }

        val brainRepo = try {
            BrainDatabaseRepository(applicationContext)
        } catch (e: Throwable) {
            Log.e("MainActivity", "Brain database initialization error: ${e.message}", e)
            BrainDatabaseRepository(this)
        }

        val supervisorRepo = try {
            AgentSupervisorRepository()
        } catch (e: Throwable) {
            Log.e("MainActivity", "Agent supervisor initialization error: ${e.message}", e)
            AgentSupervisorRepository()
        }

        val deviceController = try {
            DeviceActionController(applicationContext)
        } catch (e: Throwable) {
            Log.e("MainActivity", "Device controller initialization error: ${e.message}", e)
            DeviceActionController(this)
        }

        try {
            setContent {
                var pendingVoiceCallback: ((String) -> Unit)? = null

                val micPermissionLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.RequestPermission()
                ) { isGranted ->
                    if (isGranted) {
                        val cb = pendingVoiceCallback
                        if (cb != null) {
                            safeVoiceEngine.startInAppListening(onFinalTranscript = cb)
                        }
                    }
                }

                MyraaTheme {
                    MainScreen(
                        supervisorRepo = supervisorRepo,
                        brainRepo = brainRepo,
                        deviceController = deviceController,
                        voiceEngine = safeVoiceEngine,
                        onRequestInAppVoice = { onRecognizedText ->
                            try {
                                val hasMicPerm = ContextCompat.checkSelfPermission(
                                    this@MainActivity,
                                    Manifest.permission.RECORD_AUDIO
                                ) == PackageManager.PERMISSION_GRANTED

                                if (hasMicPerm) {
                                    safeVoiceEngine.startInAppListening(onFinalTranscript = onRecognizedText)
                                } else {
                                    pendingVoiceCallback = onRecognizedText
                                    micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                                }
                            } catch (e: Throwable) {
                                Log.e("MainActivity", "In-app voice launch error: ${e.message}", e)
                            }
                        }
                    )
                }
            }
        } catch (e: Throwable) {
            Log.e("MainActivity", "setContent error boundary caught: ${e.message}", e)
        }

        // Defer native service initialization until AFTER the first UI frame renders
        Handler(Looper.getMainLooper()).postDelayed({
            try {
                safeVoiceEngine.initializeDeferred()
            } catch (e: Throwable) {
                Log.w("MainActivity", "Deferred voice engine init warning: ${e.message}")
            }
        }, 600L)
    }

    override fun onDestroy() {
        try {
            voiceEngine?.shutdown()
        } catch (e: Throwable) {
            Log.e("MainActivity", "VoiceEngine shutdown error: ${e.message}", e)
        }
        try {
            super.onDestroy()
        } catch (e: Throwable) {
            Log.e("MainActivity", "super.onDestroy error: ${e.message}", e)
        }
    }
}
