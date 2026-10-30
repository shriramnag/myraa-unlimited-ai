package ai.myraa.mobile;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * SHIV AI — MYRAA (v7.0.37): LOCAL SQLITE BRAIN & VECTOR-STYLE CONTEXT MEMORY ENGINE
 * Supreme Owner & Nirman Karta: Shri Ram Nag (श्री राम नाग)
 *
 * Implements Pillar 5:
 * 1. SQLite Tables:
 *    - user_preferences (key-value preferences, contacts, habits, vehicle/ID notes)
 *    - conversation_history (past turns, timestamps, semantic keywords)
 *    - action_logs (executed tasks, queries, targets, timestamps)
 * 2. Smart Context Retrieval (resolves "वही गाना दोबारा चलाओ", "मेरे भाई को कॉल लगाओ", etc.)
 * 3. Automatic Fact & Preference Extraction from natural Hindi/Hinglish/English conversation
 */
public class MyraaLocalBrainDb extends SQLiteOpenHelper {

    public static final String DB_NAME = "MyraaBrainDatabase_ShriRamNag.db";
    public static final int DB_VERSION = 1;

    public static final String TABLE_PREFS = "user_preferences";
    public static final String TABLE_HISTORY = "conversation_history";
    public static final String TABLE_ACTIONS = "action_logs";

    private static volatile MyraaLocalBrainDb instance;

    public static synchronized MyraaLocalBrainDb getInstance(Context context) {
        if (instance == null) {
            instance = new MyraaLocalBrainDb(context.getApplicationContext());
        }
        return instance;
    }

    private MyraaLocalBrainDb(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(
            "CREATE TABLE IF NOT EXISTS " + TABLE_PREFS + " (" +
            "pref_key TEXT PRIMARY KEY, " +
            "pref_value TEXT NOT NULL, " +
            "category TEXT DEFAULT 'general', " +
            "updated_at INTEGER NOT NULL)"
        );

        db.execSQL(
            "CREATE TABLE IF NOT EXISTS " + TABLE_HISTORY + " (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "user_text TEXT NOT NULL, " +
            "ai_text TEXT NOT NULL, " +
            "context_tags TEXT DEFAULT '', " +
            "timestamp INTEGER NOT NULL)"
        );

        db.execSQL(
            "CREATE TABLE IF NOT EXISTS " + TABLE_ACTIONS + " (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "action_name TEXT NOT NULL, " +
            "target TEXT DEFAULT '', " +
            "query_param TEXT DEFAULT '', " +
            "status TEXT DEFAULT 'SUCCESS', " +
            "timestamp INTEGER NOT NULL)"
        );

        seedDefaultOwnerMemories(db);
    }

    private void seedDefaultOwnerMemories(SQLiteDatabase db) {
        long now = System.currentTimeMillis();
        insertPrefInternal(db, "supreme_owner", "Shri Ram Nag (श्री राम नाग)", "identity", now);
        insertPrefInternal(db, "primary_ai", "SHIV AI — MYRAA v7.0.37 Autonomous Star-Trek Agent", "identity", now);
        insertPrefInternal(db, "preferred_theme", "Dark Mode (Cyber Holographic)", "ui", now);
        insertPrefInternal(db, "preferred_language", "Hindi / Hinglish (hi-IN)", "voice", now);
        insertPrefInternal(db, "favorite_music", "Arijit Singh & Lo-Fi Beats", "music", now);
    }

    private void insertPrefInternal(SQLiteDatabase db, String key, String value, String category, long timestamp) {
        ContentValues cv = new ContentValues();
        cv.put("pref_key", key.toLowerCase(Locale.ROOT).trim());
        cv.put("pref_value", value);
        cv.put("category", category);
        cv.put("updated_at", timestamp);
        db.insertWithOnConflict(TABLE_PREFS, null, cv, SQLiteDatabase.CONFLICT_REPLACE);
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        onCreate(db);
    }

    public synchronized void savePreference(String key, String value, String category) {
        if (key == null || key.trim().isEmpty() || value == null) return;
        if (SecurityPolicyEngine.containsSensitiveOtpOrPaymentData(value)) return;
        try {
            SQLiteDatabase db = getWritableDatabase();
            insertPrefInternal(
                db,
                key.trim(),
                value.trim(),
                category != null ? category : "general",
                System.currentTimeMillis()
            );
        } catch (Exception ignored) {}
    }

    public synchronized String getPreference(String key, String defaultVal) {
        if (key == null) return defaultVal;
        try {
            SQLiteDatabase db = getReadableDatabase();
            try (Cursor c = db.query(
                TABLE_PREFS,
                new String[]{"pref_value"},
                "pref_key = ?",
                new String[]{key.toLowerCase(Locale.ROOT).trim()},
                null, null, null
            )) {
                if (c != null && c.moveToFirst()) {
                    return c.getString(0);
                }
            }
        } catch (Exception ignored) {}
        return defaultVal;
    }

    public synchronized void logConversationTurn(String userText, String aiText, String contextTags) {
        if (userText == null || userText.trim().isEmpty()) return;
        String safeUser = SecurityPolicyEngine.redactSensitiveText(userText.trim());
        String safeAi = SecurityPolicyEngine.redactSensitiveText(aiText != null ? aiText.trim() : "");
        try {
            SQLiteDatabase db = getWritableDatabase();
            ContentValues cv = new ContentValues();
            cv.put("user_text", safeUser);
            cv.put("ai_text", safeAi);
            cv.put("context_tags", contextTags != null ? contextTags : extractSemanticKeywords(safeUser));
            cv.put("timestamp", System.currentTimeMillis());
            db.insert(TABLE_HISTORY, null, cv);
        } catch (Exception ignored) {}
    }

    public synchronized void logExecutedAction(String actionName, String target, String queryParam, String status) {
        if (actionName == null || actionName.trim().isEmpty()) return;
        try {
            SQLiteDatabase db = getWritableDatabase();
            ContentValues cv = new ContentValues();
            cv.put("action_name", actionName.trim());
            cv.put("target", target != null ? SecurityPolicyEngine.redactSensitiveText(target.trim()) : "");
            cv.put("query_param", queryParam != null ? SecurityPolicyEngine.redactSensitiveText(queryParam.trim()) : "");
            cv.put("status", status != null ? status : "SUCCESS");
            cv.put("timestamp", System.currentTimeMillis());
            db.insert(TABLE_ACTIONS, null, cv);

            // Also remember last played song/video for "वही गाना दोबारा चलाओ"
            if ("YOUTUBE_SEARCH".equalsIgnoreCase(actionName) && queryParam != null && !queryParam.trim().isEmpty()) {
                savePreference("last_played_song", queryParam.trim(), "music");
            } else if ("CALL_CONTACT".equalsIgnoreCase(actionName) && target != null && !target.trim().isEmpty()) {
                savePreference("last_called_contact", target.trim(), "contact");
            }
        } catch (Exception ignored) {}
    }

    /**
     * Automatic Memory Extraction (Pillar 5.3):
     * Detects personal facts, preferences, vehicle numbers, contact relations, etc. in Hindi/Hinglish/English
     * and stores them automatically into user_preferences.
     */
    public synchronized JSONArray autoExtractAndSaveFacts(String userUtterance) {
        JSONArray extracted = new JSONArray();
        if (userUtterance == null || userUtterance.trim().isEmpty()) return extracted;
        String text = userUtterance.trim();
        if (SecurityPolicyEngine.containsSensitiveOtpOrPaymentData(text)) return extracted;

        try {
            // 1. Dark/Light mode or UI preferences: "मुझे हमेशा डार्क मोड पसंद है"
            if (text.matches("(?i).*(डार्क मोड|dark mode).*") && text.matches("(?i).*(पसंद|like|prefer|love|हमेशा|hamesha).*")) {
                savePreference("preferred_theme", "Dark Mode", "ui");
                extracted.put(new JSONObject().put("key", "preferred_theme").put("value", "Dark Mode"));
            }

            // 2. Car / Bike / Vehicle number: "मेरी कार का नंबर 4545 है" or "meri car ka number RJ19 4545 hai"
            Pattern carPat = Pattern.compile("(?i)(?:मेरी\\s+|माय\\s+|my\\s+|meri\\s+)?(कार|गाड़ी|बाइक|स्कूटी|car|bike|vehicle)\\s+(?:का\\s+|ka\\s+)?(?:नंबर|number|no)\\s+([A-Za-z0-9\\-\\s]{2,14}?)(?:\\s+है|\\s+hai|$)");
            Matcher carMat = carPat.matcher(text);
            if (carMat.find()) {
                String vehicleType = carMat.group(1).trim();
                String vehicleNum = carMat.group(2).trim();
                String key = "vehicle_" + vehicleType.toLowerCase(Locale.ROOT) + "_number";
                savePreference(key, vehicleNum, "personal_fact");
                savePreference("car_number", vehicleNum, "personal_fact");
                extracted.put(new JSONObject().put("key", "car_number").put("value", vehicleNum));
            }

            // 3. Contact relationships: "मेरे भाई का नंबर 9876543210 है" / "मेरे भाई का नाम राहुल है"
            Pattern relPat = Pattern.compile("(?i)(?:मेरे|मेरी|mere|meri|my)\\s+(भाई|बहन|पापा|पिताजी|मम्मी|माँ|दोस्त|बॉस|brother|bhai|sister|father|papa|mother|mummy|friend|boss)\\s+(?:का|की|ka|ki)?\\s*(?:नंबर|मोबाइल|फोन|नाम|number|phone|name)\\s+([A-Za-z0-9+\\-\\s\u0900-\u097F]{2,20}?)(?:\\s+है|\\s+hai|$)");
            Matcher relMat = relPat.matcher(text);
            if (relMat.find()) {
                String relation = normalizeRelationKey(relMat.group(1).trim());
                String val = relMat.group(2).trim();
                savePreference("contact_" + relation, val, "contact");
                extracted.put(new JSONObject().put("key", "contact_" + relation).put("value", val));
            }

            // 4. Favorite song / singer / music: "मेरा पसंदीदा गाना ... है" / "मुझे ... सुनना पसंद है"
            Pattern musicPat = Pattern.compile("(?i)(?:मेरा\\s+पसंदीदा\\s+गाना|मेरा\\s+फेवरेट\\s+सॉन्ग|मुझे\\s+गाना|my\\s+favorite\\s+song|mera\\s+favorite\\s+song)\\s+(.+?)(?:\\s+है|\\s+पसंद\\s+है|\\s+hai|$)");
            Matcher musicMat = musicPat.matcher(text);
            if (musicMat.find()) {
                String favSong = musicMat.group(1).trim();
                savePreference("favorite_song", favSong, "music");
                extracted.put(new JSONObject().put("key", "favorite_song").put("value", favSong));
            }

            // 5. Explicit "याद रखो कि ..." / "Remember that ..."
            Pattern remPat = Pattern.compile("(?i)^(?:याद\\s+रखो\\s+कि|याद\\s+रखो|याद\\s+रखना|remember\\s+that|remember|yaad\\s+rakho\\s+ki|yaad\\s+rakho)\\s+(.+)$");
            Matcher remMat = remPat.matcher(text);
            if (remMat.find()) {
                String fact = remMat.group(1).trim();
                String key = "fact_" + (System.currentTimeMillis() % 100000);
                savePreference(key, fact, "explicit_memory");
                extracted.put(new JSONObject().put("key", key).put("value", fact));
            }
        } catch (Exception ignored) {}
        return extracted;
    }

    private String normalizeRelationKey(String rawRel) {
        String r = rawRel.toLowerCase(Locale.ROOT);
        if (r.contains("भाई") || r.contains("bhai") || r.contains("brother")) return "brother";
        if (r.contains("बहन") || r.contains("sister")) return "sister";
        if (r.contains("पापा") || r.contains("पिता") || r.contains("papa") || r.contains("father")) return "father";
        if (r.contains("मम्मी") || r.contains("माँ") || r.contains("mummy") || r.contains("mother")) return "mother";
        if (r.contains("दोस्त") || r.contains("friend")) return "friend";
        return r.replaceAll("\\s+", "_");
    }

    /**
     * Smart Context Retrieval (Pillar 5.2):
     * Resolves contextual references like "वही गाना दोबारा चलाओ जो कल रात सुना था" or "मेरे भाई को कॉल लगाओ"
     * and returns a JSON bundle with resolved parameters + context prompt injection.
     */
    public synchronized JSONObject retrieveSmartContextForQuery(String query) {
        JSONObject res = new JSONObject();
        if (query == null) query = "";
        String lower = query.toLowerCase(Locale.ROOT);

        try {
            // Check if user is asking to replay previous/last night's song
            if (lower.contains("वही गाना") || lower.contains("पिछला गाना") || lower.contains("कल रात") ||
                lower.contains("wahi gaana") || lower.contains("pichla gaana") || lower.contains("last song") ||
                lower.contains("dobara chalao") || lower.contains("दोबारा चलाओ")) {
                String lastSong = getLastPlayedYouTubeQuery();
                if (lastSong == null || lastSong.isEmpty()) {
                    lastSong = getPreference("last_played_song", getPreference("favorite_song", "Lo-Fi Beats"));
                }
                res.put("resolvedIntent", "YOUTUBE_SEARCH");
                res.put("resolvedQuery", lastSong);
                res.put("contextExplanation", "Resolved contextual song reference from local action_logs/preferences: " + lastSong);
            }

            // Check if user is asking to call a relative ("मेरे भाई को कॉल लगाओ", "पापा को कॉल करो")
            if (lower.contains("कॉल") || lower.contains("call") || lower.contains("फोन लगाओ")) {
                String relKey = null;
                if (lower.contains("भाई") || lower.contains("bhai") || lower.contains("brother")) relKey = "contact_brother";
                else if (lower.contains("पापा") || lower.contains("papa") || lower.contains("father")) relKey = "contact_father";
                else if (lower.contains("मम्मी") || lower.contains("mummy") || lower.contains("mother")) relKey = "contact_mother";
                else if (lower.contains("बहन") || lower.contains("sister")) relKey = "contact_sister";
                else if (lower.contains("दोस्त") || lower.contains("friend")) relKey = "contact_friend";

                if (relKey != null) {
                    String contactTarget = getPreference(relKey, "");
                    if (!contactTarget.isEmpty()) {
                        res.put("resolvedIntent", "CALL_CONTACT");
                        res.put("resolvedTarget", contactTarget);
                        res.put("contextExplanation", "Resolved contact '" + relKey + "' -> " + contactTarget);
                    }
                }
            }

            // Build prompt context string from top preferences, recent actions, and semantically similar history
            JSONArray prefsArr = getAllPreferencesJson(15);
            JSONArray actionsArr = getRecentActionsJson(8);
            JSONArray historyArr = searchRelevantHistoryJson(query, 5);

            res.put("preferences", prefsArr);
            res.put("recentActions", actionsArr);
            res.put("relevantHistory", historyArr);

            StringBuilder promptCtx = new StringBuilder("[LOCAL SQLITE BRAIN MEMORY FOR SHRI RAM NAG]:\n");
            for (int i = 0; i < prefsArr.length(); i++) {
                JSONObject p = prefsArr.getJSONObject(i);
                promptCtx.append("- Pref(").append(p.optString("key")).append("): ").append(p.optString("value")).append("\n");
            }
            for (int i = 0; i < actionsArr.length(); i++) {
                JSONObject a = actionsArr.getJSONObject(i);
                promptCtx.append("- PastAction(").append(a.optString("action")).append("): ")
                    .append(a.optString("query")).append(" ").append(a.optString("target")).append("\n");
            }
            res.put("systemPromptContext", promptCtx.toString().trim());
        } catch (Exception ignored) {}
        return res;
    }

    public synchronized String getLastPlayedYouTubeQuery() {
        try {
            SQLiteDatabase db = getReadableDatabase();
            try (Cursor c = db.query(
                TABLE_ACTIONS,
                new String[]{"query_param", "target"},
                "action_name IN ('YOUTUBE_SEARCH', 'OPEN_YOUTUBE') AND (query_param != '' OR target != '')",
                null, null, null,
                "timestamp DESC",
                "1"
            )) {
                if (c != null && c.moveToFirst()) {
                    String q = c.getString(0);
                    String t = c.getString(1);
                    return (q != null && !q.isEmpty()) ? q : t;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    public synchronized JSONArray getAllPreferencesJson(int limit) {
        JSONArray arr = new JSONArray();
        try {
            SQLiteDatabase db = getReadableDatabase();
            try (Cursor c = db.query(
                TABLE_PREFS,
                new String[]{"pref_key", "pref_value", "category", "updated_at"},
                null, null, null, null,
                "updated_at DESC",
                String.valueOf(Math.max(1, limit))
            )) {
                while (c != null && c.moveToNext()) {
                    JSONObject item = new JSONObject();
                    item.put("key", c.getString(0));
                    item.put("value", c.getString(1));
                    item.put("category", c.getString(2));
                    item.put("updatedAt", c.getLong(3));
                    arr.put(item);
                }
            }
        } catch (Exception ignored) {}
        return arr;
    }

    public synchronized JSONArray getRecentActionsJson(int limit) {
        JSONArray arr = new JSONArray();
        try {
            SQLiteDatabase db = getReadableDatabase();
            try (Cursor c = db.query(
                TABLE_ACTIONS,
                new String[]{"id", "action_name", "target", "query_param", "status", "timestamp"},
                null, null, null, null,
                "timestamp DESC",
                String.valueOf(Math.max(1, limit))
            )) {
                while (c != null && c.moveToNext()) {
                    JSONObject item = new JSONObject();
                    item.put("id", c.getInt(0));
                    item.put("action", c.getString(1));
                    item.put("target", c.getString(2));
                    item.put("query", c.getString(3));
                    item.put("status", c.getString(4));
                    item.put("timestamp", c.getLong(5));
                    arr.put(item);
                }
            }
        } catch (Exception ignored) {}
        return arr;
    }

    public synchronized JSONArray searchRelevantHistoryJson(String query, int limit) {
        JSONArray arr = new JSONArray();
        try {
            SQLiteDatabase db = getReadableDatabase();
            try (Cursor c = db.query(
                TABLE_HISTORY,
                new String[]{"id", "user_text", "ai_text", "context_tags", "timestamp"},
                null, null, null, null,
                "timestamp DESC",
                String.valueOf(Math.max(5, limit * 3))
            )) {
                String[] tokens = extractSemanticKeywords(query).split("\\s+");
                while (c != null && c.moveToNext() && arr.length() < limit) {
                    String u = c.getString(1);
                    String a = c.getString(2);
                    String tags = c.getString(3);
                    String combined = (u + " " + a + " " + tags).toLowerCase(Locale.ROOT);
                    boolean match = tokens.length == 0 || tokens[0].isEmpty();
                    for (String tok : tokens) {
                        if (tok.length() >= 2 && combined.contains(tok)) {
                            match = true;
                            break;
                        }
                    }
                    if (match) {
                        JSONObject item = new JSONObject();
                        item.put("id", c.getInt(0));
                        item.put("userText", u);
                        item.put("aiText", a);
                        item.put("tags", tags);
                        item.put("timestamp", c.getLong(4));
                        arr.put(item);
                    }
                }
            }
        } catch (Exception ignored) {}
        return arr;
    }

    private String extractSemanticKeywords(String text) {
        if (text == null) return "";
        return text.toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9\u0900-\u097F\\s]", " ")
            .replaceAll("\\b(है|हैं|का|की|के|को|में|पर|से|और|या|करो|खोलो|चलाओ|is|the|to|in|on|for|and|please)\\b", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }
}
