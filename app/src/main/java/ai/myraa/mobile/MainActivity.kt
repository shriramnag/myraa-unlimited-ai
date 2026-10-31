package ai.myraa.mobile

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognizerIntent
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
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
                val speechLauncher = rememberLauncherForActivityResult(
                    contract = ActivityResultContracts.StartActivityForResult()
                ) { result ->
                    try {
                        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
                            val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                            val spokenText = matches?.firstOrNull()
                            if (!spokenText.isNullOrBlank()) {
                                supervisorRepo.createTask(
                                    title = "Voice Input: " + spokenText.take(25),
                                    actionName = spokenText
                                )
                            }
                        }
                    } catch (e: Throwable) {
                        Log.e("MainActivity", "Speech result handling error: ${e.message}", e)
                    }
                }

                MyraaTheme {
                    MainScreen(
                        supervisorRepo = supervisorRepo,
                        brainRepo = brainRepo,
                        deviceController = deviceController,
                        voiceEngine = safeVoiceEngine,
                        onLaunchSpeechRecognition = {
                            try {
                                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN")
                                    putExtra(RecognizerIntent.EXTRA_PROMPT, "श्री राम नाग जी, निर्देश बोलिए...")
                                }
                                speechLauncher.launch(intent)
                            } catch (e: Throwable) {
                                Toast.makeText(this@MainActivity, "Voice recognition not available on device", Toast.LENGTH_SHORT).show()
                            }
                        }
                    )
                }
            }
        } catch (e: Throwable) {
            Log.e("MainActivity", "setContent error boundary caught: ${e.message}", e)
        }

        // Defer native TTS / hardware service binding until AFTER the first UI frame renders
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
