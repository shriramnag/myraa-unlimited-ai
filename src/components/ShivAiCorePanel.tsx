import React, { useState } from "react";
import { SHIV_AI_11_TOOLS, executeShivAiTool } from "../services/shivAiCore";
import { YOUTUBE_11_SKILLS, executeYouTubeSkill, YouTubeSkill } from "../services/youtubeSkillEngine";
import { ShivAiTool } from "../types";
import { Sparkles, Terminal, Play, CheckCircle2, Search, ExternalLink, X, Video, Cpu, Copy, Check } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRunToolResult: (toolName: string, prompt: string, output: string) => void;
}

export const ShivAiCorePanel: React.FC<Props> = ({ isOpen, onClose, onRunToolResult }) => {
  const [activeTab, setActiveTab] = useState<"CORE" | "YOUTUBE">("CORE");
  // Core Tool state
  const [selectedTool, setSelectedTool] = useState<ShivAiTool>(SHIV_AI_11_TOOLS[10]); // Default gpt-researcher
  // YouTube Skill state
  const [selectedYtSkill, setSelectedYtSkill] = useState<YouTubeSkill>(YOUTUBE_11_SKILLS[0]); // Default YT Script Writer
  const [promptText, setPromptText] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [lastOutput, setLastOutput] = useState<{ title: string; output: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsRunning(true);
    setCopied(false);
    try {
      if (activeTab === "CORE") {
        const query = promptText || `${selectedTool.name} से विश्लेषण व रिपोर्ट तैयार करें`;
        const res = await executeShivAiTool(selectedTool.id, query);
        setLastOutput({ title: res.tool.name, output: res.output });
        onRunToolResult(res.tool.name, query, res.output);
      } else {
        const query = promptText || `${selectedYtSkill.name}: ${selectedYtSkill.hindiTitle}`;
        const res = await executeYouTubeSkill(selectedYtSkill.id, query);
        setLastOutput({ title: res.skill.name, output: res.output });
        onRunToolResult(res.skill.name, query, res.output);
      }
    } catch (e: any) {
      setLastOutput({ title: "Error", output: `Error: ${e.message || "Failed to execute"}` });
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyOutput = () => {
    if (!lastOutput) return;
    navigator.clipboard?.writeText(lastOutput.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[530px] max-h-[88vh] flex flex-col bg-slate-900 border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeTab === "CORE" ? "🔱" : "🎬"}</span>
            <div>
              <div className="text-sm font-bold text-slate-100">
                {activeTab === "CORE" ? "शिव एआई कोर (Shiv-AI-Core)" : "YouTube Creator Skill Engine"}
              </div>
              <div className="text-[10px] text-[#00E676] font-mono">
                ओनर: श्री राम नाग (Shri Ram Nag) • 11 Autonomous Skills
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

        {/* Tab Selector */}
        <div className="flex border-b border-white/10 bg-slate-950/50">
          <button
            onClick={() => {
              setActiveTab("CORE");
              setLastOutput(null);
            }}
            type="button"
            className={`flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
              activeTab === "CORE"
                ? "border-sky-400 text-sky-400 bg-sky-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Shiv-AI-Core (11 Tools)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("YOUTUBE");
              setLastOutput(null);
            }}
            type="button"
            className={`flex-1 py-2.5 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition border-b-2 ${
              activeTab === "YOUTUBE"
                ? "border-red-500 text-red-400 bg-red-500/10"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>YouTube Engine (11 Skills)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === "CORE" ? (
            /* Shiv-AI-Core 11 Tools Grid */
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
          ) : (
            /* YouTube 11 Skills Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {YOUTUBE_11_SKILLS.map((s) => {
                const isSelected = selectedYtSkill.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedYtSkill(s);
                      setLastOutput(null);
                    }}
                    type="button"
                    className={`p-2.5 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? "bg-red-500/20 border-red-500 shadow-md shadow-red-500/20"
                        : "bg-slate-950/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{s.icon}</span>
                      <span className="text-[9px] font-mono font-bold text-slate-400">
                        #{s.index}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white truncate">{s.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{s.hindiTitle}</div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Prompt & Run Input */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className={`font-bold ${activeTab === "CORE" ? "text-sky-400" : "text-red-400"}`}>
                {activeTab === "CORE" ? selectedTool.name : selectedYtSkill.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                {activeTab === "CORE" ? selectedTool.hindiDesc : selectedYtSkill.hindiTitle}
              </span>
            </div>

            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={
                activeTab === "CORE"
                  ? `निर्देश दें (उदा: '${selectedTool.name} से विश्लेषण व रिपोर्ट तैयार करें')...`
                  : selectedYtSkill.promptPlaceholder
              }
              className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              onKeyDown={(e) => e.key === "Enter" && handleExecute()}
            />

            <button
              onClick={handleExecute}
              disabled={isRunning}
              type="button"
              className={`w-full py-2.5 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 ${
                activeTab === "CORE"
                  ? "bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500"
                  : "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-white"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {isRunning
                  ? "निष्पादित हो रहा है..."
                  : activeTab === "CORE"
                  ? "टूल निष्पादित करें (Execute Tool)"
                  : "यूट्यूब स्किल चलाएं (Execute YT Skill)"}
              </span>
            </button>
          </div>

          {/* Last Output Viewer */}
          {lastOutput && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>आउटपुट रिपोर्ट: {lastOutput.title}</span>
                </span>
                <button
                  onClick={handleCopyOutput}
                  type="button"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] transition"
                  title="Copy Output"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="text-[11px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                {lastOutput.output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
