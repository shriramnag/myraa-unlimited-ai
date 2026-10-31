import React from 'react';
import { X, Wrench, CheckCircle2 } from 'lucide-react';

interface ApkBuildDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkBuildDoctorModal: React.FC<ApkBuildDoctorModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">APK और सिस्टम जानकारी</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close APK Doctor"
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs sm:text-sm text-slate-300">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Gemini Live Audio Pipeline (16kHz PCM In / 24kHz PCM Out) सक्रिय है।</span>
          </div>
          <p>
            यदि कभी ऑडियो या माइक काम न करे, तो Settings → Diagnostics में जाकर "Test Speaker (440Hz)" और "Test Gemini Voice" बटन से तुरंत जाँच करें।
          </p>
        </div>
      </div>
    </div>
  );
};
