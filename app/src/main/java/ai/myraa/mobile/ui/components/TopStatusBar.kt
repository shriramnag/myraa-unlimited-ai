package ai.myraa.mobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.myraa.mobile.ui.theme.*

@Composable
fun TopStatusBar(
    isTorchOn: Boolean,
    isVoiceLockActive: Boolean,
    hasApiKey: Boolean = false,
    onToggleTorch: () -> Unit,
    onOpenApps: () -> Unit,
    onOpenAdminVault: () -> Unit,
    onOpenApkDoctor: () -> Unit,
    onOpenApiKeySettings: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    Surface(
        color = CyberCard,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CyberBorder, RoundedCornerShape(16.dp))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Ultra-Sleek Minimal Owner Badge Chip
            Row(
                modifier = Modifier
                    .clip(RoundedCornerShape(50))
                    .background(CyberVoid.copy(alpha = 0.85f))
                    .border(1.dp, CyberBorder, RoundedCornerShape(50))
                    .padding(horizontal = 10.dp, vertical = 5.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(5.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.AutoAwesome,
                    contentDescription = "SHIV AI",
                    tint = CelestialBlue,
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    text = "SHIV AI",
                    color = Color.White,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "v7.0.65",
                    color = CelestialBlue,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = "|",
                    color = TextMuted,
                    fontSize = 10.sp
                )
                Text(
                    text = "श्री राम नाग",
                    color = EmeraldGreen,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            // Right: Quick Action Buttons
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Gemini API Key Settings Action
                IconButton(
                    onClick = onOpenApiKeySettings,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (hasApiKey) EmeraldGreen.copy(alpha = 0.25f) else CyberCardLight)
                        .testTag("top_bar_api_key_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Key,
                        contentDescription = "Gemini API Key Settings",
                        tint = if (hasApiKey) EmeraldGreen else CelestialBlue,
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Torch Action
                IconButton(
                    onClick = onToggleTorch,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(if (isTorchOn) AmberGold.copy(alpha = 0.25f) else CyberCardLight)
                        .testTag("top_bar_torch_button")
                ) {
                    Icon(
                        imageVector = if (isTorchOn) Icons.Default.FlashlightOn else Icons.Default.FlashlightOff,
                        contentDescription = "Flashlight Toggle",
                        tint = if (isTorchOn) AmberGold else TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Android Apps Drawer
                IconButton(
                    onClick = onOpenApps,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(CyberCardLight)
                        .testTag("top_bar_apps_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Apps,
                        contentDescription = "Installed Apps",
                        tint = CelestialBlue,
                        modifier = Modifier.size(16.dp)
                    )
                }

                // Admin Vault
                IconButton(
                    onClick = onOpenAdminVault,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(CyberCardLight)
                        .testTag("top_bar_admin_vault_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = "Admin Vault",
                        tint = if (isVoiceLockActive) EmeraldGreen else DangerRed,
                        modifier = Modifier.size(16.dp)
                    )
                }

                // APK Doctor
                IconButton(
                    onClick = onOpenApkDoctor,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(CyberCardLight)
                        .testTag("top_bar_apk_doctor_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Build,
                        contentDescription = "Build Doctor",
                        tint = VioletPurple,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}
