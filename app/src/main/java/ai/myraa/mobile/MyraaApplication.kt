package ai.myraa.mobile

import android.app.Application
import android.util.Log

class MyraaApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        try {
            // Global Crash Guard to ensure the app NEVER enters a crash loop on launch
            val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()
            Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
                Log.e("MyraaCrashGuard", "Intercepted crash on thread ${thread.name}: ${throwable.message}", throwable)
                // If it's a fatal crash on main thread during launch, log and prevent rescue party crash loop
                try {
                    defaultHandler?.uncaughtException(thread, throwable)
                } catch (e: Throwable) {
                    Log.e("MyraaCrashGuard", "Default handler error: ${e.message}")
                }
            }
        } catch (e: Throwable) {
            Log.e("MyraaApplication", "Crash handler installation failed: ${e.message}")
        }
    }
}
