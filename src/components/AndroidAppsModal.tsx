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

  // Phone Dialer State
  const [dialNumber, setDialNumber] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [confirmCallPending, setConfirmCallPending] = useState(false);

  // SMS / WhatsApp State
  const [recipient, setRecipient] = useState("श्री राम नाग");
  const [msgBody, setMsgBody] = useState("नमस्ते, यह MYRAA Android AI से भेजा गया संदेश है।");
  const [smsSentNotice, setSmsSentNotice] = useState("");

  // Play Store State
  const [searchApp, setSearchApp] = useState("");
  const [installedList, setInstalledList] = useState(INSTALLED_ANDROID_APPS);

  // Accessibility State
  const [screenControlOn, setScreenControlOn] = useState(true);

  if (!isOpen) return null;

  const handleDialPad = (num: string) => {
    setDialNumber((prev) => prev + num);
  };

  const handleCall = async () => {
    if (!dialNumber) {
      setDialNumber("Shri Ram Nag (Owner)");
    }
    setConfirmCallPending(true);
  };

  const confirmCallAction = async () => {
    setConfirmCallPending(false);
    setCallActive(true);
    await nativeBridge.executeAction("CALL_CONTACT", {
      confirmed: true,
      contact: dialNumber || "Shri Ram Nag",
    });
    onActionTriggered("CALL_CONTACT", `${dialNumber || "Shri Ram Nag"} से कॉल कनेक्ट हो गई है।`);
  };

  const handleSendSms = async (isWhatsapp: boolean = false) => {
    const act = isWhatsapp ? "SEND_WHATSAPP_MESSAGE" : "SEND_SMS";
    await nativeBridge.executeAction(act, {
      confirmed: true,
      recipient,
      message: msgBody,
    });
    const txt = isWhatsapp
      ? `WhatsApp पर "${recipient}" को संदेश भेजा गया!`
      : `SMS द्वारा "${recipient}" को संदेश भेजा गया!`;
    setSmsSentNotice(txt);
    onActionTriggered(act, txt);
    setTimeout(() => setSmsSentNotice(""), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[500px] h-[80vh] flex flex-col bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {currentTab === "DIALER"
                ? "Phone Dialer"
                : currentTab === "MESSAGES"
                ? "Messages & WhatsApp"
                : currentTab === "CAMERA"
                ? "Camera Viewfinder"
                : currentTab === "STORE"
                ? "Google Play Store"
                : currentTab === "SETTINGS"
                ? "Android Settings & Accessibility"
                : "Android App Drawer"}
            </span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-nav Tabs */}
        <div className="flex items-center gap-1 px-3 py-2 bg-slate-950/70 border-b border-white/5 overflow-x-auto text-[10px]">
          <button
            onClick={() => setCurrentTab("DRAWER")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition ${
              currentTab === "DRAWER" ? "bg-sky-500 text-slate-950" : "bg-white/5 text-slate-300"
            }`}
          >
            📱 Apps
          </button>
          <button
            onClick={() => setCurrentTab("DIALER")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition ${
              currentTab === "DIALER" ? "bg-emerald-500 text-slate-950" : "bg-white/5 text-slate-300"
            }`}
          >
            📞 Phone
          </button>
          <button
            onClick={() => setCurrentTab("MESSAGES")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition ${
              currentTab === "MESSAGES" ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            💬 SMS / WhatsApp
          </button>
          <button
            onClick={() => setCurrentTab("CAMERA")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition ${
              currentTab === "CAMERA" ? "bg-purple-500 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            📷 Camera
          </button>
          <button
            onClick={() => setCurrentTab("STORE")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition ${
              currentTab === "STORE" ? "bg-amber-500 text-slate-950" : "bg-white/5 text-slate-300"
            }`}
          >
            🛍️ Play Store
          </button>
          <button
            onClick={() => setCurrentTab("SETTINGS")}
            className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition ${
              currentTab === "SETTINGS" ? "bg-rose-500 text-white" : "bg-white/5 text-slate-300"
            }`}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* TAB 1: APP DRAWER */}
          {currentTab === "DRAWER" && (
            <div>
              <div className="text-xs text-slate-400 mb-3 font-medium">
                Installed Android Packages (PackageManager All-Apps Control):
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                {installedList.map((app) => (
                  <button
                    key={app.packageName}
                    onClick={() => {
                      if (app.packageName.includes("dialer")) setCurrentTab("DIALER");
                      else if (app.packageName.includes("messaging") || app.packageName.includes("whatsapp")) setCurrentTab("MESSAGES");
                      else if (app.packageName.includes("camera")) setCurrentTab("CAMERA");
                      else if (app.packageName.includes("vending")) setCurrentTab("STORE");
                      else if (app.packageName.includes("settings")) setCurrentTab("SETTINGS");
                      else {
                        nativeBridge.executeAction("OPEN_APP", { packageName: app.packageName });
                        onActionTriggered("OPEN_APP", `Opened ${app.appName}`);
                        onClose();
                      }
                    }}
                    type="button"
                    className="flex flex-col items-center p-2 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-sky-500/50 hover:bg-slate-800/60 transition group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mb-1.5 shadow-md group-hover:scale-105 transition">
                      {app.packageName.includes("youtube") ? (
                        <PlaySquare className="w-6 h-6 text-red-500" />
                      ) : app.packageName.includes("whatsapp") ? (
                        <MessageSquare className="w-6 h-6 text-emerald-400" />
                      ) : app.packageName.includes("dialer") ? (
                        <Phone className="w-6 h-6 text-sky-400" />
                      ) : app.packageName.includes("camera") ? (
                        <Camera className="w-6 h-6 text-purple-400" />
                      ) : app.packageName.includes("maps") ? (
                        <MapPin className="w-6 h-6 text-amber-400" />
                      ) : app.packageName.includes("vending") ? (
                        <ShoppingBag className="w-6 h-6 text-emerald-400" />
                      ) : app.packageName.includes("settings") ? (
                        <Settings className="w-6 h-6 text-slate-300" />
                      ) : (
                        <Sparkles className="w-6 h-6 text-sky-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-200 font-semibold truncate w-full">
                      {app.appName}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: PHONE DIALER */}
          {currentTab === "DIALER" && (
            <div className="flex flex-col items-center justify-between h-full max-w-xs mx-auto">
              <div className="w-full text-center py-4 bg-slate-950/80 rounded-2xl border border-white/10 mb-4 shadow-inner">
                <span className="text-xl font-mono font-bold text-white tracking-widest">
                  {dialNumber || "Enter number / contact"}
                </span>
                {callActive && (
                  <div className="text-[10px] text-[#00E676] font-bold mt-1 animate-pulse">
                    🟢 Call in progress with {dialNumber || "Shri Ram Nag"}...
                  </div>
                )}
              </div>

              {confirmCallPending && (
                <div className="w-full p-3 mb-3 bg-amber-500/20 border border-amber-500/50 rounded-2xl text-center">
                  <div className="text-xs font-bold text-amber-300 mb-1">
                    ⚠️ Safety Confirmation Required
                  </div>
                  <div className="text-[10px] text-slate-300 mb-2">
                    Are you sure you want to call "{dialNumber || "Shri Ram Nag"}"?
                  </div>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={confirmCallAction}
                      className="px-3 py-1 bg-emerald-500 text-black font-bold text-xs rounded-lg"
                    >
                      Yes, Call Now
                    </button>
                    <button
                      onClick={() => setConfirmCallPending(false)}
                      className="px-3 py-1 bg-white/10 text-white text-xs rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Dial Pad */}
              <div className="grid grid-cols-3 gap-3 w-full mb-4">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleDialPad(n)}
                    type="button"
                    className="p-3 text-lg font-bold text-slate-100 bg-slate-800/80 hover:bg-slate-700 rounded-2xl border border-white/10 transition active:scale-95 shadow"
                  >
                    {n}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCall}
                  type="button"
                  className="px-6 py-3 rounded-full bg-[#00E676] text-black font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-400 transition"
                >
                  <PhoneCall className="w-5 h-5" />
                  <span>Call</span>
                </button>
                {dialNumber && (
                  <button
                    onClick={() => {
                      setDialNumber("");
                      setCallActive(false);
                    }}
                    type="button"
                    className="p-3 rounded-full bg-white/10 text-slate-300 hover:bg-white/20 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MESSAGES & WHATSAPP */}
          {currentTab === "MESSAGES" && (
            <div className="space-y-3 max-w-sm mx-auto">
              {smsSentNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{smsSentNotice}</span>
                </div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Recipient (Name or Phone Number):
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Message Content (Hindi / Hinglish / English):
                </label>
                <textarea
                  rows={4}
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleSendSms(false)}
                  type="button"
                  className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS</span>
                </button>
                <button
                  onClick={() => handleSendSms(true)}
                  type="button"
                  className="flex-1 py-2.5 bg-[#00E676] hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition shadow"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CAMERA */}
          {currentTab === "CAMERA" && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-full max-w-xs h-[240px] bg-slate-950 rounded-2xl border-2 border-dashed border-sky-400/50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
                <Camera className="w-12 h-12 text-sky-400 animate-pulse mb-2" />
                <span className="text-xs text-slate-400">Camera Viewfinder Active</span>
                <span className="text-[9px] text-slate-500 mt-1">Multi-modal Vision Ready</span>
              </div>
              <button
                onClick={() => {
                  onActionTriggered("OPEN_CAMERA", "फ़ोटो खींची गई और विज़न मॉडल को भेजी गई।");
                }}
                type="button"
                className="mt-4 px-6 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-full shadow-lg"
              >
                📸 Capture Snapshot
              </button>
            </div>
          )}

          {/* TAB 5: PLAY STORE */}
          {currentTab === "STORE" && (
            <div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={searchApp}
                  onChange={(e) => setSearchApp(e.target.value)}
                  placeholder="Play Store पर ऐप्स खोजें..."
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white"
                />
              </div>

              <div className="space-y-2">
                {installedList
                  .filter((a) => a.appName.toLowerCase().includes(searchApp.toLowerCase()))
                  .map((app) => (
                    <div
                      key={app.packageName}
                      className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-white/10 rounded-xl"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">{app.appName}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{app.packageName}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-[#00E676] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        Installed
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS & ACCESSIBILITY */}
          {currentTab === "SETTINGS" && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Accessibility className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      स्क्रीन कंट्रोल (Accessibility Service)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setScreenControlOn(!screenControlOn);
                      onActionTriggered(
                        "OPEN_ACCESSIBILITY_SETTINGS",
                        screenControlOn ? "स्क्रीन कंट्रोल बंद किया गया।" : "स्क्रीन कंट्रोल चालू किया गया।"
                      );
                    }}
                    type="button"
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      screenControlOn ? "bg-[#00E676] text-black" : "bg-rose-500 text-white"
                    }`}
                  >
                    {screenControlOn ? "चालू (ON)" : "बंद (OFF)"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  इंसानों की तरह ऑटो-स्क्रॉल, क्लिक, लाइक, कॉपी, और 3-डॉट मेनू चलाने की अनुमति।
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-white/10 space-y-2 text-xs">
                <div className="font-bold text-slate-200">Device Hardware Telemetry:</div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>OS Architecture</span>
                  <span className="text-slate-200 font-mono">Android 14 (API 34)</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Owner & Developer</span>
                  <span className="text-[#00E676] font-semibold">Shri Ram Nag (श्री राम नाग)</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Keystore Protection</span>
                  <span className="text-sky-400 font-mono">AndroidKeyStore AES-256</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
