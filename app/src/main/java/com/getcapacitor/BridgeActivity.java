package com.getcapacitor;

import android.annotation.SuppressLint;
import android.graphics.Color;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class BridgeActivity extends AppCompatActivity {
    private final List<Class<? extends Plugin>> registeredPluginClasses = new ArrayList<>();
    private final Map<String, Plugin> activePlugins = new HashMap<>();
    private WebView webView;

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

        for (Class<? extends Plugin> cls : registeredPluginClasses) {
            try {
                Plugin instance = cls.getDeclaredConstructor().newInstance();
                instance.setActivity(this);
                instance.setContext(getApplicationContext());
                activePlugins.put(cls.getSimpleName(), instance);
                if ("MyraaNativePlugin".equals(cls.getSimpleName())) {
                    webView.addJavascriptInterface(new MyraaJsBridge(instance), "MyraaNativeBridge");
                }
            } catch (Exception ignored) {}
        }

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> request.grant(request.getResources()));
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
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
    }

    public static class MyraaJsBridge {
        private final Plugin plugin;

        public MyraaJsBridge(Plugin plugin) {
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
    }
}
