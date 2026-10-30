import React, { useState, useEffect } from "react";
import { Wifi, Battery, Volume2, Flashlight } from "lucide-react";

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
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      onClick={onPullDownShade}
      className="flex items-center justify-between w-full px-4 py-1.5 bg-slate-950/90 text-[11px] font-medium text-slate-300 border-b border-white/5 cursor-pointer hover:bg-slate-900 transition select-none z-30"
      title="Click to open Android Notification & Quick Settings Shade"
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white tracking-wide">{timeStr || "12:00"}</span>
        {isFlashlightOn && (
          <Flashlight className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-emerald-400">5G</span>
        <Wifi className="w-3 h-3 text-slate-300" />
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <span>{batteryLevel}%</span>
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>
    </div>
  );
};
