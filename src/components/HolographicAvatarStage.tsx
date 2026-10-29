import React, { useRef, useEffect } from "react";
import { CharacterRole, RoleTheme } from "../types";
import { Camera, Volume2, Sparkles, UserCheck } from "lucide-react";

export const ROLE_THEMES: Record<CharacterRole, RoleTheme> = {
  MYRAA: {
    role: "MYRAA",
    name: "शिव एआई • MYRAA",
    hindiTitle: "3D होलोग्राफिक AI साथी",
    specialty: "Voice Companion & Android Orchestration",
    badge: "🌸 MYRAA",
    color: "celestial",
    hex: "#0A84FF",
    thumb: "./avatars/myraa.png",
    closeupVideo: "./avatars/videos/myraa_closeup.mp4",
    fullVideo: "./avatars/videos/myraa_full.mp4",
    systemPersona: "Sweet, gentle anime heroine companion for Shri Ram Nag",
  },
  CODEX: {
    role: "CODEX",
    name: "शिव एआई • CODEX",
    hindiTitle: "SWE-Agent कोडिंग विशेषज्ञ",
    specialty: "Software Engineering & Bug Fixing",
    badge: "💻 CODEX",
    color: "emerald",
    hex: "#00E676",
    thumb: "./avatars/codex.png",
    closeupVideo: "./avatars/videos/codex_closeup.mp4",
    fullVideo: "./avatars/videos/codex_full.mp4",
    systemPersona: "Precise, intelligent autonomous software engineering specialist",
  },
  AURA: {
    role: "AURA",
    name: "शिव एआई • AURA",
    hindiTitle: "क्लासिक ब्लोंड AI साथी",
    specialty: "Creative Synthesis & Design",
    badge: "✨ AURA",
    color: "gold",
    hex: "#F59E0B",
    thumb: "./avatars/aura.png",
    closeupVideo: "./avatars/videos/aura_closeup.mp4",
    fullVideo: "./avatars/videos/aura_full.mp4",
    systemPersona: "Bright, creative and stylish anime companion",
  },
  SENTINEL: {
    role: "SENTINEL",
    name: "शिव एआई • SENTINEL",
    hindiTitle: "साइबर सुरक्षा मॉनिटर",
    specialty: "SkillSpector & App Integrity Shield",
    badge: "🛡️ SENTINEL",
    color: "crimson",
    hex: "#FF6B6B",
    thumb: "./avatars/sentinel.png",
    closeupVideo: "./avatars/videos/sentinel_closeup.mp4",
    fullVideo: "./avatars/videos/sentinel_full.mp4",
    systemPersona: "Vigilant cybersecurity and prompt injection guardian",
  },
  SAGE: {
    role: "SAGE",
    name: "शिव एआई • SAGE",
    hindiTitle: "डीप रिसर्च विशेषज्ञ",
    specialty: "gpt-researcher & Strategic Planning",
    badge: "🔬 SAGE",
    color: "violet",
    hex: "#6C63FF",
    thumb: "./avatars/sage.png",
    closeupVideo: "./avatars/videos/sage_closeup.mp4",
    fullVideo: "./avatars/videos/sage_full.mp4",
    systemPersona: "Scholarly, analytical deep research and intelligence specialist",
  },
  PIXEL: {
    role: "PIXEL",
    name: "शिव एआई • PIXEL / VORTEX",
    hindiTitle: "मीडिया व PPT विशेषज्ञ",
    specialty: "Video-Use & Interactive UI",
    badge: "🎬 PIXEL",
    color: "gold",
    hex: "#F59E0B",
    thumb: "./avatars/pixel.png",
    closeupVideo: "./avatars/videos/vortex_closeup.mp4",
    fullVideo: "./avatars/videos/vortex_full.mp4",
    systemPersona: "Dynamic media, slide deck, and UI graphics engineer",
  },
};

interface Props {
  activeRole: CharacterRole;
  onSelectRole: (role: CharacterRole) => void;
  isSpeaking: boolean;
  cameraMode: "CLOSEUP" | "FULL";
  onToggleCameraMode: () => void;
}

export const HolographicAvatarStage: React.FC<Props> = ({
  activeRole,
  onSelectRole,
  isSpeaking,
  cameraMode,
  onToggleCameraMode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const theme = ROLE_THEMES[activeRole] || ROLE_THEMES.MYRAA;
  const currentVideoSrc = cameraMode === "FULL" ? theme.fullVideo : theme.closeupVideo;

  // Handle Video Lip-Sync playback
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isSpeaking) {
      vid.playbackRate = 1.15;
      vid.play().catch(() => {});
    } else {
      vid.pause();
      vid.currentTime = 0.2; // Gentle idle frame
    }
  }, [isSpeaking, currentVideoSrc]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full px-2 pt-2 select-none">
      {/* Ambient Holographic Glow */}
      <div
        className="absolute inset-0 rounded-3xl opacity-25 blur-3xl pointer-events-none transition-colors duration-500"
        style={{ background: theme.hex }}
      />

      {/* Main 3D Avatar Video Frame */}
      <div className="relative group">
        <video
          ref={videoRef}
          src={currentVideoSrc}
          poster={theme.thumb}
          loop
          muted
          playsInline
          className="w-[250px] h-[310px] sm:w-[270px] sm:h-[340px] object-cover rounded-2xl border-2 transition-all duration-300 shadow-2xl bg-slate-950/80"
          style={{
            borderColor: theme.hex,
            boxShadow: isSpeaking
              ? `0 0 45px ${theme.hex}, 0 0 20px #00E676`
              : `0 0 25px ${theme.hex}44`,
          }}
        />

        {/* Dynamic Lip-Sync Waveform Badge (Visible while speaking) */}
        {isSpeaking && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-black/85 border border-[#00E676] rounded-full backdrop-blur-md shadow-lg">
            <Volume2 className="w-3 h-3 text-[#00E676] animate-pulse" />
            <span className="text-[9px] font-bold text-[#00E676] mr-1">LIP-SYNC</span>
            <span className="w-1 h-3 bg-[#00E676] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-4 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "120ms" }} />
            <span className="w-1 h-2 bg-[#00E676] rounded-full animate-bounce" style={{ animationDelay: "240ms" }} />
            <span className="w-1 h-4 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: "80ms" }} />
            <span className="w-1 h-2 bg-[#00E676] rounded-full animate-bounce" style={{ animationDelay: "180ms" }} />
          </div>
        )}

        {/* Floating Top Badge with Camera Toggle */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
          <button
            onClick={onToggleCameraMode}
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-semibold bg-black/75 hover:bg-black/95 text-white rounded-full border border-white/20 backdrop-blur-sm transition-all shadow"
            title="Toggle between Close-Up and Full-Body views"
          >
            <Camera className="w-2.5 h-2.5 text-sky-400" />
            {cameraMode === "CLOSEUP" ? "Close-Up" : "Full-Body"}
          </button>
        </div>
      </div>

      {/* Role & Status Pill */}
      <div className="flex items-center gap-2 mt-2">
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border text-[10px] font-medium shadow-md"
          style={{ borderColor: theme.hex }}
        >
          <Sparkles className="w-3 h-3" style={{ color: theme.hex }} />
          <span className="font-bold text-white">{theme.name}</span>
          <span className="text-slate-400 text-[9px]">
            • {isSpeaking ? "🗣️ Lip-Sync Speaking" : `[${cameraMode} • IDLE]`}
          </span>
        </div>
      </div>

      {/* 6 Character Avatars Quick Switcher */}
      <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto max-w-full px-1 py-1">
        {(Object.keys(ROLE_THEMES) as CharacterRole[]).map((roleKey) => {
          const t = ROLE_THEMES[roleKey];
          const isSelected = activeRole === roleKey;
          return (
            <button
              key={roleKey}
              onClick={() => onSelectRole(roleKey)}
              type="button"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold transition-all whitespace-nowrap border ${
                isSelected
                  ? "bg-slate-900 text-white shadow-md scale-105"
                  : "bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-white/10"
              }`}
              style={{
                borderColor: isSelected ? t.hex : undefined,
                color: isSelected ? t.hex : undefined,
              }}
            >
              <img
                src={t.thumb}
                alt={t.badge}
                className="w-3.5 h-3.5 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span>{t.badge}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
