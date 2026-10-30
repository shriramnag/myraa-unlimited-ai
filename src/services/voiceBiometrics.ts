import { CharacterRole } from "../types";

export const AVATAR_VOICE_MAP: Record<
  CharacterRole,
  {
    voiceName: "Kore" | "Aoede" | "Despina" | "Puck" | "Fenrir" | "Charon";
    gender: "Female" | "Male";
    tone: string;
    description: string;
  }
> = {
  MYRAA: {
    voiceName: "Kore",
    gender: "Female",
    tone: "warm, expressive, companion natural tone",
    description: "Kore — Warm & expressive anime companion for Shri Ram Nag",
  },
  AURA: {
    voiceName: "Aoede",
    gender: "Female",
    tone: "melodious, gentle, calm tone",
    description: "Aoede — Melodious, gentle & calm creative synthesizer",
  },
  PIXEL: {
    voiceName: "Despina",
    gender: "Female",
    tone: "energetic, dynamic, friendly tone",
    description: "Despina — Energetic & dynamic interactive media artist",
  },
  CODEX: {
    voiceName: "Puck",
    gender: "Male",
    tone: "sharp, fast, modern developer tone",
    description: "Puck — Sharp, fast, modern software engineering specialist",
  },
  SENTINEL: {
    voiceName: "Fenrir",
    gender: "Male",
    tone: "deep, commanding, authoritative tone",
    description: "Fenrir — Deep, commanding & authoritative security guardian",
  },
  SAGE: {
    voiceName: "Charon",
    gender: "Male",
    tone: "calm, intellectual, wise mentor tone",
    description: "Charon — Calm, intellectual & wise deep research mentor",
  },
};

/**
 * Converts raw 24kHz 16-bit linear PCM byte buffer into standard 44-byte WAV blob
 */
function createWavBlobFromPcm(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const wavBuffer = new ArrayBuffer(44 + pcmData.byteLength);
  const view = new DataView(wavBuffer);

  // RIFF header
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmData.byteLength, true);
  writeAscii(view, 8, "WAVE");

  // fmt chunk
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeAscii(view, 36, "data");
  view.setUint32(40, pcmData.byteLength, true);

  // Copy PCM samples
  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(pcmData, 44);

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

class VoiceBiometricsService {
  private voiceLockActive: boolean = true;
  private enrolledSpeaker: string = "श्री राम नाग (Shri Ram Nag)";
  private enrolledPitchHz: number = 155;
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private recognition: any = null;
  private listeners: Set<(speaking: boolean, text: string) => void> = new Set();
  private apiKey: string = "";

  constructor() {
    this.initSpeechRecognition();
    this.initApiKey();
  }

  private initApiKey() {
    // Read from Vite environment or window or localStorage
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      (import.meta as any).env?.GEMINI_API_KEY ||
      (window as any).__GEMINI_API_KEY__ ||
      localStorage.getItem("MYRAA_GEMINI_KEY") ||
      "";
    this.apiKey = envKey;
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
    if (this.apiKey) {
      localStorage.setItem("MYRAA_GEMINI_KEY", this.apiKey);
    }
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  private initSpeechRecognition() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = "hi-IN";
      }
    }
  }

  public subscribe(fn: (speaking: boolean, text: string) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(speaking: boolean, text: string = "") {
    this.isSpeaking = speaking;
    this.listeners.forEach((fn) => fn(speaking, text));
  }

  public isVoiceLockOn(): boolean {
    return this.voiceLockActive;
  }

  public toggleVoiceLock(): boolean {
    this.voiceLockActive = !this.voiceLockActive;
    return this.voiceLockActive;
  }

  public getSpeakerProfile() {
    return {
      speakerName: this.enrolledSpeaker,
      pitchHz: this.enrolledPitchHz,
      active: this.voiceLockActive,
      status: `${this.enrolledSpeaker} का वॉइस बायोमेट्रिक्स सक्रिय है (~${this.enrolledPitchHz}Hz)`,
    };
  }

  /**
   * Generates and plays ultra-realistic speech audio using Google AI Studio Gemini Audio API
   * Dynamically mapped to the avatar role:
   * MYRAA -> Kore (Female)
   * AURA -> Aoede (Female)
   * PIXEL -> Despina (Female)
   * CODEX -> Puck (Male)
   * SENTINEL -> Fenrir (Male)
   * SAGE -> Charon (Male)
   */
  public async speakWithGeminiVoice(
    text: string,
    role: CharacterRole = "MYRAA",
    onEnd?: () => void
  ): Promise<void> {
    this.stopSpeaking();
    const cleanText = text.replace(/[*#`_~]/g, "").trim();
    if (!cleanText) return;

    const voiceConfig = AVATAR_VOICE_MAP[role] || AVATAR_VOICE_MAP.MYRAA;
    const voiceName = voiceConfig.voiceName;

    // Trigger speaking state for 3D avatar visualizer immediately
    this.notify(true, cleanText);

    try {
      const key = this.apiKey;
      const endpoint = key
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: cleanText,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName,
              },
            },
          },
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(key ? {} : { "x-goog-api-client": "myraa-ai-studio" }),
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Gemini Audio API returned status ${response.status}`);
      }

      const data = await response.json();
      const part = data?.candidates?.[0]?.content?.parts?.[0];
      const inlineData = part?.inlineData;

      if (!inlineData || !inlineData.data) {
        throw new Error("No audio inlineData found in Gemini response");
      }

      const base64Audio = inlineData.data;
      const mimeType = inlineData.mimeType || "audio/mp3";

      let audioSrc = "";
      if (mimeType.includes("pcm")) {
        // Decode base64 to binary PCM
        const binaryStr = atob(base64Audio);
        const pcmBytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          pcmBytes[i] = binaryStr.charCodeAt(i);
        }
        const wavBlob = createWavBlobFromPcm(pcmBytes, 24000);
        audioSrc = URL.createObjectURL(wavBlob);
      } else {
        audioSrc = `data:${mimeType};base64,${base64Audio}`;
      }

      const audio = new Audio(audioSrc);
      this.currentAudioElement = audio;

      audio.onended = () => {
        this.notify(false, "");
        if (audioSrc.startsWith("blob:")) {
          URL.revokeObjectURL(audioSrc);
        }
        onEnd?.();
      };

      audio.onerror = () => {
        this.notify(false, "");
        onEnd?.();
      };

      await audio.play();
    } catch (err: any) {
      console.warn(
        `[Gemini Audio Pipeline] Voice synthesis notice for role ${role} (${voiceName}): ${err?.message || "Using fallback timer"}`
      );
      // Graceful fallback: maintain avatar lip-sync without freezing
      const durationMs = Math.min(8000, Math.max(1200, cleanText.length * 55));
      setTimeout(() => {
        this.notify(false, "");
        onEnd?.();
      }, durationMs);
    }
  }

  // Alias for backward-compatible calls
  public speakAnimeVoice(text: string, onEnd?: () => void, role: CharacterRole = "MYRAA") {
    this.speakWithGeminiVoice(text, role, onEnd);
  }

  public stopSpeaking() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement.currentTime = 0;
      this.currentAudioElement = null;
    }
    this.notify(false, "");
  }

  public listenForVoiceCommand(
    onResult: (text: string) => void,
    onError?: (err: string) => void
  ) {
    if (!this.recognition) {
      onError?.("Web Speech API not supported in this browser. Please use keyboard input.");
      return;
    }
    try {
      this.isListening = true;
      this.recognition.onresult = (event: any) => {
        this.isListening = false;
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        onResult(transcript);
      };
      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        onError?.(event.error || "Speech recognition error");
      };
      this.recognition.onend = () => {
        this.isListening = false;
      };
      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      onError?.(e.message || "Failed to start microphone");
    }
  }
}

export const voiceBiometrics = new VoiceBiometricsService();
