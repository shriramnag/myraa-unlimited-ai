import { CharacterRole } from "../types";
import { PERSONA_THEMES } from "../config/personas";
import { liveSession } from "../voice/LiveSession";
import { voiceStore, VoiceEngineState } from "../voice/voiceStore";
import {
  resolveGeminiApiKey,
  saveUserGeminiApiKey,
  hasConfiguredApiKey,
  validateGeminiApiKey,
} from "../voice/GeminiConfig";

export {
  PERSONA_THEMES,
  resolveGeminiApiKey,
  saveUserGeminiApiKey,
  hasConfiguredApiKey,
  validateGeminiApiKey,
};
export type { CharacterRole, VoiceEngineState };

export interface VoiceAuthState {
  status: VoiceEngineState;
  confidence: number;
  speakerName: string;
  transcript: string;
  aiResponse: string;
  isWakeWordActive: boolean;
  isAlwaysOn: boolean;
  audioLevel: number;
  errorMessage?: string;
}

class VoiceBiometricsAdapter {
  public getActiveAvatar(): CharacterRole {
    return voiceStore.getSnapshot().activeRole;
  }

  public setActiveAvatar(role: CharacterRole): void {
    liveSession.switchCharacter(role);
  }

  public subscribe(listener: (state: VoiceAuthState) => void): () => void {
    return voiceStore.subscribe((snap) => {
      listener({
        status: snap.state,
        confidence: snap.state === "ERROR" ? 0 : 100,
        speakerName: "श्री राम नाग (Owner)",
        transcript: snap.userCaption,
        aiResponse: snap.assistantCaption,
        isWakeWordActive: liveSession.isSessionActive(),
        isAlwaysOn: liveSession.isSessionActive(),
        audioLevel: snap.micLevel,
        errorMessage: snap.errorInfo?.hindiMessage,
      });
    });
  }

  public async startListening(): Promise<void> {
    await liveSession.startVoiceSession();
  }

  public stopListening(): void {
    liveSession.stopSession();
  }

  public async speakHindiResponse(text: string): Promise<void> {
    await liveSession.speakReadAloud(text);
  }

  public async processCommand(cmd: string): Promise<void> {
    await liveSession.sendTypedMessage(cmd);
  }
}

export const voiceEngine = new VoiceBiometricsAdapter();
export const voiceBiometrics = voiceEngine;
