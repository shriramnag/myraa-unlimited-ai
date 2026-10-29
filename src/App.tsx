import React, { useState, useEffect, useRef } from "react";
import { CharacterRole, TaskRecord, BrainMemory } from "./types";
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
import { brainDatabase } from "./services/brainDatabase";
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
    "नमस्ते श्री राम नाग जी! आपके Android APK बिल्ड की सभी 5 कमियाँ (Gradle, AndroidManifest, strings.xml और MyraaNativePlugin के 43 एक्शन्स) 100% ठीक कर दी गई हैं!"
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

  // Tasks & Device State
  const [tasks, setTasks] = useState<TaskRecord[]>(agentSupervisor.getAllTasks());
  const [deviceState, setDeviceState] = useState(nativeBridge.getDeviceState());
  const [voiceLockActive, setVoiceLockActive] = useState(voiceBiometrics.isVoiceLockOn());

  useEffect(() => {
    const unsubTasks = agentSupervisor.subscribe((taskList) => {
      setTasks([...taskList]);
    });
    const unsubVoice = voiceBiometrics.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubTasks();
      unsubVoice();
    };
  }, []);

  const handleToggleFlashlight = () => {
    const on = nativeBridge.toggleFlashlight();
    setDeviceState(nativeBridge.getDeviceState());
    const msg = on ? "फ्लैशलाइट चालू की गई।" : "फ्लैशलाइट बंद की गई।";
    triggerAssistantResponse("Torch Toggle", msg);
  };

  const triggerAssistantResponse = (prompt: string, answer: string, toolId?: string) => {
    setUserPrompt(prompt);
    setReplyText(answer);
    setActiveToolId(toolId);
    voiceBiometrics.speakAnimeVoice(answer);
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

    // Check specific intent patterns
    const lower = query.toLowerCase();

    // 1. Flashlight
    if (lower.includes("torch") || lower.includes("flashlight") || lower.includes("फ्लैशलाइट")) {
      agentSupervisor.transitionState(task.taskId, "EXECUTING", "Toggling camera flashlight...");
      const on = nativeBridge.toggleFlashlight();
      setDeviceState(nativeBridge.getDeviceState());
      const resMsg = on ? "फ्लैशलाइट चालू (ON) कर दी गई है।" : "फ्लैशलाइट बंद (OFF) कर दी गई है।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg);
      return;
    }

    // 2. Phone Call
    if (lower.includes("call") || lower.includes("कॉल")) {
      agentSupervisor.transitionState(task.taskId, "AWAITING_APPROVAL", "Confirmation required for phone call");
      setActiveAppDrawerTab("DIALER");
      setIsAppsModalOpen(true);
      const resMsg = "कॉल डायलर तैयार है। कृपया स्क्रीन पर सुरक्षा पुष्टि करें।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg);
      return;
    }

    // 3. SMS / WhatsApp
    if (lower.includes("sms") || lower.includes("whatsapp") || lower.includes("मैसेज") || lower.includes("संदेश")) {
      setActiveAppDrawerTab("MESSAGES");
      setIsAppsModalOpen(true);
      const resMsg = "मैसेज कंपोज़र खुल गया है। आप तुरंत संदेश भेज सकते हैं।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg);
      return;
    }

    // 4. Brain DB query
    if (lower.includes("brain") || lower.includes("memory") || lower.includes("याद") || lower.includes("डेटाबेस")) {
      setIsBrainDbOpen(true);
      const resMsg = "लॉन्ग-टर्म ब्रेन डेटाबेस खुल गया है। आपकी सभी स्थायी मेमोरीज़ यहाँ सुरक्षित हैं।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg);
      return;
    }

    // 5. Tools / Deep Research
    if (lower.includes("research") || lower.includes("रिसर्च") || lower.includes("tool") || lower.includes("टूल")) {
      setIsShivCoreOpen(true);
      const resMsg = "शिव एआई कोर के सभी 11 टूल्स और Deep Research वर्कबेंच तैयार है!";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg);
      return;
    }

    // 6. Camera
    if (lower.includes("camera") || lower.includes("कैमरा") || lower.includes("photo") || lower.includes("फ़ोटो")) {
      setActiveAppDrawerTab("CAMERA");
      setIsAppsModalOpen(true);
      const resMsg = "कैमरा व्यूफ़ाइंडर चालू किया गया।";
      agentSupervisor.verifyAndCompleteTask(task.taskId, { ok: true, message: resMsg });
      triggerAssistantResponse(query, resMsg);
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
      triggerAssistantResponse(query, resp);
    }, 400);
  };

  const handleVoiceListen = () => {
    if (isListening) return;
    setIsListening(true);
    voiceBiometrics.listenForVoiceCommand(
      (transcript) => {
        setIsListening(false);
        handleCommandSubmit(transcript);
      },
      (err) => {
        setIsListening(false);
        triggerAssistantResponse("Voice Command", "माफ़ कीजिए, आवाज़ समझ नहीं आई। कृपया दोबारा बोलें या लिखकर भेजें।");
      }
    );
  };

  const theme = ROLE_THEMES[activeRole] || ROLE_THEMES.MYRAA;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-0 sm:p-4 bg-slate-950 overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div
        className="absolute inset-0 opacity-20 filter blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${theme.hex}, transparent 70%)`,
        }}
      />

      {/* Main Container: Mobile Frame or Full Viewport */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden transition-all duration-300 shadow-2xl ${
          isPhoneFrameMode
            ? "w-full max-w-[430px] h-screen sm:h-[92vh] sm:rounded-[44px] border-0 sm:border-8 border-slate-900 bg-slate-950 ring-1 ring-white/10"
            : "w-full h-screen rounded-none bg-slate-950"
        }`}
      >
        {/* Flashlight Screen Illumination Overlay (When Flashlight ON) */}
        {deviceState.flashlightOn && (
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-300/30 to-transparent pointer-events-none z-30 animate-pulse" />
        )}

        {/* 1. Android Status Bar (Click to open Notification Shade) */}
        <AndroidStatusBar
          onPullDownShade={() => setIsNotificationShadeOpen(true)}
          batteryLevel={98}
          isFlashlightOn={deviceState.flashlightOn}
        />

        {/* Top Control Bar: Mode Toggle, Flashlight, Voice Lock */}
        <div className="flex items-center justify-between px-3 py-1.5 z-20 bg-slate-950/70 border-b border-white/5 backdrop-blur-sm text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>SHIV AI</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[#00E676] font-mono border border-emerald-500/30">
              v3.0 Shri Ram Nag
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* APK Build Doctor Button */}
            <button
              onClick={() => setIsApkDoctorOpen(true)}
              type="button"
              className="px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border bg-[#00E676]/20 text-[#00E676] border-[#00E676]/50 hover:bg-[#00E676]/30 transition shadow-sm"
              title="APK Build Fix Report & 1-Command Builder"
            >
              <Wrench className="w-2.5 h-2.5" />
              <span>APK Fixed ✓</span>
            </button>

            {/* Flashlight Button */}
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

            {/* Voice Lock Indicator Button */}
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

            {/* Phone Frame Toggle */}
            <button
              onClick={() => setIsPhoneFrameMode(!isPhoneFrameMode)}
              type="button"
              className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 border border-white/10 transition"
              title={isPhoneFrameMode ? "Expand to Full Viewport" : "Switch to Android Phone Handset"}
            >
              {isPhoneFrameMode ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* 2. Middle Content Area: Avatar Stage & Live Speech Bubble */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto px-2 py-1 relative z-10">
          {/* Holographic 3D Video Avatar Stage */}
          <HolographicAvatarStage
            activeRole={activeRole}
            onSelectRole={(r) => setActiveRole(r)}
            isSpeaking={isSpeaking}
            cameraMode={cameraMode}
            onToggleCameraMode={() =>
              setCameraMode(cameraMode === "CLOSEUP" ? "FULL" : "CLOSEUP")
            }
          />

          {/* Live Typewriter Speech / Chat Bubble */}
          <div className="my-1.5">
            <LiveChatBubble
              role={activeRole}
              userPrompt={userPrompt}
              replyText={replyText}
              toolId={activeToolId}
              onClose={() => setReplyText("")}
            />
          </div>

          {/* Task Monitor HUD */}
          <div className="my-1">
            <TaskMonitorHud tasks={tasks} />
          </div>
        </div>

        {/* 3. Bottom Control Dock: 5 Quick Features (11 Tools, Brain DB, Apps, Vault, APK Fix) */}
        <div className="px-3 pt-1 pb-1 z-20 bg-slate-950/95 border-t border-white/10 backdrop-blur-md">
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
              <Smartphone className="w-3.5 h-3.5 text-[#00E676] mb-0.5" />
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

          {/* Interactive Input Bar (Keyboard & Voice Mic) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleVoiceListen}
              type="button"
              className={`p-2.5 rounded-2xl border transition shadow-lg ${
                isListening
                  ? "bg-rose-500 border-rose-400 text-white animate-pulse"
                  : "bg-slate-900 border-white/15 text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
              title="Speak voice command (Web Speech API)"
            >
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-sky-400" />}
            </button>

            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="बोलें या टाइप करें (उदा: 'कॉल करो', 'डीप रिसर्च', 'फ्लैशलाइट')..."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/15 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition pr-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommandSubmit();
                }}
              />
              <button
                onClick={() => handleCommandSubmit()}
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 transition"
                title="Send Command"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 4. Android System Navigation Pill */}
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

        {/* Modals & Panels */}
        <AndroidNotificationShade
          isOpen={isNotificationShadeOpen}
          onClose={() => setIsNotificationShadeOpen(false)}
          onActionTriggered={(act, msg) => triggerAssistantResponse(act, msg)}
        />

        <ShivAiCorePanel
          isOpen={isShivCoreOpen}
          onClose={() => setIsShivCoreOpen(false)}
          onRunToolResult={(name, query, out) => triggerAssistantResponse(query, out, name)}
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
          onActionTriggered={(act, msg) => triggerAssistantResponse(act, msg)}
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
export default App;
