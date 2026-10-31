import { LiveServerMessage, Modality, Session } from "@google/genai";
import { buildSystemInstruction } from "../config/personas";
import { brainDatabase } from "../services/brainDatabase";
import { CharacterRole } from "../types";
import { audioPlaybackQueue } from "./AudioPlaybackQueue";
import { audioStreamer } from "./AudioStreamer";
import {
  createGenAIClient,
  GEMINI_MODELS,
  hasConfiguredApiKey,
  isModelNotFoundError,
  redactSecrets,
} from "./GeminiConfig";
import { executeLiveFunctionCall, LIVE_TOOL_DECLARATIONS } from "./ToolRegistry";
import { voiceStore } from "./voiceStore";

class LiveSessionManager {
  private session: Session | null = null;
  private isUserStopped: boolean = true;
  private isMicMode: boolean = false;
  private reconnectAttempts: number = 0;
  private currentInputTurnText: string = "";
  private currentOutputTurnText: string = "";
  private activeConnectPromise: Promise<boolean> | null = null;

  constructor() {
    audioPlaybackQueue.setOnSpeakingChange((speaking) => {
      const snap = voiceStore.getSnapshot();
      if (speaking) {
        voiceStore.setState("SPEAKING");
      } else {
        if (snap.state === "SPEAKING") {
          voiceStore.setState(this.isMicMode && this.session ? "LISTENING" : "IDLE");
        }
      }
    });
  }

  public isSessionActive(): boolean {
    return Boolean(this.session && !this.isUserStopped);
  }

  public async toggleVoiceSession(): Promise<void> {
    const currentState = voiceStore.getSnapshot().state;
    if (
      this.isSessionActive() ||
      currentState === "CONNECTING" ||
      currentState === "LISTENING" ||
      currentState === "SPEAKING" ||
      currentState === "THINKING"
    ) {
      this.stopSession();
      return;
    }

    await this.startVoiceSession();
  }

  public async startVoiceSession(): Promise<boolean> {
    if (!hasConfiguredApiKey()) {
      voiceStore.setError({
        hindiMessage: "Gemini API Key सेट नहीं है। कृपया Settings में अपनी API Key जोड़ें।",
        technicalError: "MISSING_API_KEY: No Gemini API key found in localStorage or environment.",
        actionLabel: "Settings खोलें",
        actionType: "OPEN_SETTINGS",
      });
      return false;
    }

    this.isUserStopped = false;
    this.isMicMode = true;
    this.reconnectAttempts = 0;
    voiceStore.clearError();
    voiceStore.setState("CONNECTING");

    try {
      const ctx = await audioPlaybackQueue.ensureAudioContextRunning();

      let stream: MediaStream;
      try {
        stream = await audioStreamer.requestMicAccess(
          voiceStore.getSnapshot().echoCancellation
        );
      } catch (micErr: any) {
        const tech = String(micErr?.message || micErr);
        voiceStore.setError({
          hindiMessage:
            "माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र/ऐप सेटिंग्स में माइक Allow करें।",
          technicalError: `getUserMedia failed: ${tech}`,
          actionLabel: "दोबारा कोशिश करें",
          actionType: "MIC_HELP",
        });
        return false;
      }

      const connected = await this.connectLiveWithFallback();
      if (!connected || !this.session) {
        audioStreamer.stopStream();
        return false;
      }

      await audioStreamer.startStreaming(ctx, stream, (base64Pcm16) => {
        if (!this.session || this.isUserStopped) return;
        try {
          this.session.sendRealtimeInput({
            audio: {
              data: base64Pcm16,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } catch (sendErr: any) {
          voiceStore.log("WARN", `sendRealtimeInput error: ${sendErr?.message || sendErr}`);
        }
      });

      voiceStore.setState("LISTENING");
      return true;
    } catch (err: any) {
      const cleanTech = redactSecrets(String(err?.message || err));
      audioStreamer.stopStream();
      voiceStore.setError({
        hindiMessage: "वॉइस सेशन शुरू करने में समस्या आई। कृपया दोबारा कोशिश करें।",
        technicalError: cleanTech,
        actionLabel: "Retry",
        actionType: "RETRY",
      });
      return false;
    }
  }

  private async connectLiveWithFallback(): Promise<boolean> {
    if (this.activeConnectPromise) {
      return this.activeConnectPromise;
    }

    this.activeConnectPromise = (async () => {
      const snap = voiceStore.getSnapshot();
      const role = snap.activeRole;
      const voiceName = voiceStore.getVoiceForRole(role);
      const memoriesSummary = brainDatabase.getCompactSummaryForPrompt(8);
      const systemInstruction = buildSystemInstruction(role, memoriesSummary);

      const candidates = snap.extendedThinking
        ? GEMINI_MODELS.LIVE_EXTENDED_THINKING_CANDIDATES
        : GEMINI_MODELS.LIVE_CANDIDATES;

      const ai = createGenAIClient();
      let lastError = "";

      for (const candidateModel of candidates) {
        if (this.isUserStopped) return false;

        try {
          voiceStore.log(
            "INFO",
            `[Live] Attempting connection with model="${candidateModel}", voice="${voiceName}"...`
          );

          const attemptResult = await this.tryConnectSingleModel(
            ai,
            candidateModel,
            voiceName,
            systemInstruction
          );

          if (attemptResult.ok && attemptResult.session) {
            this.session = attemptResult.session;
            voiceStore.setActiveLiveModel(candidateModel);
            voiceStore.log("INFO", `[Live] Connected successfully using model="${candidateModel}".`);
            return true;
          }

          lastError = attemptResult.error || `Failed to connect to ${candidateModel}`;
          voiceStore.log("WARN", `[Live] Model "${candidateModel}" did not connect: ${lastError}`);
        } catch (err: any) {
          lastError = redactSecrets(String(err?.message || err));
          voiceStore.log("WARN", `[Live] Candidate "${candidateModel}" threw error: ${lastError}`);
        }
      }

      voiceStore.setError({
        hindiMessage:
          "Gemini Live से कनेक्ट नहीं हो सका। कृपया अपनी API Key या इंटरनेट कनेक्शन जांचें।",
        technicalError: lastError || "All Live model candidates failed.",
        actionLabel: "Settings जांचें",
        actionType: "OPEN_SETTINGS",
      });
      return false;
    })();

    try {
      return await this.activeConnectPromise;
    } finally {
      this.activeConnectPromise = null;
    }
  }

  private tryConnectSingleModel(
    ai: ReturnType<typeof createGenAIClient>,
    model: string,
    voiceName: string,
    systemInstruction: string
  ): Promise<{ ok: boolean; session?: Session; error?: string }> {
    return new Promise((resolve) => {
      let settled = false;
      let resolvedSession: Session | null = null;
      let stabilityTimer: number | null = null;

      const settle = (res: { ok: boolean; session?: Session; error?: string }) => {
        if (settled) return;
        settled = true;
        if (stabilityTimer !== null) {
          window.clearTimeout(stabilityTimer);
          stabilityTimer = null;
        }
        resolve(res);
      };

      ai.live
        .connect({
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName,
                },
              },
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            tools: [{ functionDeclarations: LIVE_TOOL_DECLARATIONS }],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
          callbacks: {
            onopen: () => {
              voiceStore.log("INFO", `[Live] WebSocket opened for ${model}.`);
            },
            onmessage: (msg: LiveServerMessage) => {
              if (!settled && (msg.setupComplete || msg.serverContent || msg.toolCall)) {
                if (resolvedSession) {
                  settle({ ok: true, session: resolvedSession });
                }
              }
              this.handleServerMessage(msg);
            },
            onerror: (errEvent: any) => {
              const errMsg = redactSecrets(
                String(errEvent?.message || errEvent?.error?.message || "WebSocket error")
              );
              voiceStore.log("ERROR", `[Live] WebSocket error (${model}): ${errMsg}`);
              if (!settled) {
                settle({ ok: false, error: errMsg });
              }
            },
            onclose: (closeEvent: any) => {
              const reason = redactSecrets(
                String(closeEvent?.reason || `code=${closeEvent?.code ?? "unknown"}`)
              );
              voiceStore.log("WARN", `[Live] WebSocket closed (${model}): ${reason}`);

              if (!settled) {
                settle({ ok: false, error: reason });
                return;
              }

              if (this.session && resolvedSession === this.session) {
                this.session = null;
                this.handleUnexpectedClose(reason);
              }
            },
          },
        })
        .then((sess) => {
          resolvedSession = sess;
          stabilityTimer = window.setTimeout(() => {
            if (!settled && resolvedSession) {
              settle({ ok: true, session: resolvedSession });
            }
          }, 650);
        })
        .catch((err) => {
          settle({ ok: false, error: redactSecrets(String(err?.message || err)) });
        });
    });
  }

  private async handleServerMessage(msg: LiveServerMessage) {
    try {
      if (msg.serverContent?.interrupted) {
        voiceStore.log("INFO", "[Live] Server signaled interrupted — clearing playback queue.");
        audioPlaybackQueue.interrupt();
        this.currentOutputTurnText = "";
        if (this.isMicMode && !this.isUserStopped) {
          voiceStore.setState("LISTENING");
        } else {
          voiceStore.setState("IDLE");
        }
      }

      const interimIn = msg.serverContent?.interimInputTranscription?.text;
      const finalIn = msg.serverContent?.inputTranscription?.text;
      if (interimIn || finalIn) {
        const piece = finalIn || interimIn || "";
        if (audioPlaybackQueue.isPlaying() && piece.trim().length > 1) {
          audioPlaybackQueue.interrupt();
        }
        this.currentInputTurnText += piece;
        voiceStore.setUserCaption(this.currentInputTurnText.trim(), false);
      }

      const outTrans = msg.serverContent?.outputTranscription?.text;
      if (outTrans) {
        this.currentOutputTurnText += outTrans;
        voiceStore.setAssistantCaption(this.currentOutputTurnText.trim(), {
          isFinal: false,
        });
      }

      const parts = msg.serverContent?.modelTurn?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          audioPlaybackQueue.enqueuePcmChunk(
            part.inlineData.data,
            part.inlineData.mimeType || "audio/pcm;rate=24000"
          );
        }
        if (part.text && !outTrans) {
          this.currentOutputTurnText += part.text;
          voiceStore.setAssistantCaption(this.currentOutputTurnText.trim(), {
            isFinal: false,
          });
        }
      }

      if (msg.toolCall?.functionCalls && msg.toolCall.functionCalls.length > 0) {
        voiceStore.setState("THINKING");
        const responses = [];
        for (const fc of msg.toolCall.functionCalls) {
          voiceStore.setAssistantCaption(`टूल चल रहा है: ${fc.name}...`, {
            toolBadge: fc.name,
            isFinal: false,
          });
          const res = await executeLiveFunctionCall({
            id: fc.id,
            name: fc.name,
            args: fc.args as Record<string, any>,
          });
          responses.push(res);
        }

        if (this.session) {
          this.session.sendToolResponse({
            functionResponses: responses,
          });
          voiceStore.log("INFO", `[Live] Sent ${responses.length} tool response(s).`);
        }
      }

      if (msg.serverContent?.turnComplete) {
        if (this.currentInputTurnText.trim()) {
          voiceStore.setUserCaption(this.currentInputTurnText.trim(), true);
          this.currentInputTurnText = "";
        }
        if (this.currentOutputTurnText.trim()) {
          voiceStore.setAssistantCaption(this.currentOutputTurnText.trim(), {
            isFinal: true,
          });
          this.currentOutputTurnText = "";
        }
        if (!audioPlaybackQueue.isPlaying()) {
          voiceStore.setState(this.isMicMode && !this.isUserStopped ? "LISTENING" : "IDLE");
        }
      }

      if (msg.goAway) {
        voiceStore.log(
          "WARN",
          `[Live] Server sent goAway (timeLeft=${msg.goAway.timeLeft || "soon"}).`
        );
      }
    } catch (err: any) {
      voiceStore.log("ERROR", `handleServerMessage error: ${err?.message || err}`);
    }
  }

  private async handleUnexpectedClose(reason: string) {
    if (this.isUserStopped) {
      voiceStore.setState("IDLE");
      return;
    }

    if (this.reconnectAttempts < 1) {
      this.reconnectAttempts += 1;
      voiceStore.log("INFO", "[Live] Unexpected drop — attempting 1x auto-reconnect...");
      voiceStore.setState("CONNECTING");
      const reconnected = await this.connectLiveWithFallback();
      if (reconnected && this.session) {
        voiceStore.setState(this.isMicMode ? "LISTENING" : "IDLE");
        return;
      }
    }

    audioStreamer.stopStream();
    audioPlaybackQueue.interrupt();
    voiceStore.setError({
      hindiMessage: "वॉइस कनेक्शन टूट गया। कृपया दोबारा कनेक्ट करें।",
      technicalError: `Live session closed: ${reason}`,
      actionLabel: "Reconnect",
      actionType: "RETRY",
    });
  }

  public async sendTypedMessage(text: string): Promise<void> {
    const cleaned = text.trim();
    if (!cleaned) return;

    if (!hasConfiguredApiKey()) {
      voiceStore.setError({
        hindiMessage: "Gemini API Key सेट नहीं है। कृपया Settings में अपनी API Key जोड़ें।",
        technicalError: "MISSING_API_KEY: Cannot send message without API key.",
        actionLabel: "Settings खोलें",
        actionType: "OPEN_SETTINGS",
      });
      return;
    }

    voiceStore.clearError();
    voiceStore.setUserCaption(cleaned, true);
    audioPlaybackQueue.interrupt();

    try {
      await audioPlaybackQueue.ensureAudioContextRunning();

      if (!this.session) {
        this.isUserStopped = false;
        voiceStore.setState("CONNECTING");
        const connected = await this.connectLiveWithFallback();
        if (!connected || !this.session) {
          return;
        }
      }

      voiceStore.setState("THINKING");
      this.currentOutputTurnText = "";
      this.session.sendClientContent({
        turns: [{ role: "user", parts: [{ text: cleaned }] }],
        turnComplete: true,
      });
      voiceStore.log("INFO", `[Live] Sent typed turn (${cleaned.length} chars).`);
    } catch (err: any) {
      const cleanErr = redactSecrets(String(err?.message || err));
      voiceStore.setError({
        hindiMessage: "संदेश भेजने में समस्या आई। कृपया दोबारा कोशिश करें।",
        technicalError: cleanErr,
        actionLabel: "Retry",
        actionType: "RETRY",
      });
    }
  }

  public async switchCharacter(newRole: CharacterRole): Promise<void> {
    const prevRole = voiceStore.getSnapshot().activeRole;
    voiceStore.setActiveRole(newRole);
    audioPlaybackQueue.interrupt();

    if (this.session && !this.isUserStopped) {
      voiceStore.log(
        "INFO",
        `[Live] Reconnecting session for new character ${newRole} (was ${prevRole})...`
      );
      const oldSession = this.session;
      this.session = null;
      try {
        oldSession.close();
      } catch {}

      voiceStore.setState("CONNECTING");
      const ok = await this.connectLiveWithFallback();
      if (ok) {
        voiceStore.setState(this.isMicMode ? "LISTENING" : "IDLE");
      }
    }
  }

  public async speakReadAloud(text: string, roleOverride?: CharacterRole): Promise<boolean> {
    const cleanText = text.replace(/[*#`_~]/g, "").trim();
    if (!cleanText) return false;

    if (!hasConfiguredApiKey()) {
      voiceStore.setError({
        hindiMessage: "Gemini API Key सेट नहीं है। कृपया Settings में अपनी API Key जोड़ें।",
        technicalError: "MISSING_API_KEY: Cannot synthesize TTS without API key.",
        actionLabel: "Settings खोलें",
        actionType: "OPEN_SETTINGS",
      });
      return false;
    }

    try {
      await audioPlaybackQueue.ensureAudioContextRunning();
      audioPlaybackQueue.interrupt();

      const role = roleOverride || voiceStore.getSnapshot().activeRole;
      const voiceName = voiceStore.getVoiceForRole(role);
      const ai = createGenAIClient();
      let lastError = "";

      for (const ttsModel of GEMINI_MODELS.TTS_CANDIDATES) {
        try {
          voiceStore.log(
            "INFO",
            `[TTS] Requesting audio from model="${ttsModel}", voice="${voiceName}"...`
          );

          const res = await ai.models.generateContent({
            model: ttsModel,
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName,
                  },
                },
              },
            },
          });

          const parts = res.candidates?.[0]?.content?.parts || [];
          let enqueuedCount = 0;

          for (const part of parts) {
            if (part.inlineData?.data) {
              audioPlaybackQueue.enqueuePcmChunk(
                part.inlineData.data,
                part.inlineData.mimeType || "audio/pcm;rate=24000"
              );
              enqueuedCount++;
            }
          }

          if (enqueuedCount > 0) {
            voiceStore.log(
              "INFO",
              `[TTS] Playing ${enqueuedCount} chunk(s) from model="${ttsModel}" (voice="${voiceName}").`
            );
            return true;
          }

          lastError = `Model ${ttsModel} returned no inlineData audio parts.`;
          voiceStore.log("WARN", `[TTS] ${lastError}`);
        } catch (err: any) {
          lastError = redactSecrets(String(err?.message || err));
          voiceStore.log("WARN", `[TTS] Model "${ttsModel}" failed: ${lastError}`);
          if (!isModelNotFoundError(err) && !lastError.toLowerCase().includes("modality")) {
            break;
          }
        }
      }

      voiceStore.setError({
        hindiMessage: "Gemini TTS आवाज़ चलाने में समस्या आई।",
        technicalError: lastError || "All TTS model candidates failed.",
        actionLabel: "Settings जांचें",
        actionType: "OPEN_SETTINGS",
      });
      return false;
    } catch (err: any) {
      const cleanErr = redactSecrets(String(err?.message || err));
      voiceStore.setError({
        hindiMessage: "ऑडियो आउटपुट शुरू नहीं हो सका।",
        technicalError: cleanErr,
        actionLabel: "Retry",
        actionType: "RETRY",
      });
      return false;
    }
  }

  public stopSession(): void {
    this.isUserStopped = true;
    this.isMicMode = false;
    this.currentInputTurnText = "";
    this.currentOutputTurnText = "";

    audioStreamer.stopStream();
    audioPlaybackQueue.interrupt();

    if (this.session) {
      const s = this.session;
      this.session = null;
      try {
        s.close();
      } catch {}
    }

    voiceStore.setState("IDLE");
    voiceStore.log("INFO", "[Live] Session stopped and resources cleaned up.");
  }
}

export const liveSession = new LiveSessionManager();
