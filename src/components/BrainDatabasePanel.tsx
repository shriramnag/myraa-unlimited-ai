import React, { useState } from "react";
import { brainDatabase } from "../services/brainDatabase";
import { BrainMemory } from "../types";
import { Database, Download, Upload, Plus, Trash2, Search, X, Check, AlertCircle } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onMemoryAdded: (mem: BrainMemory) => void;
}

export const BrainDatabasePanel: React.FC<Props> = ({ isOpen, onClose, onMemoryAdded }) => {
  const [memories, setMemories] = useState<BrainMemory[]>(brainDatabase.getAll());
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<BrainMemory["category"]>("FACT");
  const [newTags, setNewTags] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  if (!isOpen) return null;

  const refreshList = () => {
    setMemories(brainDatabase.getAll());
  };

  const handleAdd = () => {
    if (!newKey.trim() || !newContent.trim()) {
      setStatusMsg("कृपया शीर्षक और विवरण दोनों भरें।");
      return;
    }
    const tagsArr = newTags.split(",").map((t) => t.trim()).filter(Boolean);
    const m = brainDatabase.addMemory(newCategory, newKey.trim(), newContent.trim(), tagsArr);
    refreshList();
    setIsAdding(false);
    setNewKey("");
    setNewContent("");
    setNewTags("");
    setStatusMsg("✓ नई मेमोरी सफलतापूर्वक सेव की गई!");
    onMemoryAdded(m);
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleDelete = (id: string) => {
    brainDatabase.deleteMemory(id);
    refreshList();
    setStatusMsg("✓ मेमोरी डिलीट की गई।");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = brainDatabase.exportBackupJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Myraa_BrainDB_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg("✓ बैकअप JSON फाइल डाउनलोड हो गई!");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const filtered = memories.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.key.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[500px] max-h-[85vh] flex flex-col bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm font-bold text-white">लॉन्ग-टर्म ब्रेन डेटाबेस (Brain Database)</div>
              <div className="text-[10px] text-purple-300 font-mono">
                ओनर: श्री राम नाग • 100% On-Device Private
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

        {/* Toolbar */}
        <div className="p-3 border-b border-white/5 bg-slate-950/40 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="मेमोरी खोजें..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            type="button"
            className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? "रद्द" : "नया"}</span>
          </button>
          <button
            onClick={handleExportBackup}
            type="button"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 transition"
            title="Export JSON Backup"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {statusMsg && (
          <div className="px-4 py-1.5 text-xs text-emerald-400 bg-emerald-950/40 border-b border-emerald-500/20 font-medium">
            {statusMsg}
          </div>
        )}

        {/* Add Memory Form */}
        {isAdding && (
          <div className="p-3.5 bg-slate-950/90 border-b border-purple-500/30 space-y-2">
            <div className="text-xs font-bold text-purple-300">नई मेमोरी दर्ज करें:</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="शीर्षक (e.g. पसंद, प्रोजेक्ट, फैक्ट)..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-purple-300"
              >
                <option value="FACT">FACT</option>
                <option value="IDENTITY">IDENTITY</option>
                <option value="PREFERENCE">PREFERENCE</option>
                <option value="PROJECT">PROJECT</option>
                <option value="HABIT">HABIT</option>
              </select>
            </div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="मेमोरी का पूरा विवरण..."
              rows={2}
              className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 resize-none"
            />
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="टैग्स (कॉमा से अलग करें)..."
                className="flex-1 mr-2 px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500"
              />
              <button
                onClick={handleAdd}
                type="button"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                सेव करें
              </button>
            </div>
          </div>
        )}

        {/* List of Memories */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-2xl bg-slate-950/70 border border-white/5 hover:border-white/15 transition space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {m.category}
                  </span>
                  <span className="text-xs font-bold text-white">{m.key}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-slate-500 font-mono">{m.timestamp}</span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    type="button"
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-slate-300 leading-relaxed">{m.content}</div>
              {m.tags && m.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {m.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[8px] font-mono text-slate-400 px-1.5 py-0.2 rounded bg-white/5"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
