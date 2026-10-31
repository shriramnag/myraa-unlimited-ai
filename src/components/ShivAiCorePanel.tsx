import React, { useState } from "react";
import { X, Sparkles, Youtube, Play, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { shivAiCore, ShivSkillModule } from "../services/shivAiCore";
import { youtubeSkillEngine, YouTubeGenerationResult } from "../services/youtubeSkillEngine";

interface ShivAiCorePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRunToolResult?: (toolName: string, prompt: string, output: string) => void;
}

export const ShivAiCorePanel: React.FC<ShivAiCorePanelProps> = ({
  isOpen,
  onClose,
  onRunToolResult,
}) => {
  const [tab, setTab] = useState<"TOOLS" | "YOUTUBE">("TOOLS");
  const [modules] = useState<ShivSkillModule[]>(() => shivAiCore.getModules());
  const [selectedModuleId, setSelectedModuleId] = useState<ShivSkillModule["id"]>("gpt-researcher");
  const [toolInput, setToolInput] = useState("");
  const [toolOutput, setToolOutput] = useState("");
  const [isRunningTool, setIsRunningTool] = useState(false);
  const [toolError, setToolError] = useState("");

  const [ytTopic, setYtTopic] = useState("");
  const [selectedYtSkill, setSelectedYtSkill] = useState("yt-viral-hook");
  const [ytResult, setYtResult] = useState<YouTubeGenerationResult | null>(null);
  const [isRunningYt, setIsRunningYt] = useState(false);
  const [ytError, setYtError] = useState("");

  if (!isOpen) return null;

  const activeModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const ytSkills = youtubeSkillEngine.getSkills();

  const handleRunTool = async (e: React.FormEvent) => {
    e.preventDefault();
    setToolError("");
    setToolOutput("");
    setIsRunningTool(true);
    try {
      const res = await shivAiCore.executeSkillModule(activeModule.id, toolInput);
      setToolOutput(res);
      onRunToolResult?.(activeModule.name, toolInput, res);
    } catch (err: any) {
      setToolError(err?.message || String(err));
    } finally {
      setIsRunningTool(false);
    }
  };

  const handleRunYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    setYtError("");
    setYtResult(null);
    setIsRunningYt(true);
    try {
      const res = await youtubeSkillEngine.generateCreatorPackage(ytTopic, selectedYtSkill);
      setYtResult(res);
      onRunToolResult?.("YouTube Creator Studio", ytTopic, res.hookScript);
    } catch (err: any) {
      setYtError(err?.message || String(err));
    } finally {
      setIsRunningYt(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">रिसर्च, राइटिंग और YouTube स्टूडियो</h2>
              <p className="text-xs text-slate-400">100% असली Gemini AI और लोकल मेमोरी टूल्स</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Studio Panel"
            className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-white/10 px-5 pt-2 gap-2 bg-slate-900/30">
          <button
            type="button"
            onClick={() => setTab("TOOLS")}
            className={`h-12 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              tab === "TOOLS"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>4 AI टूल्स (Research & Memory)</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("YOUTUBE")}
            className={`h-12 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              tab === "YOUTUBE"
                ? "border-red-400 text-red-300"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Youtube className="w-4 h-4" />
            <span>YouTube क्रिएटर स्टूडियो</span>
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {tab === "TOOLS" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {modules.map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => {
                      setSelectedModuleId(mod.id);
                      setToolOutput("");
                      setToolError("");
                    }}
                    className={`p-3.5 rounded-xl border text-left transition ${
                      selectedModuleId === mod.id
                        ? "bg-cyan-500/15 border-cyan-400 text-white"
                        : "bg-slate-900/70 border-white/10 text-slate-300 hover:border-white/25"
                    }`}
                  >
                    <p className="text-sm font-bold">{mod.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{mod.hindiSummary}</p>
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleRunTool}
                className="space-y-3 p-4 rounded-xl bg-slate-900 border border-white/10"
              >
                <label className="block text-xs font-semibold text-cyan-300">
                  {activeModule.name} — इनपुट लिखें:
                </label>
                <textarea
                  rows={3}
                  value={toolInput}
                  onChange={(e) => setToolInput(e.target.value)}
                  placeholder={activeModule.inputPlaceholder}
                  className="w-full p-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={isRunningTool}
                  className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {isRunningTool ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>प्रोसेस हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>टूल चलाएँ</span>
                    </>
                  )}
                </button>
              </form>

              {toolError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{toolError}</span>
                </div>
              )}

              {toolOutput && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>परिणाम:</span>
                  </div>
                  <pre className="text-xs sm:text-sm text-slate-100 whitespace-pre-wrap font-sans leading-relaxed">
                    {toolOutput}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <>
              <form
                onSubmit={handleRunYoutube}
                className="space-y-3 p-4 rounded-xl bg-slate-900 border border-white/10"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      YouTube टूल चुनें
                    </label>
                    <select
                      value={selectedYtSkill}
                      onChange={(e) => setSelectedYtSkill(e.target.value)}
                      className="w-full h-12 px-3 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
                    >
                      {ytSkills.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.hindiTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      वीडियो का विषय (Topic)
                    </label>
                    <input
                      type="text"
                      value={ytTopic}
                      onChange={(e) => setYtTopic(e.target.value)}
                      placeholder="जैसे: 2026 में YouTube चैनल कैसे ग्रो करें"
                      className="w-full h-12 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isRunningYt}
                  className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2"
                >
                  {isRunningYt ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini से तैयार किया जा रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Youtube className="w-4 h-4" />
                      <span>पूरा YouTube पैकेज बनाएँ</span>
                    </>
                  )}
                </button>
              </form>

              {ytError && (
                <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{ytError}</span>
                </div>
              )}

              {ytResult && (
                <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-white/10">
                  <div>
                    <h4 className="text-xs font-semibold text-red-300 uppercase">
                      सुझाए गए टाइटल (High CTR Titles)
                    </h4>
                    <ul className="mt-1.5 space-y-1 text-sm text-white list-disc list-inside">
                      {ytResult.titleOptions.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-cyan-300 uppercase">
                      शुरुआती 15-सेकंड हुक स्क्रिप्ट
                    </h4>
                    <p className="mt-1 text-sm text-slate-100 whitespace-pre-wrap">
                      {ytResult.hookScript}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-amber-300 uppercase">थंबनेल आइडिया</h4>
                    <p className="mt-1 text-xs sm:text-sm text-slate-200">
                      {ytResult.thumbnailPrompt}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-300 uppercase">
                      रिटेंशन रणनीति
                    </h4>
                    <p className="mt-1 text-xs sm:text-sm text-slate-200">
                      {ytResult.retentionStrategy}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-purple-300 uppercase">SEO टैग्स</h4>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ytResult.seoTags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
