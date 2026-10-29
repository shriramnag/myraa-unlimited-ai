import React, { useState } from "react";
import {
  Wifi,
  Bluetooth,
  Flashlight,
  BellOff,
  Sun,
  Volume2,
  Radio,
  BatteryCharging,
  RotateCw,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { nativeBridge } from "../services/nativeBridge";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onActionTriggered: (actionName: string, message: string) => void;
}

export const AndroidNotificationShade: React.FC<Props> = ({
  isOpen,
  onClose,
  onActionTriggered,
}) => {
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [dndOn, setDndOn] = useState(false);
  const [hotspotOn, setHotspotOn] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const devState = nativeBridge.getDeviceState();
  const [brightness, setBrightness] = useState(devState.brightness);
  const [volume, setVolume] = useState(devState.volume);

  if (!isOpen) return null;

  const handleToggleFlashlight = () => {
    const isNowOn = nativeBridge.toggleFlashlight();
    onActionTriggered(
      isNowOn ? "FLASHLIGHT_ON" : "FLASHLIGHT_OFF",
      isNowOn ? "फ्लैशलाइट चालू (ON) की गई।" : "फ्लैशलाइट बंद (OFF) की गई।"
    );
  };

  const handleBrightnessChange = (val: number) => {
    setBrightness(val);
    nativeBridge.setBrightness(val);
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    nativeBridge.setVolume(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-2xl text-slate-100 p-4 overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <img src="./avatars/ic_launcher_round.png" alt="Myraa" className="w-5 h-5 rounded-full" />
          <span className="font-bold text-sm tracking-wide text-slate-100">Android Quick Settings & Notifications</span>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition"
          title="Close Shade"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sliders: Brightness & Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        <div className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-xl border border-white/10">
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Screen Brightness</span>
              <span>{brightness}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={brightness}
              onChange={(e) => handleBrightnessChange(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-900/80 rounded-xl border border-white/10">
          <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Media Volume</span>
              <span>{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Quick Settings Grid */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        <button
          onClick={() => setWifiOn(!wifiOn)}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            wifiOn ? "bg-sky-500/20 border-sky-400 text-sky-300" : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <Wifi className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Wi-Fi</span>
        </button>

        <button
          onClick={() => setBluetoothOn(!bluetoothOn)}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            bluetoothOn ? "bg-sky-500/20 border-sky-400 text-sky-300" : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <Bluetooth className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Bluetooth</span>
        </button>

        <button
          onClick={handleToggleFlashlight}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            devState.flashlightOn ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-lg" : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <Flashlight className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Torch {devState.flashlightOn ? "ON" : "OFF"}</span>
        </button>

        <button
          onClick={() => setDndOn(!dndOn)}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            dndOn ? "bg-purple-500/20 border-purple-400 text-purple-300" : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <BellOff className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">DND</span>
        </button>

        <button
          onClick={() => setHotspotOn(!hotspotOn)}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            hotspotOn ? "bg-emerald-500/20 border-emerald-400 text-emerald-300" : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <Radio className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Hotspot</span>
        </button>

        <button
          onClick={() => setBatterySaver(!batterySaver)}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            batterySaver ? "bg-orange-500/20 border-orange-400 text-orange-300" : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <BatteryCharging className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Saver</span>
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          type="button"
          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition ${
            autoRotate ? "bg-indigo-500/20 border-indigo-400 text-indigo-300" : "bg-slate-900 border-white/10 text-slate-400"
          }`}
        >
          <RotateCw className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Auto-Rotate</span>
        </button>

        <button
          onClick={() => {
            onActionTriggered("OPEN_SETTINGS", "Android Main Settings opened.");
            onClose();
          }}
          type="button"
          className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800 transition"
        >
          <ShieldCheck className="w-5 h-5 mb-1 text-emerald-400" />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>

      {/* Notifications Section */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Safe Notifications</span>
          <span className="text-[10px] text-[#00E676] font-mono">MyraaNotificationService • Safe</span>
        </div>

        <div className="space-y-2.5">
          <div className="p-3 bg-slate-900/90 rounded-2xl border border-sky-500/30 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-bold text-xs text-sky-400">SHIV AI • MYRAA v3.0</span>
              </div>
              <span className="text-[9px] text-slate-400">Just now</span>
            </div>
            <p className="text-[11px] text-slate-200">
              नमस्ते श्री राम नाग जी! 3D होलोग्राफिक लिंक और सभी 11 टूल्स एक्टिव हैं।
            </p>
          </div>

          <div className="p-3 bg-slate-900/90 rounded-2xl border border-emerald-500/30 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold text-xs text-emerald-400">AndroidKeyStore & OTP Shield</span>
              </div>
              <span className="text-[9px] text-slate-400">5m ago</span>
            </div>
            <p className="text-[11px] text-slate-200">
              100% लोकल प्रोटेक्शन सक्रिय: क्लिपबोर्ड, बायोमेट्रिक व एसएमएस शील्ड सुरक्षित हैं।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
