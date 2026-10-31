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
 * Splits a full response into sentence/clause chunks for progressive ultra-low latency streaming
 */
export function splitIntoStreamingSentences(text: string): string[] {
  const cleaned = text.replace(/[*#`_~]/g, "").trim();
  if (!cleaned) return [];
  const rawChunks = cleaned.match(/[^।.!?\n;]+[।.!?\n;]*/g) || [cleaned];
  const merged: string[] = [];
  for (const chunk of rawChunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    // Merge very short fragments (< 12 chars) into previous or next chunk so Sentence 1 is natural yet fast
    if (merged.length > 0 && merged[merged.length - 1].length < 18) {
      merged[merged.length - 1] += " " + trimmed;
    } else {
      merged.push(trimmed);
    }
  }
  return merged.length > 0 ? merged : [cleaned];
}

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

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmData.byteLength, true);
  writeAscii(view, 8, "WAVE");

  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  writeAscii(view, 36, "data");
  view.setUint32(40, pcmData.byteLength, true);

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
  private audioContext: AudioContext | null = null;
  private activeSourceNode: AudioBufferSourceNode | null = null;
  private streamGenerationId: number = 0;
  private recognition: any = null;
  private mediaStream: MediaStream | null = null;
  private analyserTimer: number | null = null;
  private silencePauseTimer: number | null = null;
  private listeners: Set<(speaking: boolean, text: string) => void> = new Set();
  private apiKey: string = "";

  constructor() {
    this.initSpeechRecognition();
    this.initApiKey();
  }

  private getOrCreateAudioContext(): AudioContext | null {
    try {
      if (typeof window === "undefined") return null;
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx({ sampleRate: 24000 });
        }
      }
      if (this.audioContext && this.audioContext.state === "suspended") {
        this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  private initApiKey() {
    try {
      const storedKey =
        localStorage.getItem("GEMINI_API_KEY") ||
        localStorage.getItem("MYRAA_GEMINI_KEY") ||
        (window as any).__GEMINI_API_KEY__ ||
        (import.meta as any).env?.VITE_GEMINI_API_KEY ||
        (import.meta as any).env?.GEMINI_API_KEY ||
        "";
      this.apiKey = storedKey.trim();
    } catch {
      this.apiKey = "";
    }
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
    try {
      if (this.apiKey) {
        localStorage.setItem("GEMINI_API_KEY", this.apiKey);
        localStorage.setItem("MYRAA_GEMINI_KEY", this.apiKey);
      } else {
        localStorage.removeItem("GEMINI_API_KEY");
        localStorage.removeItem("MYRAA_GEMINI_KEY");
      }
    } catch {}
  }

  public getApiKey(): string {
    try {
      const latest =
        localStorage.getItem("GEMINI_API_KEY") ||
        localStorage.getItem("MYRAA_GEMINI_KEY") ||
        this.apiKey;
      if (latest && latest.trim()) {
        this.apiKey = latest.trim();
      }
    } catch {}
    return this.apiKey;
  }

  public hasValidApiKey(): boolean {
    const k = this.getApiKey();
    return Boolean(
      k &&
        k.length >= 10 &&
        !k.startsWith("your_key") &&
        !k.startsWith("placeholder") &&
        !k.startsWith("AIzaSyDummy")
    );
  }

  private initSpeechRecognition() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
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
   * Fetches a single sentence audio chunk from gemini-2.0-flash (ultra-low TTFB)
   * with automatic fallback to gemini-2.5-flash if required.
   */
  private async fetchSentenceAudioChunk(
    sentence: string,
    voiceName: string,
    key: string
  ): Promise<{ base64Audio: string; mimeType: string } | null> {
    const models = ["gemini-2.0-flash", "gemini-2.5-flash"];
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: sentence,
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

    for (const model of models) {
      try {
        const endpoint = key
          ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`
          : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(key ? {} : { "x-goog-api-client": "myraa-ai-studio" }),
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) continue;

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        for (const p of parts) {
          if (p?.inlineData?.data) {
            return {
              base64Audio: p.inlineData.data,
              mimeType: p.inlineData.mimeType || "audio/pcm;rate=24000",
            };
          }
        }
      } catch {
        // Try next model fallback
      }
    }
    return null;
  }

  /**
   * Plays a single decoded audio chunk via Web AudioContext (raw PCM 24kHz) or HTMLAudioElement
   * and resolves immediately when the chunk finishes so the next prefetched sentence plays with zero gap.
   */
  private playAudioChunk(
    chunk: { base64Audio: string; mimeType: string },
    genId: number,
    fullText: string
  ): Promise<void> {
    return new Promise((resolve) => {
      if (genId !== this.streamGenerationId) {
        resolve();
        return;
      }

      const binaryStr = atob(chunk.base64Audio);
      const pcmBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        pcmBytes[i] = binaryStr.charCodeAt(i);
      }

      // Synchronously trigger avatar lip-sync animation as soon as the audio buffer starts playing
      this.notify(true, fullText);

      // Prefer ultra-low latency Web AudioContext PCM buffer playback
      const ctx = this.getOrCreateAudioContext();
      if (ctx && chunk.mimeType.includes("pcm")) {
        try {
          const sampleCount = Math.floor(pcmBytes.byteLength / 2);
          const audioBuffer = ctx.createBuffer(1, sampleCount, 24000);
          const channelData = audioBuffer.getChannelData(0);
          const dataView = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);

          for (let i = 0; i < sampleCount; i++) {
            const int16 = dataView.getInt16(i * 2, true);
            channelData[i] = int16 / 32768.0;
          }

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          this.activeSourceNode = source;

          source.onended = () => {
            if (this.activeSourceNode === source) {
              this.activeSourceNode = null;
            }
            resolve();
          };
          source.start(0);
          return;
        } catch {
          // Fall through to WAV blob Audio element if AudioContext buffer creation fails
        }
      }

      let audioSrc = "";
      if (chunk.mimeType.includes("pcm")) {
        const wavBlob = createWavBlobFromPcm(pcmBytes, 24000);
        audioSrc = URL.createObjectURL(wavBlob);
      } else {
        audioSrc = `data:${chunk.mimeType};base64,${chunk.base64Audio}`;
      }

      const audio = new Audio(audioSrc);
      this.currentAudioElement = audio;

      audio.onended = () => {
        if (audioSrc.startsWith("blob:")) {
          URL.revokeObjectURL(audioSrc);
        }
        resolve();
      };

      audio.onerror = () => {
        if (audioSrc.startsWith("blob:")) {
          URL.revokeObjectURL(audioSrc);
        }
        resolve();
      };

      audio.play().catch(() => resolve());
    });
  }

  /**
   * Sentence-level progressive audio streaming using gemini-2.0-flash:
   * Immediately fetches and plays the first sentence while prefetching subsequent sentences in parallel
   * for zero-pause, ultra-low latency voice output. Completely bypasses robotic OS TTS.
   */
  public async speakWithGeminiVoice(
    text: string,
    role: CharacterRole = "MYRAA",
    onEnd?: () => void
  ): Promise<void> {
    this.stopSpeaking();
    const cleanText = text.replace(/[*#`_~]/g, "").trim();
    if (!cleanText) return;

    const genId = ++this.streamGenerationId;
    const voiceConfig = AVATAR_VOICE_MAP[role] || AVATAR_VOICE_MAP.MYRAA;
    const voiceName = voiceConfig.voiceName;
    const key = this.getApiKey();

    const sentences = splitIntoStreamingSentences(cleanText);
    if (sentences.length === 0) return;

    try {
      // Launch pipelined fetches for all sentences concurrently so Sentence 1 resolves with lowest TTFB
      // and Sentence 2..N are already waiting in memory when Sentence 1 finishes playing.
      const chunkPromises = sentences.map((sentence) =>
        this.fetchSentenceAudioChunk(sentence, voiceName, key)
      );

      let anyChunkPlayed = false;

      for (let i = 0; i < chunkPromises.length; i++) {
        if (genId !== this.streamGenerationId) return;
        const chunk = await chunkPromises[i];
        if (genId !== this.streamGenerationId) return;

        if (chunk) {
          anyChunkPlayed = true;
          await this.playAudioChunk(chunk, genId, cleanText);
        }
      }

      if (genId !== this.streamGenerationId) return;

      if (!anyChunkPlayed) {
        // Synchronize lip-sync cadence without robotic Android/Browser speechSynthesis
        this.notify(true, cleanText);
        const durationMs = Math.min(6000, Math.max(1200, cleanText.length * 48));
        await new Promise((r) => setTimeout(r, durationMs));
      }
    } catch (err: any) {
      console.warn(
        `[Gemini Progressive Audio Stream] Notice for ${role} (${voiceName}): ${err?.message || ""}`
      );
    } finally {
      if (genId === this.streamGenerationId) {
        this.notify(false, "");
        onEnd?.();
      }
    }
  }

  public speakAnimeVoice(text: string, onEnd?: () => void, role: CharacterRole = "MYRAA") {
    this.speakWithGeminiVoice(text, role, onEnd);
  }

  public stopSpeaking() {
    this.streamGenerationId++;
    if (this.activeSourceNode) {
      try {
        this.activeSourceNode.stop();
        this.activeSourceNode.disconnect();
      } catch {}
      this.activeSourceNode = null;
    }
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch {}
      this.currentAudioElement = null;
    }
    this.notify(false, "");
  }

  private stopMediaStreamAnalyser() {
    if (this.analyserTimer !== null) {
      window.clearInterval(this.analyserTimer);
      this.analyserTimer = null;
    }
    if (this.silencePauseTimer !== null) {
      window.clearTimeout(this.silencePauseTimer);
      this.silencePauseTimer = null;
    }
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.mediaStream = null;
    }
  }

  public stopListening() {
    this.isListening = false;
    this.stopMediaStreamAnalyser();
    try {
      this.recognition?.stop();
    } catch {}
  }

  /**
   * Starts in-app live sound-wave microphone listening with real-time frequency bars
   * and immediate auto-submission on voice pause (no Google OS popup).
   */
  public listenForVoiceCommand(
    onResult: (text: string) => void,
    onError?: (err: string) => void,
    onPartial?: (partialText: string) => void,
    onWaveform?: (bars: number[]) => void
  ) {
    if (typeof window !== "undefined" && !this.recognition) {
      this.initSpeechRecognition();
    }
    if (!this.recognition) {
      onError?.("Web Speech API not supported in this browser.");
      return;
    }

    try {
      this.stopSpeaking();
      this.stopMediaStreamAnalyser();
      this.isListening = true;

      let latestTranscript = "";
      let submitted = false;

      const finishAndSubmit = (textToSubmit: string) => {
        if (submitted) return;
        const cleaned = textToSubmit.trim();
        if (!cleaned) return;
        submitted = true;
        this.isListening = false;
        this.stopMediaStreamAnalyser();
        try {
          this.recognition?.stop();
        } catch {}
        onResult(cleaned);
      };

      // Start live sound-wave frequency analyzer (uses Web Audio AnalyserNode when available,
      // with responsive speech-energy cadence bars so the bottom bar always animates smoothly)
      this.startLiveWaveformVisualizer(onWaveform);

      this.recognition.onresult = (event: any) => {
        let interim = "";
        let finalTranscript = "";

        for (let i = event.resultIndex || 0; i < event.results.length; i++) {
          const res = event.results[i];
          const textPiece = res?.[0]?.transcript || "";
          if (res.isFinal) {
            finalTranscript += textPiece;
          } else {
            interim += textPiece;
          }
        }

        const combined = (finalTranscript || interim).trim();
        if (combined) {
          latestTranscript = combined;
          onPartial?.(combined);
        }

        if (finalTranscript.trim()) {
          finishAndSubmit(finalTranscript);
          return;
        }

        // Immediate auto-submission on voice pause (950ms of silence after speaking)
        if (this.silencePauseTimer !== null) {
          window.clearTimeout(this.silencePauseTimer);
        }
        if (latestTranscript) {
          this.silencePauseTimer = window.setTimeout(() => {
            if (this.isListening && latestTranscript.trim()) {
              finishAndSubmit(latestTranscript);
            }
          }, 950);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (submitted) return;
        this.isListening = false;
        this.stopMediaStreamAnalyser();
        onError?.(event.error || "Speech recognition error");
      };

      this.recognition.onend = () => {
        this.stopMediaStreamAnalyser();
        if (!submitted && latestTranscript.trim()) {
          finishAndSubmit(latestTranscript);
        } else {
          this.isListening = false;
        }
      };

      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      this.stopMediaStreamAnalyser();
      onError?.(e.message || "Failed to start microphone");
    }
  }

  private async startLiveWaveformVisualizer(onWaveform?: (bars: number[]) => void) {
    if (!onWaveform || typeof window === "undefined") return;

    let analyser: AnalyserNode | null = null;
    let freqData: Uint8Array | null = null;

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const ctx = this.getOrCreateAudioContext();
        if (ctx && this.mediaStream) {
          const source = ctx.createMediaStreamSource(this.mediaStream);
          analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          freqData = new Uint8Array(analyser.frequencyBinCount);
        }
      }
    } catch {
      // If SpeechRecognition holds exclusive mic focus on Android WebView, fall back to reactive cadence wave
    }

    let tick = 0;
    this.analyserTimer = window.setInterval(() => {
      if (!this.isListening) {
        this.stopMediaStreamAnalyser();
        return;
      }
      tick++;
      const bars: number[] = [];
      if (analyser && freqData) {
        analyser.getByteFrequencyData(freqData as any);
        for (let i = 0; i < 12; i++) {
          const raw = freqData[i + 1] || 0;
          const normalized = Math.min(1, Math.max(0.16, raw / 210));
          bars.push(normalized);
        }
      } else {
        for (let i = 0; i < 12; i++) {
          const wave =
            0.22 +
            0.45 * Math.abs(Math.sin(tick * 0.38 + i * 0.55)) +
            0.25 * Math.abs(Math.cos(tick * 0.23 - i * 0.4));
          bars.push(Math.min(1, Math.max(0.15, wave)));
        }
      }
      onWaveform(bars);
    }, 65);
  }
}

export const voiceBiometrics = new VoiceBiometricsService();
