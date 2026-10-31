import { BrainMemory } from "../types";

const BRAIN_STORAGE_KEY = "MyraaBrainDatabase_ShriRamNag_v3";

const INITIAL_MEMORIES: BrainMemory[] = [
  {
    id: "mem-creator-01",
    category: "IDENTITY",
    key: "Creator & Owner",
    content: "Shri Ram Nag (श्री राम नाग) is the creator and owner of MYRAA (SHIV AI).",
    timestamp: new Date().toLocaleDateString(),
    tags: ["Owner", "Creator", "Shri Ram Nag"],
  },
  {
    id: "mem-persona-02",
    category: "PREFERENCE",
    key: "Character Voices",
    content: "Gemini Live & TTS voices: MYRAA (Kore), AURA (Aoede), PIXEL (Despina), CODEX (Puck), SENTINEL (Fenrir), SAGE (Charon).",
    timestamp: new Date().toLocaleDateString(),
    tags: ["Voice", "Persona", "Gemini Live"],
  },
  {
    id: "mem-privacy-03",
    category: "FACT",
    key: "On-Device Privacy",
    content: "Memories are stored locally on-device in localStorage and can be exported or imported as JSON backups.",
    timestamp: new Date().toLocaleDateString(),
    tags: ["Privacy", "Local"],
  },
];

class BrainDatabaseService {
  private memories: BrainMemory[] = [];
  private listeners: Set<(memories: BrainMemory[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(BRAIN_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memories = parsed;
          return;
        }
      }
      this.memories = [...INITIAL_MEMORIES];
      this.saveToStorage();
    } catch {
      this.memories = [...INITIAL_MEMORIES];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(BRAIN_STORAGE_KEY, JSON.stringify(this.memories));
    } catch {}
    this.notify();
  }

  private notify() {
    const copy = this.getAll();
    this.listeners.forEach((fn) => fn(copy));
  }

  public subscribe(fn: (memories: BrainMemory[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.getAll());
    return () => this.listeners.delete(fn);
  }

  public getAll(): BrainMemory[] {
    return [...this.memories];
  }

  public search(query: string): BrainMemory[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll().slice(0, 10);
    return this.memories.filter(
      (m) =>
        m.key.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  public getCompactSummaryForPrompt(limit: number = 8): string {
    return this.memories
      .slice(0, limit)
      .map((m) => `- [${m.category}] ${m.key}: ${m.content}`)
      .join("\n");
  }

  public addMemory(
    category: BrainMemory["category"],
    key: string,
    content: string,
    tags: string[] = []
  ): BrainMemory {
    const mem: BrainMemory = {
      id: "mem-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
      category,
      key: key.trim() || "Note",
      content: content.trim(),
      timestamp: new Date().toLocaleDateString(),
      tags,
    };
    this.memories.unshift(mem);
    this.saveToStorage();
    return mem;
  }

  public deleteMemory(id: string): boolean {
    this.memories = this.memories.filter((m) => m.id !== id);
    this.saveToStorage();
    return true;
  }

  public exportBackupJson(): string {
    const backup = {
      appName: "MYRAA v7.0.65 / SHIV AI",
      databaseName: "MyraaBrainDatabase_ShriRamNag",
      owner: "Shri Ram Nag (श्री राम नाग)",
      exportedAt: new Date().toISOString(),
      count: this.memories.length,
      memories: this.memories,
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackupJson(jsonStr: string): { ok: boolean; count: number; error?: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.memories)) {
        this.memories = data.memories;
        this.saveToStorage();
        return { ok: true, count: this.memories.length };
      }
      return { ok: false, count: 0, error: "Invalid backup format: missing memories array." };
    } catch (e: any) {
      return { ok: false, count: 0, error: e.message || "Failed to parse JSON file." };
    }
  }
}

export const brainDatabase = new BrainDatabaseService();
