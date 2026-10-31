package ai.myraa.mobile.data

import android.content.Context
import android.content.SharedPreferences
import ai.myraa.mobile.model.BrainMemory
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class BrainDatabaseRepository(private val context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("MyraaBrainDatabase_ShriRamNag_v3", Context.MODE_PRIVATE)

    private val memories = mutableListOf<BrainMemory>()

    init {
        loadMemories()
    }

    private fun loadMemories() {
        memories.clear()
        try {
            val raw = prefs.getString("memories_json", null)
            if (raw != null) {
                val array = JSONArray(raw)
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val tagsList = mutableListOf<String>()
                    val tagsArray = obj.optJSONArray("tags")
                    if (tagsArray != null) {
                        for (j in 0 until tagsArray.length()) {
                            tagsList.add(tagsArray.getString(j))
                        }
                    }
                    memories.add(
                        BrainMemory(
                            id = obj.optString("id", UUID.randomUUID().toString()),
                            category = obj.optString("category", "FACT"),
                            key = obj.optString("key", "Key"),
                            content = obj.optString("content", ""),
                            timestamp = obj.optString("timestamp", ""),
                            tags = tagsList
                        )
                    )
                }
            } else {
                seedInitialMemories()
            }
        } catch (e: Throwable) {
            seedInitialMemories()
        }
    }

    private fun seedInitialMemories() {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        memories.clear()
        memories.addAll(
            listOf(
                BrainMemory(
                    id = "mem-creator-01",
                    category = "IDENTITY",
                    key = "Nirman Karta & Owner",
                    content = "Shri Ram Nag (श्री राम नाग) is the supreme creator, owner, and architect of MYRAA & SHIV AI.",
                    timestamp = today,
                    tags = listOf("Owner", "Creator", "Shri Ram Nag")
                ),
                BrainMemory(
                    id = "mem-persona-02",
                    category = "PREFERENCE",
                    key = "Persona & Voice Style",
                    content = "Warm, soft-spoken, high-pitched anime heroine companion voice (+35% pitch, 0.95x speed) with affectionate, caring, polite Hindi/Hinglish/English vocabulary.",
                    timestamp = today,
                    tags = listOf("Voice", "Persona", "Anime")
                ),
                BrainMemory(
                    id = "mem-privacy-03",
                    category = "FACT",
                    key = "Privacy & Storage Security",
                    content = "100% on-device private storage with SQLite + Encrypted SharedPreferences. Never leaks personal credentials, OTPs, or passwords to third-party telemetries.",
                    timestamp = today,
                    tags = listOf("Privacy", "Security", "Local")
                ),
                BrainMemory(
                    id = "mem-tools-04",
                    category = "PROJECT",
                    key = "Shiv-AI-Core Tool Integration",
                    content = "Includes all 11 autonomous tools (claude-mem, gsd-core, Agent-Reach, no-ai-slop, ppt-master, video-use, SkillSpector, AI-penetration-testing, SWE-agent, huggingface_hub, gpt-researcher).",
                    timestamp = today,
                    tags = listOf("Tools", "Shiv-AI-Core", "Autonomous")
                )
            )
        )
        saveMemories()
    }

    private fun saveMemories() {
        try {
            val array = JSONArray()
            for (m in memories) {
                val obj = JSONObject()
                obj.put("id", m.id)
                obj.put("category", m.category)
                obj.put("key", m.key)
                obj.put("content", m.content)
                obj.put("timestamp", m.timestamp)
                val tagsArr = JSONArray()
                m.tags.forEach { tagsArr.put(it) }
                obj.put("tags", tagsArr)
                array.put(obj)
            }
            prefs.edit().putString("memories_json", array.toString()).apply()
        } catch (e: Exception) {
            // Ignored
        }
    }

    fun getAllMemories(): List<BrainMemory> = memories.toList()

    fun addMemory(category: String, key: String, content: String, tags: List<String>): BrainMemory {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val newMem = BrainMemory(
            id = "mem-" + UUID.randomUUID().toString().take(8),
            category = category,
            key = key,
            content = content,
            timestamp = today,
            tags = tags
        )
        memories.add(0, newMem)
        saveMemories()
        return newMem
    }

    fun deleteMemory(id: String): Boolean {
        val removed = memories.removeAll { it.id == id }
        if (removed) {
            saveMemories()
        }
        return removed
    }

    fun exportBackupJson(): String {
        val root = JSONObject()
        root.put("appName", "MYRAA v7.0.65 / SHIV AI")
        root.put("databaseName", "MyraaBrainDatabase_ShriRamNag")
        root.put("owner", "Shri Ram Nag (श्री राम नाग)")
        root.put("exportedAt", SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.getDefault()).format(Date()))
        root.put("count", memories.size)
        val arr = JSONArray()
        for (m in memories) {
            val obj = JSONObject()
            obj.put("id", m.id)
            obj.put("category", m.category)
            obj.put("key", m.key)
            obj.put("content", m.content)
            obj.put("timestamp", m.timestamp)
            val tagsArr = JSONArray()
            m.tags.forEach { tagsArr.put(it) }
            obj.put("tags", tagsArr)
            arr.put(obj)
        }
        root.put("memories", arr)
        return root.toString(2)
    }

    fun importBackupJson(jsonString: String): Result<Int> {
        return try {
            val root = JSONObject(jsonString)
            val arr = root.getJSONArray("memories")
            val newOnes = mutableListOf<BrainMemory>()
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val tagsList = mutableListOf<String>()
                val tagsArray = obj.optJSONArray("tags")
                if (tagsArray != null) {
                    for (j in 0 until tagsArray.length()) {
                        tagsList.add(tagsArray.getString(j))
                    }
                }
                newOnes.add(
                    BrainMemory(
                        id = obj.getString("id"),
                        category = obj.getString("category"),
                        key = obj.getString("key"),
                        content = obj.getString("content"),
                        timestamp = obj.getString("timestamp"),
                        tags = tagsList
                    )
                )
            }
            memories.clear()
            memories.addAll(newOnes)
            saveMemories()
            Result.success(memories.size)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
