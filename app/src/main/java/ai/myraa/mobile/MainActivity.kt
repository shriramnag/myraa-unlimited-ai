package ai.myraa.mobile

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.speech.RecognizerIntent
import android.util.Log
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.remember
import ai.myraa.mobile.data.AgentSupervisorRepository
import ai.myraa.mobile.data.BrainDatabaseRepository
import ai.myraa.mobile.data.DeviceActionController
import ai.myraa.mobile.data.VoiceAssistantEngine
import ai.myraa.mobile.ui.MainScreen
import ai.myraa.mobile.ui.theme.MyraaTheme
import java.util.Locale

class MainActivity : ComponentActivity() {
    private var voiceEngine: VoiceAssistantEngine? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Robust startup with safe fallback error boundaries
        val safeVoiceEngine = try {
            VoiceAssistantEngine(this).also { voiceEngine = it }
        } catch (e: Exception) {
            Log.e("MainActivity", "Voice assistant initialization error: ${e.message}", e)
            VoiceAssistantEngine(this).also { voiceEngine = it }
        }

        val brainRepo = try {
            BrainDatabaseRepository(this)
        } catch (e: Exception) {
            Log.e("MainActivity", "Brain database initialization error: ${e.message}", e)
            BrainDatabaseRepository(this)
        }

        val supervisorRepo = try {
            AgentSupervisorRepository()
        } catch (e: Exception) {
            Log.e("MainActivity", "Agent supervisor initialization error: ${e.message}", e)
            AgentSupervisorRepository()
        }

        val deviceController = try {
            DeviceActionController(this)
        } catch (e: Exception) {
            Log.e("MainActivity", "Device controller initialization error: ${e.message}", e)
            DeviceActionController(this)
        }

        setContent {
            val speechLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.StartActivityForResult()
            ) { result ->
                if (result.resultCode == Activity.RESULT_OK && result.data != null) {
                    val matches = result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                    val spokenText = matches?.firstOrNull()
                    if (!spokenText.isNullOrBlank()) {
                        // Pass spoken text directly to chat/supervisor
                        supervisorRepo.createTask(
                            title = "Voice Input: " + spokenText.take(25),
                            actionName = spokenText
                        )
                    }
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
                        } catch (e: Exception) {
                            Toast.makeText(this, "Voice recognition not available on device", Toast.LENGTH_SHORT).show()
                        }
                    }
                )
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            voiceEngine?.shutdown()
        } catch (e: Exception) {
            Log.e("MainActivity", "VoiceEngine shutdown error: ${e.message}", e)
        }
    }
}
