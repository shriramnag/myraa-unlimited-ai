import React, { useState } from "react";
import { X, Smartphone, ExternalLink, Phone, Flashlight, CheckCircle2, Info } from "lucide-react";
import {
  nativeBridge,
  ALL_43_NATIVE_ACTIONS,
  INSTALLED_ANDROID_APPS,
} from "../services/nativeBridge";
import { deviceActions } from "../voice/DeviceActions";

interface AndroidAppsModalProps {
  isOpen: boolean;
  activeAppId?: string | null;
  onClose: () => void;
  onActionTriggered?: (action: string, msg: string) => void;
}

export const AndroidAppsModal: React.FC<AndroidAppsModalProps> = ({
  isOpen,
  onClose,
  onActionTriggered,
}) => {
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState("");
  const [waText, setWaText] = useState("");
  const [activeTab, setActiveTab] = useState<"QUICK" | "CATALOG">("QUICK");

  if (!isOpen) return null;

  const isNative = nativeBridge.hasAndroidBridge();
  const browserReadyCount = ALL_43_NATIVE_ACTIONS.filter(
    (a) => isNative || a.worksInBrowser
  ).length;

  const handleOpenApp = async (appId: string) => {
    const res = await deviceActions.openApp(appId);
    setStatusMsg(res.message);
    onActionTriggered?.(`Open ${appId}`, res.message);
  };

  const handleToggleTorch = async () => {
    const res = await deviceActions.toggleFlashlight();
    setStatusMsg(res.message);
    onActionTriggered?.("Toggle Flashlight", res.message);
  };

  const handleWhatsAppSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await deviceActions.openWhatsApp(phoneInput, waText);
    setStatusMsg(res.message);
    onActionTriggered?.("Open WhatsApp", res.message);
  };

  const handleDial = async () => {
    if (!phoneInput.trim()) {
      setStatusMsg("कृपया पहले फ़ोन नंबर लिखें।");
      return;
    }
    const res = await deviceActions.makeCall(phoneInput);
    setStatusMsg(res.message);
    onActionTriggered?.(`Call ${phoneInput}`, res.message);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">ऐप्स और डिवाइस कंट्रोल (Device Actions)</h2>
              <p className="text-xs text-slate-400">
                रनटाइम: {isNative ? "Android Native Bridge Active" : "Web Browser Mode (Deep Links & Web APIs)"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Apps Modal"
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/10 px-5 pt-2 gap-2 bg-slate-900/30">
          <button
            type="button"
            onClick={() => setActiveTab("QUICK")}
            className={`h-12 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === "QUICK"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            तुरंत ऐप और कॉल (Quick Actions)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("CATALOG")}
            className={`h-12 px-4 text-xs sm:text-sm font-semibold border-b-2 transition ${
              activeTab === "CATALOG"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            Android क्षमताएँ ({browserReadyCount}/{ALL_43_NATIVE_ACTIONS.length} इस मोड में सक्रिय)
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {statusMsg && (
            <div className="p-3.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-xs text-cyan-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>{statusMsg}</span>
            </div>
          )}

          {activeTab === "QUICK" ? (
            <>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  अनुमति प्राप्त ऐप्स (Allowlisted Apps)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {INSTALLED_ANDROID_APPS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => handleOpenApp(app.id)}
                      className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/15 text-left transition flex items-center justify-between text-white"
                    >
                      <div>
                        <p className="text-sm font-bold">{app.appName}</p>
                        <p className="text-xs text-slate-400">{app.category}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-cyan-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-white/10">
                <div className="flex items-center gap-3">
                  <Flashlight className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">फ़्लैशलाइट / टॉर्च (Camera Torch)</p>
                    <p className="text-xs text-slate-400">
                      Android ऐप ब्रिज पर असली कैमरा टॉर्च चालू/बंद करता है
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className="h-12 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-semibold text-amber-300"
                >
                  टॉर्च टॉगल करें
                </button>
              </div>

              <form
                onSubmit={handleWhatsAppSend}
                className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3"
              >
                <h3 className="text-sm font-semibold text-white">सीधा कॉल या WhatsApp संदेश</h3>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="फ़ोन नंबर लिखें (जैसे: 9876543210)"
                  className="w-full h-12 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                />
                <input
                  type="text"
                  value={waText}
                  onChange={(e) => setWaText(e.target.value)}
                  placeholder="WhatsApp संदेश (वैकल्पिक)"
                  className="w-full h-12 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDial}
                    className="flex-1 h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>कॉल करें (पुष्टि सहित)</span>
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>WhatsApp खोलें</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 flex items-start gap-2.5 text-xs text-slate-300">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  नीचे Android ऐप के सिस्टम एक्शन दिए गए हैं। जो एक्शन वर्तमान मोड ({isNative ? "Android APK" : "Web Browser"}) में काम करते हैं उन पर हरा बैज है; बाकी केवल इंस्टॉल किए गए Android APK में काम करते हैं।
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ALL_43_NATIVE_ACTIONS.map((item) => {
                  const worksNow = isNative || item.worksInBrowser;
                  return (
                    <div
                      key={item.name}
                      className="p-3 rounded-xl bg-slate-900/70 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{item.name}</p>
                        <p className="text-xs text-slate-400">{item.description}</p>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                          worksNow
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border border-white/10"
                        }`}
                      >
                        {worksNow ? "Active Now" : "Android App Only"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
