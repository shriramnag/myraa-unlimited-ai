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
    setStatusMsg("✓ 1-Click Brain DB Backup (.json) डाउनलोड हो गया!");
    setTimeout(() => setStatusMsg(""), 4000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = brainDatabase.importBackupJson(content);
      if (res.ok) {
        refreshList();
        setStatusMsg(`✓ बैकअप से ${res.count} मेमोरीज़ रीस्टोर हो गईं!`);
      } else {
        setStatusMsg(`Error: ${res.error}`);
      }
      setTimeout(() => setStatusMsg(""), 4000);
    };
    reader.readAsText(file);
  };

  const filtered = memories.filter(
    (m) =>
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xl animate-in fade-in duration-150">
      <div className="w-full max-w-[520px] max-h-[85vh] flex flex-col bg-slate-900 border border-sky-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <div className="text-sm font-bold text-slate-100">
                लॉन्ग-टर्म ब्रेन डेटाबेस (Brain Database)
              </div>
              <div className="text-[10px] text-[#00E676] font-mono">
                MyraaBrainDatabase_ShriRamNag • Dual-Layer (IndexedDB + Local)
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

        {/* Action Controls & Backup Row */}
        <div className="p-3 bg-slate-950/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              type="button"
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAdding ? "रद्द करें" : "नई मेमोरी जोड़ें"}</span>
            </button>
            <button
              onClick={handleExportBackup}
              type="button"
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs rounded-xl flex items-center gap-1 transition"
              title="Export full JSON backup"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Backup DB</span>
            </button>
            <label className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 text-xs rounded-xl flex items-center gap-1 transition cursor-pointer">
              <Upload className="w-3 h-3 text-sky-400" />
              <span>Restore DB</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="मेमोरी खोजें..."
              className="pl-8 pr-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 w-36 focus:w-44 transition-all focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Status Alert if any */}
        {statusMsg && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Add Memory Form */}
        {isAdding && (
          <div className="p-4 mx-4 mt-2 bg-slate-950 rounded-2xl border border-sky-500/30 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="शीर्षक (Title, उदा: पसंदीदा संगीत)..."
                className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-2 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="FACT">FACT</option>
                <option value="IDENTITY">IDENTITY</option>
                <option value="PREFERENCE">PREFERENCE</option>
                <option value="PROJECT">PROJECT</option>
                <option value="HABIT">HABIT</option>
                <option value="RELATIONSHIP">RELATIONSHIP</option>
              </select>
            </div>
            <textarea
              rows={2}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="विस्तार से विवरण लिखें जो MYRAA हमेशा याद रखेगी..."
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
            />
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="टैग्स (कॉमा से अलग, उदा: Music, Daily)"
                className="flex-1 mr-2 px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white"
              />
              <button
                onClick={handleAdd}
                type="button"
                className="px-3 py-1.5 bg-[#00E676] text-black font-bold text-xs rounded-lg"
              >
                सेव करें
              </button>
            </div>
          </div>
        )}

        {/* Memory Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              कोई मेमोरी नहीं मिली।
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-slate-950/70 border border-white/10 rounded-2xl hover:border-white/20 transition flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      {m.category}
                    </span>
                    <span className="text-xs font-bold text-slate-200">{m.key}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    type="button"
                    className="p-1 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-2 select-text">{m.content}</p>
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <div className="flex gap-1 flex-wrap">
                    {m.tags.map((t, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <span>{m.timestamp}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
