import { decodeBase64Pcm16ToAudioBuffer } from "./AudioDecoder";
import { voiceStore } from "./voiceStore";

/**
 * Single persistent Web Audio playback queue for Gemini Live & TTS output.
 * Graph: AudioBufferSourceNode -> GainNode (1.0) -> AnalyserNode -> destination.
 * Never creates a new AudioContext per chunk.
 */
class AudioPlaybackQueue {
  private ctx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private nextStartTime: number = 0;
  private analyserTimer: number | null = null;
  private onSpeakingChangeCallback: ((speaking: boolean) => void) | null = null;

  public setOnSpeakingChange(cb: (speaking: boolean) => void) {
    this.onSpeakingChangeCallback = cb;
  }

  /**
   * Creates or resumes the single persistent AudioContext and verifies state === "running".
   */
  public async ensureAudioContextRunning(): Promise<AudioContext> {
    if (typeof window === "undefined") {
      throw new Error("ब्राउज़र ऑडियो उपलब्ध नहीं है।");
    }

    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        throw new Error("Web AudioContext इस डिवाइस पर समर्थित नहीं है।");
      }
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.65;

      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
      voiceStore.log("INFO", `AudioContext created (sampleRate=${this.ctx.sampleRate}Hz).`);
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    if (this.ctx.state !== "running") {
      await this.ctx.resume();
    }

    if (this.ctx.state !== "running") {
      throw new Error(`AudioContext state is "${this.ctx.state}" (expected "running").`);
    }

    return this.ctx;
  }

  public getAudioContext(): AudioContext | null {
    return this.ctx;
  }

  /**
   * Schedules a base64 PCM16 audio chunk gaplessly at nextStartTime.
   */
  public enqueuePcmChunk(base64Data: string, mimeType?: string): void {
    try {
      if (!this.ctx || !this.gainNode) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 1.0;
        this.analyserNode = this.ctx.createAnalyser();
        this.analyserNode.fftSize = 64;
        this.gainNode.connect(this.analyserNode);
        this.analyserNode.connect(this.ctx.destination);
      }

      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }

      const buffer = decodeBase64Pcm16ToAudioBuffer(this.ctx, base64Data, mimeType);
      if (!buffer) return;

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.gainNode);

      const now = this.ctx.currentTime;
      const startAt = Math.max(now + 0.008, this.nextStartTime);
      this.nextStartTime = startAt + buffer.duration;

      const wasEmpty = this.activeSources.size === 0;
      this.activeSources.add(source);

      if (wasEmpty) {
        this.startAnalyserSampling();
        this.onSpeakingChangeCallback?.(true);
      }

      source.onended = () => {
        this.activeSources.delete(source);
        try {
          source.disconnect();
        } catch {}

        if (this.activeSources.size === 0) {
          this.stopAnalyserSampling();
          this.onSpeakingChangeCallback?.(false);
        }
      };

      source.start(startAt);
    } catch (err: any) {
      voiceStore.log("ERROR", `enqueuePcmChunk failed: ${err?.message || err}`);
    }
  }

  /**
   * Immediately stops every active audio source, clears queue, and resets nextStartTime.
   */
  public interrupt(): void {
    for (const src of this.activeSources) {
      try {
        src.onended = null;
        src.stop();
        src.disconnect();
      } catch {}
    }
    this.activeSources.clear();
    this.nextStartTime = 0;
    this.stopAnalyserSampling();
    this.onSpeakingChangeCallback?.(false);
  }

  public isPlaying(): boolean {
    return this.activeSources.size > 0;
  }

  /**
   * Plays a 440 Hz sine wave test tone (0.6s) through the EXACT SAME
   * GainNode -> AnalyserNode -> destination graph for Settings -> Diagnostics.
   */
  public async playTestSpeakerTone(): Promise<void> {
    const ctx = await this.ensureAudioContextRunning();
    if (!this.gainNode) return;

    voiceStore.log("INFO", "[Diagnostics] Playing 440Hz test tone through main audio graph.");
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);

    env.gain.setValueAtTime(0.001, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.04);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(env);
    env.connect(this.gainNode);

    this.startAnalyserSampling();
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.62);

    await new Promise<void>((resolve) => {
      osc.onended = () => {
        try {
          osc.disconnect();
          env.disconnect();
        } catch {}
        if (this.activeSources.size === 0) {
          this.stopAnalyserSampling();
        }
        resolve();
      };
    });
  }

  private startAnalyserSampling() {
    if (this.analyserTimer !== null || !this.analyserNode) return;
    const freqBins = new Uint8Array(this.analyserNode.frequencyBinCount);

    this.analyserTimer = window.setInterval(() => {
      if (!this.analyserNode) return;
      this.analyserNode.getByteFrequencyData(freqBins);
      const bars: number[] = [];
      for (let i = 0; i < 12; i++) {
        const val = freqBins[i + 1] || 0;
        bars.push(Math.min(1, Math.max(0.15, val / 210)));
      }
      voiceStore.setOutputWaveform(bars);
    }, 55);
  }

  private stopAnalyserSampling() {
    if (this.analyserTimer !== null) {
      window.clearInterval(this.analyserTimer);
      this.analyserTimer = null;
    }
    voiceStore.setOutputWaveform([
      0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15,
    ]);
  }
}

export const audioPlaybackQueue = new AudioPlaybackQueue();
