package ai.myraa.mobile.ui.dialogs

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import ai.myraa.mobile.data.DeviceActionController
import ai.myraa.mobile.ui.theme.*

@Composable
fun AndroidAppsDialog(
    deviceController: DeviceActionController,
    onDismiss: () -> Unit
) {
    var selectedTab by remember { mutableStateOf(0) } // 0: Apps, 1: Dialer, 2: Messages

    // Dialer state
    var dialNumber by remember { mutableStateOf("") }

    // Message state
    var msgPhone by remember { mutableStateOf("") }
    var msgBody by remember { mutableStateOf("") }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.85f)
                .clip(RoundedCornerShape(24.dp))
                .border(1.dp, CelestialBlue.copy(alpha = 0.5f), RoundedCornerShape(24.dp))
                .testTag("android_apps_dialog"),
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
                        Icon(Icons.Default.Smartphone, contentDescription = null, tint = CelestialBlue)
                        Column {
                            Text("एंड्रॉयड सिस्टम हब (Android Hub)", color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("नेटिव ऐप्स, कॉलिंग व मैसेजिंग", color = TextSecondary, fontSize = 10.sp)
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(36.dp).testTag("close_apps_hub")
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Tabs
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = CyberCard,
                    contentColor = CelestialBlue,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            modifier = Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = CelestialBlue
                        )
                    }
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("ऐप्स ड्रॉअर", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("फ़ोन डायलर", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("मैसेजेस", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                when (selectedTab) {
                    0 -> AppsDrawerView(deviceController = deviceController)
                    1 -> PhoneDialerView(
                        dialNumber = dialNumber,
                        onNumberChange = { dialNumber = it },
                        onCall = {
                            deviceController.launchDialer(dialNumber)
                        }
                    )
                    2 -> MessagesView(
                        phoneNumber = msgPhone,
                        messageText = msgBody,
                        onPhoneChange = { msgPhone = it },
                        onMessageChange = { msgBody = it },
                        onSendWhatsApp = {
                            deviceController.launchWhatsApp(msgPhone, msgBody)
                        },
                        onSendSms = {
                            deviceController.launchSms(msgPhone, msgBody)
                        }
                    )
                }
            }
        }
    }
}

data class QuickAppAction(
    val title: String,
    val icon: ImageVector,
    val color: Color,
    val onClick: () -> Unit
)

@Composable
fun AppsDrawerView(deviceController: DeviceActionController) {
    val apps = remember {
        listOf(
            QuickAppAction("Camera", Icons.Default.CameraAlt, CrimsonRed) { deviceController.launchCamera() },
            QuickAppAction("WhatsApp", Icons.Default.Chat, EmeraldGreen) { deviceController.launchWhatsApp("", "नमस्ते!") },
            QuickAppAction("YouTube", Icons.Default.PlayCircle, DangerRed) { deviceController.launchYouTubeSearch("AI Technology 2026") },
            QuickAppAction("Google Maps", Icons.Default.Map, CelestialBlue) { deviceController.launchMaps("Near me") },
            QuickAppAction("Web Search", Icons.Default.Language, SkyCyan) { deviceController.launchWebSearch("Shri Ram Nag AI") },
            QuickAppAction("Wi-Fi Settings", Icons.Default.Wifi, AmberGold) { deviceController.launchSettings("WIFI") },
            QuickAppAction("Bluetooth", Icons.Default.Bluetooth, CelestialBlue) { deviceController.launchSettings("BLUETOOTH") },
            QuickAppAction("Display", Icons.Default.BrightnessMedium, AmberGold) { deviceController.launchSettings("DISPLAY") },
            QuickAppAction("Accessibility", Icons.Default.Accessibility, VioletPurple) { deviceController.launchSettings("ACCESSIBILITY") }
        )
    }

    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        items(apps) { app ->
            Surface(
                onClick = app.onClick,
                color = CyberCard,
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(90.dp)
                    .border(1.dp, CyberBorder, RoundedCornerShape(16.dp))
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(app.color.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(imageVector = app.icon, contentDescription = app.title, tint = app.color, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(text = app.title, color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Medium)
                }
            }
        }
    }
}

@Composable
fun PhoneDialerView(
    dialNumber: String,
    onNumberChange: (String) -> Unit,
    onCall: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Display number
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(CyberCard)
                .padding(horizontal = 14.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(
                text = dialNumber.ifEmpty { "नंबर डायल करें..." },
                color = if (dialNumber.isEmpty()) TextMuted else Color.White,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        }

        // Keypad (3x4)
        val keys = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#")
        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxWidth().weight(1f).padding(vertical = 12.dp)
        ) {
            items(keys) { key ->
                IconButton(
                    onClick = { onNumberChange(dialNumber + key) },
                    modifier = Modifier
                        .height(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(CyberCard)
                ) {
                    Text(key, color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Action Buttons: Call & Clear
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { if (dialNumber.isNotEmpty()) onNumberChange(dialNumber.dropLast(1)) },
                modifier = Modifier.size(48.dp).clip(CircleShape).background(CyberCard)
            ) {
                Icon(Icons.Default.Backspace, contentDescription = "Clear", tint = TextSecondary)
            }

            Button(
                onClick = onCall,
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                shape = CircleShape,
                modifier = Modifier.size(56.dp)
            ) {
                Icon(Icons.Default.Call, contentDescription = "Call", tint = CyberVoid, modifier = Modifier.size(24.dp))
            }
        }
    }
}

@Composable
fun MessagesView(
    phoneNumber: String,
    messageText: String,
    onPhoneChange: (String) -> Unit,
    onMessageChange: (String) -> Unit,
    onSendWhatsApp: () -> Unit,
    onSendSms: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedTextField(
            value = phoneNumber,
            onValueChange = onPhoneChange,
            label = { Text("मोबाइल नंबर (उदा: +919876543210)", fontSize = 11.sp) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )

        OutlinedTextField(
            value = messageText,
            onValueChange = onMessageChange,
            label = { Text("संदेश (Message text)", fontSize = 11.sp) },
            modifier = Modifier.fillMaxWidth().height(100.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = onSendWhatsApp,
                colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f).height(46.dp)
            ) {
                Icon(Icons.Default.Share, contentDescription = null, tint = CyberVoid, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("WhatsApp", color = CyberVoid, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }

            Button(
                onClick = onSendSms,
                colors = ButtonDefaults.buttonColors(containerColor = CelestialBlue),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.weight(1f).height(46.dp)
            ) {
                Icon(Icons.Default.Send, contentDescription = null, tint = CyberVoid, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("SMS", color = CyberVoid, fontWeight = FontWeight.Bold, fontSize = 12.sp)
            }
        }
    }
}
