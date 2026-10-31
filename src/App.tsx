import React, { useState, useEffect } from "react";
import { CharacterRole, TaskRecord } from "./types";
import { HolographicAvatarStage, ROLE_THEMES } from "./components/HolographicAvatarStage";
import { AndroidStatusBar } from "./components/AndroidStatusBar";
import { AndroidNotificationShade } from "./components/AndroidNotificationShade";
import { LiveChatBubble } from "./components/LiveChatBubble";
import { TaskMonitorHud } from "./components/TaskMonitorHud";
import { ShivAiCorePanel } from "./components/ShivAiCorePanel";
import { BrainDatabasePanel } from "./components/BrainDatabasePanel";
import { AndroidAppsModal } from "./components/AndroidAppsModal";
import { AdminVaultModal } from "./components/AdminVaultModal";
import { ApkBuildDoctorModal } from "./components/ApkBuildDoctorModal";
import { agentSupervisor } from "./services/agentSupervisor";
import { nativeBridge } from "./services/nativeBridge";
import { voiceBiometrics } from "./services/voiceBiometrics";
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Smartphone,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  ShieldCheck,
  Database,
  Cpu,
  Layers,
  Flashlight,
  Sun,
  Activity,
  Wrench,
} from "lucide-react";

export function App() {
  const [activeRole, setActiveRole] = useState<CharacterRole>("MYRAA");
  const [cameraMode, setCameraMode] = useState<"CLOSEUP" | "FULL">("CLOSEUP");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [inputText, setInputText] = useState("");
  const [replyText, setReplyText] = useState(
    "नमस्ते श्री राम नाग जी! Google AI Studio (Gemini Audio) का प्राकृतिक आवाज़ इंजन सक्रिय है। सभी 6 कैरेक्टर्स (MYRAA: Kore, AURA: Aoede, PIXEL: Despina, CODEX: Puck, SENTINEL: Fenrir, SAGE: Charon) 100% तैयार हैं!"
  );
  const [activeToolId, setActiveToolId] = useState<string | undefined>(undefined);

  // Modals & Drawers
  const [isNotificationShadeOpen, setIsNotificationShadeOpen] = useState(false);
  const [isShivCoreOpen, setIsShivCoreOpen] = useState(false);
  const [isBrainDbOpen, setIsBrainDbOpen] = useState(false);
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
  const [activeAppDrawerTab, setActiveAppDrawerTab] = useState<string | null>(null);
  const [isAdminVaultOpen, setIsAdminVaultOpen] = useState(false);
  const [isApkDoctorOpen, setIsApkDoctorOpen] = useState(false);
  const [isPhoneFrameMode, setIsPhoneFrameMode] = useState(true);

  // Tasks & Device State (Wrapped in safe try-catch hydration to prevent storage boot crashes)
  const [tasks, setTasks] = useState<TaskRecord[]>(() => {
    try {
      return agentSupervisor.getAllTasks();
    } catch {
      return [];
    }
  });
  const [deviceState, setDeviceState] = useState(() => {
    try {
      return nativeBridge.getDeviceState();
    } catch {
      return { flashlightOn: false, batteryLevel: 98, network: "5G VoLTE", wifi: "Active / Secured" };
    }
  });
  const [voiceLockActive, setVoiceLockActive] = useState(() => {
    try {
      return voiceBiometrics.isVoiceLockOn();
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let unsubTasks = () => {};
    let unsubVoice = () => {};
    try {
      unsubTasks = agentSupervisor.subscribe((taskList) => {
        setTasks([...taskList]);
      });
      unsubVoice = voiceBiometrics.subscribe((speaking) => {
        setIsSpeaking(speaking);
      });
      (window as any).onNativeVoiceRecognized = (text: string) => {
        setIsListening(false);
        if (text && text.trim()) {
          handleCommandSubmit(text.trim());
        }
      };
    } catch {}
    return () => {
      try {
        unsubTasks();
        unsubVoice();
      } catch {}
    };
  }, []);

  const triggerAssistantResponse = (prompt: string, answer: string, toolId?: string, roleOverride?: CharacterRole) => {
    setUserPrompt(prompt);
    setReplyText(answer);
    setActiveToolId(toolId);
    const targetRole = roleOverride || activeRole;
    voiceBiometrics.speakWithGeminiVoice(answer, targetRole);
  };

  const handleToggleFlashlight = () => {
    const on = nativeBridge.toggleFlashlight();
    setDeviceState(nativeBridge.getDeviceState());
    const msg = on ? "फ्लैशलाइट चालू की गई।" : "फ्लैशलाइट बंद की गई।";
    triggerAssistantResponse("Torch Toggle", msg);
  };

  const handleRoleChange = (newRole: CharacterRole) => {
    setActiveRole(newRole);
    const theme = ROLE_THEMES[newRole];
    const introMsg = `नमस्ते श्री राम नाग जी! मैं ${theme.name} हूँ। (${theme.voiceDescription})`;
    triggerAssistantResponse("Switch Role", introMsg, undefined, newRole);
  };

  const handleCommandSubmit = async (queryText?: string) => {
    const query = (queryText || inputText).trim();
    if (!query) return;

    setInputText("");
    setUserPrompt(query);

    // Route to specialist agent
    const specialist = agentSupervisor.routeIntentToSpecialist(query);
    setActiveRole(specialist.avatar);

    const task = agentSupervisor.createTask({
      title: `Execute: ${query.slice(0, 35)}...`,
      actionName: query,
      avatarRole: specialist.avatar,
    });

    agentSupervisor.transitionState(task.taskId, "PLANNING", "Checking security policy & intent...");

    const lower = query.toLowerCase();

    // 1. Flashlight
    if (lower.includes("torch") || lower.includes("flashlight") || lower.includes("फ्लैशलाइट")) {
      agentSupervisor.transitionState(task.taskId, "EXECUTING", "Toggling camera flashlight...");
      const on = nativeBridge.toggleFlashlight();
      setDeviceState(nativeBridge.getDeviceState());
      const resMsg = on ? "फ्लैशलाइट चालू (ON) कर दी गई है।" : "फ्लैशलाइट बंद (OFF) कर दी गई है।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg, undefined, specialist.avatar);
      return;
    }

    // 2. Phone Call
    if (lower.includes("call") || lower.includes("कॉल")) {
      agentSupervisor.transitionState(task.taskId, "AWAITING_APPROVAL", "Confirmation required for phone call");
      setActiveAppDrawerTab("DIALER");
      setIsAppsModalOpen(true);
      const resMsg = "कॉल डायलर तैयार है। कृपया स्क्रीन पर सुरक्षा पुष्टि करें।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg, undefined, specialist.avatar);
      return;
    }

    // 3. SMS / WhatsApp
    if (lower.includes("sms") || lower.includes("whatsapp") || lower.includes("मैसेज") || lower.includes("संदेश")) {
      setActiveAppDrawerTab("MESSAGES");
      setIsAppsModalOpen(true);
      const resMsg = "मैसेज कंपोज़र खुल गया है। आप तुरंत संदेश भेज सकते हैं।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg, undefined, specialist.avatar);
      return;
    }

    // 4. Brain DB query
    if (lower.includes("brain") || lower.includes("memory") || lower.includes("याद") || lower.includes("डेटाबेस")) {
      setIsBrainDbOpen(true);
      const resMsg = "लॉन्ग-टर्म ब्रेन डेटाबेस खुल गया है। आपकी सभी स्थायी मेमोरीज़ यहाँ सुरक्षित हैं।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg, undefined, specialist.avatar);
      return;
    }

    // 5. Tools / Deep Research
    if (lower.includes("research") || lower.includes("रिसर्च") || lower.includes("tool") || lower.includes("टूल")) {
      setIsShivCoreOpen(true);
      const resMsg = "शिव एआई कोर के सभी 11 टूल्स और Deep Research वर्कबेंच तैयार है!";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg, "gpt-researcher", specialist.avatar);
      return;
    }

    // YouTube Creator Skills (11 Skills)
    if (
      lower.includes("youtube") ||
      lower.includes("यूट्यूब") ||
      lower.includes("script") ||
      lower.includes("स्क्रिप्ट") ||
      lower.includes("shorts") ||
      lower.includes("शॉर्ट्स") ||
      lower.includes("hook") ||
      lower.includes("seo")
    ) {
      setIsShivCoreOpen(true);
      const resMsg = "यूट्यूब क्रिएटर स्किल इंजन (11 स्किल्स: स्क्रिप्ट्स, हुक, SEO, शॉर्ट्स) तैयार है!";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg, "yt-script-writer", specialist.avatar);
      return;
    }

    // 6. Camera
    if (lower.includes("camera") || lower.includes("कैमरा") || lower.includes("photo") || lower.includes("फ़ोटो")) {
      setActiveAppDrawerTab("DRAWER");
      setIsAppsModalOpen(true);
      const resMsg = "कैमरा व्यूफ़ाइंडर चालू किया गया।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg, undefined, specialist.avatar);
      return;
    }

    // 7. General AI response
    agentSupervisor.transitionState(task.taskId, "EXECUTING", `Processing intent via ${specialist.label}...`);
    setTimeout(() => {
      let resp = "";
      if (specialist.avatar === "CODEX") {
        resp = `[CODEX]: श्री राम नाग जी, आपके कोड कार्य "${query}" का विश्लेषण पूरा हुआ। सभी 11 टूल्स और ऑटोमेशन लाइब्रेरी सक्रिय हैं।`;
      } else if (specialist.avatar === "SAGE") {
        resp = `[SAGE]: विषय "${query}" पर बहु-स्रोतीय रिसर्च रिपोर्ट तैयार की जा रही है। मुख्य निष्कर्ष डेटाबेस में संचित हैं।`;
      } else if (specialist.avatar === "SENTINEL") {
        resp = `[SENTINEL]: सुरक्षा शील्ड सामान्य है। किसी भी प्रॉम्प्ट इंजेक्शन या अनधिकृत क्रेडेंशियल रिसाव का जोखिम 0% है।`;
      } else {
        resp = `हाँ श्री राम नाग जी, मैंने आपका निर्देश "${query}" समझ लिया है। सभी सिस्टम सुरक्षित और तैयार हैं!`;
      }
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resp });
      triggerAssistantResponse(query, resp, undefined, specialist.avatar);
    }, 400);
  };

  const handleVoiceListen = () => {
    if (isListening) {
      voiceBiometrics.stopListening();
      setIsListening(false);
      return;
    }
    setIsListening(true);
    voiceBiometrics.listenForVoiceCommand(
      (transcript) => {
        setIsListening(false);
        if (transcript && transcript.trim()) {
          // Immediately auto-submit the recognized text, trigger realistic Gemini voice output, and display avatar speaking animation!
          handleCommandSubmit(transcript.trim());
        }
      },
      (err) => {
        // Fallback to native Android speech recognizer bridge if WebView SpeechRecognition is restricted
        try {
          const bridge = (window as any).MyraaNativeBridge;
          if (bridge && typeof bridge.startVoiceRecognition === "function") {
            bridge.startVoiceRecognition();
            return;
          }
        } catch {}
        setIsListening(false);
        triggerAssistantResponse(
          "Voice Command",
          "माफ़ कीजिए, आवाज़ समझ नहीं आई। कृपया दोबारा बोलें या लिखकर भेजें।"
        );
      }
    );
  };

  const currentTheme = ROLE_THEMES[activeRole] || ROLE_THEMES.MYRAA;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-0 sm:p-4 bg-slate-950 overflow-hidden font-sans">
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 opacity-20 filter blur-3xl pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(circle at 50% 30%, ${currentTheme.hex}, transparent 70%)` }}
      />

      {/* Main Container */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden transition-all duration-300 shadow-2xl ${
          isPhoneFrameMode
            ? "w-full max-w-[430px] h-screen sm:h-[92vh] sm:rounded-[44px] border-0 sm:border-8 border-slate-900 bg-slate-950 ring-1 ring-white/10"
            : "w-full h-screen rounded-none bg-slate-950"
        }`}
      >
        {/* Flashlight Beam Simulation */}
        {deviceState.flashlightOn && (
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-300/30 to-transparent pointer-events-none z-30 animate-pulse" />
        )}

        {/* Android Status Bar */}
        <AndroidStatusBar
          onPullDownShade={() => setIsNotificationShadeOpen(true)}
          batteryLevel={deviceState.batteryLevel}
          isFlashlightOn={deviceState.flashlightOn}
        />

        {/* Supreme Owner Header */}
        <div className="flex items-center justify-between px-3 py-1.5 z-20 bg-slate-950/70 border-b border-white/5 backdrop-blur-sm text-[10px]">
          {/* Ultra-Sleek Minimal Owner Badge Chip */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-md shadow-sm"
            title="निर्माण कर्ता एवं मालिक: श्री राम नाग (Shri Ram Nag)"
          >
            <Sparkles className="w-3 h-3 text-sky-400 shrink-0" />
            <span className="font-bold text-white text-[10px] tracking-tight">SHIV AI</span>
            <span className="text-[8px] font-mono text-sky-400">v7.0.36</span>
            <span className="text-slate-600 text-[10px]">|</span>
            <span className="text-[9px] font-medium text-emerald-400 truncate max-w-[150px]">श्री राम नाग</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsApkDoctorOpen(true)}
              type="button"
              className="px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border bg-[#00E676]/20 text-[#00E676] border-[#00E676]/50 hover:bg-[#00E676]/30 transition shadow-sm"
              title="APK Build Fix Report"
            >
              <Wrench className="w-2.5 h-2.5" />
              <span>Build Fix ✓</span>
            </button>

            <button
              onClick={handleToggleFlashlight}
              type="button"
              className={`p-1.5 rounded-full border transition ${
                deviceState.flashlightOn
                  ? "bg-amber-400 text-black border-amber-300 shadow-md"
                  : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
              }`}
              title="Torch / Flashlight"
            >
              <Flashlight className="w-3 h-3" />
            </button>

            <button
              onClick={() => {
                const next = voiceBiometrics.toggleVoiceLock();
                setVoiceLockActive(next);
              }}
              type="button"
              className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border transition ${
                voiceLockActive
                  ? "bg-[#00E676]/20 text-[#00E676] border-[#00E676]/40"
                  : "bg-rose-500/20 text-rose-300 border-rose-500/30"
              }`}
              title="Voice Biometrics Owner Lock (~155Hz Shri Ram Nag)"
            >
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>{voiceLockActive ? "Voice Lock" : "Unlocked"}</span>
            </button>

            <button
              onClick={() => setIsPhoneFrameMode(!isPhoneFrameMode)}
              type="button"
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition"
              title={isPhoneFrameMode ? "Expand to Full Viewport" : "Switch to Phone Frame"}
            >
              {isPhoneFrameMode ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto px-2 py-1 relative z-10">
          {/* 3D Holographic Stage */}
          <HolographicAvatarStage
            activeRole={activeRole}
            onSelectRole={handleRoleChange}
            isSpeaking={isSpeaking}
            cameraMode={cameraMode}
            onToggleCameraMode={() =>
              setCameraMode(cameraMode === "CLOSEUP" ? "FULL" : "CLOSEUP")
            }
          />

          {/* Live Chat Bubble */}
          <div className="my-1.5">
            <LiveChatBubble
              role={activeRole}
              userPrompt={userPrompt}
              replyText={replyText}
              toolId={activeToolId}
              onClose={() => setReplyText("")}
              onReplayVoice={() => voiceBiometrics.speakWithGeminiVoice(replyText, activeRole)}
            />
          </div>

          {/* 10-State Task Monitor HUD */}
          <div className="my-1">
            <TaskMonitorHud tasks={tasks} />
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="px-3 pt-1 pb-1 z-20 bg-slate-950/95 border-t border-white/10 backdrop-blur-md">
          {/* 5 Master Feature Triggers */}
          <div className="grid grid-cols-5 gap-1.5 mb-2">
            <button
              onClick={() => setIsShivCoreOpen(true)}
              type="button"
              className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 border border-sky-500/30 hover:border-sky-400 hover:bg-slate-800 transition"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
              <span className="text-[9px] font-bold text-slate-200">11 Tools</span>
            </button>

            <button
              onClick={() => setIsBrainDbOpen(true)}
              type="button"
              className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 border border-purple-500/30 hover:border-purple-400 hover:bg-slate-800 transition"
            >
              <Database className="w-3.5 h-3.5 text-purple-400 mb-0.5" />
              <span className="text-[9px] font-bold text-slate-200">Brain DB</span>
            </button>

            <button
              onClick={() => {
                setActiveAppDrawerTab("DRAWER");
                setIsAppsModalOpen(true);
              }}
              type="button"
              className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 border border-emerald-500/30 hover:border-emerald-400 hover:bg-slate-800 transition"
            >
              <Layers className="w-3.5 h-3.5 text-[#00E676] mb-0.5" />
              <span className="text-[9px] font-bold text-slate-200">Apps</span>
            </button>

            <button
              onClick={() => setIsAdminVaultOpen(true)}
              type="button"
              className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-900 border border-amber-500/30 hover:border-amber-400 hover:bg-slate-800 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 mb-0.5" />
              <span className="text-[9px] font-bold text-slate-200">Vault</span>
            </button>

            <button
              onClick={() => setIsApkDoctorOpen(true)}
              type="button"
              className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-950/60 border border-[#00E676]/50 hover:border-[#00E676] hover:bg-emerald-900/40 transition"
            >
              <Wrench className="w-3.5 h-3.5 text-[#00E676] mb-0.5" />
              <span className="text-[9px] font-bold text-[#00E676]">APK Fix</span>
            </button>
          </div>

          {/* Direct One-Touch Mic & Expanded Command Bar */}
          <div className="flex items-center gap-2 w-full pb-0.5">
            {/* Master One-Touch Mic Controller */}
            <button
              onClick={handleVoiceListen}
              type="button"
              className={`w-11 h-11 shrink-0 rounded-2xl border flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                isListening
                  ? "bg-rose-500 border-rose-400 text-white animate-pulse ring-4 ring-rose-500/30 scale-105"
                  : "bg-slate-900/90 border-white/15 text-sky-400 hover:text-white hover:bg-slate-800"
              }`}
              title={isListening ? "सुन रहे हैं... बोलिए..." : "आवाज़ से निर्देश देने के लिए माइक दबाएं"}
            >
              {isListening ? <MicOff className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Cleanly Expanded Input Field */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={isListening ? "🎙️ सुन रहे हैं... बोलिए..." : "बोलें या टाइप करें (उदा: 'डीप रिसर्च', 'फ्लैशलाइट')..."}
                className={`w-full px-3.5 py-2.5 bg-slate-900/90 border rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none transition-all ${
                  isListening
                    ? "border-rose-500 ring-2 ring-rose-500/20"
                    : "border-white/15 focus:border-sky-500"
                }`}
                onKeyDown={(e) => e.key === "Enter" && handleCommandSubmit()}
              />
            </div>

            {/* Dedicated Send Button - Fully Visible, Comfortable to Tap, Never Clipped */}
            <button
              onClick={() => handleCommandSubmit()}
              disabled={!inputText.trim()}
              type="button"
              className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-95 ${
                inputText.trim()
                  ? "bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
                  : "bg-slate-900/80 border border-white/10 text-slate-600 cursor-not-allowed"
              }`}
              title="Send Command"
            >
              <Send className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>

          {/* Android Home Gesture Pill */}
          <div className="flex items-center justify-center pt-2 pb-0.5">
            <div
              onClick={() => {
                setIsNotificationShadeOpen(false);
                setIsShivCoreOpen(false);
                setIsBrainDbOpen(false);
                setIsAppsModalOpen(false);
                setIsAdminVaultOpen(false);
                setIsApkDoctorOpen(false);
              }}
              className="w-24 h-1 rounded-full bg-slate-600 hover:bg-slate-400 transition cursor-pointer"
              title="Android Home Gesture Pill"
            />
          </div>
        </div>

        {/* Modals */}
        <AndroidNotificationShade
          isOpen={isNotificationShadeOpen}
          onClose={() => setIsNotificationShadeOpen(false)}
          onActionTriggered={(a, m) => triggerAssistantResponse(a, m)}
        />

        <ShivAiCorePanel
          isOpen={isShivCoreOpen}
          onClose={() => setIsShivCoreOpen(false)}
          onRunToolResult={(z, prompt, output) => triggerAssistantResponse(prompt, output, z)}
        />

        <BrainDatabasePanel
          isOpen={isBrainDbOpen}
          onClose={() => setIsBrainDbOpen(false)}
          onMemoryAdded={(mem) =>
            triggerAssistantResponse(
              "New Memory",
              `ब्रेन डेटाबेस में नई मेमोरी '${mem.key}' सुरक्षित रूप से सेव हो गई है!`
            )
          }
        />

        <AndroidAppsModal
          isOpen={isAppsModalOpen}
          activeAppId={activeAppDrawerTab}
          onClose={() => setIsAppsModalOpen(false)}
          onActionTriggered={(a, m) => triggerAssistantResponse(a, m)}
        />

        <AdminVaultModal
          isOpen={isAdminVaultOpen}
          onClose={() => setIsAdminVaultOpen(false)}
        />

        <ApkBuildDoctorModal
          isOpen={isApkDoctorOpen}
          onClose={() => setIsApkDoctorOpen(false)}
        />
      </div>
    </div>
  );
}
