package ai.myraa.mobile.ui.components

import android.graphics.BitmapFactory
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CropFree
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.myraa.mobile.model.CharacterRole
import ai.myraa.mobile.ui.theme.*

@Composable
fun HolographicAvatarStage(
    activeRole: CharacterRole,
    onSelectRole: (CharacterRole) -> Unit,
    isSpeaking: Boolean,
    cameraMode: String, // "CLOSEUP" or "FULL"
    onToggleCameraMode: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val roleColor = remember(activeRole) {
        Color(android.graphics.Color.parseColor(activeRole.hexColor))
    }

    // Pulse animation when speaking
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = if (isSpeaking) 1.08f else 1.02f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (isSpeaking) 450 else 1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    // Load asset image bitmap asynchronously off the main thread to prevent cold-boot stalls or OOM
    val avatarBitmap by produceState<androidx.compose.ui.graphics.ImageBitmap?>(
        initialValue = null,
        key1 = activeRole.assetImage
    ) {
        value = kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val opts = BitmapFactory.Options().apply {
                    inPreferredConfig = android.graphics.Bitmap.Config.ARGB_8888
                }
                context.assets.open(activeRole.assetImage).use { stream ->
                    BitmapFactory.decodeStream(stream, null, opts)?.asImageBitmap()
                }
            } catch (e: Throwable) {
                null
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Holographic Viewport Box
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(if (cameraMode == "FULL") 280.dp else 230.dp)
                .clip(RoundedCornerShape(24.dp))
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            roleColor.copy(alpha = 0.15f),
                            CyberCard.copy(alpha = 0.95f),
                            CyberVoid
                        )
                    )
                )
                .border(1.5.dp, roleColor.copy(alpha = 0.45f), RoundedCornerShape(24.dp)),
            contentAlignment = Alignment.Center
        ) {
            // Background grid / decorative rings
            Box(
                modifier = Modifier
                    .size(if (cameraMode == "FULL") 240.dp else 190.dp)
                    .clip(CircleShape)
                    .border(1.dp, roleColor.copy(alpha = 0.25f), CircleShape)
            )

            // Outer pulse ring when speaking
            Box(
                modifier = Modifier
                    .size(if (cameraMode == "FULL") 260.dp else 210.dp)
                    .scale(pulseScale)
                    .clip(CircleShape)
                    .border(
                        2.dp,
                        if (isSpeaking) roleColor.copy(alpha = 0.8f) else roleColor.copy(alpha = 0.15f),
                        CircleShape
                    )
            )

            // Avatar Image Rendering
            val bmp = avatarBitmap
            if (bmp != null) {
                Image(
                    bitmap = bmp,
                    contentDescription = activeRole.roleName,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(12.dp)
                        .scale(if (isSpeaking) pulseScale else 1.0f)
                        .clip(RoundedCornerShape(20.dp)),
                    contentScale = if (cameraMode == "FULL") ContentScale.Fit else ContentScale.Crop
                )
            } else {
                // Fallback Icon/Text if bitmap fails
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = "Avatar Placeholder",
                        tint = roleColor,
                        modifier = Modifier.size(56.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = activeRole.badge,
                        color = roleColor,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Top-Right: Camera Mode Toggle
            IconButton(
                onClick = onToggleCameraMode,
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(8.dp)
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(CyberVoid.copy(alpha = 0.75f))
                    .border(1.dp, Color.White.copy(alpha = 0.2f), CircleShape)
                    .testTag("avatar_camera_mode_toggle")
            ) {
                Icon(
                    imageVector = Icons.Default.CropFree,
                    contentDescription = "Toggle Camera Mode",
                    tint = TextPrimary,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Top-Left: Live Speaking / Idle Status Chip
            Row(
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(10.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(CyberVoid.copy(alpha = 0.8f))
                    .border(1.dp, roleColor.copy(alpha = 0.5f), RoundedCornerShape(12.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.GraphicEq,
                    contentDescription = "Audio State",
                    tint = if (isSpeaking) EmeraldGreen else roleColor,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = if (isSpeaking) "LIP-SYNC ACTIVE" else "HOLOGRAPHIC IDLE",
                    color = if (isSpeaking) EmeraldGreen else TextSecondary,
                    fontSize = 9.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            // Bottom Overlay: Persona Title & Specialty Badge
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color.Transparent, CyberVoid.copy(alpha = 0.9f))
                        )
                    )
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = activeRole.roleName,
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "${activeRole.hindiTitle} • ${activeRole.specialty}",
                    color = roleColor,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Role Selector Chips (Horizontal Scrollable)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            CharacterRole.values().forEach { role ->
                val isSelected = role == activeRole
                val chipColor = remember(role) {
                    Color(android.graphics.Color.parseColor(role.hexColor))
                }
                Surface(
                    onClick = { onSelectRole(role) },
                    shape = RoundedCornerShape(14.dp),
                    color = if (isSelected) chipColor.copy(alpha = 0.25f) else CyberCard,
                    modifier = Modifier
                        .border(
                            1.dp,
                            if (isSelected) chipColor else CyberBorder,
                            RoundedCornerShape(14.dp)
                        )
                        .testTag("avatar_chip_${role.name}")
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = role.badge,
                            color = if (isSelected) chipColor else TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                        )
                    }
                }
            }
        }
    }
}
