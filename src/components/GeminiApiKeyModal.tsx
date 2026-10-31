import React, { useState, useEffect } from "react";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, X, Volume2, Sparkles, ShieldCheck } from "lucide-react";
import { voiceBiometrics, AVATAR_VOICE_MAP } from "../services/voiceBiometrics";
import { CharacterRole } from "../types";

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: CharacterRole;
  onKeyUpdated: (hasKey: boolean) => void;
}

export const GeminiApiKeyModal: React.FC<GeminiApiKeyModalProps> = ({
  isOpen,
  onClose,
  activeRole,
  onKeyUpdated,
}) => {
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSavedBanner, setIsSavedBanner] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = voiceBiometrics.getApiKey();
      setKeyInput(existing);
      setIsConnected(voiceBiometrics.hasValidApiKey());
      setIsSavedBanner(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    const trimmed = keyInput.trim();
    voiceBiometrics.setApiKey(trimmed);
    const valid = voiceBiometrics.hasValidApiKey();
    setIsConnected(valid);
    setIsSavedBanner(true);
    onKeyUpdated(valid);
    setTimeout(() => setIsSavedBanner(false), 3000);
  };

  const handleTestVoice = () => {
    const trimmed = keyInput.trim();
    if (trimmed) {
      voiceBiometrics.setApiKey(trimmed);
      const valid = voiceBiometrics.hasValidApiKey();
      setIsConnected(valid);
      onKeyUpdated(valid);
    }
    const voiceMeta = AVATAR_VOICE_MAP[activeRole] || AVATAR_VOICE_MAP.MYRAA;
    voiceBiometrics.speakWithGeminiVoice(
      `नमस्ते श्री राम नाग जी! Google Gemini ${voiceMeta.voiceName} आवाज़ सफलतापूर्वक कनेक्ट हो गई है।`,
      activeRole
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/95 border border-sky-500/30 shadow-2xl p-5 text-white overflow-hidden">
        {/* Subtle Top Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5">
                <span>Gemini API Key Settings</span>
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              </h3>
              <p className="text-[10px] text-slate-400">
                6 Realistic Avatar Voices (Kore • Aoede • Despina • Puck • Fenrir • Charon)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Chip Row */}
        <div className="mt-3.5 flex items-center justify-between px-3 py-2 rounded-2xl bg-slate-950/80 border border-white/10">
          <span className="text-[11px] font-medium text-slate-300">Voice Pipeline Status:</span>
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Active / Connected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Key Not Set (Fallback Mode)
            </span>
          )}
        </div>

        {/* Polite Inline Prompt when no key is entered yet */}
        {!isConnected && (
          <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 leading-relaxed">
            कृपया अपनी Google Gemini API Key दर्ज करें ताकि सभी 6 कैरेक्टर्स की असली आवाज़ (Kore, Aoede, Despina, Puck, Fenrir, Charon) तुरंत चालू हो सके।
          </div>
        )}

        {/* Password-Masked Input Box with Eye Toggle */}
        <div className="mt-4">
          <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
            Enter Google Gemini API Key
          </label>
          <div className="relative flex items-center">
            <input
              type={showKey ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Enter Google Gemini API Key (AIzaSy...)"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-white/15 focus:border-sky-400 text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2.5 p-1.5 text-slate-400 hover:text-white transition"
              title={showKey ? "Hide API Key" : "Show API Key"}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>यह कुंजी आपके डिवाइस के लोकल स्टोरेज ('GEMINI_API_KEY') में सुरक्षित रहती है।</span>
          </p>
        </div>

        {/* Saved Confirmation Toast */}
        {isSavedBanner && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>GEMINI_API_KEY सुरक्षित रूप से सेव हो गई है!</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSaveKey}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg transition active:scale-95"
          >
            Save Key
          </button>

          <button
            type="button"
            onClick={handleTestVoice}
            className="py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/15 text-sky-300 font-semibold text-xs flex items-center gap-1.5 transition active:scale-95"
            title="Test Realistic Gemini Voice"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Voice</span>
          </button>
        </div>
      </div>
    </div>
  );
};
