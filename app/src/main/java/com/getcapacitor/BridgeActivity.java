package com.getcapacitor;

import ai.myraa.mobile.SecurityPolicyEngine;
import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.media.audiofx.AcousticEchoCanceler;
import android.media.audiofx.AutomaticGainControl;
import android.media.audiofx.NoiseSuppressor;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONObject;

/**
 * SHIV AI — MYRAA v7.0.35 SUPREME OMNI-CONTROLLER BRIDGE
 * Nirman Karta & Supreme Malik: Shri Ram Nag (श्री राम नाग)
 * Features:
 * 1. Full-Duplex Google Gemini Live Call Audio Engine (16kHz AudioRecord w/ Hardware AEC + 24kHz AudioTrack PCM Player, Zero "tu-tu" beeps, Instant Barge-In)
 * 2. Native Android SpeechRecognizer + RecognizerIntent + Neural Voice TTS Fallback
 * 3. Live Over-The-Air (OTA) Channel Updater from GitHub (Zero APK Reinstall Needed)
 * 4. Supreme Owner Anti-Tamper Cryptographic Verification Shield
 */
public class BridgeActivity extends AppCompatActivity {
    private static final int REQ_PERMISSIONS_CODE = 5001;
    private static final int REQ_SPEECH_INTENT_CODE = 5002;
    private static final String PREFS_NAME = "MyraaSecureKeyStorePrefs";
    private static final String KEY_GEMINI_API = "encrypted_gemini_api_key";
    private static final String OTA_FILE_NAME = "myraa_live_ota_channel.html";
    private static final String GITHUB_OTA_URL =
        "https://raw.githubusercontent.com/shriramnag/myraa-unlimited-ai/main/app/src/main/assets/public/index.html";

    private final List<Class<? extends Plugin>> registeredPluginClasses = new ArrayList<>();
    private final Map<String, Plugin> activePlugins = new HashMap<>();
    private WebView webView;
    private SpeechRecognizer speechRecognizer;
    private TextToSpeech nativeTts;
    private boolean ttsReady = false;
    private String currentVoiceLang = "hi-IN";
    private float currentTtsPitch = 1.0f;
    private float currentTtsRate = 1.02f;

    // Full-Duplex Phone Call Audio Engine (Zero "tu-tu" beeps + Instant Barge-In)
    private volatile boolean isLiveCallMicRunning = false;
    private AudioRecord liveCallAudioRecord;
    private Thread liveCallMicThread;
    private AudioTrack livePcmAudioTrack;
    private MediaPlayer cloudMediaPlayer;
    private final Object audioTrackLock = new Object();
    private final ExecutorService pcmPlaybackExecutor = Executors.newSingleThreadExecutor();
    private volatile long lastAudioTrackWriteMs = 0L;
    private int consecutiveSpeechFramesDuringPlayback = 0;

    public void registerPlugin(Class<? extends Plugin> pluginClass) {
        if (!registeredPluginClasses.contains(pluginClass)) {
            registeredPluginClasses.add(pluginClass);
        }
    }

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.parseColor("#04070D"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#04070D"));

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        if (!SecurityPolicyEngine.verifySupremeOwnerIntegrity(this, null)) {
            webView.loadData(
                "<html><body style='background:#1a0005;color:#ff4d6d;font-family:sans-serif;padding:30px;text-align:center;'>" +
                "<h2>🔒 ANTI-TAMPER LOCKDOWN</h2><p>Unauthorized modification detected. Owned exclusively by Nirman Karta & Malik: <b>Shri Ram Nag (श्री राम नाग)</b>.</p></body></html>",
                "text/html",
                "UTF-8"
            );
            setContentView(webView);
            return;
        }

        initNativeTts();
        requestEssentialRuntimePermissions();

        for (Class<? extends Plugin> cls : registeredPluginClasses) {
            try {
                Plugin instance = cls.getDeclaredConstructor().newInstance();
                instance.setActivity(this);
                instance.setContext(getApplicationContext());
                activePlugins.put(cls.getSimpleName(), instance);
                if ("MyraaNativePlugin".equals(cls.getSimpleName())) {
                    webView.addJavascriptInterface(new MyraaJsBridge(this, instance), "MyraaNativeBridge");
                }
            } catch (Exception ignored) {}
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    try {
                        request.grant(request.getResources());
                    } catch (Exception ignored) {}
                });
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request != null && request.getUrl() != null) {
                    String url = request.getUrl().toString();
                    if (url.endsWith(".apk") || url.contains("github.com/shriramnag/myraa-unlimited-ai/releases")) {
                        try {
                            Intent browserIntent = new Intent(Intent.ACTION_VIEW, request.getUrl());
                            browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                            startActivity(browserIntent);
                            return true;
                        } catch (Exception ignored) {}
                    }
                }
                return false;
            }
        });

        root.addView(
            webView,
            new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        );
        setContentView(root);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                } else {
                    setEnabled(false);
                    getOnBackPressedDispatcher().onBackPressed();
                }
            }
        });

        loadActiveChannelIntoWebView();
        handleWakeIntent(getIntent());
    }

    public void loadActiveChannelIntoWebView() {
        runOnUiThread(() -> {
            try {
                File otaFile = new File(getFilesDir(), OTA_FILE_NAME);
                if (otaFile.exists() && otaFile.length() > 1024) {
                    StringBuilder sb = new StringBuilder();
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(new FileInputStream(otaFile), StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = br.readLine()) != null) {
                            sb.append(line).append("\n");
                        }
                    }
                    String otaHtml = sb.toString();
                    if (SecurityPolicyEngine.verifySupremeOwnerIntegrity(this, otaHtml)) {
                        webView.loadDataWithBaseURL(
                            "file:///android_asset/public/",
                            otaHtml,
                            "text/html",
                            "UTF-8",
                            null
                        );
                        return;
                    } else {
                        otaFile.delete();
                    }
                }
            } catch (Exception ignored) {}
            webView.loadUrl("file:///android_asset/public/index.html");
        });
    }

    public void pullLiveChannelUpdateFromGithub() {
        new Thread(() -> {
            try {
                dispatchOtaStatusToJs("downloading", "Downloading latest live channel update from GitHub (shriramnag/myraa-unlimited-ai)...");
                URL url = new URL(GITHUB_OTA_URL + "?t=" + System.currentTimeMillis());
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(12000);
                conn.setRequestProperty("Cache-Control", "no-cache");

                int code = conn.getResponseCode();
                if (code == 200) {
                    StringBuilder sb = new StringBuilder();
                    try (BufferedReader br = new BufferedReader(
                            new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = br.readLine()) != null) {
                            sb.append(line).append("\n");
                        }
                    }
                    String html = sb.toString();
                    if (!SecurityPolicyEngine.verifySupremeOwnerIntegrity(this, html)) {
                        dispatchOtaStatusToJs("error", "ANTI-TAMPER SHIELD: Rejected modified update missing Nirman Karta Shri Ram Nag signature!");
                        return;
                    }
                    File otaFile = new File(getFilesDir(), OTA_FILE_NAME);
                    try (FileOutputStream fos = new FileOutputStream(otaFile, false)) {
                        fos.write(html.getBytes(StandardCharsets.UTF_8));
                    }
                    dispatchOtaStatusToJs("applied", "Live Channel Update Verified & Applied! Reloading in 1 second...");
                    runOnUiThread(() -> new android.os.Handler(getMainLooper()).postDelayed(this::loadActiveChannelIntoWebView, 900));
                } else {
                    dispatchOtaStatusToJs("error", "GitHub channel HTTP " + code + ". Push your latest changes to GitHub first.");
                }
            } catch (Exception e) {
                dispatchOtaStatusToJs("error", "Live update notice: " + e.getMessage());
            }
        }).start();
    }

    public void resetToBuiltInChannel() {
        try {
            File otaFile = new File(getFilesDir(), OTA_FILE_NAME);
            if (otaFile.exists()) {
                otaFile.delete();
            }
        } catch (Exception ignored) {}
        loadActiveChannelIntoWebView();
    }

    private void dispatchOtaStatusToJs(final String state, final String message) {
        if (webView == null) return;
        runOnUiThread(() -> {
            try {
                String safeMsg = JSONObject.quote(message != null ? message : "");
                String js = "if(window.onLiveOtaEvent){window.onLiveOtaEvent('" + state + "'," + safeMsg + ");}";
                webView.evaluateJavascript(js, null);
            } catch (Exception ignored) {}
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWakeIntent(intent);
    }

    private void handleWakeIntent(Intent intent) {
        if (intent == null) return;
        final String wakeCmd = intent.getStringExtra("wake_command");
        if (wakeCmd != null && !wakeCmd.trim().isEmpty()) {
            intent.removeExtra("wake_command");
            new android.os.Handler(getMainLooper()).postDelayed(() ->
                dispatchVoiceEventToJs("result", wakeCmd.trim(), true), 650);
        }
    }

    private void initNativeTts() {
        try {
            nativeTts = new TextToSpeech(getApplicationContext(), status -> {
                if (status == TextToSpeech.SUCCESS && nativeTts != null) {
                    ttsReady = true;
                    selectBestHumanTtsVoice(currentVoiceLang);
                    nativeTts.setPitch(currentTtsPitch);
                    nativeTts.setSpeechRate(currentTtsRate);
                }
            });
        } catch (Exception ignored) {}
    }

    private void selectBestHumanTtsVoice(String langCode) {
        if (nativeTts == null) return;
        try {
            Locale targetLocale = (langCode != null && langCode.startsWith("en"))
                ? new Locale("en", "IN")
                : new Locale("hi", "IN");
            int res = nativeTts.setLanguage(targetLocale);
            if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                targetLocale = Locale.US;
                nativeTts.setLanguage(targetLocale);
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                Set<Voice> voices = nativeTts.getVoices();
                if (voices != null) {
                    Voice bestVoice = null;
                    int bestScore = -1;
                    String targetLangIso = targetLocale.getLanguage();
                    for (Voice v : voices) {
                        if (v == null || v.getLocale() == null) continue;
                        if (!v.getLocale().getLanguage().equalsIgnoreCase(targetLangIso)) continue;
                        int score = v.getQuality();
                        String vName = v.getName() != null ? v.getName().toLowerCase(Locale.ROOT) : "";
                        // Prefer natural neural/wavenet/female voices (hie, hid, ene, wavenet, network)
                        if (vName.contains("wavenet") || vName.contains("neural")) score += 500;
                        if (vName.contains("hie") || vName.contains("hid") || vName.contains("ene") || vName.contains("tpf")) score += 300;
                        if (!v.isNetworkConnectionRequired()) score += 50;
                        if (score > bestScore) {
                            bestScore = score;
                            bestVoice = v;
                        }
                    }
                    if (bestVoice != null) {
                        nativeTts.setVoice(bestVoice);
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    // ============================================================================
    // FULL-DUPLEX PHONE CALL AUDIO ENGINE (ZERO "TU-TU" BEEPS + INSTANT BARGE-IN)
    // ============================================================================
    @SuppressLint("MissingPermission")
    public void startNativeLiveCallMicOnUi() {
        runOnUiThread(() -> {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, REQ_PERMISSIONS_CODE);
                dispatchVoiceEventToJs("status", "Requesting Microphone Permission for Live Call...", false);
                return;
            }
            if (isLiveCallMicRunning) {
                return;
            }
            // Stop SpeechRecognizer so it never plays "tu-tu" system beeps during a Live Call
            try {
                if (speechRecognizer != null) {
                    speechRecognizer.stopListening();
                    speechRecognizer.destroy();
                    speechRecognizer = null;
                }
            } catch (Exception ignored) {}

            isLiveCallMicRunning = true;
            liveCallMicThread = new Thread(() -> {
                final int sampleRate = 16000;
                final int channelConfig = AudioFormat.CHANNEL_IN_MONO;
                final int audioFormat = AudioFormat.ENCODING_PCM_16BIT;
                int minBuf = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat);
                if (minBuf <= 0) minBuf = 6400;
                int bufferSize = Math.max(minBuf * 2, 6400);

                AcousticEchoCanceler aec = null;
                NoiseSuppressor ns = null;
                AutomaticGainControl agc = null;

                try {
                    // VOICE_COMMUNICATION enables hardware echo cancellation & prevents any "tu-tu" sound
                    liveCallAudioRecord = new AudioRecord(
                        MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                        sampleRate,
                        channelConfig,
                        audioFormat,
                        bufferSize
                    );
                    if (liveCallAudioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
                        liveCallAudioRecord = new AudioRecord(
                            MediaRecorder.AudioSource.MIC,
                            sampleRate,
                            channelConfig,
                            audioFormat,
                            bufferSize
                        );
                    }

                    int sessionId = liveCallAudioRecord.getAudioSessionId();
                    try {
                        if (AcousticEchoCanceler.isAvailable()) {
                            aec = AcousticEchoCanceler.create(sessionId);
                            if (aec != null) aec.setEnabled(true);
                        }
                        if (NoiseSuppressor.isAvailable()) {
                            ns = NoiseSuppressor.create(sessionId);
                            if (ns != null) ns.setEnabled(true);
                        }
                        if (AutomaticGainControl.isAvailable()) {
                            agc = AutomaticGainControl.create(sessionId);
                            if (agc != null) agc.setEnabled(true);
                        }
                    } catch (Exception ignored) {}

                    liveCallAudioRecord.startRecording();
                    dispatchVoiceEventToJs("live_call_started", "📞 Live Call Connected (Zero-Beep Full-Duplex Audio)", false);

                    // Read 100ms chunks (1600 samples = 3200 bytes at 16kHz 16-bit mono)
                    byte[] pcmBuffer = new byte[3200];
                    while (isLiveCallMicRunning && liveCallAudioRecord != null) {
                        int readBytes = liveCallAudioRecord.read(pcmBuffer, 0, pcmBuffer.length);
                        if (readBytes > 0) {
                            // Compute voice RMS energy for instant local Barge-In detection
                            long sumSq = 0;
                            int samples = readBytes / 2;
                            for (int i = 0; i < readBytes - 1; i += 2) {
                                short sample = (short) ((pcmBuffer[i] & 0xFF) | (pcmBuffer[i + 1] << 8));
                                sumSq += (long) sample * sample;
                            }
                            int rms = samples > 0 ? (int) Math.sqrt((double) sumSq / samples) : 0;

                            // Instant Local Barge-In: If user speaks loudly while AI audio is playing, stop AI speech immediately!
                            boolean aiCurrentlyPlaying = (System.currentTimeMillis() - lastAudioTrackWriteMs < 900)
                                || (nativeTts != null && nativeTts.isSpeaking());
                            if (aiCurrentlyPlaying && rms > 1350) {
                                consecutiveSpeechFramesDuringPlayback++;
                                if (consecutiveSpeechFramesDuringPlayback >= 2) {
                                    flushLiveAudioPlayback();
                                    dispatchVoiceEventToJs("barge_in", "User interrupted AI speech", false);
                                    consecutiveSpeechFramesDuringPlayback = 0;
                                }
                            } else {
                                consecutiveSpeechFramesDuringPlayback = 0;
                            }

                            byte[] exactChunk = (readBytes == pcmBuffer.length)
                                ? pcmBuffer
                                : java.util.Arrays.copyOf(pcmBuffer, readBytes);
                            String b64 = Base64.encodeToString(exactChunk, Base64.NO_WRAP);
                            dispatchPcmChunkToJs(b64, rms);
                        }
                    }
                } catch (Exception e) {
                    dispatchVoiceEventToJs("error", "Live call mic notice: " + e.getMessage(), false);
                } finally {
                    isLiveCallMicRunning = false;
                    try {
                        if (aec != null) aec.release();
                        if (ns != null) ns.release();
                        if (agc != null) agc.release();
                    } catch (Exception ignored) {}
                    try {
                        if (liveCallAudioRecord != null) {
                            liveCallAudioRecord.stop();
                            liveCallAudioRecord.release();
                            liveCallAudioRecord = null;
                        }
                    } catch (Exception ignored) {}
                }
            }, "MyraaLiveCallMicThread");
            liveCallMicThread.start();
        });
    }

    public void stopNativeLiveCallMicOnUi() {
        isLiveCallMicRunning = false;
        try {
            if (liveCallAudioRecord != null) {
                liveCallAudioRecord.stop();
            }
        } catch (Exception ignored) {}
    }

    private void dispatchPcmChunkToJs(final String base64Pcm, final int rms) {
        if (webView == null || !isLiveCallMicRunning) return;
        runOnUiThread(() -> {
            try {
                String js = "if(window.onNativePcmMicChunk){window.onNativePcmMicChunk('" + base64Pcm + "'," + rms + ");}";
                webView.evaluateJavascript(js, null);
            } catch (Exception ignored) {}
        });
    }

    private AudioTrack ensureLivePcmAudioTrack() {
        synchronized (audioTrackLock) {
            if (livePcmAudioTrack == null || livePcmAudioTrack.getState() != AudioTrack.STATE_INITIALIZED) {
                int sampleRate = 24000; // Google Gemini Live native 24kHz PCM output
                int minBuf = AudioTrack.getMinBufferSize(
                    sampleRate,
                    AudioFormat.CHANNEL_OUT_MONO,
                    AudioFormat.ENCODING_PCM_16BIT
                );
                if (minBuf <= 0) minBuf = 9600;
                livePcmAudioTrack = new AudioTrack(
                    new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build(),
                    new AudioFormat.Builder()
                        .setSampleRate(sampleRate)
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build(),
                    Math.max(minBuf * 2, 12000),
                    AudioTrack.MODE_STREAM,
                    AudioManager.AUDIO_SESSION_ID_GENERATE
                );
                livePcmAudioTrack.play();
            }
            return livePcmAudioTrack;
        }
    }

    public void playLivePcm24kChunk(final String base64Pcm) {
        if (base64Pcm == null || base64Pcm.isEmpty()) return;
        pcmPlaybackExecutor.execute(() -> {
            try {
                byte[] pcmBytes = Base64.decode(base64Pcm, Base64.DEFAULT);
                if (pcmBytes == null || pcmBytes.length == 0) return;
                synchronized (audioTrackLock) {
                    AudioTrack track = ensureLivePcmAudioTrack();
                    if (track.getPlayState() != AudioTrack.PLAYSTATE_PLAYING) {
                        track.play();
                    }
                    lastAudioTrackWriteMs = System.currentTimeMillis();
                    track.write(pcmBytes, 0, pcmBytes.length);
                }
            } catch (Exception ignored) {}
        });
    }

    public void flushLiveAudioPlayback() {
        lastAudioTrackWriteMs = 0L;
        try {
            if (nativeTts != null) {
                nativeTts.stop();
            }
        } catch (Exception ignored) {}
        synchronized (audioTrackLock) {
            try {
                if (cloudMediaPlayer != null) {
                    if (cloudMediaPlayer.isPlaying()) {
                        cloudMediaPlayer.stop();
                    }
                    cloudMediaPlayer.release();
                    cloudMediaPlayer = null;
                }
            } catch (Exception ignored) {}
            try {
                if (livePcmAudioTrack != null && livePcmAudioTrack.getState() == AudioTrack.STATE_INITIALIZED) {
                    livePcmAudioTrack.pause();
                    livePcmAudioTrack.flush();
                    livePcmAudioTrack.play();
                }
            } catch (Exception ignored) {}
        }
    }

    public void playBase64Mp3Chunk(final String base64Mp3) {
        if (base64Mp3 == null || base64Mp3.isEmpty()) return;
        pcmPlaybackExecutor.execute(() -> {
            try {
                byte[] mp3Bytes = Base64.decode(base64Mp3, Base64.DEFAULT);
                if (mp3Bytes == null || mp3Bytes.length == 0) return;
                playMp3BytesInternal(mp3Bytes);
            } catch (Exception ignored) {}
        });
    }

    private void playMp3BytesInternal(byte[] mp3Bytes) throws Exception {
        File tempMp3 = new File(getCacheDir(), "myraa_realistic_voice.mp3");
        try (FileOutputStream fos = new FileOutputStream(tempMp3, false)) {
            fos.write(mp3Bytes);
        }
        synchronized (audioTrackLock) {
            if (cloudMediaPlayer != null) {
                try {
                    cloudMediaPlayer.stop();
                    cloudMediaPlayer.release();
                } catch (Exception ignored) {}
                cloudMediaPlayer = null;
            }
            cloudMediaPlayer = new MediaPlayer();
            cloudMediaPlayer.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            );
            try (FileInputStream fis = new FileInputStream(tempMp3)) {
                cloudMediaPlayer.setDataSource(fis.getFD());
                cloudMediaPlayer.prepare();
            }
            lastAudioTrackWriteMs = System.currentTimeMillis();
            cloudMediaPlayer.setOnCompletionListener(mp -> {
                lastAudioTrackWriteMs = 0L;
            });
            cloudMediaPlayer.start();
        }
    }

    private void requestEssentialRuntimePermissions() {
        List<String> needed = new ArrayList<>();
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.RECORD_AUDIO);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            needed.add(Manifest.permission.CAMERA);
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                needed.add(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
        if (!needed.isEmpty()) {
            ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), REQ_PERMISSIONS_CODE);
        }
    }

    public void startNativeVoiceOnUi(final String lang) {
        currentVoiceLang = (lang != null && !lang.isEmpty()) ? lang : "hi-IN";
        runOnUiThread(() -> {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.RECORD_AUDIO}, REQ_PERMISSIONS_CODE);
                dispatchVoiceEventToJs("status", "Requesting Microphone Permission... Tap Mic again after allowing.", false);
                return;
            }

            // Instantly flush any ongoing AI speech when user taps Mic (Barge-In)
            flushLiveAudioPlayback();

            if (!SpeechRecognizer.isRecognitionAvailable(this)) {
                launchSystemSpeechIntent(currentVoiceLang);
                return;
            }

            try {
                if (speechRecognizer != null) {
                    speechRecognizer.destroy();
                }
                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
                speechRecognizer.setRecognitionListener(new RecognitionListener() {
                    @Override
                    public void onReadyForSpeech(Bundle params) {
                        dispatchVoiceEventToJs("listening", "", false);
                    }

                    @Override
                    public void onBeginningOfSpeech() {
                        flushLiveAudioPlayback();
                    }

                    @Override
                    public void onRmsChanged(float rmsdB) {}

                    @Override
                    public void onBufferReceived(byte[] buffer) {}

                    @Override
                    public void onEndOfSpeech() {}

                    @Override
                    public void onError(int error) {
                        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ||
                            error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY ||
                            error == SpeechRecognizer.ERROR_SERVER ||
                            error == SpeechRecognizer.ERROR_NETWORK) {
                            launchSystemSpeechIntent(currentVoiceLang);
                        } else {
                            dispatchVoiceEventToJs("error", "Mic ready (" + error + ")", false);
                        }
                    }

                    @Override
                    public void onResults(Bundle results) {
                        ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (matches != null && !matches.isEmpty()) {
                            dispatchVoiceEventToJs("result", matches.get(0), true);
                        } else {
                            dispatchVoiceEventToJs("error", "No speech detected", false);
                        }
                    }

                    @Override
                    public void onPartialResults(Bundle partialResults) {
                        ArrayList<String> partial = partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (partial != null && !partial.isEmpty() && !partial.get(0).isEmpty()) {
                            flushLiveAudioPlayback();
                            dispatchVoiceEventToJs("partial", partial.get(0), false);
                        }
                    }

                    @Override
                    public void onEvent(int eventType, Bundle params) {}
                });

                Intent recognizerIntent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, currentVoiceLang);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, currentVoiceLang);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                recognizerIntent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
                speechRecognizer.startListening(recognizerIntent);
            } catch (Exception e) {
                launchSystemSpeechIntent(currentVoiceLang);
            }
        });
    }

    private void launchSystemSpeechIntent(String lang) {
        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "SHIV AI — MYRAA Listening (Nirman Karta: Shri Ram Nag)...");
            startActivityForResult(intent, REQ_SPEECH_INTENT_CODE);
        } catch (Exception e) {
            dispatchVoiceEventToJs("error", "Speech recognizer not available: " + e.getMessage(), false);
        }
    }

    public void stopNativeVoiceOnUi() {
        stopNativeLiveCallMicOnUi();
        runOnUiThread(() -> {
            try {
                if (speechRecognizer != null) {
                    speechRecognizer.stopListening();
                }
            } catch (Exception ignored) {}
        });
    }

    public void configureVoiceParamsOnUi(final float pitch, final float rate) {
        currentTtsPitch = Math.max(0.5f, Math.min(2.0f, pitch));
        currentTtsRate = Math.max(0.5f, Math.min(2.0f, rate));
        runOnUiThread(() -> {
            try {
                if (nativeTts != null) {
                    nativeTts.setPitch(currentTtsPitch);
                    nativeTts.setSpeechRate(currentTtsRate);
                }
            } catch (Exception ignored) {}
        });
    }

    public void speakNativeOnUi(final String text, final String lang) {
        if (text == null || text.trim().isEmpty()) return;
        final String cleanText = text.trim().length() > 220 ? text.trim().substring(0, 220) : text.trim();
        final String tl = (lang != null && lang.toLowerCase(Locale.ROOT).startsWith("en")) ? "en-IN" : "hi";

        // 1. Try Natural Google Cloud Neural Voice stream first (Zero Robotic Sound!)
        pcmPlaybackExecutor.execute(() -> {
            try {
                String ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl="
                    + URLEncoder.encode(tl, "UTF-8")
                    + "&q=" + URLEncoder.encode(cleanText, "UTF-8");
                HttpURLConnection conn = (HttpURLConnection) new URL(ttsUrl).openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(3500);
                conn.setReadTimeout(4500);
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14)");
                if (conn.getResponseCode() == 200) {
                    java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                    try (InputStream is = conn.getInputStream()) {
                        byte[] buf = new byte[4096];
                        int n;
                        while ((n = is.read(buf)) != -1) {
                            baos.write(buf, 0, n);
                        }
                    }
                    byte[] mp3Data = baos.toByteArray();
                    if (mp3Data.length > 256) {
                        playMp3BytesInternal(mp3Data);
                        return;
                    }
                }
            } catch (Exception ignored) {}

            // 2. Offline Fallback only if internet is completely unavailable
            runOnUiThread(() -> {
                try {
                    if (ttsReady && nativeTts != null) {
                        selectBestHumanTtsVoice(lang);
                        nativeTts.setPitch(currentTtsPitch);
                        nativeTts.setSpeechRate(currentTtsRate);
                        Bundle params = new Bundle();
                        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_MUSIC);
                        nativeTts.speak(cleanText, TextToSpeech.QUEUE_FLUSH, params, "myraa-utt-" + System.currentTimeMillis());
                    }
                } catch (Exception ignored) {}
            });
        });
    }

    public void stopNativeSpeakOnUi() {
        flushLiveAudioPlayback();
    }

    private void dispatchVoiceEventToJs(final String type, final String text, final boolean isFinal) {
        if (webView == null) return;
        runOnUiThread(() -> {
            try {
                String safeText = JSONObject.quote(text != null ? text : "");
                String js = "if(window.onNativeVoiceEvent){window.onNativeVoiceEvent('" + type + "'," + safeText + "," + isFinal + ");}";
                webView.evaluateJavascript(js, null);
            } catch (Exception ignored) {}
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_SPEECH_INTENT_CODE) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                ArrayList<String> results = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
                if (results != null && !results.isEmpty()) {
                    dispatchVoiceEventToJs("result", results.get(0), true);
                    return;
                }
            }
            dispatchVoiceEventToJs("error", "Voice input cancelled", false);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_PERMISSIONS_CODE) {
            boolean micGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED;
            if (micGranted) {
                dispatchVoiceEventToJs("permission_granted", "Microphone permission granted!", false);
            }
        }
    }

    @Override
    protected void onDestroy() {
        stopNativeLiveCallMicOnUi();
        try {
            if (speechRecognizer != null) {
                speechRecognizer.destroy();
                speechRecognizer = null;
            }
            if (nativeTts != null) {
                nativeTts.stop();
                nativeTts.shutdown();
            }
            synchronized (audioTrackLock) {
                if (livePcmAudioTrack != null) {
                    livePcmAudioTrack.stop();
                    livePcmAudioTrack.release();
                    livePcmAudioTrack = null;
                }
            }
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    public static class MyraaJsBridge {
        private final BridgeActivity activity;
        private final Plugin plugin;

        public MyraaJsBridge(BridgeActivity activity, Plugin plugin) {
            this.activity = activity;
            this.plugin = plugin;
        }

        @JavascriptInterface
        public String invoke(String methodName, String jsonPayload) {
            if (!SecurityPolicyEngine.verifySupremeOwnerIntegrity(activity, null)) {
                return "{\"status\":\"error\",\"error\":\"ANTI-TAMPER LOCKDOWN: Owned exclusively by Shri Ram Nag\"}";
            }
            try {
                JSObject payload = (jsonPayload != null && !jsonPayload.isEmpty())
                    ? new JSObject(jsonPayload)
                    : new JSObject();
                PluginCall call = new PluginCall(payload);
                Method method = plugin.getClass().getMethod(methodName, PluginCall.class);
                method.invoke(plugin, call);
                if (call.getRejectedMessage() != null) {
                    JSObject err = new JSObject();
                    err.put("status", "error");
                    err.put("error", call.getRejectedMessage());
                    return err.toString();
                }
                JSObject res = call.getResolvedData();
                return res != null ? res.toString() : new JSObject().put("status", "ok").toString();
            } catch (Exception e) {
                JSObject err = new JSObject();
                err.put("status", "error");
                err.put("error", e.getMessage() != null ? e.getMessage() : "Bridge invocation error");
                return err.toString();
            }
        }

        @JavascriptInterface
        public void startNativeVoice(String lang) {
            activity.startNativeVoiceOnUi(lang);
        }

        @JavascriptInterface
        public void stopNativeVoice() {
            activity.stopNativeVoiceOnUi();
        }

        @JavascriptInterface
        public void startNativeLiveCallMic() {
            activity.startNativeLiveCallMicOnUi();
        }

        @JavascriptInterface
        public void stopNativeLiveCallMic() {
            activity.stopNativeLiveCallMicOnUi();
        }

        @JavascriptInterface
        public void playLivePcm24k(String base64Pcm) {
            activity.playLivePcm24kChunk(base64Pcm);
        }

        @JavascriptInterface
        public void flushLiveAudio() {
            activity.flushLiveAudioPlayback();
        }

        @JavascriptInterface
        public void speakNative(String text, String lang) {
            activity.speakNativeOnUi(text, lang);
        }

        @JavascriptInterface
        public void setVoiceCloneParams(float pitch, float rate) {
            activity.configureVoiceParamsOnUi(pitch, rate);
        }

        @JavascriptInterface
        public void stopNativeSpeak() {
            activity.stopNativeSpeakOnUi();
        }

        @JavascriptInterface
        public String getSavedGeminiKey() {
            SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            return prefs.getString(KEY_GEMINI_API, "");
        }

        @JavascriptInterface
        public void saveGeminiKey(String apiKey) {
            SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_GEMINI_API, apiKey != null ? apiKey.trim() : "").apply();
        }

        @JavascriptInterface
        public void playBase64Mp3(String base64Mp3) {
            activity.playBase64Mp3Chunk(base64Mp3);
        }

        @JavascriptInterface
        public void pullLiveChannelUpdate() {
            activity.pullLiveChannelUpdateFromGithub();
        }

        @JavascriptInterface
        public void pullLiveChannelUpdate(String optionalUrl) {
            activity.pullLiveChannelUpdateFromGithub();
        }

        @JavascriptInterface
        public void resetLiveChannel() {
            activity.resetToBuiltInChannel();
        }

        @JavascriptInterface
        public String getOwnerSeal() {
            return SecurityPolicyEngine.computeOwnerSealToken();
        }
    }
}
