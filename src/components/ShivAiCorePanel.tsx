import React, { useState } from "react";
import { SHIV_AI_11_TOOLS, executeShivAiTool } from "../services/shivAiCore";
import { ShivAiTool } from "../types";
import { Sparkles, Terminal, Play, CheckCircle2, Search, ExternalLink, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRunToolResult: (toolName: string, prompt: string, output: string) => void;
}

export const ShivAiCorePanel: React.FC<Props> = ({ isOpen, onClose, onRunToolResult }) => {
  const [selectedTool, setSelectedTool] = useState<ShivAiTool>(SHIV_AI_11_TOOLS[10]); // Default gpt-researcher
  const [promptText, setPromptText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [lastOutput, setLastOutput] = useState<{ tool: ShivAiTool; output: string } | null>(null);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsRunning(true);
    const query = promptText || `${selectedTool.name} से विश्लेषण व रिपोर्ट तैयार करें`;
    try {
      const res = await executeShivAiTool(selectedTool.id, query);
      setLastOutput({ tool: res.tool, output: res.output });
      onRunToolResult(res.tool.name, query, res.output);
    } catch (e: any) {
      setLastOutput({ tool: selectedTool, output: `Error: ${e.message || "Failed to execute"}` });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[520px] max-h-[85vh] flex flex-col bg-slate-900 border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔱</span>
            <div>
              <div className="text-sm font-bold text-slate-100">
                शिव एआई कोर (Shiv-AI-Core) • 11 ऑटोनॉमस टूल्स
              </div>
              <div className="text-[10px] text-[#00E676] font-mono">
                ओनर: श्री राम नाग (Shri Ram Nag) • 100% Free Forever
              </div>
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prompt Input Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
              <span>रिसर्च या कोडिंग कमांड (Prompt):</span>
              <span className="text-[9px] text-sky-400">टूल: {selectedTool.name}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={`उदा: '${selectedTool.name} से AI के भविष्य पर रिपोर्ट बनाओ'...`}
                className="flex-1 px-3 py-2 bg-slate-950 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleExecute();
                }}
              />
              <button
                onClick={handleExecute}
                disabled={isRunning}
                type="button"
                className="px-4 py-2 bg-[#00E676] hover:bg-[#00E676]/90 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-lg"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? "चल रहा है..." : "चलाएं"}</span>
              </button>
            </div>
          </div>

          {/* Last Output Banner */}
          {lastOutput && (
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-[#00E676]/50 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-bold text-[#00E676] mb-1.5">
                <span>⚡ टूल आउटपुट: {lastOutput.tool.name}</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> VERIFIED
                </span>
              </div>
              <div className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed max-h-[160px] overflow-y-auto select-text pr-1">
                {lastOutput.output}
              </div>
            </div>
          )}

          {/* 11 Tools Grid */}
          <div>
            <div className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>उपलब्ध 11 ऑटोनॉमस टूल्स सूची:</span>
              <span className="text-[9px] text-[#00E676]">🟢 ALL 11 READY</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SHIV_AI_11_TOOLS.map((t) => {
                const isSelected = selectedTool.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTool(t)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-800 border-sky-400 shadow-lg"
                        : "bg-slate-950/70 border-white/10 hover:border-white/20 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{t.icon}</span>
                        <span className="text-[11px] font-bold text-white">
                          #{t.index} {t.name}
                        </span>
                      </div>
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                        {t.category}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{t.hindiDesc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
