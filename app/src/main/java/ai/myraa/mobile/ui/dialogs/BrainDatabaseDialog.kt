package ai.myraa.mobile.ui.dialogs

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import ai.myraa.mobile.data.BrainDatabaseRepository
import ai.myraa.mobile.model.BrainMemory
import ai.myraa.mobile.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BrainDatabaseDialog(
    repository: BrainDatabaseRepository,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var memories by remember { mutableStateOf(repository.getAllMemories()) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf("ALL") }

    var isAdding by remember { mutableStateOf(false) }
    var newKey by remember { mutableStateOf("") }
    var newContent by remember { mutableStateOf("") }
    var newCategory by remember { mutableStateOf("FACT") }
    var newTags by remember { mutableStateOf("") }

    val categories = listOf("ALL", "IDENTITY", "PREFERENCE", "FACT", "PROJECT", "HABIT")

    val filtered = remember(memories, searchQuery, selectedCategory) {
        memories.filter { mem ->
            val matchCat = selectedCategory == "ALL" || mem.category.equals(selectedCategory, ignoreCase = true)
            val matchQuery = searchQuery.isBlank() ||
                    mem.key.contains(searchQuery, ignoreCase = true) ||
                    mem.content.contains(searchQuery, ignoreCase = true) ||
                    mem.tags.any { it.contains(searchQuery, ignoreCase = true) }
            matchCat && matchQuery
        }
    }

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
                .testTag("brain_database_dialog"),
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
                        Icon(
                            imageVector = Icons.Default.Psychology,
                            contentDescription = "Brain DB",
                            tint = CelestialBlue,
                            modifier = Modifier.size(24.dp)
                        )
                        Column {
                            Text(
                                text = "लॉन्ग-टर्म ब्रेन डेटाबेस",
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "ओनर: श्री राम नाग • 100% On-Device Private",
                                color = EmeraldGreen,
                                fontSize = 10.sp
                            )
                        }
                    }

                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.size(36.dp).testTag("close_brain_db")
                    ) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Search Bar & Add Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("मेमोरी खोजें...", color = TextMuted, fontSize = 11.sp) },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted, modifier = Modifier.size(16.dp)) },
                        singleLine = true,
                        shape = RoundedCornerShape(14.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = CyberCard,
                            unfocusedContainerColor = CyberCard,
                            focusedBorderColor = CelestialBlue,
                            unfocusedBorderColor = CyberBorder
                        ),
                        modifier = Modifier.weight(1f)
                    )

                    Button(
                        onClick = { isAdding = !isAdding },
                        colors = ButtonDefaults.buttonColors(containerColor = CelestialBlue),
                        shape = RoundedCornerShape(14.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp),
                        modifier = Modifier.height(48.dp).testTag("add_memory_button")
                    ) {
                        Icon(if (isAdding) Icons.Default.Close else Icons.Default.Add, contentDescription = null, tint = CyberVoid, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(if (isAdding) "रद्द" else "जोड़ें", color = CyberVoid, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }

                // Add Form (when isAdding is true)
                if (isAdding) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Surface(
                        color = CyberCardLight,
                        shape = RoundedCornerShape(14.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(1.dp, CelestialBlue.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                            .padding(10.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("नई मेमोरी प्रविष्टि", color = CelestialBlue, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            OutlinedTextField(
                                value = newKey,
                                onValueChange = { newKey = it },
                                placeholder = { Text("शीर्षक (e.g. पसंदीदा रंग, प्रोजेक्ट नाम)", fontSize = 11.sp, color = TextMuted) },
                                singleLine = true,
                                modifier = Modifier.fillMaxWidth()
                            )
                            OutlinedTextField(
                                value = newContent,
                                onValueChange = { newContent = it },
                                placeholder = { Text("विवरण...", fontSize = 11.sp, color = TextMuted) },
                                modifier = Modifier.fillMaxWidth().height(70.dp)
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Button(
                                    onClick = {
                                        if (newKey.isNotBlank() && newContent.isNotBlank()) {
                                            val tagsList = newTags.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                                            repository.addMemory(newCategory, newKey, newContent, tagsList)
                                            memories = repository.getAllMemories()
                                            newKey = ""
                                            newContent = ""
                                            newTags = ""
                                            isAdding = false
                                            Toast.makeText(context, "मेमोरी सुरक्षित कर ली गई!", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldGreen),
                                    shape = RoundedCornerShape(10.dp)
                                ) {
                                    Text("सेव करें", color = CyberVoid, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Category Filter Chips
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    categories.forEach { cat ->
                        val isSelected = cat == selectedCategory
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedCategory = cat },
                            label = { Text(cat, fontSize = 10.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = CelestialBlue,
                                selectedLabelColor = CyberVoid,
                                containerColor = CyberCard,
                                labelColor = TextSecondary
                            )
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Memories List
                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(filtered) { mem ->
                        MemoryCardItem(
                            memory = mem,
                            onDelete = {
                                repository.deleteMemory(mem.id)
                                memories = repository.getAllMemories()
                                Toast.makeText(context, "मेमोरी डिलीट की गई", Toast.LENGTH_SHORT).show()
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Footer: Export / Backup
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${filtered.size} मेमोरीज़ सुरक्षित",
                        color = TextMuted,
                        fontSize = 11.sp
                    )

                    OutlinedButton(
                        onClick = {
                            val json = repository.exportBackupJson()
                            Toast.makeText(context, "Backup JSON ready (${json.length} bytes)", Toast.LENGTH_SHORT).show()
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.testTag("export_backup_button")
                    ) {
                        Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Export JSON", fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun MemoryCardItem(
    memory: BrainMemory,
    onDelete: () -> Unit
) {
    Surface(
        color = CyberCard,
        shape = RoundedCornerShape(14.dp),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, CyberBorder, RoundedCornerShape(14.dp))
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
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(CelestialBlue.copy(alpha = 0.2f))
                            .border(1.dp, CelestialBlue.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = memory.category,
                            color = CelestialBlue,
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = memory.key,
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.DeleteOutline,
                        contentDescription = "Delete Memory",
                        tint = DangerRed,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = memory.content,
                color = TextSecondary,
                fontSize = 11.sp,
                lineHeight = 16.sp
            )

            if (memory.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    memory.tags.forEach { tag ->
                        Text(
                            text = "#$tag",
                            color = EmeraldGreen,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }
    }
}
