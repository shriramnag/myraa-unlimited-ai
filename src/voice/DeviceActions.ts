import { agentSupervisor } from "../services/agentSupervisor";
import { brainDatabase } from "../services/brainDatabase";
import { nativeBridge } from "../services/nativeBridge";
import { createGenAIClient, GEMINI_MODELS, isModelNotFoundError, redactSecrets } from "./GeminiConfig";
import { PanelTarget, voiceStore } from "./voiceStore";

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

async function runWithSupervisor(
  actionName: string,
  title: string,
  executor: (taskId: string) => Promise<ToolExecutionResult>
): Promise<ToolExecutionResult> {
  if (agentSupervisor.isEmergencyStopActive()) {
    return {
      success: false,
      message: "Emergency Stop (HALT) सक्रिय है। कृपया पहले टास्क मॉनिटर से Resume करें।",
    };
  }

  const task = agentSupervisor.createTask({
    title,
    actionName,
    avatarRole: voiceStore.getSnapshot().activeRole,
    model: voiceStore.getSnapshot().activeLiveModel || "gemini-3.8-live",
  });

  agentSupervisor.transitionState(task.taskId, "PLANNING", `Checking policy for ${actionName}...`);
  try {
    agentSupervisor.transitionState(task.taskId, "EXECUTING", `Running ${actionName}...`);
    const result = await executor(task.taskId);
    agentSupervisor.verifyAndCompleteTask(task.taskId, {
      success: result.success,
      message: result.message,
      error: result.success ? undefined : result.message,
    });
    return result;
  } catch (err: any) {
    const cleanErr = redactSecrets(String(err?.message || err || "Unknown tool error"));
    agentSupervisor.verifyAndCompleteTask(task.taskId, {
      success: false,
      error: cleanErr,
    });
    return {
      success: false,
      message: `त्रुटि: ${cleanErr}`,
    };
  }
}

export const deviceActions = {
  async openApp(appName: string): Promise<ToolExecutionResult> {
    return runWithSupervisor("openApp", `Open App: ${appName}`, async () => {
      const res = nativeBridge.launchAllowlistedApp(appName);
      return {
        success: res.success,
        message: res.message,
        data: { mode: res.mode, appName },
      };
    });
  },

  async openWhatsApp(phone?: string, message?: string): Promise<ToolExecutionResult> {
    return runWithSupervisor("openWhatsApp", `WhatsApp: ${phone || "chat"}`, async () => {
      const combinedCheck = `${phone || ""} ${message || ""}`;
      if (nativeBridge.isBlockedByPaymentShield(combinedCheck)) {
        return {
          success: false,
          message: "Payment & OTP Shield के कारण OTP या पेमेंट संदेश ऑटोमैटिक भेजना प्रतिबंधित है।",
        };
      }

      const cleanPhone = (phone || "").replace(/[^\d]/g, "");
      if (phone && cleanPhone.length < 7) {
        return {
          success: false,
          message: "अमान्य फ़ोन नंबर। कृपया सही WhatsApp नंबर बताएं।",
        };
      }

      const params = new URLSearchParams();
      if (message && message.trim()) {
        params.set("text", message.trim());
      }
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}${queryStr}`
        : `https://wa.me/${queryStr}`;

      try {
        const win = window.open(waUrl, "_blank", "noopener,noreferrer");
        nativeBridge.recordAudit(
          "INFO",
          "WHATSAPP",
          "OPEN_WHATSAPP",
          "EXECUTED",
          `Opened WhatsApp link (${cleanPhone || "general"})`
        );
        if (win) {
          return {
            success: true,
            message: "WhatsApp चैट विंडो खोल दी गई है। आप वहां Send दबा सकते हैं।",
            data: { url: waUrl },
          };
        }
        window.location.href = waUrl;
        return {
          success: true,
          message: "WhatsApp लिंक खोल दिया गया है।",
          data: { url: waUrl },
        };
      } catch (e: any) {
        return {
          success: false,
          message: `WhatsApp खोलने में त्रुटि: ${e?.message || "Unknown error"}`,
        };
      }
    });
  },

  async openUrl(url: string): Promise<ToolExecutionResult> {
    return runWithSupervisor("openUrl", `Open URL: ${url.slice(0, 32)}`, async () => {
      if (nativeBridge.isBlockedByPaymentShield(url)) {
        return {
          success: false,
          message: "Payment & OTP Shield के कारण बैंकिंग या पेमेंट URL खोलना प्रतिबंधित है।",
        };
      }

      let parsed: URL;
      try {
        parsed = new URL(url.trim());
      } catch {
        return {
          success: false,
          message: "अमान्य URL प्रारूप। केवल मान्य https:// लिंक ही खोले जा सकते हैं।",
        };
      }

      if (parsed.protocol !== "https:") {
        return {
          success: false,
          message: "सुरक्षा नियम: केवल सुरक्षित https:// URL ही खोले जा सकते हैं।",
        };
      }

      const win = window.open(parsed.toString(), "_blank", "noopener,noreferrer");
      if (!win) {
        return {
          success: false,
          message: "ब्राउज़र ने पॉप-अप विंडो रोक दी। कृपया पॉप-अप की अनुमति दें।",
        };
      }

      nativeBridge.recordAudit("INFO", "BROWSER", "OPEN_URL", "EXECUTED", `Opened ${parsed.hostname}`);
      return {
        success: true,
        message: `${parsed.hostname} नए टैब में खोल दिया गया है।`,
        data: { url: parsed.toString() },
      };
    });
  },

  async makeCall(phoneNumber: string, contactName?: string): Promise<ToolExecutionResult> {
    return runWithSupervisor("makeCall", `Call: ${contactName || phoneNumber}`, async (taskId) => {
      const cleaned = (phoneNumber || "").replace(/[^\d+*#]/g, "");
      if (!cleaned || cleaned.replace(/\D/g, "").length < 3) {
        return {
          success: false,
          message: "कॉल करने के लिए मान्य फ़ोन नंबर आवश्यक है।",
        };
      }

      agentSupervisor.transitionState(
        taskId,
        "AWAITING_APPROVAL",
        `Waiting for user confirmation to call ${cleaned}`
      );

      const confirmed = await new Promise<boolean>((resolve) => {
        voiceStore.setPendingCall({
          phoneNumber: cleaned,
          contactName,
          onConfirm: () => {
            voiceStore.setPendingCall(null);
            resolve(true);
          },
          onCancel: () => {
            voiceStore.setPendingCall(null);
            resolve(false);
          },
        });
      });

      if (!confirmed) {
        nativeBridge.recordAudit(
          "INFO",
          "TELEPHONY",
          "CALL_CANCELLED",
          "BLOCKED_BY_POLICY",
          `User cancelled call to ${cleaned}`
        );
        return {
          success: false,
          message: "यूज़र ने स्क्रीन पर कॉल रद्द कर दी।",
        };
      }

      const dialRes = nativeBridge.launchNativeDialer(cleaned);
      return {
        success: dialRes.success,
        message: dialRes.message,
        data: { mode: dialRes.mode, phoneNumber: cleaned },
      };
    });
  },

  async callContact(name: string): Promise<ToolExecutionResult> {
    const trimmedName = (name || "").trim();
    if (!trimmedName) {
      return {
        success: false,
        message: "कृपया संपर्क का नाम बताएं।",
      };
    }

    const androidBridge = typeof window !== "undefined" ? (window as any).MyraaNativeBridge : null;
    if (androidBridge && typeof androidBridge.findContacts === "function") {
      try {
        const rawMatches = androidBridge.findContacts(trimmedName);
        const matches: Array<{ name: string; number: string }> =
          typeof rawMatches === "string" ? JSON.parse(rawMatches) : rawMatches || [];

        if (matches.length > 1) {
          const listStr = matches.map((m) => `${m.name} (${m.number})`).join(", ");
          return {
            success: false,
            message: `'${trimmedName}' नाम के ${matches.length} संपर्क मिले: ${listStr}। कृपया बताएं किस नंबर पर कॉल करना है?`,
            data: { multipleMatches: matches },
          };
        }

        if (matches.length === 1 && matches[0].number) {
          return this.makeCall(matches[0].number, matches[0].name);
        }
      } catch {
        // Fall through to Brain DB contact lookup
      }
    }

    const memoryMatches = brainDatabase
      .search(trimmedName)
      .map((m) => {
        const phoneMatch = m.content.match(/(\+?\d[\d\s\-]{7,15}\d)/);
        return phoneMatch ? { name: m.key, number: phoneMatch[1].replace(/[\s\-]/g, "") } : null;
      })
      .filter((item): item is { name: string; number: string } => Boolean(item));

    if (memoryMatches.length > 1) {
      const listStr = memoryMatches.map((m) => `${m.name} (${m.number})`).join(", ");
      return {
        success: false,
        message: `'${trimmedName}' नाम के एक से अधिक नंबर मिले: ${listStr}। कृपया बताएं किस पर कॉल करना है?`,
        data: { multipleMatches: memoryMatches },
      };
    }

    if (memoryMatches.length === 1) {
      return this.makeCall(memoryMatches[0].number, memoryMatches[0].name);
    }

    return {
      success: false,
      message: `'${trimmedName}' नाम का कोई फ़ोन नंबर नहीं मिला (ब्राउज़र में फ़ोन कॉन्टैक्ट्स तक सीधी पहुँच नहीं होती — कृपया नंबर बोलें या ब्रेन मेमोरी में नंबर सेव करें)।`,
    };
  },

  async toggleFlashlight(on?: boolean): Promise<ToolExecutionResult> {
    return runWithSupervisor("toggleFlashlight", "Toggle Hardware Flashlight", async () => {
      const res = nativeBridge.toggleFlashlight(on);
      return {
        success: res.success,
        message: res.message,
        data: { flashlightOn: res.flashlightOn },
      };
    });
  },

  async saveMemory(
    text: string,
    category: "IDENTITY" | "PREFERENCE" | "PROJECT" | "FACT" | "HABIT" | "RELATIONSHIP" = "FACT",
    key?: string
  ): Promise<ToolExecutionResult> {
    return runWithSupervisor("saveMemory", `Save Memory: ${(key || text).slice(0, 28)}`, async () => {
      const cleaned = (text || "").trim();
      if (!cleaned) {
        return { success: false, message: "सेव करने के लिए कोई टेक्स्ट नहीं मिला।" };
      }
      const title = (key || cleaned.split(/[।.!?\n]/)[0] || "Memory").slice(0, 42).trim();
      const mem = brainDatabase.addMemory(category, title, cleaned, ["VoiceSaved"]);
      return {
        success: true,
        message: `ब्रेन डेटाबेस में मेमोरी '${mem.key}' सुरक्षित रूप से सेव हो गई है।`,
        data: { memoryId: mem.id, key: mem.key },
      };
    });
  },

  async searchMemory(query: string): Promise<ToolExecutionResult> {
    return runWithSupervisor("searchMemory", `Search Memory: ${query.slice(0, 28)}`, async () => {
      const results = brainDatabase.search(query || "");
      if (results.length === 0) {
        return {
          success: true,
          message: `'${query}' से जुड़ी कोई मेमोरी ब्रेन डेटाबेस में नहीं मिली।`,
          data: { count: 0, results: [] },
        };
      }
      const summary = results
        .slice(0, 5)
        .map((m) => `• [${m.category}] ${m.key}: ${m.content}`)
        .join("\n");
      return {
        success: true,
        message: `${results.length} मेमोरी मिलीं:\n${summary}`,
        data: { count: results.length, results: results.slice(0, 5) },
      };
    });
  },

  async deepResearch(topic: string): Promise<ToolExecutionResult> {
    return runWithSupervisor("deepResearch", `Deep Research: ${topic.slice(0, 32)}`, async () => {
      const cleanTopic = (topic || "").trim();
      if (!cleanTopic) {
        return { success: false, message: "रिसर्च के लिए विषय (topic) आवश्यक है।" };
      }

      const ai = createGenAIClient();
      let lastErr = "";

      for (const model of GEMINI_MODELS.TEXT_CANDIDATES) {
        try {
          voiceStore.log("INFO", `[deepResearch] Querying ${model} with Google Search grounding...`);
          const response = await ai.models.generateContent({
            model,
            contents: `Perform a thorough, factual research synthesis on: "${cleanTopic}". Provide key findings clearly in the same language as the topic (Hindi/Hinglish/English) and cite real facts.`,
            config: {
              tools: [{ googleSearch: {} }],
            },
          });

          const text = response.text?.trim() || "";
          const chunks =
            response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const sources: Array<{ title: string; url: string }> = [];

          for (const ch of chunks) {
            if (ch.web?.uri) {
              sources.push({
                title: ch.web.title || ch.web.uri,
                url: ch.web.uri,
              });
            }
          }

          if (!text) {
            throw new Error("मॉडल से खाली उत्तर मिला।");
          }

          const sourcesBlock =
            sources.length > 0
              ? `\n\nस्रोत (Sources):\n${sources
                  .slice(0, 5)
                  .map((s, idx) => `${idx + 1}. ${s.title} — ${s.url}`)
                  .join("\n")}`
              : "";

          voiceStore.log("INFO", `[deepResearch] Completed via ${model} (${sources.length} sources).`);
          return {
            success: true,
            message: `${text}${sourcesBlock}`,
            data: { model, sources, topic: cleanTopic },
          };
        } catch (err: any) {
          lastErr = redactSecrets(String(err?.message || err));
          voiceStore.log("WARN", `[deepResearch] ${model} failed: ${lastErr}`);
          if (!isModelNotFoundError(err)) {
            break;
          }
        }
      }

      return {
        success: false,
        message: `डीप रिसर्च विफल रही: ${lastErr || "मॉडल से संपर्क नहीं हो सका।"}`,
      };
    });
  },

  async rewriteText(text: string, style: string = "clear, natural, human, zero AI slop"): Promise<ToolExecutionResult> {
    return runWithSupervisor("rewriteText", `Rewrite (${style.slice(0, 20)})`, async () => {
      const cleanText = (text || "").trim();
      if (!cleanText) {
        return { success: false, message: "रीराइट करने के लिए टेक्स्ट आवश्यक है।" };
      }

      const ai = createGenAIClient();
      let lastErr = "";

      for (const model of GEMINI_MODELS.TEXT_CANDIDATES) {
        try {
          voiceStore.log("INFO", `[rewriteText] Calling ${model}...`);
          const response = await ai.models.generateContent({
            model,
            contents: `Rewrite the following text in style "${style}". Remove all robotic clichés, filler words, and AI slop. Keep it natural, human, and direct in the user's language:\n\n${cleanText}`,
          });

          const out = response.text?.trim() || "";
          if (!out) throw new Error("खाली उत्तर प्राप्त हुआ।");

          return {
            success: true,
            message: out,
            data: { model, style },
          };
        } catch (err: any) {
          lastErr = redactSecrets(String(err?.message || err));
          if (!isModelNotFoundError(err)) break;
        }
      }

      return {
        success: false,
        message: `टेक्स्ट रीराइट में त्रुटि: ${lastErr}`,
      };
    });
  },

  async openPanel(panel: string): Promise<ToolExecutionResult> {
    return runWithSupervisor("openPanel", `Open Panel: ${panel}`, async () => {
      const normalized = (panel || "").trim().toLowerCase() as PanelTarget;
      const validPanels: PanelTarget[] = [
        "brain",
        "apps",
        "vault",
        "settings",
        "tools",
        "tasks",
        "diagnostics",
      ];
      if (!validPanels.includes(normalized)) {
        return {
          success: false,
          message: `अमान्य पैनल '${panel}'। उपलब्ध पैनल: brain, apps, vault, settings.`,
        };
      }

      voiceStore.requestPanel(normalized);
      return {
        success: true,
        message: `${normalized} पैनल स्क्रीन पर खोल दिया गया है।`,
        data: { panel: normalized },
      };
    });
  },
};
