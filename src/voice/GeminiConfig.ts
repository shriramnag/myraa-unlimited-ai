import { GoogleGenAI } from "@google/genai";

/**
 * Centralized Gemini Model IDs & API Key Resolution
 * Single source of truth for all Live, TTS, and Text models.
 */
export const GEMINI_MODELS = {
  /** Primary & fallback candidates for Gemini Live real-time bidirectional voice */
  LIVE_CANDIDATES: [
    "gemini-3.8-live",
    "gemini-2.5-flash-native-audio-preview-12-2025",
    "gemini-live-2.5-flash-preview",
    "gemini-2.0-flash-live-001",
  ] as const,

  /** Extended thinking Live candidate */
  LIVE_EXTENDED_THINKING_CANDIDATES: [
    "gemini-3.8-live-extended-thinking",
    "gemini-3.8-live",
    "gemini-2.5-flash-native-audio-preview-12-2025",
    "gemini-live-2.5-flash-preview",
  ] as const,

  /** Read-aloud TTS candidates (replay button, voice preview, diagnostics test) */
  TTS_CANDIDATES: [
    "gemini-3.8-flash-tts",
    "gemini-3.8-flash-lite-tts",
    "gemini-2.5-flash-preview-tts",
  ] as const,

  /** Text / Deep Research / Rewriting candidates */
  TEXT_CANDIDATES: [
    "gemini-3.8-flash",
    "gemini-2.5-flash",
  ] as const,
};

const STORAGE_KEY_PRIMARY = "GEMINI_API_KEY";
const STORAGE_KEY_LEGACY = "MYRAA_GEMINI_KEY";

/**
 * Resolves the Gemini API key in strict priority order:
 * 1. User-entered key in localStorage
 * 2. AI Studio injected environment key (import.meta.env / process.env / window)
 * Never hard-codes or logs the key value.
 */
export function resolveGeminiApiKey(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const userKey =
        window.localStorage.getItem(STORAGE_KEY_PRIMARY) ||
        window.localStorage.getItem(STORAGE_KEY_LEGACY);
      if (userKey && isPlausibleKey(userKey.trim())) {
        return userKey.trim();
      }
    }
  } catch {
    // Ignore storage read error
  }

  try {
    const envMeta = (import.meta as any)?.env;
    const candidates = [
      envMeta?.VITE_GEMINI_API_KEY,
      envMeta?.GEMINI_API_KEY,
      (globalThis as any)?.process?.env?.GEMINI_API_KEY,
      typeof window !== "undefined" ? (window as any).__GEMINI_API_KEY__ : undefined,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && isPlausibleKey(c.trim())) {
        return c.trim();
      }
    }
  } catch {
    // Ignore env read error
  }

  return "";
}

export function isPlausibleKey(key: string): boolean {
  if (!key || key.length < 15) return false;
  const lower = key.toLowerCase();
  if (
    lower.startsWith("your_") ||
    lower.startsWith("placeholder") ||
    lower.startsWith("aizasydummy") ||
    lower === "undefined" ||
    lower === "null"
  ) {
    return false;
  }
  return true;
}

export function saveUserGeminiApiKey(key: string): void {
  const trimmed = key.trim();
  try {
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY_PRIMARY, trimmed);
      window.localStorage.setItem(STORAGE_KEY_LEGACY, trimmed);
    } else {
      window.localStorage.removeItem(STORAGE_KEY_PRIMARY);
      window.localStorage.removeItem(STORAGE_KEY_LEGACY);
    }
  } catch {
    // Ignore storage write error
  }
}

export function hasConfiguredApiKey(): boolean {
  return isPlausibleKey(resolveGeminiApiKey());
}

/**
 * Redacts any API key from log or error messages so keys are never printed.
 */
export function redactSecrets(input: string): string {
  if (!input) return "";
  let out = input.replace(/AIza[0-9A-Za-z\-_]{20,}/g, "AIza[REDACTED]");
  const currentKey = resolveGeminiApiKey();
  if (currentKey && currentKey.length >= 8) {
    out = out.split(currentKey).join("[REDACTED_KEY]");
  }
  return out;
}

export function createGenAIClient(overrideKey?: string): GoogleGenAI {
  const apiKey = (overrideKey ?? resolveGeminiApiKey()).trim();
  if (!isPlausibleKey(apiKey)) {
    throw new Error("MISSING_API_KEY: Gemini API Key कॉन्फ़िगर नहीं है।");
  }
  return new GoogleGenAI({ apiKey });
}

export function isModelNotFoundError(err: unknown): boolean {
  const msg = String((err as any)?.message || err || "").toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("404") ||
    msg.includes("not supported") ||
    msg.includes("invalid model") ||
    msg.includes("does not exist") ||
    msg.includes("is not found for api version")
  );
}

/**
 * Validates an API key by performing a minimal text generation check across TEXT_CANDIDATES.
 */
export async function validateGeminiApiKey(
  candidateKey?: string,
  onLog?: (msg: string) => void
): Promise<{ valid: boolean; workingModel?: string; error?: string }> {
  const keyToTest = (candidateKey ?? resolveGeminiApiKey()).trim();
  if (!isPlausibleKey(keyToTest)) {
    return { valid: false, error: "API Key खाली या अमान्य प्रारूप में है।" };
  }

  const ai = new GoogleGenAI({ apiKey: keyToTest });
  let lastError = "";

  for (const model of GEMINI_MODELS.TEXT_CANDIDATES) {
    try {
      onLog?.(`[KeyCheck] Testing key with model ${model}...`);
      const res = await ai.models.generateContent({
        model,
        contents: "Reply with OK",
        config: { maxOutputTokens: 5 },
      });
      if (res && (res.text || res.candidates?.length)) {
        onLog?.(`[KeyCheck] Success! Working model: ${model}`);
        return { valid: true, workingModel: model };
      }
    } catch (err: any) {
      const cleanErr = redactSecrets(String(err?.message || err));
      lastError = cleanErr;
      onLog?.(`[KeyCheck] Candidate ${model} failed: ${cleanErr}`);
      if (!isModelNotFoundError(err)) {
        return { valid: false, error: cleanErr };
      }
    }
  }

  return { valid: false, error: lastError || "सभी मॉडल उम्मीदवारों पर जांच विफल रही।" };
}
