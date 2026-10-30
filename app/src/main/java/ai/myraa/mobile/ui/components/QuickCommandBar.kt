package ai.myraa.mobile.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
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
                label = { Text("🔱 11 ऑटोनॉमस टूल्स", fontSize = 10.sp, color = AmberGold) },
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
                label = { Text("📱 ऐप्स & डायलर", fontSize = 10.sp, color = SkyCyan) },
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

        // Input Box and Action Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = onInputChange,
                placeholder = {
                    Text(
                        text = "निर्देश या प्रश्न पूछें (हिंदी/English)...",
                        color = TextMuted,
                        fontSize = 12.sp
                    )
                },
                singleLine = true,
                shape = RoundedCornerShape(20.dp),
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

            // Voice Mic Button
            IconButton(
                onClick = onVoiceClick,
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(CyberCardLight)
                    .testTag("voice_mic_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "Voice Input",
                    tint = CelestialBlue,
                    modifier = Modifier.size(22.dp)
                )
            }

            // Send Button
            IconButton(
                onClick = {
                    if (inputText.isNotBlank()) {
                        onSubmit(inputText)
                    }
                },
                enabled = inputText.isNotBlank(),
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(if (inputText.isNotBlank()) CelestialBlue else CyberCardLight)
                    .testTag("submit_command_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Send",
                    tint = if (inputText.isNotBlank()) CyberVoid else TextMuted,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}
