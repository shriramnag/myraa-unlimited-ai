import React, { useState, useEffect } from "react";
import { PERSONA_THEMES } from "./config/personas";
import { CharacterRole, TaskRecord } from "./types";
import { HolographicAvatarStage } from "./components/HolographicAvatarStage";
import { TaskMonitorHud } from "./components/TaskMonitorHud";
import { ShivAiCorePanel } from "./components/ShivAiCorePanel";
import { BrainDatabasePanel } from "./components/BrainDatabasePanel";
import { AndroidAppsModal } from "./components/AndroidAppsModal";
import { AdminVaultModal } from "./components/AdminVaultModal";
import { ApkBuildDoctorModal } from "./components/ApkBuildDoctorModal";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { SettingsPage } from "./components/SettingsPage";
import { agentSupervisor } from "./services/agentSupervisor";
import { liveSession } from "./voice/LiveSession";
import { VoiceEngineState, VoiceStoreSnapshot, voiceStore } from "./voice/voiceStore";
import {
  Mic,
  Square,
  Loader2,
  Send,
  Settings,
  Keyboard,
  LayoutGrid,
  Volume2,
  Database,
  Cpu,
  Smartphone,
  ShieldCheck,
  Activity,
  Terminal,
  PhoneCall,
  X,
  AlertTriangle,
  MessageSquareText,
} from "lucide-react";

const STATE_PILL_CONFIG: Record<
  VoiceEngineState,
  { label: string; dotColor: string; pillStyle: string }
> = {
  IDLE: {
    label: "Idle",
    dotColor: "bg-slate-400",
    pillStyle: "bg-slate-900/90 text-slate-200 border-white/15",
  },
  CONNECTING: {
    label: "Connecting",
    dotColor: "bg-amber-400 animate-ping",
    pillStyle: "bg-amber-950/70 text-amber-200 border-amber-500/40",
  },
  LISTENING: {
    label: "Listening",
    dotColor: "bg-emerald-400 animate-pulse",
    pillStyle: "bg-emerald-950/70 text-emerald-200 border-emerald-500/40",
  },
  THINKING: {
    label: "Thinking",
    dotColor: "bg-purple-400 animate-ping",
    pillStyle: "bg-purple-950/70 text-purple-200 border-purple-500/40",
  },
  SPEAKING: {
    label: "Speaking",
    dotColor: "bg-sky-400 animate-pulse",
    pillStyle: "bg-sky-950/70 text-sky-200 border-sky-500/40",
  },
  ERROR: {
    label: "Error",
    dotColor: "bg-rose-500",
    pillStyle: "bg-rose-950/80 text-rose-200 border-rose-500/50",
  },
};

const ROLE_ORDER: CharacterRole[] = ["MYRAA", "AURA", "PIXEL", "CODEX", "SENTINEL", "SAGE"];

export function App() {
  const [snapshot, setSnapshot] = useState<VoiceStoreSnapshot>(() => voiceStore.getSnapshot());
  const [cameraMode, setCameraMode] = useState<"CLOSEUP" | "FULL">("CLOSEUP");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [inputText, setInputText] = useState("");

  // Sheets & Pages
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isTranscriptSheetOpen, setIsTranscriptSheetOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShivCoreOpen, setIsShivCoreOpen] = useState(false);
  const [isBrainDbOpen, setIsBrainDbOpen] = useState(false);
  const [isAppsModalOpen, setIsAppsModalOpen] = useState(false);
  const [activeAppDrawerTab, setActiveAppDrawerTab] = useState<string | null>("DRAWER");
  const [isAdminVaultOpen, setIsAdminVaultOpen] = useState(false);
  const [isApkDoctorOpen, setIsApkDoctorOpen] = useState(false);
  const [isTaskMonitorSheetOpen, setIsTaskMonitorSheetOpen] = useState(false);

  const [tasks, setTasks] = useState<TaskRecord[]>(() => agentSupervisor.getAllTasks());

  useEffect(() => {
    const unsubVoice = voiceStore.subscribe((snap) => {
      setSnapshot(snap);
      if (snap.requestedPanel) {
        const panel = snap.requestedPanel;
        voiceStore.requestPanel(null);
        setIsMoreSheetOpen(false);
        if (panel === "brain") setIsBrainDbOpen(true);
        else if (panel === "apps") setIsAppsModalOpen(true);
        else if (panel === "vault") setIsAdminVaultOpen(true);
        else if (panel === "settings" || panel === "diagnostics") setIsSettingsOpen(true);
        else if (panel === "tools") setIsShivCoreOpen(true);
        else if (panel === "tasks") setIsTaskMonitorSheetOpen(true);
      }
    });

    const unsubTasks = agentSupervisor.subscribe((list) => {
      setTasks([...list]);
    });

    return () => {
      unsubVoice();
      unsubTasks();
    };
  }, []);

  const currentTheme = PERSONA_THEMES[snapshot.activeRole] || PERSONA_THEMES.MYRAA;
  const currentVoiceName = voiceStore.getVoiceForRole(snapshot.activeRole);
  const stateConfig = STATE_PILL_CONFIG[snapshot.state] || STATE_PILL_CONFIG.IDLE;

  const handlePrimaryVoiceButton = async () => {
    await liveSession.toggleVoiceSession();
  };

  const handleSendTyped = async () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    setInputText("");
    await liveSession.sendTypedMessage(trimmed);
  };

  const handleCharacterSelect = async (role: CharacterRole) => {
    await liveSession.switchCharacter(role);
  };

  const handleErrorAction = () => {
    const err = snapshot.errorInfo;
    if (!err) return;
    if (err.actionType === "OPEN_SETTINGS") {
      voiceStore.clearError();
      setIsSettingsOpen(true);
    } else {
      voiceStore.clearError();
      liveSession.startVoiceSession();
    }
  };

  return (
    <div className="relative w-full h-[100dvh] flex items-center justify-center bg-[#02020a] overflow-hidden font-sans">
      {/* Ambient Radial Accent Glow */}
      <div
        className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${currentTheme.hex}, transparent 70%)`,
        }}
      />

      {/* Responsive Mobile-First Container (cosmetic frame only >768px) */}
      <div className="relative w-full h-[100dvh] md:max-w-[430px] md:h-[94dvh] md:rounded-[40px] md:border-4 md:border-slate-800 bg-[#02020a] flex flex-col justify-between overflow-hidden shadow-2xl">
        {!snapshot.onboardingDone ? (
          <OnboardingScreen onComplete={() => voiceStore.setOnboardingDone(true)} />
        ) : isSettingsOpen ? (
          <SettingsPage
            snapshot={snapshot}
            onClose={() => setIsSettingsOpen(false)}
            onOpenApkDoctor={() => setIsApkDoctorOpen(true)}
          />
        ) : (
          <>
            {/* 1. Top Bar (56px) */}
            <header className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-slate-950/80 backdrop-blur-md z-20 shrink-0">
              {/* Left: MYRAA wordmark + small version */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-extrabold tracking-tight text-white">MYRAA</span>
                <span className="text-xs font-mono text-sky-400">v7.0.65</span>
              </div>

              {/* Center: State Pill with colored dot */}
              <div
                className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-2 transition ${stateConfig.pillStyle}`}
              >
                <span className={`w-2 h-2 rounded-full ${stateConfig.dotColor}`} />
                <span>{stateConfig.label}</span>
              </div>

              {/* Right: Settings gear (>=48px tap target) */}
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Open Settings"
                className="min-w-[48px] min-h-[48px] -mr-2 rounded-2xl text-slate-200 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
              >
                <Settings className="w-5 h-5" />
              </button>
            </header>

            {/* 2. Main Stage & Captions Area */}
            <main className="flex-1 flex flex-col justify-between min-h-0 overflow-hidden py-1 z-10">
              {/* Avatar Stage (~55% height) */}
              <div className="h-[54%] min-h-[220px] w-full shrink-0">
                <HolographicAvatarStage
                  activeRole={snapshot.activeRole}
                  voiceState={snapshot.state}
                  voiceName={currentVoiceName}
                  micLevel={snapshot.micLevel}
                  outputWaveform={snapshot.outputWaveform}
                  cameraMode={cameraMode}
                  onToggleCameraMode={() =>
                    setCameraMode(cameraMode === "CLOSEUP" ? "FULL" : "CLOSEUP")
                  }
                />
              </div>

              {/* Friendly Hindi Error Banner (if error active) */}
              {snapshot.errorInfo && (
                <div className="mx-3 my-1 p-3 rounded-2xl bg-rose-950/90 border border-rose-500/50 flex items-center justify-between gap-2 shadow-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                    <span className="text-xs text-rose-100 leading-relaxed">
                      {snapshot.errorInfo.hindiMessage}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleErrorAction}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold shrink-0 transition"
                  >
                    {snapshot.errorInfo.actionLabel}
                  </button>
                </div>
              )}

              {/* Captions Box (Tap opens full transcript sheet) */}
              <div className="px-3 my-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTranscriptSheetOpen(true)}
                  className="flex-1 text-left p-3 rounded-2xl bg-slate-900/75 hover:bg-slate-900 border border-white/10 transition space-y-1 min-h-[76px]"
                >
                  {snapshot.userCaption && (
                    <div className="text-xs text-slate-400 truncate leading-relaxed">
                      आप: {snapshot.userCaption}
                    </div>
                  )}
                  <div className="text-[18px] font-medium text-white leading-[1.5] line-clamp-2">
                    {snapshot.assistantCaption}
                  </div>
                </button>

                {/* Replay TTS Button (>=48px tap target) */}
                <button
                  type="button"
                  onClick={() =>
                    liveSession.speakReadAloud(snapshot.assistantCaption, snapshot.activeRole)
                  }
                  aria-label="Replay Assistant Voice"
                  title="आवाज़ दोबारा सुनें"
                  className="min-w-[48px] min-h-[48px] rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-sky-400 flex items-center justify-center shrink-0 transition"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* 3. Character Switcher: One row of six 44px+ avatar chips above dock */}
              <div className="px-3 pt-1">
                <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-1 scrollbar-none">
                  {ROLE_ORDER.map((role) => {
                    const item = PERSONA_THEMES[role];
                    const isSelected = snapshot.activeRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleCharacterSelect(role)}
                        className={`min-h-[48px] px-2.5 py-1.5 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-md"
                            : "bg-slate-950/80 text-slate-300 hover:text-white border-white/10"
                        }`}
                        style={{
                          borderColor: isSelected ? item.hex : "rgba(255,255,255,0.1)",
                          boxShadow: isSelected ? `0 0 14px ${item.hex}40` : "none",
                        }}
                      >
                        <img
                          src={item.thumb}
                          alt={item.name}
                          className="w-6 h-6 rounded-full object-cover border border-white/20"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </main>

            {/* 4. Optional Keyboard Input Bar above Dock */}
            {isKeyboardOpen && (
              <div className="px-3 py-2 bg-slate-950 border-t border-white/10 flex items-center gap-2 z-20">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="संदेश टाइप करें (Gemini अपनी आवाज़ में जवाब देगा)..."
                  className="flex-1 min-h-[48px] px-3.5 py-2 bg-slate-900 border border-white/15 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400"
                  onKeyDown={(e) => e.key === "Enter" && handleSendTyped()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSendTyped}
                  disabled={!inputText.trim()}
                  aria-label="Send message"
                  className="min-w-[48px] min-h-[48px] rounded-2xl bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold flex items-center justify-center transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* 5. Bottom Dock: Left 48px Keyboard | Center 72px Primary Voice Button | Right 48px More */}
            <footer className="px-6 py-3 bg-slate-950/95 border-t border-white/10 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
              {/* Left 48px Keyboard Toggle */}
              <button
                type="button"
                onClick={() => setIsKeyboardOpen(!isKeyboardOpen)}
                aria-label="Toggle Keyboard Input"
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition ${
                  isKeyboardOpen
                    ? "bg-sky-500/20 border-sky-400 text-sky-300"
                    : "bg-slate-900 border-white/15 text-slate-200 hover:text-white"
                }`}
              >
                <Keyboard className="w-5 h-5" />
              </button>

              {/* Center 72px Primary Voice Button */}
              <button
                type="button"
                onClick={handlePrimaryVoiceButton}
                aria-label={
                  snapshot.state === "LISTENING" || snapshot.state === "SPEAKING"
                    ? "Stop Voice Session"
                    : "Start Voice Session"
                }
                className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all shadow-2xl active:scale-95 ${
                  snapshot.state === "LISTENING" || snapshot.state === "SPEAKING"
                    ? "bg-rose-500 hover:bg-rose-400 text-white ring-4 ring-rose-500/30 animate-pulse"
                    : snapshot.state === "CONNECTING" || snapshot.state === "THINKING"
                    ? "bg-purple-600 text-white ring-4 ring-purple-500/30"
                    : "bg-gradient-to-tr from-sky-500 to-emerald-400 hover:from-sky-400 hover:to-emerald-300 text-slate-950"
                }`}
              >
                {snapshot.state === "CONNECTING" || snapshot.state === "THINKING" ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : snapshot.state === "LISTENING" || snapshot.state === "SPEAKING" ? (
                  <Square className="w-7 h-7 fill-current" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              {/* Right 48px More Button */}
              <button
                type="button"
                onClick={() => setIsMoreSheetOpen(true)}
                aria-label="Open More Features Sheet"
                className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/15 text-slate-200 hover:text-white flex items-center justify-center transition"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </footer>
          </>
        )}

        {/* Single "More" Bottom Sheet (Tools, Brain DB, Apps, Vault, Task Monitor, Diagnostics) */}
        {isMoreSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-[460px] bg-slate-900 border-t border-white/15 rounded-t-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-white">MYRAA Hub & Tools</div>
                  <div className="text-xs text-slate-300">
                    ओनर: श्री राम नाग (Shri Ram Nag)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMoreSheetOpen(false)}
                  aria-label="Close More Sheet"
                  className="min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    setIsShivCoreOpen(true);
                  }}
                  className="min-h-[64px] p-3.5 rounded-2xl bg-slate-950 border border-sky-500/30 hover:border-sky-400 flex items-center gap-3 text-left transition"
                >
                  <Cpu className="w-6 h-6 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">Tools & YT</div>
                    <div className="text-xs text-slate-300">Research & Creator</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    setIsBrainDbOpen(true);
                  }}
                  className="min-h-[64px] p-3.5 rounded-2xl bg-slate-950 border border-purple-500/30 hover:border-purple-400 flex items-center gap-3 text-left transition"
                >
                  <Database className="w-6 h-6 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">Brain DB</div>
                    <div className="text-xs text-slate-300">On-Device Memory</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    setActiveAppDrawerTab("DRAWER");
                    setIsAppsModalOpen(true);
                  }}
                  className="min-h-[64px] p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 flex items-center gap-3 text-left transition"
                >
                  <Smartphone className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">Apps & Dialer</div>
                    <div className="text-xs text-slate-300">Android Actions</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    setIsAdminVaultOpen(true);
                  }}
                  className="min-h-[64px] p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-400 flex items-center gap-3 text-left transition"
                >
                  <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">Admin Vault</div>
                    <div className="text-xs text-slate-300">Audit & Shield</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    setIsTaskMonitorSheetOpen(true);
                  }}
                  className="min-h-[64px] p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-400 flex items-center gap-3 text-left transition"
                >
                  <Activity className="w-6 h-6 text-indigo-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">Task Monitor</div>
                    <div className="text-xs text-slate-300">{tasks.length} Tasks</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="min-h-[64px] p-3.5 rounded-2xl bg-slate-950 border border-teal-500/30 hover:border-teal-400 flex items-center gap-3 text-left transition"
                >
                  <Terminal className="w-6 h-6 text-teal-400 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">Diagnostics</div>
                    <div className="text-xs text-slate-300">Audio & Logs</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Transcript Sheet (when user taps captions) */}
        {isTranscriptSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-[480px] max-h-[82vh] flex flex-col bg-slate-900 border-t border-white/15 rounded-t-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MessageSquareText className="w-5 h-5 text-sky-400" />
                  <span className="text-base font-bold text-white">Live Voice Transcript</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTranscriptSheetOpen(false)}
                  aria-label="Close Transcript"
                  className="min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {snapshot.transcript.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border text-sm leading-relaxed ${
                      item.sender === "user"
                        ? "bg-slate-950 border-white/10 text-slate-200 ml-6"
                        : "bg-sky-950/40 border-sky-500/30 text-white mr-4"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-bold">
                        {item.sender === "user" ? "आप" : item.role || "MYRAA"}
                      </span>
                      <span className="font-mono">{item.timestamp}</span>
                    </div>
                    <div>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Task Monitor Sheet */}
        {isTaskMonitorSheetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-[480px] bg-slate-900 border border-white/15 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white">10-State Agent Supervisor</span>
                <button
                  type="button"
                  onClick={() => setIsTaskMonitorSheetOpen(false)}
                  aria-label="Close Task Monitor"
                  className="min-w-[48px] min-h-[48px] rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <TaskMonitorHud tasks={tasks} defaultExpanded={true} />
            </div>
          </div>
        )}

        {/* On-Screen Call Confirmation Dialog (Mandatory before any call) */}
        {snapshot.pendingCall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="w-full max-w-[360px] bg-slate-900 border border-emerald-500/50 rounded-3xl p-5 space-y-4 shadow-2xl text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <PhoneCall className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold text-white">कॉल की पुष्टि करें</div>
                <div className="text-sm text-slate-300 leading-relaxed">
                  क्या आप{" "}
                  <span className="font-bold text-white">
                    {snapshot.pendingCall.contactName
                      ? `${snapshot.pendingCall.contactName} (${snapshot.pendingCall.phoneNumber})`
                      : snapshot.pendingCall.phoneNumber}
                  </span>{" "}
                  के लिए डायलर खोलना चाहते हैं?
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={snapshot.pendingCall.onCancel}
                  className="flex-1 min-h-[48px] py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold transition"
                >
                  रद्द करें
                </button>
                <button
                  type="button"
                  onClick={snapshot.pendingCall.onConfirm}
                  className="flex-1 min-h-[48px] py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold transition"
                >
                  हाँ, कॉल करें
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feature Modals */}
        <ShivAiCorePanel
          isOpen={isShivCoreOpen}
          onClose={() => setIsShivCoreOpen(false)}
          onRunToolResult={(toolName, prompt, output) => {
            voiceStore.setUserCaption(prompt, true);
            voiceStore.setAssistantCaption(output, { isFinal: true, toolBadge: toolName });
            liveSession.speakReadAloud(output.slice(0, 280), snapshot.activeRole);
          }}
        />

        <BrainDatabasePanel
          isOpen={isBrainDbOpen}
          onClose={() => setIsBrainDbOpen(false)}
          onMemoryAdded={(mem) => {
            const msg = `ब्रेन डेटाबेस में नई मेमोरी '${mem.key}' सुरक्षित रूप से सेव हो गई है।`;
            voiceStore.setAssistantCaption(msg, { isFinal: true });
          }}
        />

        <AndroidAppsModal
          isOpen={isAppsModalOpen}
          activeAppId={activeAppDrawerTab}
          onClose={() => setIsAppsModalOpen(false)}
          onActionTriggered={(action, msg) => {
            voiceStore.setUserCaption(action, true);
            voiceStore.setAssistantCaption(msg, { isFinal: true });
          }}
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
