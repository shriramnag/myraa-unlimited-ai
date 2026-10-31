import React, { useEffect, useState } from "react";
import { PERSONA_THEMES } from "../config/personas";
import { CharacterRole } from "../types";
import { VoiceEngineState } from "../voice/voiceStore";
import { liveSession } from "../voice/LiveSession";

interface HolographicAvatarStageProps {
  activeRole: CharacterRole;
  voiceState: VoiceEngineState;
  voiceName: string;
  micLevel: number;
  outputWaveform: number[];
  cameraMode?: "CLOSEUP" | "FULL";
  onToggleCameraMode?: () => void;
}

export const HolographicAvatarStage: React.FC<HolographicAvatarStageProps> = ({
  activeRole,
  voiceState,
  voiceName,
  micLevel,
  outputWaveform,
}) => {
  const theme = PERSONA_THEMES[activeRole] || PERSONA_THEMES.MYRAA;
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const avgOutEnergy =
    outputWaveform && outputWaveform.length > 0
      ? outputWaveform.reduce((a, b) => a + b, 0) / outputWaveform.length
      : 0.15;

  const activeEnergy =
    voiceState === "SPEAKING"
      ? avgOutEnergy
      : voiceState === "LISTENING"
      ? Math.max(0.15, micLevel)
      : 0.1;

  const mouthOpenPx =
    voiceState === "SPEAKING"
      ? Math.max(4, Math.min(24, Math.round(avgOutEnergy * 34)))
      : voiceState === "LISTENING"
      ? 4
      : 2;

  const orbScale = 1 + Math.min(0.2, activeEnergy * 0.28);

  const statusText = (() => {
    switch (voiceState) {
      case "CONNECTING":
        return "कनेक्ट हो रहा है...";
      case "LISTENING":
        return "सुन रही हूँ... बोलिए";
      case "THINKING":
        return "सोच रही हूँ...";
      case "SPEAKING":
        return `${theme.name} बोल रही है... (रोकने के लिए बोलें या टैप करें)`;
      case "ERROR":
        return "कनेक्शन में समस्या — दोबारा कोशिश करें";
      default:
        return "बात करने के लिए माइक दबाएँ";
    }
  })();

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none overflow-hidden px-4">
      {/* Ambient radial glow */}
      <div
        className="pointer-events-none absolute w-64 h-64 rounded-full blur-3xl transition-all duration-500 opacity-30"
        style={{
          background: `radial-gradient(circle, ${theme.hex} 0%, transparent 75%)`,
          transform: `scale(${orbScale * 1.15})`,
        }}
      />

      {/* Interactive Center Stage Orb */}
      <button
        type="button"
        onClick={() => liveSession.toggleVoiceSession()}
        aria-label={`${theme.name} voice orb`}
        className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 rounded-full focus:outline-none transition-transform duration-200 active:scale-95"
      >
        {/* Outer reactive ring */}
        <div
          className="absolute inset-0 rounded-full transition-transform duration-100"
          style={{
            border: `2px solid ${theme.hex}`,
            transform: `scale(${orbScale})`,
            boxShadow: `0 0 36px ${theme.hex}33`,
          }}
        />

        {/* Rotating ring */}
        <div
          className={`absolute inset-3 rounded-full border border-dashed ${
            voiceState === "CONNECTING" || voiceState === "THINKING" ? "animate-spin" : ""
          }`}
          style={{
            borderColor: `${theme.hex}66`,
            animationDuration: "8s",
          }}
        />

        {/* Glass sphere */}
        <div
          className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-slate-950/90 backdrop-blur-xl border border-white/15 flex flex-col items-center justify-center overflow-hidden shadow-2xl"
          style={{
            boxShadow: `inset 0 0 32px ${theme.hex}29`,
          }}
        >
          {/* SVG Expressive Face */}
          <svg viewBox="0 0 160 160" className="w-32 h-32 sm:w-36 sm:h-36">
            <path
              d="M42,58 C42,30 118,30 118,58 C118,98 104,126 80,134 C56,126 42,98 42,58 Z"
              fill="rgba(15, 23, 42, 0.9)"
              stroke={theme.hex}
              strokeWidth="2.2"
            />
            <circle cx="80" cy="48" r="3.2" fill={theme.hex} />
            <path
              d={
                voiceState === "THINKING"
                  ? "M54,60 Q64,54 72,60 M88,58 Q96,52 106,58"
                  : "M54,62 Q64,57 72,61 M88,61 Q96,57 106,62"
              }
              stroke={theme.hex}
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
            />
            {blink ? (
              <>
                <line x1="56" y1="72" x2="70" y2="72" stroke={theme.hex} strokeWidth="2.5" strokeLinecap="round" />
                <line x1="90" y1="72" x2="104" y2="72" stroke={theme.hex} strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <ellipse cx="63" cy="72" rx="6.5" ry="5" fill="#0f172a" stroke={theme.hex} strokeWidth="2" />
                <circle cx="63" cy="72" r="2.5" fill={theme.hex} />
                <ellipse cx="97" cy="72" rx="6.5" ry="5" fill="#0f172a" stroke={theme.hex} strokeWidth="2" />
                <circle cx="97" cy="72" r="2.5" fill={theme.hex} />
              </>
            )}
            <path
              d="M80,76 L78,90 L83,91"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.6"
              fill="none"
              strokeLinecap="round"
            />
            {voiceState === "SPEAKING" ? (
              <rect
                x={80 - 13}
                y={106 - mouthOpenPx / 2}
                width={26}
                height={mouthOpenPx}
                rx={mouthOpenPx / 2}
                fill={theme.hex}
                fillOpacity="0.35"
                stroke={theme.hex}
                strokeWidth="2.2"
              />
            ) : (
              <path
                d="M67,105 Q80,113 93,105"
                stroke={theme.hex}
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* 12-bar live audio waveform */}
          <div className="flex items-end justify-center gap-1 h-5 px-4">
            {(outputWaveform && outputWaveform.length === 12
              ? outputWaveform
              : Array.from({ length: 12 }, () => activeEnergy)
            ).map((val, idx) => {
              const barValue = voiceState === "LISTENING" ? Math.max(0.15, micLevel) : val;
              const heightPx = Math.max(4, Math.min(20, Math.round(barValue * 20)));
              return (
                <span
                  key={idx}
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: `${heightPx}px`,
                    backgroundColor: theme.hex,
                    opacity: voiceState === "IDLE" ? 0.35 : 0.9,
                  }}
                />
              );
            })}
          </div>
        </div>
      </button>

      {/* Character Identity & Status */}
      <div className="mt-2.5 text-center max-w-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.hex }} />
          <span className="text-xs font-bold text-white">{theme.name}</span>
          <span className="text-xs text-slate-300">• Voice: {voiceName}</span>
        </div>
        <p className="mt-1 text-xs text-slate-300 font-medium">{statusText}</p>
      </div>
    </div>
  );
};
