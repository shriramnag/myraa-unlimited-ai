import React, { useState } from "react";
import {
  ArrowLeft,
  KeyRound,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Trash2,
  Loader2,
  Activity,
  Sparkles,
  Wrench,
} from "lucide-react";
import {
  resolveGeminiApiKey,
  saveUserGeminiApiKey,
  validateGeminiApiKey,
  GEMINI_MODELS,
} from "../voice/GeminiConfig";
import { voiceStore, VoiceStoreSnapshot } from "../voice/voiceStore";
import { liveSession } from "../voice/LiveSession";
import { audioPlaybackQueue } from "../voice/AudioPlaybackQueue";
import { ALL_GEMINI_VOICES, PERSONA_THEMES, GeminiVoiceName } from "../config/personas";
import { CharacterRole } from "../types";

interface SettingsPageProps {
  snapshot: VoiceStoreSnapshot;
  onClose: () => void;
  onOpenApkDoctor?: () => void;
}

const ROLE_KEYS: CharacterRole[] = ["MYRAA", "AURA", "PIXEL", "CODEX", "SENTINEL", "SAGE"];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  snapshot,
  onClose,
  onOpenApkDoctor,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(() => resolveGeminiApiKey());
  const [showKey, setShowKey] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{ ok: boolean; text: string } | null>(null);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const handleSaveAndVerifyKey = async () => {
    saveUserGeminiApiKey(apiKeyInput.trim());
    voiceStore.refreshApiKeyStatus();
    setIsTestingKey(true);
    setStatusBanner(null);
    const res = await validateGeminiApiKey(apiKeyInput.trim() || undefined, (msg) =>
      voiceStore.log("INFO", msg)
    );
    setIsTestingKey(false);
    setStatusBanner({
      ok: res.valid,
      text: res.valid
        ? `API Key मान्य है! सक्रिय मॉडल: ${res.workingModel}`
        : `API Key त्रुटि: ${res.error || "अमान्य Key"}`,
    });
  };

  const handleTestSpeakerTone = async () => {
    setStatusBanner(null);
    try {
      await audioPlaybackQueue.playTestSpeakerTone();
      setStatusBanner({
        ok: true,
        text: "440Hz टेस्ट टोन सफलतापूर्वक बजाई गई (Web AudioContext चालू है)।",
      });
    } catch (err: any) {
      setStatusBanner({
        ok: false,
        text: `स्पीकर टेस्ट विफल: ${err?.message || err}`,
      });
    }
  };

  const handleTestGeminiVoice = async () => {
    setStatusBanner(null);
    setIsTestingVoice(true);
    try {
      const theme = PERSONA_THEMES[snapshot.activeRole];
      const ok = await liveSession.speakReadAloud(
        `नमस्ते श्री राम नाग जी, मैं ${theme.name} बोल रही हूँ। मेरी आवाज़ बिल्कुल साफ़ है।`,
        snapshot.activeRole
      );
      if (ok) {
        setStatusBanner({
          ok: true,
          text: `${theme.name} (${voiceStore.getVoiceForRole(snapshot.activeRole)}) की असली Gemini आवाज़ सफलतापूर्वक चली!`,
        });
      }
    } finally {
      setIsTestingVoice(false);
    }
  };

  const handleCopyLogs = async () => {
    const text = snapshot.logs
      .map((l) => `[${l.time}] [${l.level}] ${l.message}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text || "No logs");
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="w-full h-full bg-[#02020a] text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 px-4 border-b border-white/10 flex items-center justify-between bg-slate-950/90 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to main screen"
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-white">सेटिंग्स और डायग्नोस्टिक्स</h1>
        </div>
        {onOpenApkDoctor && (
          <button
            type="button"
            onClick={onOpenApkDoctor}
            className="h-12 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-cyan-300 flex items-center gap-1.5"
          >
            <Wrench className="w-4 h-4" />
            <span>System Info</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {statusBanner && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
              statusBanner.ok
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                : "bg-red-500/15 border-red-500/30 text-red-200"
            }`}
          >
            {statusBanner.ok ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span>{statusBanner.text}</span>
          </div>
        )}

        {/* 1. API Key */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">1. Gemini API Key</h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300">
              {snapshot.hasApiKey ? "Configured" : "Not Set"}
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type={showKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy... (अपनी Gemini API Key यहाँ डालें)"
              className="flex-1 h-12 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="h-12 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200"
            >
              {showKey ? "छुपाएँ" : "दिखाएँ"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAndVerifyKey}
            disabled={isTestingKey}
            className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
          >
            {isTestingKey ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>जाँचा जा रहा है...</span>
              </>
            ) : (
              <span>Save & Check API Key</span>
            )}
          </button>
        </section>

        {/* 2. Audio Diagnostics */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">2. ऑडियो डायग्नोस्टिक्स (Diagnostics)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleTestSpeakerTone}
              className="h-12 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>Test Speaker (440Hz)</span>
            </button>
            <button
              type="button"
              onClick={handleTestGeminiVoice}
              disabled={isTestingVoice}
              className="h-12 px-3.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center justify-center gap-2"
            >
              {isTestingVoice ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>चल रहा है...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Test Gemini Voice</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 3. Character & Voice Picker */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
          <h2 className="text-sm font-bold text-white">3. किरदार और आवाज़ चुनें</h2>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_KEYS.map((role) => {
              const item = PERSONA_THEMES[role];
              const isSelected = snapshot.activeRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => liveSession.switchCharacter(role)}
                  className={`p-3 rounded-xl border text-left transition ${
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-400 text-white"
                      : "bg-slate-950 border-white/10 text-slate-300"
                  }`}
                >
                  <p className="text-xs font-bold">{item.name}</p>
                  <p className="text-xs text-slate-400">
                    Voice: {voiceStore.getVoiceForRole(role)}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {snapshot.activeRole} के लिए Gemini Voice बदलें:
            </label>
            <select
              value={voiceStore.getVoiceForRole(snapshot.activeRole)}
              onChange={(e) =>
                voiceStore.setVoiceForRole(
                  snapshot.activeRole,
                  e.target.value as GeminiVoiceName
                )
              }
              className="w-full h-12 px-3 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
            >
              {ALL_GEMINI_VOICES.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.gender}) — {v.description}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <p className="text-xs font-semibold text-white">Echo Cancellation & Noise Filter</p>
              <p className="text-xs text-slate-400">माइक पर इको और शोर रोकें</p>
            </div>
            <button
              type="button"
              onClick={() => voiceStore.setEchoCancellation(!snapshot.echoCancellation)}
              className={`h-12 px-4 rounded-xl text-xs font-bold transition ${
                snapshot.echoCancellation
                  ? "bg-emerald-500 text-slate-950"
                  : "bg-white/10 text-slate-300"
              }`}
            >
              {snapshot.echoCancellation ? "ON" : "OFF"}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <p className="text-xs font-semibold text-white">Extended Thinking Live Mode</p>
              <p className="text-xs text-slate-400">
                Primary: {GEMINI_MODELS.LIVE_CANDIDATES[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => voiceStore.setExtendedThinking(!snapshot.extendedThinking)}
              className={`h-12 px-4 rounded-xl text-xs font-bold transition ${
                snapshot.extendedThinking
                  ? "bg-cyan-500 text-slate-950"
                  : "bg-white/10 text-slate-300"
              }`}
            >
              {snapshot.extendedThinking ? "ON" : "OFF"}
            </button>
          </div>
        </section>

        {/* 4. 100-line Diagnostic Log Viewer */}
        <section className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold text-white">
                4. लॉग्स ({snapshot.logs.length}/100)
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLogs}
                className="h-12 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedLogs ? "Copied!" : "Copy Logs"}</span>
              </button>
              <button
                type="button"
                onClick={() => voiceStore.clearLogs()}
                aria-label="Clear logs"
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-300 flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-xl bg-slate-950 border border-white/10 p-3 space-y-1.5 font-mono">
            {snapshot.logs.length === 0 ? (
              <p className="text-xs text-slate-500">अभी कोई लॉग एंट्री नहीं है।</p>
            ) : (
              snapshot.logs.map((log) => (
                <div key={log.id} className="text-xs leading-relaxed border-b border-white/5 pb-1">
                  <span className="text-slate-500">[{log.time}]</span>{" "}
                  <span
                    className={
                      log.level === "ERROR"
                        ? "text-red-400 font-bold"
                        : log.level === "WARN"
                        ? "text-amber-300 font-semibold"
                        : "text-cyan-300"
                    }
                  >
                    [{log.level}]
                  </span>{" "}
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
