package ai.myraa.mobile.data

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Locale

class VoiceAssistantEngine(private val context: Context) : TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = null
    private var isInitialized = false

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking: StateFlow<Boolean> = _isSpeaking.asStateFlow()

    private val _isVoiceLockActive = MutableStateFlow(true)
    val isVoiceLockActive: StateFlow<Boolean> = _isVoiceLockActive.asStateFlow()

    val speakerProfile = "श्री राम नाग (Shri Ram Nag) • ~155Hz Enrolled"

    init {
        try {
            tts = TextToSpeech(context.applicationContext, this)
        } catch (e: Throwable) {
            Log.e("VoiceAssistantEngine", "Failed to construct TextToSpeech: ${e.message}", e)
            tts = null
        }
    }

    override fun onInit(status: Int) {
        try {
            if (status == TextToSpeech.SUCCESS) {
                val result = tts?.setLanguage(Locale("hi", "IN"))
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts?.setLanguage(Locale.US)
                }
                tts?.setPitch(1.35f) // High-pitch anime heroine voice
                tts?.setSpeechRate(0.95f) // Slightly slower, comforting cadence

                tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        _isSpeaking.value = true
                    }

                    override fun onDone(utteranceId: String?) {
                        _isSpeaking.value = false
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        _isSpeaking.value = false
                    }
                })
                isInitialized = true
            }
        } catch (e: Throwable) {
            Log.e("VoiceAssistantEngine", "onInit error: ${e.message}", e)
        }
    }

    fun speak(text: String) {
        try {
            if (isInitialized && tts != null) {
                _isSpeaking.value = true
                tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "myraa_utterance_${System.currentTimeMillis()}")
            }
        } catch (e: Throwable) {
            Log.e("VoiceAssistantEngine", "speak error: ${e.message}", e)
            _isSpeaking.value = false
        }
    }

    fun stopSpeaking() {
        try {
            tts?.stop()
        } catch (e: Throwable) {
            Log.e("VoiceAssistantEngine", "stopSpeaking error: ${e.message}", e)
        } finally {
            _isSpeaking.value = false
        }
    }

    fun toggleVoiceLock(): Boolean {
        _isVoiceLockActive.value = !_isVoiceLockActive.value
        return _isVoiceLockActive.value
    }

    fun shutdown() {
        try {
            tts?.stop()
            tts?.shutdown()
        } catch (e: Throwable) {
            Log.e("VoiceAssistantEngine", "shutdown error: ${e.message}", e)
        } finally {
            tts = null
            isInitialized = false
        }
    }
}
