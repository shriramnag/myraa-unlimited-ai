import { CharacterRole } from "../types";
import { GeminiVoiceName, PERSONA_THEMES } from "../config/personas";
import { hasConfiguredApiKey, redactSecrets } from "./GeminiConfig";

export type VoiceEngineState =
  | "IDLE"
  | "CONNECTING"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "ERROR";

export interface TranscriptLine {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  role?: CharacterRole;
  timestamp: string;
}

export interface DiagnosticLogEntry {
  id: string;
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}

export interface VoiceErrorInfo {
  hindiMessage: string;
  technicalError: string;
  actionLabel: string;
  actionType: "OPEN_SETTINGS" | "RETRY" | "MIC_HELP";
}

export interface PendingCallConfirmation {
  phoneNumber: string;
  contactName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export type PanelTarget =
  | "brain"
  | "apps"
  | "vault"
  | "settings"
  | "tools"
  | "tasks"
  | "diagnostics"
  | null;

export interface VoiceStoreSnapshot {
  state: VoiceEngineState;
  activeRole: CharacterRole;
  voiceOverrides: Partial<Record<CharacterRole, GeminiVoiceName>>;
  echoCancellation: boolean;
  extendedThinking: boolean;
  userCaption: string;
  assistantCaption: string;
  activeToolBadge?: string;
  transcript: TranscriptLine[];
  micLevel: number;
  outputWaveform: number[];
  errorInfo: VoiceErrorInfo | null;
  logs: DiagnosticLogEntry[];
  activeLiveModel: string;
  hasApiKey: boolean;
  onboardingDone: boolean;
  pendingCall: PendingCallConfirmation | null;
  requestedPanel: PanelTarget;
}

const VOICE_OVERRIDES_KEY = "MYRAA_VOICE_OVERRIDES_V1";
const ECHO_CANCEL_KEY = "MYRAA_ECHO_CANCEL_V1";
const ONBOARDING_DONE_KEY = "MYRAA_ONBOARDING_DONE_V1";

class VoiceStore {
  private snapshot: VoiceStoreSnapshot;
  private listeners: Set<(snap: VoiceStoreSnapshot) => void> = new Set();

  constructor() {
    let savedOverrides: Partial<Record<CharacterRole, GeminiVoiceName>> = {};
    let echoCancel = true;
    let onboardingDone = false;

    try {
      const rawOverrides = localStorage.getItem(VOICE_OVERRIDES_KEY);
      if (rawOverrides) savedOverrides = JSON.parse(rawOverrides);
      const rawEcho = localStorage.getItem(ECHO_CANCEL_KEY);
      if (rawEcho !== null) echoCancel = rawEcho === "true";
      onboardingDone = localStorage.getItem(ONBOARDING_DONE_KEY) === "true";
    } catch {
      // Ignore storage error
    }

    const keyPresent = hasConfiguredApiKey();

    this.snapshot = {
      state: "IDLE",
      activeRole: "MYRAA",
      voiceOverrides: savedOverrides,
      echoCancellation: echoCancel,
      extendedThinking: false,
      userCaption: "",
      assistantCaption:
        "नमस्ते! माइक बटन दबाएं और मुझसे सीधे अपनी भाषा में बात करें।",
      activeToolBadge: undefined,
      transcript: [
        {
          id: "init-1",
          sender: "assistant",
          role: "MYRAA",
          text: "नमस्ते! माइक बटन दबाएं और मुझसे सीधे अपनी भाषा में बात करें।",
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      micLevel: 0,
      outputWaveform: [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15],
      errorInfo: null,
      logs: [],
      activeLiveModel: "",
      hasApiKey: keyPresent,
      onboardingDone: onboardingDone || keyPresent,
      pendingCall: null,
      requestedPanel: null,
    };

    this.log("INFO", "VoiceStore initialized.");
  }

  public getSnapshot(): VoiceStoreSnapshot {
    return this.snapshot;
  }

  public subscribe(listener: (snap: VoiceStoreSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const current = { ...this.snapshot };
    this.listeners.forEach((fn) => fn(current));
  }

  public setState(state: VoiceEngineState) {
    if (this.snapshot.state === state) return;
    this.snapshot = {
      ...this.snapshot,
      state,
      errorInfo: state === "ERROR" ? this.snapshot.errorInfo : null,
    };
    this.log("INFO", `State -> ${state}`);
    this.emit();
  }

  public setError(errorInfo: VoiceErrorInfo) {
    const cleanTech = redactSecrets(errorInfo.technicalError);
    this.log("ERROR", `${errorInfo.hindiMessage} | ${cleanTech}`);
    this.snapshot = {
      ...this.snapshot,
      state: "ERROR",
      errorInfo: {
        ...errorInfo,
        technicalError: cleanTech,
      },
    };
    this.emit();
  }

  public clearError() {
    if (!this.snapshot.errorInfo && this.snapshot.state !== "ERROR") return;
    this.snapshot = {
      ...this.snapshot,
      state: this.snapshot.state === "ERROR" ? "IDLE" : this.snapshot.state,
      errorInfo: null,
    };
    this.emit();
  }

  public setActiveRole(role: CharacterRole) {
    if (this.snapshot.activeRole === role) return;
    this.snapshot = { ...this.snapshot, activeRole: role };
    this.log("INFO", `Switched active character to ${role}`);
    this.emit();
  }

  public getVoiceForRole(role: CharacterRole = this.snapshot.activeRole): GeminiVoiceName {
    const override = this.snapshot.voiceOverrides[role];
    if (override) return override;
    return PERSONA_THEMES[role]?.voiceName || "Kore";
  }

  public setVoiceForRole(role: CharacterRole, voice: GeminiVoiceName) {
    const updated = { ...this.snapshot.voiceOverrides, [role]: voice };
    try {
      localStorage.setItem(VOICE_OVERRIDES_KEY, JSON.stringify(updated));
    } catch {}
    this.snapshot = { ...this.snapshot, voiceOverrides: updated };
    this.log("INFO", `Voice for ${role} set to ${voice}`);
    this.emit();
  }

  public setEchoCancellation(enabled: boolean) {
    try {
      localStorage.setItem(ECHO_CANCEL_KEY, String(enabled));
    } catch {}
    this.snapshot = { ...this.snapshot, echoCancellation: enabled };
    this.log("INFO", `Echo cancellation set to ${enabled}`);
    this.emit();
  }

  public setExtendedThinking(enabled: boolean) {
    this.snapshot = { ...this.snapshot, extendedThinking: enabled };
    this.log("INFO", `Extended thinking Live mode set to ${enabled}`);
    this.emit();
  }

  public refreshApiKeyStatus() {
    const hasKey = hasConfiguredApiKey();
    this.snapshot = { ...this.snapshot, hasApiKey: hasKey };
    this.emit();
  }

  public setOnboardingDone(done: boolean) {
    try {
      localStorage.setItem(ONBOARDING_DONE_KEY, String(done));
    } catch {}
    this.snapshot = { ...this.snapshot, onboardingDone: done };
    this.emit();
  }

  public setUserCaption(text: string, isFinal: boolean = false) {
    const cleaned = text.trim();
    if (!cleaned) return;
    const updatedTranscript = [...this.snapshot.transcript];
    if (isFinal) {
      updatedTranscript.push({
        id: "u-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
        sender: "user",
        text: cleaned,
        timestamp: new Date().toLocaleTimeString(),
      });
      if (updatedTranscript.length > 100) updatedTranscript.shift();
    }
    this.snapshot = {
      ...this.snapshot,
      userCaption: cleaned,
      transcript: updatedTranscript,
    };
    this.emit();
  }

  public setAssistantCaption(
    text: string,
    options?: { append?: boolean; isFinal?: boolean; toolBadge?: string; role?: CharacterRole }
  ) {
    const nextText = options?.append
      ? (this.snapshot.assistantCaption + text).trimStart()
      : text.trim();
    if (!nextText) return;

    const updatedTranscript = [...this.snapshot.transcript];
    if (options?.isFinal) {
      updatedTranscript.push({
        id: "a-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
        sender: "assistant",
        role: options?.role || this.snapshot.activeRole,
        text: nextText,
        timestamp: new Date().toLocaleTimeString(),
      });
      if (updatedTranscript.length > 100) updatedTranscript.shift();
    }

    this.snapshot = {
      ...this.snapshot,
      assistantCaption: nextText,
      activeToolBadge: options?.toolBadge ?? this.snapshot.activeToolBadge,
      transcript: updatedTranscript,
    };
    this.emit();
  }

  public setMicLevel(level: number) {
    const clamped = Math.max(0, Math.min(1, level));
    if (Math.abs(this.snapshot.micLevel - clamped) < 0.015 && clamped > 0) return;
    this.snapshot = { ...this.snapshot, micLevel: clamped };
    this.emit();
  }

  public setOutputWaveform(bars: number[]) {
    this.snapshot = { ...this.snapshot, outputWaveform: bars };
    this.emit();
  }

  public setActiveLiveModel(model: string) {
    this.snapshot = { ...this.snapshot, activeLiveModel: model };
    this.emit();
  }

  public setPendingCall(pendingCall: PendingCallConfirmation | null) {
    this.snapshot = { ...this.snapshot, pendingCall };
    this.emit();
  }

  public requestPanel(panel: PanelTarget) {
    this.snapshot = { ...this.snapshot, requestedPanel: panel };
    this.emit();
  }

  public log(level: "INFO" | "WARN" | "ERROR", message: string) {
    const entry: DiagnosticLogEntry = {
      id: "log-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 5),
      time: new Date().toLocaleTimeString(),
      level,
      message: redactSecrets(message),
    };
    const nextLogs = [entry, ...this.snapshot.logs].slice(0, 100);
    this.snapshot = { ...this.snapshot, logs: nextLogs };
    this.emit();
  }

  public clearLogs() {
    this.snapshot = { ...this.snapshot, logs: [] };
    this.emit();
  }
}

export const voiceStore = new VoiceStore();
