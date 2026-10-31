import { brainDatabase } from "./brainDatabase";
import { deviceActions } from "../voice/DeviceActions";
import { createGenAIClient, GEMINI_MODELS } from "../voice/GeminiConfig";

export interface ShivSkillModule {
  id: "claude-mem" | "agent-reach" | "gpt-researcher" | "no-ai-slop";
  name: string;
  repoUrl: string;
  category: "MEMORY" | "INTERNET" | "RESEARCH" | "QUALITY";
  description: string;
  hindiSummary: string;
  inputPlaceholder: string;
}

export const REAL_SHIV_MODULES: ShivSkillModule[] = [
  {
    id: "claude-mem",
    name: "Memory Vault (claude-mem)",
    repoUrl: "https://github.com/thedotmack/claude-mem.git",
    category: "MEMORY",
    description: "Saves and searches persistent notes and preferences in on-device storage.",
    hindiSummary: "आपके डिवाइस की मेमोरी में ज़रूरी बातें सहेजता और खोजता है",
    inputPlaceholder: "कोई याद लिखें या खोजें (जैसे: मेरा पसंदीदा विषय टेक है)...",
  },
  {
    id: "agent-reach",
    name: "Web Reader (Agent-Reach)",
    repoUrl: "https://github.com/Panniantong/Agent-Reach.git",
    category: "INTERNET",
    description: "Fetches live web facts and URLs using Gemini with Google Search grounding.",
    hindiSummary: "इंटरनेट और Google Search से ताज़ा जानकारी और लिंक लाता है",
    inputPlaceholder: "कोई ताज़ा सवाल या विषय लिखें...",
  },
  {
    id: "gpt-researcher",
    name: "Deep Researcher (gpt-researcher)",
    repoUrl: "https://github.com/assafelovic/gpt-researcher.git",
    category: "RESEARCH",
    description: "Generates multi-point research briefs with verified web sources using Gemini Search grounding.",
    hindiSummary: "किसी भी विषय पर स्रोतों (sources) के साथ पूरी रिसर्च रिपोर्ट बनाता है",
    inputPlaceholder: "रिसर्च का विषय लिखें (जैसे: भारत में सेमीकंडक्टर मिशन 2026)...",
  },
  {
    id: "no-ai-slop",
    name: "No-AI-Slop Rewriter (no-ai-slop)",
    repoUrl: "https://github.com/hardikpandya/no-ai-slop.git",
    category: "QUALITY",
    description: "Removes cliché AI buzzwords and rewrites text into natural, clear human language.",
    hindiSummary: "बनावटी AI शब्दों को हटाकर साफ़ और असली इंसान जैसी भाषा लिखता है",
    inputPlaceholder: "यहाँ वह टेक्स्ट पेस्ट करें जिसे प्राकृतिक और साफ़ बनाना है...",
  },
];

class ShivAiCoreService {
  public getModules(): ShivSkillModule[] {
    return REAL_SHIV_MODULES;
  }

  public async executeSkillModule(moduleId: string, queryInput: string): Promise<string> {
    const query = (queryInput || "").trim();
    if (!query) {
      throw new Error("कृपया इनपुट बॉक्स में अपना सवाल या टेक्स्ट लिखें।");
    }

    if (moduleId === "claude-mem") {
      const existing = brainDatabase.search(query);
      const saveRes = await deviceActions.saveMemory(query, "FACT");
      if (existing.length > 0) {
        const list = existing
          .slice(0, 4)
          .map((m) => `• [${m.category}] ${m.key}: ${m.content}`)
          .join("\n");
        return `${saveRes.message}\n\nसंबंधित यादें:\n${list}`;
      }
      return saveRes.message;
    }

    if (moduleId === "no-ai-slop") {
      const res = await deviceActions.rewriteText(query, "natural, human, clear, zero AI slop");
      if (!res.success) {
        throw new Error(res.message);
      }
      return res.message;
    }

    if (moduleId === "gpt-researcher" || moduleId === "agent-reach") {
      const res = await deviceActions.deepResearch(query);
      if (!res.success) {
        throw new Error(res.message);
      }
      return res.message;
    }

    // Fallback direct Gemini call
    const ai = createGenAIClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.TEXT_CANDIDATES[0],
      contents: query,
    });
    return response.text?.trim() || "कोई उत्तर प्राप्त नहीं हुआ।";
  }
}

export const shivAiCore = new ShivAiCoreService();
