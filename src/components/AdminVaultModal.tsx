import React, { useState } from "react";
import { nativeBridge } from "../services/nativeBridge";
import { AuditLogItem } from "../types";
import { ShieldCheck, Lock, Unlock, Key, AlertTriangle, Eye, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminVaultModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [passcode, setPasscode] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);

  if (!isOpen) return null;

  const handleUnlock = () => {
    // Master vault key: 1977 or shriramnag
    if (passcode === "1977" || passcode.toLowerCase() === "shriramnag" || passcode.toLowerCase() === "owner") {
      setIsUnlocked(true);
      setErrorMsg("");
      setLogs(nativeBridge.getAuditLogs());
    } else {
      setErrorMsg("गलत पासकोड! केवल अधिकृत ओनर (श्री राम नाग) ही एक्सेस कर सकते हैं।");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[480px] max-h-[85vh] flex flex-col bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-white">एडमिन वॉल्ट & सुरक्षा ऑडिट (Admin Vault)</div>
              <div className="text-[10px] text-emerald-400 font-mono">
                ओनर: श्री राम नाग (Shri Ram Nag) • AES-256 Gated
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Locked View */}
        {!isUnlocked ? (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">ओनर ऑथेंटिकेशन (Passcode Gate)</div>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                सिस्टम लॉग्स, सुरक्षा ऑडिट और संवेदनशील क्रेडेंशियल्स देखने के लिए मास्टर पासकोड दर्ज करें (डिफ़ॉल्ट: 1977)।
              </p>
            </div>

            <div className="w-full max-w-xs space-y-2">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="पासकोड दर्ज करें..."
                className="w-full text-center px-4 py-2.5 bg-slate-950 border border-white/20 rounded-xl text-sm font-mono tracking-widest text-white focus:outline-none focus:border-emerald-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnlock();
                }}
              />
              {errorMsg && (
                <div className="text-xs text-rose-400 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <button
                onClick={handleUnlock}
                type="button"
                className="w-full py-2.5 bg-[#00E676] hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                वॉल्ट खोलें (Unlock Vault)
              </button>
            </div>
          </div>
        ) : (
          /* Unlocked Audit Log View */
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-white/10">
              <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                <Unlock className="w-3.5 h-3.5" /> वॉल्ट अनलॉक है (Owner: Shri Ram Nag)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {logs.length} Audit Events Logged
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 bg-slate-950/80 border border-white/10 rounded-xl text-[11px] font-mono space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-[10px]">{log.action}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        log.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400"
                          : log.severity === "HIGH"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {log.severity} • {log.status}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[10px]">{log.details}</div>
                  <div className="text-[8px] text-slate-600 text-right">{log.timestamp}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
