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
          {/* Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SHIV_AI_11_TOOLS.map((t) => {
              const isSelected = selectedTool.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTool(t);
                    setLastOutput(null);
                  }}
                  type="button"
                  className={`p-2.5 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? "bg-sky-500/20 border-sky-400 shadow-md shadow-sky-500/20"
                      : "bg-slate-950/60 border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{t.icon}</span>
                    <span className="text-[9px] font-mono font-bold text-slate-400">
                      #{t.index}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white truncate">{t.name}</div>
                  <div className="text-[9px] text-slate-400 truncate">{t.hindiDesc}</div>
                </button>
              );
            })}
          </div>

          {/* Prompt & Run Input */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-400">
                {selectedTool.name} ({selectedTool.category})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedTool.hindiDesc}
              </span>
            </div>

            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={`निर्देश दें (उदा: '${selectedTool.name} से विश्लेषण व रिपोर्ट तैयार करें')...`}
              className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              onKeyDown={(e) => e.key === "Enter" && handleExecute()}
            />

            <button
              onClick={handleExecute}
              disabled={isRunning}
              type="button"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? "निष्पादित हो रहा है..." : "टूल निष्पादित करें (Execute)"}</span>
            </button>
          </div>

          {/* Last Output Viewer */}
          {lastOutput && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>आउटपुट रिपोर्ट: {lastOutput.tool.name}</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">COMPLETED & VERIFIED</span>
              </div>
              <pre className="text-[11px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto">
                {lastOutput.output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
