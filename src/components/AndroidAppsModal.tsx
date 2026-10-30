import React, { useState } from "react";
import { INSTALLED_ANDROID_APPS, nativeBridge } from "../services/nativeBridge";
import {
  Phone,
  MessageSquare,
  Camera,
  PlaySquare,
  Settings,
  ShoppingBag,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Sparkles,
  X,
  PhoneCall,
  Send,
  Share2,
  Check,
  AlertCircle,
  Accessibility,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  activeAppId: string | null;
  onClose: () => void;
  onActionTriggered: (action: string, msg: string) => void;
}

export const AndroidAppsModal: React.FC<Props> = ({
  isOpen,
  activeAppId,
  onClose,
  onActionTriggered,
}) => {
  const [currentTab, setCurrentTab] = useState<string>(activeAppId || "DRAWER");
  const [dialNumber, setDialNumber] = useState("");
  const [smsTarget, setSmsTarget] = useState("");
  const [smsContent, setSmsContent] = useState("");

  if (!isOpen) return null;

  const handleDial = () => {
    if (!dialNumber) return;
    nativeBridge.recordAudit(
      "MEDIUM",
      "TELEPHONY",
      "CALL_CONTACT",
      "EXECUTED",
      `Initiated call to ${dialNumber}`
    );
    onActionTriggered("Phone Call", `नंबर ${dialNumber} पर कॉल लगाई जा रही है...`);
    onClose();
  };

  const handleSendSms = (isWhatsApp = false) => {
    if (!smsTarget || !smsContent) return;
    const action = isWhatsApp ? "SEND_WHATSAPP_MESSAGE" : "SEND_SMS";
    nativeBridge.recordAudit(
      "MEDIUM",
      "MESSAGING",
      action,
      "EXECUTED",
      `Sent ${isWhatsApp ? "WhatsApp" : "SMS"} to ${smsTarget}: ${smsContent}`
    );
    onActionTriggered(
      isWhatsApp ? "WhatsApp Message" : "SMS Message",
      `${isWhatsApp ? "WhatsApp" : "SMS"} संदेश ${smsTarget} को भेज दिया गया!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[480px] max-h-[85vh] flex flex-col bg-slate-900 border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <div>
              <div className="text-sm font-bold text-white">Android System Hub & Native Apps</div>
              <div className="text-[10px] text-emerald-400 font-mono">43 Native Actions Catalog</div>
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

        {/* Tab Switcher */}
        <div className="flex border-b border-white/5 bg-slate-950/40">
          <button
            onClick={() => setCurrentTab("DRAWER")}
            type="button"
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              currentTab === "DRAWER"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Apps Drawer
          </button>
          <button
            onClick={() => setCurrentTab("DIALER")}
            type="button"
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              currentTab === "DIALER"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Phone Dialer
          </button>
          <button
            onClick={() => setCurrentTab("MESSAGES")}
            type="button"
            className={`flex-1 py-2 text-xs font-bold transition border-b-2 ${
              currentTab === "MESSAGES"
                ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            SMS / WhatsApp
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentTab === "DRAWER" && (
            <div className="grid grid-cols-3 gap-3">
              {INSTALLED_ANDROID_APPS.map((app) => (
                <button
                  key={app.packageName}
                  onClick={() => {
                    onActionTriggered("Open App", `${app.appName} खोला जा रहा है...`);
                    onClose();
                  }}
                  type="button"
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-950 border border-white/5 hover:border-emerald-500/50 hover:bg-slate-800 transition group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mb-2 group-hover:scale-105 transition">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-xs font-bold text-white text-center truncate w-full">
                    {app.appName}
                  </span>
                  <span className="text-[9px] text-slate-400">{app.category}</span>
                </button>
              ))}
            </div>
          )}

          {currentTab === "DIALER" && (
            <div className="space-y-4 max-w-[280px] mx-auto">
              <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 text-center font-mono text-xl font-bold text-white tracking-widest min-h-[52px] flex items-center justify-center">
                {dialNumber || <span className="text-slate-600 text-sm">नंबर दर्ज करें...</span>}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => setDialNumber((prev) => prev + digit)}
                    type="button"
                    className="h-12 rounded-2xl bg-slate-950 border border-white/5 hover:border-emerald-400/40 text-lg font-bold text-white transition hover:bg-slate-800"
                  >
                    {digit}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setDialNumber((prev) => prev.slice(0, -1))}
                  type="button"
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
                >
                  Clear
                </button>
                <button
                  onClick={handleDial}
                  type="button"
                  className="flex-1 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 flex items-center justify-center gap-1.5 transition"
                >
                  <PhoneCall className="w-4 h-4 fill-current" />
                  <span>Call</span>
                </button>
              </div>
            </div>
          )}

          {currentTab === "MESSAGES" && (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  मोबाइल नंबर (Recipient):
                </label>
                <input
                  type="text"
                  value={smsTarget}
                  onChange={(e) => setSmsTarget(e.target.value)}
                  placeholder="+91 98765 43210..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">
                  संदेश (Message Text):
                </label>
                <textarea
                  value={smsContent}
                  onChange={(e) => setSmsContent(e.target.value)}
                  placeholder="संदेश टाइप करें..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleSendSms(false)}
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>SMS भेजें</span>
                </button>
                <button
                  onClick={() => handleSendSms(true)}
                  type="button"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
