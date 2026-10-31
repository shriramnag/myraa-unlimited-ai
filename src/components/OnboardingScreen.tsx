import React, { useState } from "react";
import { KeyRound, Mic, Sparkles, CheckCircle2, AlertTriangle, Volume2, Loader2 } from "lucide-react";
import {
  resolveGeminiApiKey,
  saveUserGeminiApiKey,
  hasConfiguredApiKey,
  validateGeminiApiKey,
} from "../voice/GeminiConfig";
import { PERSONA_THEMES } from "../config/personas";
import { CharacterRole } from "../types";
import { liveSession } from "../voice/LiveSession";
import { voiceStore } from "../voice/voiceStore";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const ROLE_KEYS: CharacterRole[] = ["MYRAA", "AURA", "PIXEL", "CODEX", "SENTINEL", "SAGE"];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [apiKeyInput, setApiKeyInput] = useState(() => resolveGeminiApiKey());
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyVerified, setKeyVerified] = useState(() => hasConfiguredApiKey());
  const [keyMessage, setKeyMessage] = useState("");

  const [micGranted, setMicGranted] = useState(false);
  const [micMessage, setMicMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState<CharacterRole>(
    () => voiceStore.getSnapshot().activeRole
  );
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);

  const handleTestAndSaveKey = async () => {
    setKeyMessage("");
    if (apiKeyInput.trim()) {
      saveUserGeminiApiKey(apiKeyInput.trim());
      voiceStore.refreshApiKeyStatus();
    }
    if (!hasConfiguredApiKey()) {
      setKeyVerified(false);
      setKeyMessage("कृपया अपनी Gemini API Key दर्ज करें।");
      return;
    }
    setIsTestingKey(true);
    const res = await validateGeminiApiKey(apiKeyInput.trim() || undefined);
    setIsTestingKey(false);
    setKeyVerified(res.valid);
    setKeyMessage(
      res.valid
        ? `API Key सत्यापित (${res.workingModel})!`
        : res.error || "API Key जाँच विफल रही।"
    );
    if (res.valid) {
      setTimeout(() => setStep(2), 450);
    }
  };

  const handleRequestMic = async () => {
    setMicMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.getTracks().forEach((t) => t.stop());
      setMicGranted(true);
      setMicMessage("माइक्रोफ़ोन अनुमति मिल गई!");
      setTimeout(() => setStep(3), 400);
    } catch {
      setMicGranted(false);
      setMicMessage("माइक्रोफ़ोन अनुमति नहीं मिली। कृपया ब्राउज़र/फ़ोन सेटिंग्स में Mic Allow करें।");
    }
  };

  const handleSelectRole = (role: CharacterRole) => {
    setSelectedRole(role);
    liveSession.switchCharacter(role);
  };

  const handlePreviewGreeting = async () => {
    setIsPreviewingVoice(true);
    try {
      const theme = PERSONA_THEMES[selectedRole];
      await liveSession.speakReadAloud(
        `नमस्ते श्री राम नाग जी, मैं ${theme.name} हूँ। बताइए आज क्या करें?`,
        selectedRole
      );
    } finally {
      setIsPreviewingVoice(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#02020a] text-white flex flex-col justify-between p-5 overflow-y-auto">
      <div className="max-w-md w-full mx-auto my-auto space-y-6 py-4">
        <div className="text-center space-y-2">
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            MYRAA • SHIV AI सेटअप (कदम {step}/3)
          </span>
          <h1 className="text-xl font-bold text-white">नमस्ते श्री राम नाग जी</h1>
          <p className="text-xs sm:text-sm text-slate-400">
            असली आवाज़ और लाइव बातचीत शुरू करने के लिए 3 छोटे कदम पूरे करें
          </p>
        </div>

        {step === 1 && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/15 space-y-4">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <KeyRound className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">1. Gemini API Key जोड़ें</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              मायरा की असली आवाज़ और लाइव बातचीत के लिए अपनी Google Gemini API Key डालें।
            </p>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy... (अपनी Gemini API Key यहाँ पेस्ट करें)"
              className="w-full h-12 px-4 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
            {keyMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  keyVerified
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-300"
                }`}
              >
                {keyVerified ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{keyMessage}</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestAndSaveKey}
                disabled={isTestingKey}
                className="flex-1 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
              >
                {isTestingKey ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Key जाँची जा रही है...</span>
                  </>
                ) : (
                  <span>Key सहेजें और आगे बढ़ें</span>
                )}
              </button>
              {hasConfiguredApiKey() && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="h-12 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
                >
                  आगे बढ़ें
                </button>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/15 space-y-4">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Mic className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">2. माइक्रोफ़ोन की अनुमति दें</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              बिना किसी पॉपअप के सीधे ऐप के अंदर बात करने के लिए माइक्रोफ़ोन की अनुमति दें।
            </p>
            {micMessage && (
              <p className={`text-xs ${micGranted ? "text-emerald-300" : "text-amber-300"}`}>
                {micMessage}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRequestMic}
                className="flex-1 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>माइक अनुमति दें (Allow Mic)</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="h-12 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white"
              >
                छोड़ें
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/15 space-y-4">
            <div className="flex items-center gap-2.5 text-cyan-400">
              <Sparkles className="w-5 h-5" />
              <h2 className="text-base font-bold text-white">3. अपना किरदार और आवाज़ चुनें</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {ROLE_KEYS.map((role) => {
                const item = PERSONA_THEMES[role];
                const isSelected = role === selectedRole;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleSelectRole(role)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 text-white"
                        : "bg-slate-950 border-white/10 text-slate-300"
                    }`}
                  >
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="text-xs text-slate-400">Voice: {item.voiceName}</p>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handlePreviewGreeting}
              disabled={isPreviewingVoice}
              className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              {isPreviewingVoice ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>आवाज़ चल रही है...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>{PERSONA_THEMES[selectedRole].name} की नमस्ते सुनें</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onComplete}
              className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm"
            >
              मायरा शुरू करें
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
