package ai.myraa.mobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import androidx.core.app.NotificationCompat;
import java.util.ArrayList;
import java.util.Locale;

/**
 * SHIV AI — MYRAA (v6.0): ALWAYS-ON WAKE-WORD ("HEY MYRAA" / "JAI SHIV") FOREGROUND SERVICE
 * Supreme Owner: Shri Ram Nag (श्री राम नाग)
 */
public class MyraaBackgroundService extends Service {
    public static final String CHANNEL_ID = "MYRAA_BACKGROUND_VOICE_CHANNEL";
    public static final int NOTIFICATION_ID = 1001;
    public static volatile boolean isRunning = false;
    public static volatile String lastHeardWakePhrase = "";

    private SpeechRecognizer speechRecognizer;

    @Override
    public void onCreate() {
        super.onCreate();
        isRunning = true;
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        isRunning = true;
        Notification notification = buildNotification("Wake-Word Active: Say 'Hey MYRAA' or 'Jai Shiv'...");
        startForeground(NOTIFICATION_ID, notification);
        startListening();
        return START_STICKY;
    }

    private void startListening() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) return;
        if (speechRecognizer == null) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onError(int error) { restartSoon(); }
                @Override public void onResults(Bundle results) {
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (matches != null && !matches.isEmpty()) {
                        String query = matches.get(0);
                        handleWakePhrase(query);
                    }
                    restartSoon();
                }
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onEvent(int eventType, Bundle params) {}
            });
        }

        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "hi-IN");
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        try {
            speechRecognizer.startListening(intent);
        } catch (Exception ignored) {}
    }

    private void handleWakePhrase(String phrase) {
        if (phrase == null || phrase.trim().isEmpty()) return;
        lastHeardWakePhrase = phrase.trim();
        String lower = lastHeardWakePhrase.toLowerCase(Locale.ROOT);
        if (lower.contains("myraa") || lower.contains("myra") || lower.contains("मायरा") ||
            lower.contains("shiv") || lower.contains("शिव") || lower.contains("hello") ||
            lower.contains("flashlight") || lower.contains("torch")) {

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.notify(NOTIFICATION_ID, buildNotification("Wake Command: " + lastHeardWakePhrase));
            }

            Intent wakeIntent = new Intent(this, MainActivity.class);
            wakeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            wakeIntent.putExtra("wake_command", lastHeardWakePhrase);
            try {
                startActivity(wakeIntent);
            } catch (Exception ignored) {}
        }
    }

    private void restartSoon() {
        if (!isRunning) return;
        new android.os.Handler(getMainLooper()).postDelayed(() -> {
            if (isRunning) startListening();
        }, 1200);
    }

    private Notification buildNotification(String text) {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("SHIV AI — MYRAA Wake-Word Guard")
                .setContentText(text)
                .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                .setContentIntent(pendingIntent)
                .setOngoing(true)
                .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "MYRAA Wake-Word Background Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        isRunning = false;
        if (speechRecognizer != null) {
            speechRecognizer.destroy();
            speechRecognizer = null;
        }
        stopForeground(true);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
