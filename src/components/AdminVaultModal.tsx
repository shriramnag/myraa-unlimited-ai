import React, { useState, useEffect } from "react";
import { X, Lock, ShieldCheck, KeyRound, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  resolveGeminiApiKey,
  saveUserGeminiApiKey,
  validateGeminiApiKey,
} from "../voice/GeminiConfig";
import { voiceStore } from "../voice/voiceStore";

interface AdminVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PASSCODE_HASH_KEY = "MYRAA_ADMIN_PASSCODE_SHA256";
const VAULT_SECRETS_KEY = "MYRAA_VAULT_SECRETS_V2";

interface VaultSecretItem {
  id: string;
  label: string;
  value: string;
  updatedAt: number;
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const AdminVaultModal: React.FC<AdminVaultModalProps> = ({ isOpen, onClose }) => {
  const [hasExistingPasscode, setHasExistingPasscode] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [confirmPasscodeInput, setConfirmPasscodeInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState<string>("");
  const [isTestingKey, setIsTestingKey] = useState(false);

  const [secrets, setSecrets] = useState<VaultSecretItem[]>([]);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const savedHash = localStorage.getItem(PASSCODE_HASH_KEY);
    setHasExistingPasscode(Boolean(savedHash));
    setIsUnlocked(false);
    setPasscodeInput("");
    setConfirmPasscodeInput("");
    setAuthError("");
    setGeminiKeyInput(resolveGeminiApiKey());
    setKeyStatus("");

    try {
      const raw = localStorage.getItem(VAULT_SECRETS_KEY);
      if (raw) {
        setSecrets(JSON.parse(raw));
      }
    } catch {
      setSecrets([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSetupPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (passcodeInput.trim().length < 4) {
      setAuthError("पासकोड कम से कम 4 अक्षरों या अंकों का होना चाहिए।");
      return;
    }
    if (passcodeInput.trim() !== confirmPasscodeInput.trim()) {
      setAuthError("दोनों पासकोड मेल नहीं खा रहे हैं।");
      return;
    }
    const hash = await sha256Hex(passcodeInput);
    localStorage.setItem(PASSCODE_HASH_KEY, hash);
    setHasExistingPasscode(true);
    setIsUnlocked(true);
    setPasscodeInput("");
    setConfirmPasscodeInput("");
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const savedHash = localStorage.getItem(PASSCODE_HASH_KEY);
    if (!savedHash) {
      setHasExistingPasscode(false);
      return;
    }
    const inputHash = await sha256Hex(passcodeInput);
    if (inputHash === savedHash) {
      setIsUnlocked(true);
      setPasscodeInput("");
    } else {
      setAuthError("गलत पासकोड। कृपया सही पासकोड डालें।");
    }
  };

  const handleSaveGeminiKey = async () => {
    saveUserGeminiApiKey(geminiKeyInput.trim());
    voiceStore.refreshApiKeyStatus();
    setIsTestingKey(true);
    setKeyStatus("जाँचा जा रहा है...");
    const res = await validateGeminiApiKey(geminiKeyInput.trim() || undefined);
    setIsTestingKey(false);
    setKeyStatus(
      res.valid
        ? `सफलतापूर्वक जुड़ा (${res.workingModel})!`
        : `त्रुटि: ${res.error || "API Key अमान्य है।"}`
    );
  };

  const handleAddSecret = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newValue.trim()) return;
    const updated: VaultSecretItem[] = [
      ...secrets,
      {
        id: `sec_${Date.now()}`,
        label: newLabel.trim(),
        value: newValue.trim(),
        updatedAt: Date.now(),
      },
    ];
    setSecrets(updated);
    localStorage.setItem(VAULT_SECRETS_KEY, JSON.stringify(updated));
    setNewLabel("");
    setNewValue("");
  };

  const handleDeleteSecret = (id: string) => {
    const updated = secrets.filter((s) => s.id !== id);
    setSecrets(updated);
    localStorage.setItem(VAULT_SECRETS_KEY, JSON.stringify(updated));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">सुरक्षित एडमिन वॉल्ट (Admin Vault)</h2>
              <p className="text-xs text-slate-400">SHA-256 एन्क्रिप्टेड पासकोड सुरक्षा</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Admin Vault"
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {!hasExistingPasscode ? (
            <form onSubmit={handleSetupPasscode} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200">
                पहली बार उपयोग: कृपया अपने वॉल्ट के लिए एक नया पासकोड बनाएँ। यह पासकोड केवल आपके डिवाइस पर SHA-256 हैश के रूप में सहेजा जाएगा।
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  नया पासकोड बनाएँ (कम से कम 4 अक्षर)
                </label>
                <input
                  type="password"
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="नया पासकोड लिखें"
                  className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  पासकोड की पुष्टि करें
                </label>
                <input
                  type="password"
                  value={confirmPasscodeInput}
                  onChange={(e) => setConfirmPasscodeInput(e.target.value)}
                  placeholder="दोबारा पासकोड लिखें"
                  className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
              {authError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition"
              >
                पासकोड सहेजें और वॉल्ट खोलें
              </button>
            </form>
          ) : !isUnlocked ? (
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900 border border-white/10">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-xs text-slate-300">
                  वॉल्ट लॉक है। खोलने के लिए अपना पासकोड दर्ज करें।
                </p>
              </div>
              <input
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                placeholder="अपना पासकोड लिखें"
                className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
              {authError && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </p>
              )}
              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition"
              >
                वॉल्ट अनलॉक करें
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                    Gemini API Key
                  </span>
                </div>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy... (अपनी Gemini API Key यहाँ डालें)"
                  className="w-full h-12 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleSaveGeminiKey}
                  disabled={isTestingKey}
                  className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-xs sm:text-sm transition"
                >
                  {isTestingKey ? "जाँचा जा रहा है..." : "Key सहेजें और जाँचें"}
                </button>
                {keyStatus && (
                  <p className="text-xs text-cyan-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{keyStatus}</span>
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">निजी नोट्स / क्रेडेंशियल</h3>
                <form onSubmit={handleAddSecret} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="नाम (जैसे: YouTube Channel ID)"
                    className="h-12 px-3.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="गुप्त मान"
                      className="flex-1 h-12 px-3.5 rounded-xl bg-slate-900 border border-white/15 text-xs text-white"
                    />
                    <button
                      type="submit"
                      className="px-4 h-12 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
                    >
                      जोड़ें
                    </button>
                  </div>
                </form>

                {secrets.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">कोई निजी नोट सहेजा नहीं गया है।</p>
                ) : (
                  <div className="space-y-2">
                    {secrets.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-white/10"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">{item.label}</p>
                          <p className="text-xs text-slate-400">••••••••••••</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSecret(item.id)}
                          aria-label={`Delete ${item.label}`}
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
