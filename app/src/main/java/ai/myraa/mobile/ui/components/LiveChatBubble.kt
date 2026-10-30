package ai.myraa.mobile.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.myraa.mobile.model.CharacterRole
import ai.myraa.mobile.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun LiveChatBubble(
    activeRole: CharacterRole,
    userPrompt: String,
    replyText: String,
    activeToolId: String?,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val roleColor = remember(activeRole) {
        Color(android.graphics.Color.parseColor(activeRole.hexColor))
    }
    var copied by remember { mutableStateOf(false) }

    // Typewriter effect
    var displayedReply by remember { mutableStateOf("") }
    LaunchedEffect(replyText) {
        if (replyText.isEmpty()) {
            displayedReply = ""
            return@LaunchedEffect
        }
        displayedReply = ""
        val step = maxOf(2, replyText.length / 40)
        var i = 0
        while (i < replyText.length) {
            i = minOf(i + step, replyText.length)
            displayedReply = replyText.substring(0, i)
            delay(24)
        }
    }

    if (replyText.isEmpty() && userPrompt.isEmpty()) return

    Surface(
        color = CyberCard.copy(alpha = 0.95f),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(18.dp))
            .border(1.5.dp, roleColor.copy(alpha = 0.6f), RoundedCornerShape(18.dp))
            .testTag("live_chat_bubble")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp)
        ) {
            // Header: Specialist Badge, Active Tool chip, Copy, Dismiss
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.AutoAwesome,
                        contentDescription = "Role Indicator",
                        tint = roleColor,
                        modifier = Modifier.size(14.dp)
                    )
                    Text(
                        text = activeRole.badge,
                        color = roleColor,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    if (!activeToolId.isNullOrEmpty()) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(EmeraldGreen.copy(alpha = 0.2f))
                                .border(1.dp, EmeraldGreen.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "⚡ $activeToolId",
                                color = EmeraldGreen,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            clipboard.setPrimaryClip(ClipData.newPlainText("MYRAA Response", replyText))
                            copied = true
                            Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                        },
                        modifier = Modifier.size(32.dp).testTag("copy_response_button")
                    ) {
                        Icon(
                            imageVector = if (copied) Icons.Default.Check else Icons.Default.ContentCopy,
                            contentDescription = "Copy text",
                            tint = if (copied) EmeraldGreen else TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(32.dp).testTag("dismiss_chat_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Dismiss",
                            tint = TextSecondary,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }

            // User Prompt preview
            if (userPrompt.isNotEmpty()) {
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "आप: \"$userPrompt\"",
                    color = SkyCyan,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Medium,
                    maxLines = 2
                )
            }

            Spacer(modifier = Modifier.height(6.dp))

            // Reply text with typewriter animation
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 140.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                Text(
                    text = displayedReply.ifEmpty { replyText },
                    color = TextPrimary,
                    fontSize = 12.sp,
                    lineHeight = 18.sp
                )
            }
        }
    }
}
