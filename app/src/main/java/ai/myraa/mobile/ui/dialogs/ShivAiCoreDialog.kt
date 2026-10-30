package ai.myraa.mobile.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import ai.myraa.mobile.data.ShivAiCoreEngine
import ai.myraa.mobile.model.ShivAiTool
import ai.myraa.mobile.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShivAiCoreDialog(
    onDismiss: () -> Unit,
    onApplyResult: (toolName: String, resultText: String) -> Unit
) {
    val tools = ShivAiCoreEngine.ALL_11_TOOLS
    var selectedTool by remember { mutableStateOf<ShivAiTool>(tools.last()) } // Default gpt-researcher
    var promptInput by remember { mutableStateOf("") }
    var outputText by remember { mutableStateOf("") }
    var isExecuting by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.88f)
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, AmberGold.copy(alpha = 0.5f), RoundedCornerShape(24.dp))
                .testTag("shiv_ai_core_dialog"),
            color = CyberVoid
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("🔱", fontSize = 22.sp)
                        Column {
                            Text(
                                text = "शिव एआई कोर (Shiv-AI-Core)",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "11 Autonomous Tools • 100% Free Forever",
                                color = AmberGold,
                                fontSize = 10.sp
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(36.dp).testTag("close_shiv_core")
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Horizontal or Compact Tools Selection Bar
                Text(
                    text = "चयनित टूल: #${selectedTool.index} ${selectedTool.name} (${selectedTool.hindiDesc})",
                    color = CelestialBlue,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Tools List Grid / Column
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(130.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(CyberCard)
                        .border(1.dp, CyberBorder, RoundedCornerShape(14.dp))
                        .padding(6.dp)
                ) {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        items(tools) { tool ->
                            val isSelected = tool.id == selectedTool.id
                            Surface(
                                onClick = {
                                    selectedTool = tool
                                    outputText = ""
                                },
                                shape = RoundedCornerShape(8.dp),
                                color = if (isSelected) AmberGold.copy(alpha = 0.2f) else Color.Transparent,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .border(
                                        1.dp,
                                        if (isSelected) AmberGold.copy(alpha = 0.6f) else Color.Transparent,
                                        RoundedCornerShape(8.dp)
                                    )
                                    .padding(vertical = 2.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 8.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(tool.iconEmoji, fontSize = 14.sp)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = tool.name,
                                            color = if (isSelected) AmberGold else Color.White,
                                            fontSize = 11.sp,
                                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                    Text(
                                        text = tool.category,
                                        color = TextMuted,
                                        fontSize = 9.sp
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Input Query & Run Button
                OutlinedTextField(
                    value = promptInput,
                    onValueChange = { promptInput = it },
                    placeholder = {
                        Text(
                            text = "${selectedTool.name} के लिए विषय या निर्देश डालें...",
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedContainerColor = CyberCard,
                        unfocusedContainerColor = CyberCard,
                        focusedBorderColor = AmberGold,
                        unfocusedBorderColor = CyberBorder
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                Button(
                    onClick = {
                        isExecuting = true
                        val res = ShivAiCoreEngine.executeTool(selectedTool.id, promptInput)
                        outputText = res.second
                        isExecuting = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AmberGold),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(44.dp)
                        .testTag("execute_shiv_tool_button")
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null, tint = CyberVoid, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = if (isExecuting) "निष्पादित हो रहा है..." else "टूल निष्पादित करें (Execute)",
                        color = CyberVoid,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Output Screen
                Text("आउटपुट व रिपोर्ट:", color = TextSecondary, fontSize = 11.sp)
                Spacer(modifier = Modifier.height(4.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(CyberCard)
                        .border(1.dp, CyberBorder, RoundedCornerShape(14.dp))
                        .padding(10.dp)
                        .verticalScroll(rememberScrollState())
                ) {
                    if (outputText.isNotEmpty()) {
                        Text(
                            text = outputText,
                            color = TextPrimary,
                            fontSize = 11.sp,
                            lineHeight = 16.sp
                        )
                    } else {
                        Text(
                            text = "यहाँ टूल का ऑटोनॉमस विश्लेषण परिणाम दिखेगा...",
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    }
                }

                if (outputText.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = {
                            onApplyResult(selectedTool.name, outputText)
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("इसे चैट में भेजें & बोलकर सुनाएं", color = CyberVoid, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}
