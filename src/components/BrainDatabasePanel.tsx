import React, { useState, useEffect } from "react";
import { X, Brain, Plus, Trash2, Download, Search } from "lucide-react";
import { brainDatabase } from "../services/brainDatabase";
import { BrainMemory } from "../types";

interface BrainDatabasePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryAdded?: (mem: BrainMemory) => void;
}

export const BrainDatabasePanel: React.FC<BrainDatabasePanelProps> = ({
  isOpen,
  onClose,
  onMemoryAdded,
}) => {
  const [memories, setMemories] = useState<BrainMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newMemoryText, setNewMemoryText] = useState("");
  const [category, setCategory] = useState<BrainMemory["category"]>("FACT");

  useEffect(() => {
    if (!isOpen) return;
    setMemories(brainDatabase.getAll());
    const unsub = brainDatabase.subscribe((list) => {
      setMemories(list);
    });
    return () => {
      unsub();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = memories.filter(
    (m) =>
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryText.trim()) return;
    const title = newKey.trim() || newMemoryText.trim().slice(0, 32);
    const created = brainDatabase.addMemory(category, title, newMemoryText.trim(), ["Manual"]);
    setNewKey("");
    setNewMemoryText("");
    onMemoryAdded?.(created);
  };

  const handleExport = () => {
    const json = brainDatabase.exportBackupJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `myraa-brain-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-950 border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white">मेमोरी और ब्रेन डेटाबेस (Brain DB)</h2>
              <p className="text-xs text-slate-400">
                ऑन-डिवाइस मेमोरी स्टोर ({memories.length} यादें)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="h-12 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Brain DB"
              className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <form
            onSubmit={handleAddMemory}
            className="space-y-2.5 p-3.5 rounded-xl bg-slate-900/80 border border-white/10"
          >
            <label className="block text-xs font-semibold text-slate-300">
              नई याद या नियम जोड़ें (यह लाइव बातचीत में मायरा को याद रहेगा)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BrainMemory["category"])}
                className="h-12 px-3 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
              >
                <option value="FACT">तथ्य (Fact)</option>
                <option value="PREFERENCE">पसंद (Preference)</option>
                <option value="PROJECT">प्रोजेक्ट (Project)</option>
                <option value="HABIT">आदत (Habit)</option>
                <option value="RELATIONSHIP">संपर्क (Contact)</option>
              </select>
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="शीर्षक (जैसे: राहुल का नंबर)"
                className="h-12 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-xs text-white"
              />
              <input
                type="text"
                value={newMemoryText}
                onChange={(e) => setNewMemoryText(e.target.value)}
                placeholder="विवरण लिखें..."
                className="h-12 px-3.5 rounded-xl bg-slate-950 border border-white/15 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>मेमोरी सहेजें</span>
            </button>
          </form>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="यादें खोजें..."
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-900 border border-white/10 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">कोई मेमोरी नहीं मिली।</p>
            ) : (
              filtered.map((mem) => (
                <div
                  key={mem.id}
                  className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/10"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300">
                        {mem.category}
                      </span>
                      <span className="text-xs font-bold text-white">{mem.key}</span>
                      <span className="text-xs text-slate-400">{mem.timestamp}</span>
                    </div>
                    <p className="text-sm text-slate-100 leading-relaxed">{mem.content}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => brainDatabase.deleteMemory(mem.id)}
                    aria-label="Delete memory"
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
