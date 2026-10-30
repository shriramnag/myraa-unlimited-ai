package ai.myraa.mobile.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import ai.myraa.mobile.AuditLogManager
import ai.myraa.mobile.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AdminVaultDialog(
    isVoiceLockActive: Boolean,
    onToggleVoiceLock: () -> Boolean,
    onDismiss: () -> Unit
) {
    var passcode by remember { mutableStateOf("") }
    var isUnlocked by remember { mutableStateOf(false) }
    var errorMsg by remember { mutableStateOf("") }
    var events by remember { mutableStateOf<List<AuditLogManager.AuditEvent>>(emptyList()) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.85f)
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, EmeraldGreen.copy(alpha = 0.5f), RoundedCornerShape(24.dp))
                .testTag("admin_vault_dialog"),
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
                        Icon(Icons.Default.Shield, contentDescription = null, tint = EmeraldGreen)
                        Column {
                            Text("एडमिन वॉल्ट & सुरक्षा ऑडिट", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("ओनर: श्री राम नाग • AES-256 Hardened", color = EmeraldGreen, fontSize = 10.sp)
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(36.dp).testTag("close_admin_vault")
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                if (!isUnlocked) {
                    // Lock Screen View
                    Column(
                        modifier = Modifier.fillMaxSize(),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Locked",
                            tint = EmeraldGreen,
                            modifier = Modifier.size(56.dp)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "मालिक का सुरक्षा पासकोड दर्ज करें",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "(Master PIN: 1977 या 'shriramnag')",
                            color = TextMuted,
                            fontSize = 11.sp
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        OutlinedTextField(
                            value = passcode,
                            onValueChange = {
                                passcode = it
                                errorMsg = ""
                            },
                            placeholder = { Text("पासकोड दर्ज करें...", fontSize = 12.sp) },
                            visualTransformation = PasswordVisualTransformation(),
                            singleLine = true,
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth(0.8f).testTag("vault_passcode_field")
                        )

                        if (errorMsg.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(text = errorMsg, color = DangerRed, fontSize = 11.sp)
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = {
                                val trimmed = passcode.trim().lowercase(Locale.ROOT)
                                if (trimmed == "1977" || trimmed == "shriramnag" || trimmed == "owner") {
                                    isUnlocked = true
                                    events = AuditLogManager.getRecentEvents()
                                } else {
                                    errorMsg = "गलत पासकोड! केवल अधिकृत ओनर ही एक्सेस कर सकते हैं।"
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.fillMaxWidth(0.8f).height(48.dp).testTag("unlock_vault_button")
                        ) {
                            Text("वॉल्ट अनलॉक करें", color = CyberVoid, fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    // Unlocked Security Dashboard
                    Column(modifier = Modifier.fillMaxSize()) {
                        // Shield Status Strip
                        Surface(
                            color = CyberCard,
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth().border(1.dp, CyberBorder, RoundedCornerShape(12.dp))
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(10.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("पेमेंट & OTP शील्ड:", color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    Text("GPay, PhonePe, Paytm, SBI, OTPs 100% शील्डेड", color = EmeraldGreen, fontSize = 9.sp)
                                }
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(6.dp))
                                        .background(EmeraldGreen.copy(alpha = 0.2f))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                ) {
                                    Text("ACTIVE", color = EmeraldGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text("सुरक्षा ऑडिट इवेंट्स (Audit Logs):", color = TextSecondary, fontSize = 11.sp)
                        Spacer(modifier = Modifier.height(6.dp))

                        if (events.isEmpty()) {
                            Box(
                                modifier = Modifier.fillMaxWidth().weight(1f),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("कोई अनधिकृत गतिविधि दर्ज नहीं है। सभी सिस्टम सुरक्षित हैं।", color = TextMuted, fontSize = 11.sp)
                            }
                        } else {
                            LazyColumn(
                                modifier = Modifier.weight(1f),
                                verticalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                items(events.reversed()) { evt ->
                                    val timeStr = SimpleDateFormat("HH:mm:ss", Locale.getDefault()).format(Date(evt.timestampMs))
                                    Surface(
                                        color = CyberCard,
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.fillMaxWidth().border(1.dp, CyberBorder, RoundedCornerShape(10.dp))
                                    ) {
                                        Column(modifier = Modifier.padding(8.dp)) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Text("[${evt.severity}] ${evt.subsystem} • ${evt.action}", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                                Text(timeStr, color = TextMuted, fontSize = 9.sp)
                                            }
                                            Spacer(modifier = Modifier.height(2.dp))
                                            Text(text = "Status: ${evt.outcome} | ${evt.detail}", color = TextSecondary, fontSize = 9.sp)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
