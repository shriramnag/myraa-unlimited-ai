class VoiceBiometricsService {
  private voiceLockActive: boolean = true;
  private enrolledSpeaker: string = "श्री राम नाग (Shri Ram Nag)";
  private enrolledPitchHz: number = 155;
  private isSpeaking: boolean = false;
  private isListening: boolean = false;
  private recognition: any = null;
  private listeners: Set<(speaking: boolean, text: string) => void> = new Set();

  constructor() {
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
      status: `${this.enrolledSpeaker} का वॉइस सैंपल एक्टिव है (~${this.enrolledPitchHz}Hz)`,
    };
  }

  public speakAnimeVoice(text: string, onEnd?: () => void) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      this.notify(true, text);
      setTimeout(() => {
        this.notify(false, "");
        onEnd?.();
      }, Math.max(1500, text.length * 70));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.35; // Cute high pitch anime heroine voice
    utterance.rate = 0.95; // Slightly slower, calm comforting speed
    utterance.lang = "hi-IN";

    utterance.onstart = () => {
      this.notify(true, text);
    };

    utterance.onend = () => {
      this.notify(false, "");
      onEnd?.();
    };

    utterance.onerror = () => {
      this.notify(false, "");
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }

  public stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.notify(false, "");
  }

  public listenForVoiceCommand(onResult: (text: string) => void, onError?: (err: string) => void) {
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
