import React, { useState, useEffect } from "react";
import { CharacterRole } from "../types";
import { ROLE_THEMES } from "./HolographicAvatarStage";
import { Copy, Check, X, Sparkles } from "lucide-react";

interface Props {
  role: CharacterRole;
  userPrompt: string;
  replyText: string;
  toolId?: string;
  onClose: () => void;
}

export const LiveChatBubble: React.FC<Props> = ({
  role,
  userPrompt,
  replyText,
  toolId,
  onClose,
}) => {
  const [displayText, setDisplayText] = useState("");
  const [copied, setCopied] = useState(false);
  const theme = ROLE_THEMES[role] || ROLE_THEMES.MYRAA;

  useEffect(() => {
    if (!replyText) {
      setDisplayText("");
      return;
    }

    setDisplayText("");
    let idx = 0;
    const step = Math.max(2, Math.ceil(replyText.length / 45));
    const timer = setInterval(() => {
      idx += step;
      if (idx >= replyText.length) {
        setDisplayText(replyText);
        clearInterval(timer);
      } else {
        setDisplayText(replyText.slice(0, idx) + " ▍");
      }
    }, 28);

    return () => clearInterval(timer);
  }, [replyText]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(replyText || displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!replyText && !userPrompt) return null;

  return (
    <div
      className="w-full max-w-[460px] mx-auto p-3 rounded-2xl bg-slate-900/95 border backdrop-blur-xl shadow-2xl transition-all duration-300"
      style={{ borderColor: theme.hex }}
    >
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" style={{ color: theme.hex }} />
          <span className="text-[11px] font-bold" style={{ color: theme.hex }}>
            {theme.badge}
          </span>
          {toolId && (
            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/40">
              ⚡ {toolId}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            type="button"
            className="flex items-center gap-1 px-2 py-0.5 text-[9px] text-slate-300 bg-white/10 hover:bg-white/20 rounded-md transition"
            title="Copy text"
          >
            {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={onClose}
            type="button"
            className="p-1 text-slate-400 hover:text-white rounded-md transition"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {userPrompt && (
        <div className="text-[10px] text-sky-400 font-medium mb-1 truncate">
          आप: "{userPrompt}"
        </div>
      )}

      <div className="text-[11px] text-slate-100 leading-relaxed max-h-[110px] overflow-y-auto whitespace-pre-wrap select-text pr-1">
        {displayText || replyText}
      </div>
    </div>
  );
};
