package ai.myraa.mobile;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Bundle;
import android.os.IBinder;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import java.util.ArrayList;

public class MyraaBackgroundService extends Service {
    public static final String CHANNEL_ID = "MYRAA_BACKGROUND_VOICE_CHANNEL";
    public static final int NOTIFICATION_ID = 1001;
    private SpeechRecognizer speechRecognizer;

    @Override
    public void onCreate() {
        super.onCreate();
        try {
            createNotificationChannel();
        } catch (Throwable e) {
            Log.e("MyraaBackgroundService", "Channel creation failed: " + e.getMessage());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        try {
            Notification notification = buildNotification("MYRAA is listening in background...");
            if (Build.VERSION.SDK_INT >= 34) {
                if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                    startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
                } else {
                    startForeground(NOTIFICATION_ID, notification);
                }
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
            startListening();
        } catch (Throwable e) {
            Log.e("MyraaBackgroundService", "Safe startForeground catch: " + e.getMessage(), e);
        }
        return START_NOT_STICKY;
    }

    private void startListening() {
        try {
            if (checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                return;
            }
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
                        try {
                            ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                            if (matches != null && !matches.isEmpty()) {
                                String query = matches.get(0);
                                // Broadcast or wake
                            }
                        } catch (Exception ignored) {}
                        restartSoon();
                    }
                    @Override public void onPartialResults(Bundle partialResults) {}
                    @Override public void onEvent(int eventType, Bundle params) {}
                });
            }

            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            speechRecognizer.startListening(intent);
        } catch (Throwable e) {
            Log.e("MyraaBackgroundService", "startListening error: " + e.getMessage());
        }
    }

    private void restartSoon() {
        try {
            new android.os.Handler(getMainLooper()).postDelayed(this::startListening, 1500);
        } catch (Exception ignored) {}
    }

    private Notification buildNotification(String text) {
        try {
            Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, launchIntent, 
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            return new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("MYRAA Background Voice Mode")
                    .setContentText(text)
                    .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                    .setContentIntent(pendingIntent)
                    .setOngoing(true)
                    .build();
        } catch (Exception e) {
            return new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("MYRAA")
                    .setContentText(text)
                    .setSmallIcon(android.R.drawable.ic_btn_speak_now)
                    .build();
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "MYRAA Background Voice Service",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override
    public void onDestroy() {
        try {
            if (speechRecognizer != null) {
                speechRecognizer.destroy();
                speechRecognizer = null;
            }
            stopForeground(true);
        } catch (Throwable ignored) {}
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
