package ai.myraa.mobile.data

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
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
        tts = TextToSpeech(context.applicationContext, this)
    }

    override fun onInit(status: Int) {
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
    }

    fun speak(text: String) {
        if (isInitialized && tts != null) {
            _isSpeaking.value = true
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "myraa_utterance_${System.currentTimeMillis()}")
        }
    }

    fun stopSpeaking() {
        tts?.stop()
        _isSpeaking.value = false
    }

    fun toggleVoiceLock(): Boolean {
        _isVoiceLockActive.value = !_isVoiceLockActive.value
        return _isVoiceLockActive.value
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
    }
}
