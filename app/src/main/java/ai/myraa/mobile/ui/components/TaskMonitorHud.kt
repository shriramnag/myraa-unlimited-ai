package ai.myraa.mobile.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import ai.myraa.mobile.model.TaskRecord
import ai.myraa.mobile.model.TaskState
import ai.myraa.mobile.ui.theme.*

@Composable
fun TaskMonitorHud(
    tasks: List<TaskRecord>,
    isEmergencyStopActive: Boolean,
    onEmergencyStop: () -> Unit,
    onResume: () -> Unit,
    modifier: Modifier = Modifier
) {
    var isExpanded by remember { mutableStateOf(false) }
    val activeTasks = remember(tasks) {
        tasks.filter { it.state !in listOf(TaskState.COMPLETED, TaskState.FAILED, TaskState.CANCELLED, TaskState.BLOCKED_BY_POLICY) }
    }

    Surface(
        color = CyberCard.copy(alpha = 0.95f),
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 4.dp)
            .clip(RoundedCornerShape(18.dp))
            .border(1.dp, CyberBorder, RoundedCornerShape(18.dp))
            .testTag("task_monitor_hud")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp)
        ) {
            // Header Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { isExpanded = !isExpanded },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Timeline,
                        contentDescription = "Task Engine",
                        tint = if (isEmergencyStopActive) DangerRed else CelestialBlue,
                        modifier = Modifier.size(20.dp)
                    )
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "Task Monitor HUD",
                                color = TextPrimary,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(CelestialBlue.copy(alpha = 0.2f))
                                    .border(1.dp, CelestialBlue.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                                    .padding(horizontal = 5.dp, vertical = 1.dp)
                            ) {
                                Text(
                                    text = "10-STATE ENGINE",
                                    color = CelestialBlue,
                                    fontSize = 8.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                        Text(
                            text = if (isEmergencyStopActive) {
                                "EMERGENCY STOP ACTIVE"
                            } else if (activeTasks.isNotEmpty()) {
                                "${activeTasks.size} tasks in flight"
                            } else {
                                "All agent tasks verified & completed"
                            },
                            color = if (isEmergencyStopActive) DangerRed else TextSecondary,
                            fontSize = 10.sp
                        )
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Emergency Stop Button / Resume Button
                    if (isEmergencyStopActive) {
                        Button(
                            onClick = onResume,
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                            modifier = Modifier.height(28.dp).testTag("resume_engine_button")
                        ) {
                            Icon(Icons.Default.PlayArrow, contentDescription = "Resume", modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Resume", fontSize = 10.sp, color = CyberVoid, fontWeight = FontWeight.Bold)
                        }
                    } else {
                        OutlinedButton(
                            onClick = onEmergencyStop,
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = DangerRed),
                            border = ButtonDefaults.outlinedButtonBorder.copy(brush = androidx.compose.ui.graphics.SolidColor(DangerRed)),
                            contentPadding = PaddingValues(horizontal = 8.dp, vertical = 4.dp),
                            modifier = Modifier.height(28.dp).testTag("emergency_stop_button")
                        ) {
                            Icon(Icons.Default.Stop, contentDescription = "Stop", modifier = Modifier.size(12.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("HALT", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.width(4.dp))

                    IconButton(
                        onClick = { isExpanded = !isExpanded },
                        modifier = Modifier.size(32.dp).testTag("expand_hud_button")
                    ) {
                        Icon(
                            imageVector = if (isExpanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                            contentDescription = "Toggle Expand",
                            tint = TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }

            // Expanded Task Cards
            AnimatedVisibility(visible = isExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    tasks.take(5).forEach { task ->
                        TaskItemCard(task = task)
                    }
                }
            }
        }
    }
}

@Composable
fun TaskItemCard(task: TaskRecord) {
    val stateColor = remember(task.state) {
        Color(android.graphics.Color.parseColor(task.state.badgeColor))
    }

    Surface(
        color = CyberCardLight,
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, CyberBorder, RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = task.title,
                    color = Color.White,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(6.dp))
                        .background(stateColor.copy(alpha = 0.2f))
                        .border(1.dp, stateColor.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = task.state.label,
                        color = stateColor,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "${task.activeAgentLabel} • ${task.currentStep}",
                color = TextSecondary,
                fontSize = 10.sp
            )

            if (task.verified) {
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Verified Invariant",
                        tint = EmeraldGreen,
                        modifier = Modifier.size(12.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Invariant Passed: Verified by Supervisor",
                        color = EmeraldGreen,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}
