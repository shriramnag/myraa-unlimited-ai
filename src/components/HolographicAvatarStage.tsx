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
    voiceName: "Kore",
    voiceGender: "Female",
    voiceDescription: "Kore (warm, expressive, companion natural tone)",
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
    voiceName: "Puck",
    voiceGender: "Male",
    voiceDescription: "Puck (sharp, fast, modern developer tone)",
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
    voiceName: "Aoede",
    voiceGender: "Female",
    voiceDescription: "Aoede (melodious, gentle, calm tone)",
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
    voiceName: "Fenrir",
    voiceGender: "Male",
    voiceDescription: "Fenrir (deep, commanding, authoritative tone)",
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
    voiceName: "Charon",
    voiceGender: "Male",
    voiceDescription: "Charon (calm, intellectual, wise mentor tone)",
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
    voiceName: "Despina",
    voiceGender: "Female",
    voiceDescription: "Despina (energetic, dynamic, friendly tone)",
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
      vid.currentTime = 0.2;
    }
  }, [isSpeaking, currentVideoSrc]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full px-2 pt-2 select-none">
      {/* 3D Viewport Box */}
      <div
        className="relative w-full max-w-[390px] h-[260px] sm:h-[300px] rounded-3xl overflow-hidden border transition-all duration-500 shadow-2xl backdrop-blur-md flex items-center justify-center bg-slate-950/80"
        style={{ borderColor: theme.hex }}
      >
        {/* Glow ambient background */}
        <div
          className="absolute inset-0 opacity-25 filter blur-2xl transition-all duration-700 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 50%, ${theme.hex}, transparent 75%)` }}
        />

        {/* Video / Avatar Surface */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={currentVideoSrc}
            poster={theme.thumb}
            playsInline
            muted
            loop
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isSpeaking ? "scale-105" : "scale-100"
            }`}
          />
        </div>

        {/* Top-Right: Camera Mode Toggle */}
        <button
          onClick={onToggleCameraMode}
          type="button"
          className="absolute top-2.5 right-2.5 z-20 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10 transition shadow-lg flex items-center gap-1 text-[10px]"
          title="Toggle Closeup / Full Viewport"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="font-mono">{cameraMode}</span>
        </button>

        {/* Top-Left: Status & Gemini Voice Chip */}
        <div className="absolute top-2.5 left-2.5 z-20 flex flex-col gap-1">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border shadow-lg"
            style={{
              backgroundColor: "rgba(10, 15, 30, 0.8)",
              borderColor: theme.hex,
              color: theme.hex,
            }}
          >
            <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: "4s" }} />
            <span>{isSpeaking ? "LIP-SYNC ACTIVE" : "HOLOGRAPHIC IDLE"}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono bg-slate-900/80 text-emerald-400 border border-emerald-500/30">
            <Volume2 className="w-2.5 h-2.5" />
            <span>Gemini: {theme.voiceName} ({theme.voiceGender})</span>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-2.5 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{theme.name}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {theme.hindiTitle} • {theme.voiceDescription}
            </div>
          </div>
          <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/10">
            {theme.badge}
          </div>
        </div>
      </div>

      {/* Role Switcher Carousel */}
      <div className="flex items-center justify-start sm:justify-center w-full max-w-[420px] gap-2 overflow-x-auto py-2.5 px-1 scrollbar-none">
        {(Object.keys(ROLE_THEMES) as CharacterRole[]).map((role) => {
          const item = ROLE_THEMES[role];
          const isSelected = activeRole === role;
          return (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-bold transition-all shrink-0 border ${
                isSelected
                  ? "bg-slate-900 text-white shadow-lg scale-105"
                  : "bg-slate-950/80 text-slate-400 hover:text-white border-white/5"
              }`}
              style={{
                borderColor: isSelected ? item.hex : "rgba(255,255,255,0.08)",
                boxShadow: isSelected ? `0 0 15px ${item.hex}40` : "none",
              }}
            >
              <img
                src={item.thumb}
                alt={item.name}
                className="w-4 h-4 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span>{item.badge}</span>
              <span className="text-[9px] opacity-75 font-mono">({item.voiceName})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
