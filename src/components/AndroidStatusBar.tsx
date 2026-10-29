import React, { useState, useEffect } from "react";
import { Wifi, Signal, Battery, Bell, Sun, Volume2 } from "lucide-react";

interface Props {
  onPullDownShade: () => void;
  batteryLevel?: number;
  isFlashlightOn?: boolean;
}

export const AndroidStatusBar: React.FC<Props> = ({
  onPullDownShade,
  batteryLevel = 98,
  isFlashlightOn = false,
}) => {
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={onPullDownShade}
      className="w-full flex items-center justify-between px-4 py-1.5 text-xs text-slate-200 bg-black/60 backdrop-blur-md select-none cursor-pointer border-b border-white/5 hover:bg-black/80 transition"
      title="Tap or drag down for Android Notification Shade & Quick Settings"
    >
      {/* Left: Time and Notifications Indicator */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-100 tracking-tight text-[11px]">
          {timeStr || "12:30"}
        </span>
        <div className="flex items-center gap-1 text-slate-400">
          <Bell className="w-2.5 h-2.5 text-sky-400" />
          <img
            src="./avatars/ic_launcher_round.png"
            alt="Myraa"
            className="w-3 h-3 rounded-full border border-sky-400/40"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
          {isFlashlightOn && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Flashlight ON" />
          )}
        </div>
      </div>

      {/* Middle: Phone Camera Punch-Hole Simulation */}
      <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 shadow-inner" />

      {/* Right: Telemetry (5G, Wi-Fi, Battery) */}
      <div className="flex items-center gap-1.5 text-slate-300">
        <span className="text-[9px] font-bold tracking-tight text-slate-300">5G</span>
        <Signal className="w-3 h-3 text-slate-200" />
        <Wifi className="w-3 h-3 text-slate-200" />
        <div className="flex items-center gap-1 font-mono text-[10px] text-slate-200">
          <span>{batteryLevel}%</span>
          <Battery className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
        </div>
      </div>
    </div>
  );
};
