package com.getcapacitor;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
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
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.json.JSONObject;

public class BridgeActivity extends AppCompatActivity {
    private static final int REQ_PERMISSIONS_CODE = 5001;
    private static final int REQ_SPEECH_INTENT_CODE = 5002;
    private static final String PREFS_NAME = "MyraaSecureKeyStorePrefs";
    private static final String KEY_GEMINI_API = "encrypted_gemini_api_key";

    private final List<Class<? extends Plugin>> registeredPluginClasses = new ArrayList<>();
    private final Map<String, Plugin> activePlugins = new HashMap<>();
    private WebView webView;
    private SpeechRecognizer speechRecognizer;
    private TextToSpeech nativeTts;
    private boolean ttsReady = false;
    private String currentVoiceLang = "hi-IN";

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

        webView.loadUrl("file:///android_asset/public/index.html");
        handleWakeIntent(getIntent());
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
                    int res = nativeTts.setLanguage(new Locale("hi", "IN"));
                    if (res == TextToSpeech.LANG_MISSING_DATA || res == TextToSpeech.LANG_NOT_SUPPORTED) {
                        nativeTts.setLanguage(Locale.US);
                    }
                    nativeTts.setSpeechRate(1.02f);
                }
            });
        } catch (Exception ignored) {}
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

            try {
                if (nativeTts != null && nativeTts.isSpeaking()) {
                    nativeTts.stop();
                }
            } catch (Exception ignored) {}

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
                    public void onBeginningOfSpeech() {}

                    @Override
                    public void onRmsChanged(float rmsdB) {}

                    @Override
                    public void onBufferReceived(byte[] buffer) {}

                    @Override
                    public void onEndOfSpeech() {}

                    @Override
                    public void onError(int error) {
                        // Error 7 = ERROR_NO_MATCH, Error 6 = ERROR_SPEECH_TIMEOUT, Error 5 = ERROR_CLIENT
                        if (error == SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS ||
                            error == SpeechRecognizer.ERROR_RECOGNIZER_BUSY ||
                            error == SpeechRecognizer.ERROR_SERVER ||
                            error == SpeechRecognizer.ERROR_NETWORK) {
                            launchSystemSpeechIntent(currentVoiceLang);
                        } else {
                            dispatchVoiceEventToJs("error", "Mic error code: " + error, false);
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
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "SHIV AI — MYRAA Listening (Speak Hindi / English)...");
            startActivityForResult(intent, REQ_SPEECH_INTENT_CODE);
        } catch (Exception e) {
            dispatchVoiceEventToJs("error", "Speech recognizer not available: " + e.getMessage(), false);
        }
    }

    public void stopNativeVoiceOnUi() {
        runOnUiThread(() -> {
            try {
                if (speechRecognizer != null) {
                    speechRecognizer.stopListening();
                }
            } catch (Exception ignored) {}
        });
    }

    public void speakNativeOnUi(final String text, final String lang) {
        if (text == null || text.trim().isEmpty()) return;
        runOnUiThread(() -> {
            try {
                if (ttsReady && nativeTts != null) {
                    if (lang != null && lang.startsWith("en")) {
                        nativeTts.setLanguage(new Locale("en", "IN"));
                    } else {
                        int r = nativeTts.setLanguage(new Locale("hi", "IN"));
                        if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                            nativeTts.setLanguage(Locale.US);
                        }
                    }
                    nativeTts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "myraa-utt-" + System.currentTimeMillis());
                }
            } catch (Exception ignored) {}
        });
    }

    public void stopNativeSpeakOnUi() {
        runOnUiThread(() -> {
            try {
                if (nativeTts != null) {
                    nativeTts.stop();
                }
            } catch (Exception ignored) {}
        });
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
        try {
            if (speechRecognizer != null) {
                speechRecognizer.destroy();
                speechRecognizer = null;
            }
            if (nativeTts != null) {
                nativeTts.stop();
                nativeTts.shutdown();
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
        public void speakNative(String text, String lang) {
            activity.speakNativeOnUi(text, lang);
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
    }
}
