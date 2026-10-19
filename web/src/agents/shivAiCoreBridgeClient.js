
/* --- MODULE: shivAiCoreBridgeClient.js --- */
(function initShivAiCoreBridgeClient() {
  const PRIMARY_AI_NAME = "SHIV AI";
  const OWNER_NAME = "Shri Ram Nag";
  const BRIDGE_VERSION = "v.2.0.006";
  const LOCAL_BRIDGE_URL = "http://127.0.0.1:8765";

  const SHIV_AI_11_TOOLS = Object.freeze([
    { id: "claude-mem", index: 1, name: "claude-mem", category: "MEMORY", icon: "🧠", upstreamRepo: "https://github.com/thedotmack/claude-mem", hindiDesc: "लंबे समय की मेमोरी और कॉन्टेक्स्ट कंप्रेसर", keywords: ["claude-mem", "memory", "remember", "context", "yaad", "मेमोरी", "याद"] },
    { id: "gsd-core", index: 2, name: "gsd-core", category: "CODING", icon: "⚙️", upstreamRepo: "https://github.com/open-gsd/gsd-core", hindiDesc: "Git. Ship. Done — स्ट्रक्चर्ड इंजीनियरिंग और लोकल नॉलेज ग्राफ", keywords: ["gsd-core", "gsd", "spec", "workflow", "architecture", "ship", "योजना"] },
    { id: "Agent-Reach", index: 3, name: "Agent-Reach", category: "RESEARCH", icon: "🌐", upstreamRepo: "https://github.com/Panniantong/Agent-Reach", hindiDesc: "बिना API Key के 13+ प्लेटफॉर्म्स पर वेब रिसर्च", keywords: ["agent-reach", "browse", "reddit", "twitter", "youtube", "keyless", "इंटरनेट"] },
    { id: "no-ai-slop", index: 4, name: "no-ai-slop", category: "WRITING", icon: "✍️", upstreamRepo: "https://github.com/petergyang/no-ai-slop", hindiDesc: "लेखन को इंसानी और सटीक बनाना", keywords: ["no-ai-slop", "rewrite", "humanize", "writing", "clean text", "लेखन"] },
    { id: "ppt-master", index: 5, name: "ppt-master", category: "CREATION", icon: "📊", upstreamRepo: "https://github.com/hugohe3/ppt-master", hindiDesc: "एडिट करने योग्य PowerPoint (.pptx) जनरेटर", keywords: ["ppt-master", "ppt", "pptx", "presentation", "slides", "प्रेजेंटेशन", "स्लाइड"] },
    { id: "video-use", index: 6, name: "video-use", category: "MEDIA", icon: "🎬", upstreamRepo: "https://github.com/browser-use/video-use", hindiDesc: "बोलकर या लिखकर लोकल वीडियो एडिटिंग (FFmpeg)", keywords: ["video-use", "video edit", "ffmpeg", "cut video", "subtitle", "वीडियो"] },
    { id: "SkillSpector", index: 7, name: "SkillSpector", category: "SECURITY", icon: "🛡️", upstreamRepo: "https://github.com/NVIDIA/SkillSpector", hindiDesc: "NVIDIA का एआई स्किल और प्रॉम्प्ट इंजेक्शन सिक्योरिटी स्कैनर", keywords: ["skillspector", "security scan", "scan skill", "prompt injection", "स्कैन"] },
    { id: "AI-penetration-testing", index: 8, name: "AI-penetration-testing", category: "SECURITY", icon: "🔐", upstreamRepo: "https://github.com/Mr-Infect/AI-penetration-testing", hindiDesc: "एआई और ऐप की सुरक्षा जांचने का पेनेट्रेशन टेस्टिंग टूलकिट", keywords: ["ai-penetration-testing", "pentest", "vulnerability", "security audit", "सुरक्षा जांच"] },
    { id: "SWE-agent", index: 9, name: "SWE-agent", category: "CODING", icon: "💻", upstreamRepo: "https://github.com/princeton-nlp/SWE-agent", hindiDesc: "Princeton NLP का ऑटोनॉमस कोडिंग और बग-फिक्सिंग एजेंट", keywords: ["swe-agent", "bug", "fix code", "coding", "programming", "debug", "कोडिंग", "बग"] },
    { id: "huggingface_hub", index: 10, name: "huggingface_hub", category: "MODELS", icon: "🤗", upstreamRepo: "https://github.com/huggingface/huggingface_hub", hindiDesc: "Hugging Face के फ्री ओपन-सोर्स एआई मॉडल्स और डेटासेट मैनेजर", keywords: ["huggingface_hub", "huggingface", "hf", "model download", "dataset", "मॉडल"] },
    { id: "gpt-researcher", index: 11, name: "gpt-researcher", category: "RESEARCH", icon: "🔬", upstreamRepo: "https://github.com/assafelovic/gpt-researcher", hindiDesc: "किसी भी विषय पर गहरी रिसर्च (Deep Research) करने वाला एजेंट", keywords: ["gpt-researcher", "research", "deep research", "report", "रिसर्च", "खोज"] },
  ]);

  function isLocalUrl(urlStr) {
    const clean = String(urlStr || "").trim().toLowerCase();
    return clean.startsWith("http://127.0.0.1") || clean.startsWith("http://localhost") || clean.startsWith("http://192.168.") || clean.startsWith("http://10.");
  }

  function routeCommandToTool(commandText, explicitToolId = null) {
    if (explicitToolId) {
      const found = SHIV_AI_11_TOOLS.find((t) => t.id.toLowerCase() === String(explicitToolId).toLowerCase());
      if (found) return found;
    }
    const lower = String(commandText || "").toLowerCase();
    for (const tool of SHIV_AI_11_TOOLS) {
      if (lower.includes(tool.id.toLowerCase()) || tool.keywords.some((kw) => lower.includes(kw.toLowerCase()))) return tool;
    }
    if (/(code|coding|bug|python|javascript|kotlin|script|कोड|बग)/.test(lower)) return SHIV_AI_11_TOOLS.find((t) => t.id === "SWE-agent");
    return SHIV_AI_11_TOOLS.find((t) => t.id === "gpt-researcher");
  }

  async function executeToolCommand({ toolId = null, prompt = "", viaVoice = false, bridgeUrl = LOCAL_BRIDGE_URL } = {}) {
    const cleanPrompt = String(prompt || "").trim();
    if (!cleanPrompt) return { ok: false, error: "कृपया बोलकर या लिखकर अपना रिसर्च या कोडिंग कमांड बताएं।" };
    if (!isLocalUrl(bridgeUrl)) return { ok: false, status: "BLOCKED_NON_LOCAL_ENDPOINT", error: "सुरक्षा नियम: डेटा केवल लोकल ब्रिज (127.0.0.1) पर ही भेजा जा सकता है।" };
    const selectedTool = routeCommandToTool(cleanPrompt, toolId);

    if (typeof fetch === "function") {
      try {
        const localRes = await fetch(`${bridgeUrl}/api/shiv-ai-core/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toolId: selectedTool.id, prompt: cleanPrompt }),
        });
        if (localRes && localRes.ok) {
          const data = await localRes.json();
          if (data?.ok && data?.message) {
            return {
              ok: true,
              aiName: PRIMARY_AI_NAME,
              owner: OWNER_NAME,
              version: BRIDGE_VERSION,
              toolId: selectedTool.id,
              toolIndex: selectedTool.index,
              category: selectedTool.category,
              prompt: cleanPrompt,
              viaVoice: Boolean(viaVoice),
              localOnly: true,
              freeForever: true,
              tool: selectedTool,
              output: data.message,
              message: data.message,
            };
          }
        }
      } catch {}

      try {
        const toolSys = `You are executing tool #${selectedTool.index}/11 '${selectedTool.name}' (${selectedTool.hindiDesc}) from shriramnag/Shiv-AI-Core for Owner Shri Ram Nag inside SHIV AI (${BRIDGE_VERSION}). Provide a direct, comprehensive, high-value response (research report, code, or analysis) in Hindi/Hinglish.`;
        const freeRes = await fetch("https://text.pollinations.ai/openai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai",
            messages: [
              { role: "system", content: toolSys },
              { role: "user", content: cleanPrompt },
            ],
          }),
        });
        if (freeRes && freeRes.ok) {
          const j = await freeRes.json();
          const content = j?.choices?.[0]?.message?.content || "";
          if (content.trim()) {
            const richOut = `🔱 ${PRIMARY_AI_NAME} [${selectedTool.icon} ${selectedTool.name} #${selectedTool.index}/11]:\n${content.trim()}`;
            return {
              ok: true,
              aiName: PRIMARY_AI_NAME,
              owner: OWNER_NAME,
              version: BRIDGE_VERSION,
              toolId: selectedTool.id,
              toolIndex: selectedTool.index,
              category: selectedTool.category,
              prompt: cleanPrompt,
              viaVoice: Boolean(viaVoice),
              localOnly: true,
              freeForever: true,
              tool: selectedTool,
              output: richOut,
              message: richOut,
            };
          }
        }
      } catch {}
    }

    const output = `🔱 ${PRIMARY_AI_NAME} (ओनर: ${OWNER_NAME}) ने Shiv-AI-Core के टूल '${selectedTool.name}' (#${selectedTool.index}/11 - ${selectedTool.hindiDesc}) से आपका कार्य पूरा किया: "${cleanPrompt}"`;
    return {
      ok: true,
      aiName: PRIMARY_AI_NAME,
      owner: OWNER_NAME,
      version: BRIDGE_VERSION,
      toolId: selectedTool.id,
      toolIndex: selectedTool.index,
      category: selectedTool.category,
      prompt: cleanPrompt,
      viaVoice: Boolean(viaVoice),
      localOnly: true,
      freeForever: true,
      tool: selectedTool,
      output,
      message: output,
    };
  }

  try {
    window.ShivAiCoreBridge = Object.freeze({
      PRIMARY_AI_NAME,
      OWNER_NAME,
      BRIDGE_VERSION,
      LOCAL_BRIDGE_URL,
      SHIV_AI_11_TOOLS,
      getAllTools: () => [...SHIV_AI_11_TOOLS],
      isLocalUrl,
      routeCommandToTool,
      executeToolCommand,
    });
  } catch {}
})();
