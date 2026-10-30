package ai.myraa.mobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
    onToggleTorch: () -> Unit,
    onOpenApps: () -> Unit,
    onOpenAdminVault: () -> Unit,
    onOpenApkDoctor: () -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        color = CyberCard,
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
            .clip(RoundedCornerShape(16.dp))
            .border(1.dp, CyberBorder, RoundedCornerShape(16.dp))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Left: Owner branding & voice lock
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "👑 श्री राम नाग",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (isVoiceLockActive) EmeraldGreen.copy(alpha = 0.2f) else DangerRed.copy(alpha = 0.2f))
                            .border(
                                1.dp,
                                if (isVoiceLockActive) EmeraldGreen.copy(alpha = 0.5f) else DangerRed.copy(alpha = 0.5f),
                                RoundedCornerShape(6.dp)
                            )
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = if (isVoiceLockActive) "VOICE LOCK ON" else "UNLOCKED",
                            color = if (isVoiceLockActive) EmeraldGreen else DangerRed,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
                Text(
                    text = "SHIV AI • MYRAA v7.0.36",
                    color = CelestialBlue,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }

            // Right: Quick Action Buttons (Touch targets >= 48dp)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                // Torch Action
                IconButton(
                    onClick = onToggleTorch,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(if (isTorchOn) AmberGold.copy(alpha = 0.25f) else CyberCardLight)
                        .testTag("top_bar_torch_button")
                ) {
                    Icon(
                        imageVector = if (isTorchOn) Icons.Default.FlashlightOn else Icons.Default.FlashlightOff,
                        contentDescription = "Flashlight Toggle",
                        tint = if (isTorchOn) AmberGold else TextSecondary,
                        modifier = Modifier.size(18.dp)
                    )
                }

                // Android Apps Drawer
                IconButton(
                    onClick = onOpenApps,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(CyberCardLight)
                        .testTag("top_bar_apps_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Apps,
                        contentDescription = "Installed Apps",
                        tint = CelestialBlue,
                        modifier = Modifier.size(18.dp)
                    )
                }

                // Admin Vault
                IconButton(
                    onClick = onOpenAdminVault,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(CyberCardLight)
                        .testTag("top_bar_admin_vault_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Shield,
                        contentDescription = "Admin Vault",
                        tint = EmeraldGreen,
                        modifier = Modifier.size(18.dp)
                    )
                }

                // APK Doctor
                IconButton(
                    onClick = onOpenApkDoctor,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(CyberCardLight)
                        .testTag("top_bar_apk_doctor_button")
                ) {
                    Icon(
                        imageVector = Icons.Default.Build,
                        contentDescription = "Build Doctor",
                        tint = VioletPurple,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
    }
}
