package ai.myraa.mobile.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.myraa.mobile.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QuickCommandBar(
    inputText: String,
    onInputChange: (String) -> Unit,
    onSubmit: (String) -> Unit,
    onVoiceClick: () -> Unit,
    isListening: Boolean = false,
    waveformLevels: List<Float> = emptyList(),
    onOpenBrainDb: () -> Unit,
    onOpenShivCore: () -> Unit,
    onToggleTorch: () -> Unit,
    onOpenApps: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        // Quick Shortcuts Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            SuggestionChip(
                onClick = onOpenBrainDb,
                label = { Text("🧠 ब्रेन डेटाबेस", fontSize = 10.sp, color = CelestialBlue) },
                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = CyberCard),
                border = BorderStroke(1.dp, CelestialBlue.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("chip_brain_db")
            )
            SuggestionChip(
                onClick = onOpenShivCore,
                label = { Text("🔱 11 टूल्स & YT स्किल्स", fontSize = 10.sp, color = AmberGold) },
                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = CyberCard),
                border = BorderStroke(1.dp, AmberGold.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("chip_11_tools")
            )
            SuggestionChip(
                onClick = onToggleTorch,
                label = { Text("🔦 फ्लैशलाइट", fontSize = 10.sp, color = EmeraldGreen) },
                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = CyberCard),
                border = BorderStroke(1.dp, EmeraldGreen.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("chip_torch")
            )
            SuggestionChip(
                onClick = onOpenApps,
                label = { Text("📱 ऐप्स", fontSize = 10.sp, color = SkyCyan) },
                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = CyberCard),
                border = BorderStroke(1.dp, SkyCyan.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("chip_apps")
            )
            SuggestionChip(
                onClick = { onSubmit("Deep Research on Autonomous AI Agents") },
                label = { Text("🔬 डीप रिसर्च", fontSize = 10.sp, color = VioletPurple) },
                colors = SuggestionChipDefaults.suggestionChipColors(containerColor = CyberCard),
                border = BorderStroke(1.dp, VioletPurple.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.testTag("chip_research")
            )
        }

        Spacer(modifier = Modifier.height(6.dp))

        // Direct One-Touch Master Mic & Cleanly Expanded Command Bar with In-App Live Sound-Wave Visualizer
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Single Master Voice Input Mic Button
            IconButton(
                onClick = onVoiceClick,
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (isListening) CrimsonRed.copy(alpha = 0.25f) else CyberCardLight)
                    .border(
                        1.5.dp,
                        if (isListening) CrimsonRed else CelestialBlue.copy(alpha = 0.4f),
                        RoundedCornerShape(16.dp)
                    )
                    .testTag("voice_mic_button")
            ) {
                Icon(
                    imageVector = if (isListening) Icons.Default.MicOff else Icons.Default.Mic,
                    contentDescription = "Master Voice Input",
                    tint = if (isListening) CrimsonRed else CelestialBlue,
                    modifier = Modifier.size(22.dp)
                )
            }

            if (isListening) {
                // In-App Live Rising & Falling Sound-Wave Frequency Bars inside the bottom bar (NO Google popup)
                Row(
                    modifier = Modifier
                        .weight(1f)
                        .height(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(CyberCard)
                        .border(1.5.dp, CrimsonRed.copy(alpha = 0.7f), RoundedCornerShape(16.dp))
                        .padding(horizontal = 12.dp, vertical = 6.dp)
                        .testTag("live_sound_wave_bar"),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    // 12 Dynamic Rising & Falling Frequency Bars
                    Row(
                        modifier = Modifier
                            .height(34.dp)
                            .wrapContentWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(3.dp)
                    ) {
                        val bars = if (waveformLevels.isNotEmpty()) waveformLevels else List(12) { 0.3f }
                        bars.take(12).forEachIndexed { index, level ->
                            val animatedFraction by animateFloatAsState(
                                targetValue = level.coerceIn(0.15f, 1.0f),
                                animationSpec = tween(durationMillis = 70),
                                label = "wave_bar_$index"
                            )
                            Box(
                                modifier = Modifier
                                    .width(3.5.dp)
                                    .fillMaxHeight(animatedFraction)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.verticalGradient(
                                            colors = listOf(SkyCyan, CelestialBlue, CrimsonRed)
                                        )
                                    )
                            )
                        }
                    }

                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = if (inputText.isNotBlank()) inputText else "सुन रहे हैं... बोलिए (रुकने पर ऑटो-सेंड)",
                            color = TextPrimary,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "LIVE SOUND-WAVE • ZERO-POPUP AUTO SUBMIT",
                            color = SkyCyan,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold,
                            maxLines = 1
                        )
                    }
                }
            } else {
                // Expanded Input Field
                OutlinedTextField(
                    value = inputText,
                    onValueChange = onInputChange,
                    placeholder = {
                        Text(
                            text = "बोलें या टाइप करें (उदा: 'यूट्यूब स्क्रिप्ट', 'डीप रिसर्च')...",
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CelestialBlue,
                        unfocusedBorderColor = CyberBorder,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary,
                        focusedContainerColor = CyberCard,
                        unfocusedContainerColor = CyberCard
                    ),
                    modifier = Modifier
                        .weight(1f)
                        .testTag("command_input_field")
                )
            }

            // Unclipped 48dp Send Button
            IconButton(
                onClick = {
                    if (inputText.isNotBlank()) {
                        onSubmit(inputText)
                    }
                },
                enabled = inputText.isNotBlank(),
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (inputText.isNotBlank()) CelestialBlue else CyberCardLight)
                    .testTag("submit_command_button")
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.Send,
                    contentDescription = "Send",
                    tint = if (inputText.isNotBlank()) CyberVoid else TextMuted,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
