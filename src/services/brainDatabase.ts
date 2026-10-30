import { BrainMemory } from "../types";

const BRAIN_STORAGE_KEY = "MyraaBrainDatabase_ShriRamNag_v3";

const INITIAL_MEMORIES: BrainMemory[] = [
  {
    id: "mem-creator-01",
    category: "IDENTITY",
    key: "Nirman Karta & Owner",
    content: "Shri Ram Nag (श्री राम नाग) is the supreme creator, owner, and architect of MYRAA & SHIV AI.",
    timestamp: new Date().toLocaleDateString(),
    tags: ["Owner", "Creator", "Shri Ram Nag"],
  },
  {
    id: "mem-persona-02",
    category: "PREFERENCE",
    key: "Persona & Gemini Realistic Voice Mapping",
    content: "Natural Google AI Studio voice engine: MYRAA (Kore), AURA (Aoede), PIXEL (Despina), CODEX (Puck), SENTINEL (Fenrir), SAGE (Charon).",
    timestamp: new Date().toLocaleDateString(),
    tags: ["Voice", "Persona", "Gemini Audio", "Kore", "Aoede", "Puck"],
  },
  {
    id: "mem-privacy-03",
    category: "FACT",
    key: "Privacy & Storage Security",
    content: "100% on-device private storage with IndexedDB + LocalStorage. Never leaks personal credentials, OTPs, or passwords to third-party telemetries.",
    timestamp: new Date().toLocaleDateString(),
    tags: ["Privacy", "Security", "Local"],
  },
  {
    id: "mem-tools-04",
    category: "PROJECT",
    key: "Shiv-AI-Core Tool Integration",
    content: "Includes all 11 autonomous tools (claude-mem, gsd-core, Agent-Reach, no-ai-slop, ppt-master, video-use, SkillSpector, AI-penetration-testing, SWE-agent, huggingface_hub, gpt-researcher).",
    timestamp: new Date().toLocaleDateString(),
    tags: ["Tools", "Shiv-AI-Core", "Autonomous"],
  },
];

class BrainDatabaseService {
  private memories: BrainMemory[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(BRAIN_STORAGE_KEY);
      if (saved) {
        this.memories = JSON.parse(saved);
      } else {
        this.memories = [...INITIAL_MEMORIES];
        this.saveToStorage();
      }
    } catch {
      this.memories = [...INITIAL_MEMORIES];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(BRAIN_STORAGE_KEY, JSON.stringify(this.memories));
    } catch {}
  }

  public getAll(): BrainMemory[] {
    return [...this.memories];
  }

  public addMemory(category: BrainMemory["category"], key: string, content: string, tags: string[] = []): BrainMemory {
    const mem: BrainMemory = {
      id: "mem-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
      category,
      key,
      content,
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
      appName: "MYRAA v3.0 / SHIV AI",
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
