package ai.myraa.mobile.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import ai.myraa.mobile.data.VoiceAssistantEngine
import ai.myraa.mobile.model.CharacterRole
import ai.myraa.mobile.ui.theme.*

@Composable
fun GeminiApiKeyDialog(
    voiceEngine: VoiceAssistantEngine,
    activeRole: CharacterRole,
    onDismiss: () -> Unit
) {
    var keyInput by remember { mutableStateOf(voiceEngine.getSavedApiKey()) }
    var showPassword by remember { mutableStateOf(false) }
    var showSavedNotice by remember { mutableStateOf(false) }
    val hasApiKey by voiceEngine.hasApiKey.collectAsState()

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, CelestialBlue.copy(alpha = 0.5f), RoundedCornerShape(24.dp))
                .testTag("gemini_api_key_dialog"),
            color = CyberVoid
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(18.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(CelestialBlue.copy(alpha = 0.15f))
                                .border(1.dp, CelestialBlue.copy(alpha = 0.4f), RoundedCornerShape(12.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Key,
                                contentDescription = "Gemini API Key",
                                tint = CelestialBlue,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "Gemini API Key Settings",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "6 Realistic Voices (Kore • Aoede • Despina • Puck • Fenrir • Charon)",
                                color = TextSecondary,
                                fontSize = 10.sp
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .size(36.dp)
                            .testTag("close_gemini_api_key_dialog")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = TextSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Quick Status Chip Row
                Surface(
                    color = CyberCard,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, CyberBorder, RoundedCornerShape(14.dp))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 12.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Voice Pipeline Status:",
                            color = TextSecondary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )

                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(
                                    if (hasApiKey) EmeraldGreen.copy(alpha = 0.2f)
                                    else AmberGold.copy(alpha = 0.2f)
                                )
                                .border(
                                    1.dp,
                                    if (hasApiKey) EmeraldGreen.copy(alpha = 0.5f)
                                    else AmberGold.copy(alpha = 0.5f),
                                    RoundedCornerShape(50)
                                )
                                .padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(5.dp)
                        ) {
                            Icon(
                                imageVector = if (hasApiKey) Icons.Default.CheckCircle else Icons.Default.Info,
                                contentDescription = null,
                                tint = if (hasApiKey) EmeraldGreen else AmberGold,
                                modifier = Modifier.size(13.dp)
                            )
                            Text(
                                text = if (hasApiKey) "Active / Connected" else "Setup Needed",
                                color = if (hasApiKey) EmeraldGreen else AmberGold,
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }

                // Polite inline prompt if no key is entered yet
                if (!hasApiKey) {
                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        color = AmberGold.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, AmberGold.copy(alpha = 0.3f), RoundedCornerShape(12.dp))
                    ) {
                        Text(
                            text = "कृपया अपनी Google Gemini API Key दर्ज करें ताकि सभी 6 कैरेक्टर्स की असली आवाज़ (Kore, Aoede, Despina, Puck, Fenrir, Charon) तुरंत चालू हो सके।",
                            color = AmberGold,
                            fontSize = 11.sp,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = "Enter Google Gemini API Key",
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = keyInput,
                    onValueChange = {
                        keyInput = it
                        showSavedNotice = false
                    },
                    placeholder = {
                        Text(
                            text = "Enter Google Gemini API Key (AIzaSy...)",
                            fontSize = 12.sp,
                            color = TextMuted
                        )
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    trailingIcon = {
                        IconButton(
                            onClick = { showPassword = !showPassword },
                            modifier = Modifier.testTag("toggle_api_key_visibility")
                        ) {
                            Icon(
                                imageVector = if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                contentDescription = if (showPassword) "Hide API Key" else "Show API Key",
                                tint = TextSecondary
                            )
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("gemini_api_key_input")
                )

                if (showSavedNotice) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "✓ GEMINI_API_KEY सुरक्षित रूप से सेव हो गई है!",
                        color = EmeraldGreen,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = {
                            voiceEngine.saveApiKey(keyInput)
                            showSavedNotice = true
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CelestialBlue),
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp)
                            .testTag("save_gemini_api_key_button")
                    ) {
                        Text(
                            text = "Save Key",
                            color = CyberVoid,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }

                    OutlinedButton(
                        onClick = {
                            if (keyInput.isNotBlank()) {
                                voiceEngine.saveApiKey(keyInput)
                            }
                            val voiceName = voiceEngine.getVoiceNameForRole(activeRole)
                            voiceEngine.speak(
                                "नमस्ते श्री राम नाग जी! Google Gemini $voiceName आवाज़ सफलतापूर्वक कनेक्ट हो गई है।",
                                activeRole
                            )
                        },
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .height(48.dp)
                            .testTag("test_gemini_voice_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.VolumeUp,
                            contentDescription = "Test Voice",
                            tint = CelestialBlue,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Test Voice",
                            color = CelestialBlue,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}
