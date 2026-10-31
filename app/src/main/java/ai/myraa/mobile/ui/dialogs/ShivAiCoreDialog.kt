package ai.myraa.mobile.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
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
    var selectedTab by remember { mutableIntStateOf(0) } // 0 = 11 Core Tools, 1 = 11 YouTube Skills
    val coreTools = ShivAiCoreEngine.ALL_11_TOOLS
    val ytSkills = ShivAiCoreEngine.YOUTUBE_11_SKILLS
    val activeList = if (selectedTab == 0) coreTools else ytSkills

    var selectedTool by remember { mutableStateOf<ShivAiTool>(coreTools.last()) }
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
                        Text(if (selectedTab == 0) "🔱" else "🎬", fontSize = 22.sp)
                        Column {
                            Text(
                                text = if (selectedTab == 0) "शिव एआई कोर (Shiv-AI-Core)" else "YouTube Creator Skill Engine",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "ओनर: श्री राम नाग • 11 Autonomous Capabilities",
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

                Spacer(modifier = Modifier.height(8.dp))

                // Tab Switcher: 11 Core Tools vs 11 YouTube Creator Skills
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = CyberCard,
                    contentColor = AmberGold,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = AmberGold
                        )
                    }
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = {
                            selectedTab = 0
                            selectedTool = coreTools.last()
                            outputText = ""
                        },
                        text = { Text("🔱 11 Core Tools", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = {
                            selectedTab = 1
                            selectedTool = ytSkills.first()
                            outputText = ""
                        },
                        text = { Text("🎬 11 YouTube Skills", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "चयनित: #${selectedTool.index} ${selectedTool.name} (${selectedTool.hindiDesc})",
                    color = CelestialBlue,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )

                Spacer(modifier = Modifier.height(6.dp))

                // Tools List Box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(135.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(CyberCard)
                        .border(1.dp, CyberBorder, RoundedCornerShape(14.dp))
                        .padding(6.dp)
                ) {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        items(activeList) { tool ->
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

                Spacer(modifier = Modifier.height(8.dp))

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
                        text = if (isExecuting) "निष्पादित हो रहा है..." else "निष्पादित करें (Execute)",
                        color = CyberVoid,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

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
                            text = "यहाँ टूल/स्किल का ऑटोनॉमस विश्लेषण परिणाम दिखेगा...",
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
