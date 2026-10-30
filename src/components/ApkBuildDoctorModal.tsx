import React, { useState } from "react";
import {
  CheckCircle2,
  Wrench,
  FileCode2,
  Copy,
  Check,
  X,
  Terminal,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const FIXED_ISSUES = [
  {
    id: "fix-1",
    title: "1. Google AI Studio (Gemini Audio) Voice Pipeline",
    problem: "Previous text-to-speech used robotic/synthetic window.speechSynthesis.",
    solution:
      "Direct API integration with gemini-2.5-flash:generateContent for 6 distinct character voices (MYRAA: Kore, AURA: Aoede, PIXEL: Despina, CODEX: Puck, SENTINEL: Fenrir, SAGE: Charon) with low-latency Web Audio/HTML5 Audio playback.",
    file: "src/services/voiceBiometrics.ts",
  },
  {
    id: "fix-2",
    title: "2. Clean Plain-Text AndroidManifest & Resource Integrity",
    problem: "Corrupted binary AXML fragments and duplicate abc_* library resources caused AAPT2 crashes.",
    solution: "Purged corrupted binary AXMLs and ensured clean XML resource files and adaptive launcher icons.",
    file: "android/app/src/main/AndroidManifest.xml",
  },
  {
    id: "fix-3",
    title: "3. res/values/ Resources Present",
    problem: "Missing strings.xml and styles.xml caused build errors.",
    solution: "Provided complete strings.xml, styles.xml, and colors.xml with proper dark theme values.",
    file: "android/app/src/main/res/values/strings.xml",
  },
  {
    id: "fix-4",
    title: "4. All 43 Native Android Actions Catalog",
    problem: "Actions lacked unified execution dispatch.",
    solution: "Integrated 43 native actions covering hardware torch, dialer, SMS, WhatsApp, camera, and settings.",
    file: "src/services/nativeBridge.ts",
  },
  {
    id: "fix-5",
    title: "5. Long-Term Brain Database & 11 Autonomous Tools",
    problem: "Session memory was ephemeral without persistent storage.",
    solution: "Persistent on-device SQLite / localStorage memory with JSON backup export/import and 11 Shiv AI tools.",
    file: "src/services/brainDatabase.ts",
  },
];

export const ApkBuildDoctorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[500px] max-h-[85vh] flex flex-col bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-white">APK बिल्ड डॉक्टर (Build Doctor)</div>
              <div className="text-[10px] text-emerald-400 font-mono">100% Android Studio & Gradle Compliance</div>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {FIXED_ISSUES.map((issue) => (
            <div
              key={issue.id}
              className="p-3 rounded-2xl bg-slate-950/80 border border-white/5 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[12px]">{issue.title}</span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  FIXED ✓
                </span>
              </div>
              <div className="text-[11px] text-slate-400">{issue.solution}</div>
              <div className="text-[9px] font-mono text-slate-500">{issue.file}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
