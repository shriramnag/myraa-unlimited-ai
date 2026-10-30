import React from "react";
import { nativeBridge } from "../services/nativeBridge";
import {
  Wifi,
  Bluetooth,
  Flashlight,
  Volume2,
  Sun,
  Shield,
  Smartphone,
  X,
  ChevronDown,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onActionTriggered: (action: string, msg: string) => void;
}

export const AndroidNotificationShade: React.FC<Props> = ({
  isOpen,
  onClose,
  onActionTriggered,
}) => {
  if (!isOpen) return null;
  const dev = nativeBridge.getDeviceState();

  const handleToggleTorch = () => {
    const on = nativeBridge.toggleFlashlight();
    onActionTriggered("Flashlight Toggle", on ? "फ्लैशलाइट चालू (ON) की गई।" : "फ्लैशलाइट बंद (OFF) की गई।");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-start bg-slate-950/90 backdrop-blur-2xl animate-in slide-in-from-top duration-200 p-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div>
          <div className="text-sm font-bold text-white">Android Quick Settings & Notifications</div>
          <div className="text-[10px] text-sky-400 font-mono">MYRAA System Shade • Shri Ram Nag</div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Settings Tiles Grid */}
      <div className="grid grid-cols-4 gap-2.5 my-4">
        <button
          onClick={handleToggleTorch}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            dev.flashlightOn
              ? "bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20"
              : "bg-slate-900 text-slate-300 border-white/10 hover:border-white/20"
          }`}
        >
          <Flashlight className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Torch</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30"
        >
          <Wifi className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Wi-Fi</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/20 text-[#00E676] border border-emerald-500/30"
        >
          <Bluetooth className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Bluetooth</span>
        </button>

        <button
          type="button"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 text-slate-300 border border-white/10"
        >
          <Volume2 className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold">Sound</span>
        </button>
      </div>

      {/* Safe Notifications List */}
      <div className="flex-1 overflow-y-auto space-y-2 mt-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Notifications (Payment & OTP Shield Active)
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/30 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Security Shield Engaged</div>
            <div className="text-[11px] text-slate-300">
              Payment & OTP Shield सक्रिय है। UPI/Banking ऐप्स पूर्णतः सुरक्षित हैं।
            </div>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-white/10 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-white">Gemini Audio Voice Pipeline Online</div>
            <div className="text-[11px] text-slate-300">
              Kore, Aoede, Despina, Puck, Fenrir, और Charon वॉइस प्रोफाइल्स सक्रिय हैं।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
