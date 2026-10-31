package ai.myraa.mobile.data

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Base64
import android.util.Log
import ai.myraa.mobile.BuildConfig
import ai.myraa.mobile.model.CharacterRole
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.Locale

class VoiceAssistantEngine(private val context: Context) : TextToSpeech.OnInitListener {
    private val engineScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private var initRequested = false

    private val _isSpeaking = MutableStateFlow(false)
    val isSpeaking: StateFlow<Boolean> = _isSpeaking.asStateFlow()

    private val _isVoiceLockActive = MutableStateFlow(true)
    val isVoiceLockActive: StateFlow<Boolean> = _isVoiceLockActive.asStateFlow()

    val speakerProfile = "श्री राम नाग (Shri Ram Nag) • ~155Hz Enrolled"

    // 6-Avatar Realistic Gemini Voice Mapping (Strict Preservation)
    val geminiVoiceMap = mapOf(
        CharacterRole.MYRAA to "Kore",       // Female: warm, expressive, companion natural tone
        CharacterRole.AURA to "Aoede",       // Female: melodious, gentle, calm tone
        CharacterRole.PIXEL to "Despina",    // Female: energetic, dynamic, friendly tone
        CharacterRole.CODEX to "Puck",       // Male: sharp, fast, modern developer tone
        CharacterRole.SENTINEL to "Fenrir",  // Male: deep, commanding, authoritative tone
        CharacterRole.SAGE to "Charon"       // Male: calm, intellectual, wise mentor tone
    )

    // Deferred asynchronous initialization — NEVER invoked synchronously on MainActivity.onCreate()
    fun initializeDeferred() {
        if (initRequested) return
        initRequested = true
        engineScope.launch(Dispatchers.Main) {
            try {
                delay(400) // Allow UI/WebView to finish first-frame render before binding TTS service
                tts = TextToSpeech(context.applicationContext, this@VoiceAssistantEngine)
            } catch (e: Throwable) {
                Log.w("VoiceAssistantEngine", "Deferred TTS bind skipped: ${e.message}")
                tts = null
            }
        }
    }

    override fun onInit(status: Int) {
        try {
            if (status == TextToSpeech.SUCCESS) {
                val result = tts?.setLanguage(Locale("hi", "IN"))
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    tts?.setLanguage(Locale.US)
                }
                tts?.setPitch(1.05f)
                tts?.setSpeechRate(1.0f)

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
            Log.w("VoiceAssistantEngine", "onInit warning: ${e.message}")
        }
    }

    fun getVoiceNameForRole(role: CharacterRole): String {
        return geminiVoiceMap[role] ?: "Kore"
    }

    fun speak(text: String, role: CharacterRole = CharacterRole.MYRAA) {
        val cleanText = text.trim()
        if (cleanText.isEmpty()) return

        engineScope.launch {
            _isSpeaking.value = true
            val voiceName = getVoiceNameForRole(role)
            val playedViaGemini = trySpeakWithGeminiAudio(cleanText, voiceName)
            if (!playedViaGemini) {
                try {
                    if (!initRequested) {
                        initializeDeferred()
                    }
                    if (isInitialized && tts != null) {
                        val isMale = role in listOf(CharacterRole.CODEX, CharacterRole.SENTINEL, CharacterRole.SAGE)
                        tts?.setPitch(if (isMale) 0.92f else 1.12f)
                        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, "myraa_utt_${System.currentTimeMillis()}")
                    } else {
                        val durationMs = (cleanText.length * 55L).coerceIn(1200L, 6000L)
                        delay(durationMs)
                        _isSpeaking.value = false
                    }
                } catch (e: Throwable) {
                    Log.w("VoiceAssistantEngine", "Fallback speak warning: ${e.message}")
                    _isSpeaking.value = false
                }
            }
        }
    }

    private fun resolveGeminiApiKey(): String {
        return try {
            val prefs = context.getSharedPreferences("MyraaBrainDatabase_ShriRamNag_v3", Context.MODE_PRIVATE)
            val saved = prefs.getString("GEMINI_API_KEY", null)
            if (!saved.isNullOrBlank()) return saved.trim()
            val buildKeys = BuildConfig.GEMINI_API_KEYS
            val firstKey = buildKeys.split(",").map { it.trim() }.firstOrNull {
                it.isNotEmpty() && !it.startsWith("your_key") && !it.startsWith("placeholder")
            }
            firstKey ?: ""
        } catch (e: Throwable) {
            ""
        }
    }

    private fun trySpeakWithGeminiAudio(text: String, voiceName: String): Boolean {
        val apiKey = resolveGeminiApiKey()
        if (apiKey.isEmpty()) return false

        var conn: HttpURLConnection? = null
        return try {
            val endpoint = URL("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey")
            conn = (endpoint.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 7000
                readTimeout = 12000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }

            val payload = JSONObject().apply {
                put("contents", JSONArray().put(
                    JSONObject().put("parts", JSONArray().put(
                        JSONObject().put("text", text)
                    ))
                ))
                put("generationConfig", JSONObject().apply {
                    put("responseModalities", JSONArray().put("AUDIO"))
                    put("speechConfig", JSONObject().apply {
                        put("voiceConfig", JSONObject().apply {
                            put("prebuiltVoiceConfig", JSONObject().apply {
                                put("voiceName", voiceName)
                            })
                        })
                    })
                })
            }

            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { writer ->
                writer.write(payload.toString())
                writer.flush()
            }

            if (conn.responseCode !in 200..299) {
                return false
            }

            val responseStr = conn.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
            val json = JSONObject(responseStr)
            val candidates = json.optJSONArray("candidates") ?: return false
            val content = candidates.optJSONObject(0)?.optJSONObject("content") ?: return false
            val parts = content.optJSONArray("parts") ?: return false
            var base64Audio: String? = null
            for (i in 0 until parts.length()) {
                val inlineData = parts.optJSONObject(i)?.optJSONObject("inlineData")
                if (inlineData != null && inlineData.has("data")) {
                    base64Audio = inlineData.optString("data")
                    break
                }
            }
            if (base64Audio.isNullOrEmpty()) return false

            val pcmBytes = Base64.decode(base64Audio, Base64.DEFAULT)
            playPcmAudioBytes(pcmBytes, 24000)
            _isSpeaking.value = false
            true
        } catch (e: Throwable) {
            Log.w("VoiceAssistantEngine", "Gemini Audio notice ($voiceName): ${e.message}")
            false
        } finally {
            try { conn?.disconnect() } catch (_: Throwable) {}
        }
    }

    private fun playPcmAudioBytes(pcmBytes: ByteArray, sampleRate: Int) {
        var audioTrack: AudioTrack? = null
        try {
            val minBufferSize = AudioTrack.getMinBufferSize(
                sampleRate,
                AudioFormat.CHANNEL_OUT_MONO,
                AudioFormat.ENCODING_PCM_16BIT
            ).coerceAtLeast(pcmBytes.size)

            audioTrack = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(minBufferSize)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            audioTrack.write(pcmBytes, 0, pcmBytes.size)
            audioTrack.play()

            val durationMs = ((pcmBytes.size.toLong() * 1000L) / (sampleRate * 2)).coerceIn(500L, 25000L)
            Thread.sleep(durationMs)
        } catch (e: Throwable) {
            Log.w("VoiceAssistantEngine", "AudioTrack playback warning: ${e.message}")
        } finally {
            try {
                audioTrack?.stop()
                audioTrack?.release()
            } catch (_: Throwable) {}
        }
    }

    fun stopSpeaking() {
        try {
            tts?.stop()
        } catch (e: Throwable) {
            Log.w("VoiceAssistantEngine", "stopSpeaking warning: ${e.message}")
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
            Log.w("VoiceAssistantEngine", "shutdown warning: ${e.message}")
        } finally {
            tts = null
            isInitialized = false
        }
    }
}
