package ai.myraa.mobile.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = CelestialBlue,
    onPrimary = CyberVoid,
    primaryContainer = CyberCardLight,
    onPrimaryContainer = CelestialBlue,
    secondary = EmeraldGreen,
    onSecondary = CyberVoid,
    background = CyberVoid,
    onBackground = TextPrimary,
    surface = CyberCard,
    onSurface = TextPrimary,
    surfaceVariant = CyberCardLight,
    onSurfaceVariant = TextSecondary,
    outline = CyberBorder,
    error = DangerRed,
    onError = TextPrimary
)

@Composable
fun MyraaTheme(
    content: @Composable () -> Unit
) {
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = CyberVoid.toArgb()
                window.navigationBarColor = CyberVoid.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
                WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
            }
        }
    }

    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
