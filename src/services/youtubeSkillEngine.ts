import { agentSupervisor } from "./agentSupervisor";
import { brainDatabase } from "./brainDatabase";
import { createGenAIClient, GEMINI_MODELS, redactSecrets } from "../voice/GeminiConfig";

export interface YouTubeSkillModule {
  id: string;
  name: string;
  category: "STRATEGY" | "SCRIPTING" | "SEO" | "THUMBNAIL";
  hindiTitle: string;
  description: string;
}

export interface YouTubeGenerationResult {
  skillId: string;
  topic: string;
  titleOptions: string[];
  hookScript: string;
  seoTags: string[];
  thumbnailPrompt: string;
  retentionStrategy: string;
}

class YouTubeSkillEngine {
  private skills: YouTubeSkillModule[] = [
    {
      id: "yt-viral-hook",
      name: "Viral Hook Lab",
      category: "SCRIPTING",
      hindiTitle: "वायरल शुरुआती 15 सेकंड हुक",
      description: "Generates high-retention 15-second video hooks in Hinglish/Hindi for YouTube & Shorts.",
    },
    {
      id: "yt-title-ctr",
      name: "High-CTR Title Generator",
      category: "SEO",
      hindiTitle: "हाई-क्लिक टाइटल और थंबनेल टेक्स्ट",
      description: "Crafts curiosity-driven titles under 60 characters for Indian YouTube audiences.",
    },
    {
      id: "yt-script-architect",
      name: "Retention Script Architect",
      category: "SCRIPTING",
      hindiTitle: "पूरी वीडियो स्क्रिप्ट रूपरेखा",
      description: "Structures story-driven scripts with pattern interrupts and clear CTAs.",
    },
    {
      id: "yt-thumbnail-concept",
      name: "Thumbnail Concept Studio",
      category: "THUMBNAIL",
      hindiTitle: "थंबनेल डिज़ाइन और कंट्रास्ट आइडिया",
      description: "Designs 3-element high-contrast thumbnail visual descriptions and short text overlays.",
    },
    {
      id: "yt-seo-metadata",
      name: "YouTube SEO & Tag Engine",
      category: "SEO",
      hindiTitle: "सर्च रैंकिंग टैग्स और डिस्क्रिप्शन",
      description: "Produces high-intent Hindi + English search keywords and description hooks.",
    },
    {
      id: "yt-shorts-repurpose",
      name: "Shorts Script Lab",
      category: "STRATEGY",
      hindiTitle: "60-सेकंड यूट्यूब शॉर्ट्स स्क्रिप्ट",
      description: "Creates fast-paced 60-second YouTube Shorts scripts with loop endings.",
    },
  ];

  public getSkills(): YouTubeSkillModule[] {
    return this.skills;
  }

  public async generateCreatorPackage(
    topic: string,
    skillId?: string
  ): Promise<YouTubeGenerationResult> {
    const cleanTopic = (topic || "").trim();
    if (!cleanTopic) {
      throw new Error("कृपया YouTube पैकेज बनाने के लिए कोई विषय (Topic) लिखें।");
    }

    const skill = this.skills.find((s) => s.id === skillId) || this.skills[0];
    const task = agentSupervisor.createTask({
      title: `YouTube: ${skill.name} (${cleanTopic.slice(0, 24)})`,
      actionName: "youtubeCreatorStudio",
      avatarRole: "PIXEL",
    });

    agentSupervisor.transitionState(task.taskId, "PLANNING", `Preparing ${skill.name}...`);

    try {
      agentSupervisor.transitionState(task.taskId, "EXECUTING", "Generating with Gemini...");
      const ai = createGenAIClient();
      let rawJson = "";
      let lastErr = "";

      const prompt = `You are an expert Indian YouTube Strategist for Shri Ram Nag.
Create a complete, practical YouTube Creator Package for the topic: "${cleanTopic}" focusing on "${skill.name}" (${skill.description}).
Write specific, high-CTR Hinglish/Hindi content tailored to this exact topic.
Respond ONLY with valid JSON matching this structure:
{
  "titleOptions": ["4 specific catchy titles under 60 chars in Hinglish/Hindi"],
  "hookScript": "Exact 15-second spoken opening hook script in natural Hinglish",
  "seoTags": ["8 specific search keywords for this topic"],
  "thumbnailPrompt": "Specific visual layout, facial expression, and 3-word bold text overlay for the thumbnail",
  "retentionStrategy": "Specific pacing and pattern-interrupt advice for this video"
}`;

      for (const model of GEMINI_MODELS.TEXT_CANDIDATES) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.6,
            },
          });
          if (response.text) {
            rawJson = response.text.trim();
            break;
          }
        } catch (e: any) {
          lastErr = redactSecrets(String(e?.message || e));
        }
      }

      if (!rawJson) {
        throw new Error(lastErr || "Gemini से उत्तर नहीं मिला।");
      }

      const cleanedJson = rawJson.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      const parsed = JSON.parse(cleanedJson);

      const result: YouTubeGenerationResult = {
        skillId: skill.id,
        topic: cleanTopic,
        titleOptions:
          Array.isArray(parsed.titleOptions) && parsed.titleOptions.length > 0
            ? parsed.titleOptions
            : [`${cleanTopic} — पूरी जानकारी`],
        hookScript:
          typeof parsed.hookScript === "string" && parsed.hookScript
            ? parsed.hookScript
            : `दोस्तों, आज हम ${cleanTopic} के बारे में सीधा और असली सच जानेंगे।`,
        seoTags:
          Array.isArray(parsed.seoTags) && parsed.seoTags.length > 0
            ? parsed.seoTags
            : [cleanTopic, "Hindi Tech", "Shri Ram Nag"],
        thumbnailPrompt:
          typeof parsed.thumbnailPrompt === "string" && parsed.thumbnailPrompt
            ? parsed.thumbnailPrompt
            : `High-contrast thumbnail for ${cleanTopic}`,
        retentionStrategy:
          typeof parsed.retentionStrategy === "string" && parsed.retentionStrategy
            ? parsed.retentionStrategy
            : "हर 30 सेकंड में स्क्रीन पर विज़ुअल उदाहरण बदलें।",
      };

      brainDatabase.addMemory(
        "PROJECT",
        `YT: ${cleanTopic.slice(0, 30)}`,
        `Title: ${result.titleOptions[0]} | Hook: ${result.hookScript.slice(0, 80)}`,
        ["YouTube", skill.name]
      );

      agentSupervisor.verifyAndCompleteTask(task.taskId, {
        success: true,
        message: `YouTube पैकेज तैयार: ${result.titleOptions[0]}`,
      });

      return result;
    } catch (err: any) {
      const msg = redactSecrets(String(err?.message || err));
      agentSupervisor.verifyAndCompleteTask(task.taskId, {
        success: false,
        error: msg,
      });
      throw new Error(`YouTube पैकेज बनाने में त्रुटि: ${msg}`);
    }
  }
}

export const youtubeSkillEngine = new YouTubeSkillEngine();
