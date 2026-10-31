import { encodeInt16ToBase64 } from "./AudioDecoder";
import { voiceStore } from "./voiceStore";

const WORKLET_PROCESSOR_CODE = `
class MyraaPcm16Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetRate = 16000;
    this.buffer = new Int16Array(1600);
    this.writeIndex = 0;
    this.resampleAccum = 0;
    this.sumSq = 0;
    this.sampleCount = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channelData = input[0];
    const ratio = sampleRate / this.targetRate;

    for (let i = 0; i < channelData.length; i++) {
      this.resampleAccum += 1;
      if (this.resampleAccum >= ratio) {
        this.resampleAccum -= ratio;
        const s = Math.max(-1, Math.min(1, channelData[i]));
        this.sumSq += s * s;
        this.sampleCount += 1;
        this.buffer[this.writeIndex++] = s < 0 ? s * 0x8000 : s * 0x7fff;

        if (this.writeIndex >= this.buffer.length) {
          const rms = Math.sqrt(this.sumSq / Math.max(1, this.sampleCount));
          const chunk = this.buffer.slice(0);
          this.port.postMessage({ pcm16: chunk, rms }, [chunk.buffer]);
          this.writeIndex = 0;
          this.sumSq = 0;
          this.sampleCount = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("myraa-pcm16-processor", MyraaPcm16Processor);
`;

export class AudioStreamer {
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private muteGain: GainNode | null = null;
  private workletRegisteredOnCtx: WeakSet<AudioContext> = new WeakSet();
  private streaming: boolean = false;

  public async requestMicAccess(echoCancellation: boolean = true): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("MIC_UNSUPPORTED: इस ब्राउज़र या वेबव्यू में माइक्रोफ़ोन API उपलब्ध नहीं है।");
    }

    this.stopStream();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 16000,
      },
    });

    this.mediaStream = stream;
    voiceStore.log(
      "INFO",
      `Microphone access granted (echoCancellation=${echoCancellation}).`
    );
    return stream;
  }

  public async startStreaming(
    ctx: AudioContext,
    stream: MediaStream,
    onChunk: (base64Pcm16: string, rms: number) => void
  ): Promise<void> {
    this.stopNodesOnly();
    this.mediaStream = stream;
    this.streaming = true;

    this.sourceNode = ctx.createMediaStreamSource(stream);
    this.muteGain = ctx.createGain();
    this.muteGain.gain.value = 0;
    this.muteGain.connect(ctx.destination);

    if (ctx.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      try {
        if (!this.workletRegisteredOnCtx.has(ctx)) {
          const blob = new Blob([WORKLET_PROCESSOR_CODE], { type: "application/javascript" });
          const blobUrl = URL.createObjectURL(blob);
          try {
            await ctx.audioWorklet.addModule(blobUrl);
            this.workletRegisteredOnCtx.add(ctx);
          } finally {
            URL.revokeObjectURL(blobUrl);
          }
        }

        const worklet = new AudioWorkletNode(ctx, "myraa-pcm16-processor");
        worklet.port.onmessage = (ev) => {
          if (!this.streaming) return;
          const { pcm16, rms } = ev.data as { pcm16: Int16Array; rms: number };
          const normalizedLevel = Math.min(1, rms * 4.5);
          voiceStore.setMicLevel(normalizedLevel);
          const base64 = encodeInt16ToBase64(pcm16);
          onChunk(base64, normalizedLevel);
        };

        this.sourceNode.connect(worklet);
        worklet.connect(this.muteGain);
        this.workletNode = worklet;
        voiceStore.log("INFO", "Mic streaming started via AudioWorklet (16kHz PCM16 LE).");
        return;
      } catch (workletErr: any) {
        voiceStore.log(
          "WARN",
          `AudioWorklet unavailable (${workletErr?.message || workletErr}), using ScriptProcessor fallback.`
        );
      }
    }

    const processor = ctx.createScriptProcessor(2048, 1, 1);
    const inputRate = ctx.sampleRate;
    const targetRate = 16000;
    const ratio = inputRate / targetRate;
    let resampleAccum = 0;
    const outBuffer = new Int16Array(1600);
    let writeIdx = 0;
    let sumSq = 0;
    let count = 0;

    processor.onaudioprocess = (event) => {
      if (!this.streaming) return;
      const input = event.inputBuffer.getChannelData(0);
      for (let i = 0; i < input.length; i++) {
        resampleAccum += 1;
        if (resampleAccum >= ratio) {
          resampleAccum -= ratio;
          const s = Math.max(-1, Math.min(1, input[i]));
          sumSq += s * s;
          count += 1;
          outBuffer[writeIdx++] = s < 0 ? s * 0x8000 : s * 0x7fff;
          if (writeIdx >= outBuffer.length) {
            const rms = Math.sqrt(sumSq / Math.max(1, count));
            const normalizedLevel = Math.min(1, rms * 4.5);
            voiceStore.setMicLevel(normalizedLevel);
            const base64 = encodeInt16ToBase64(outBuffer);
            onChunk(base64, normalizedLevel);
            writeIdx = 0;
            sumSq = 0;
            count = 0;
          }
        }
      }
    };

    this.sourceNode.connect(processor);
    processor.connect(this.muteGain);
    this.scriptProcessor = processor;
    voiceStore.log("INFO", "Mic streaming started via ScriptProcessor fallback (16kHz PCM16 LE).");
  }

  private stopNodesOnly() {
    this.streaming = false;
    voiceStore.setMicLevel(0);

    if (this.workletNode) {
      try {
        this.workletNode.port.onmessage = null;
        this.workletNode.disconnect();
      } catch {}
      this.workletNode = null;
    }

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.onaudioprocess = null;
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch {}
      this.sourceNode = null;
    }

    if (this.muteGain) {
      try {
        this.muteGain.disconnect();
      } catch {}
      this.muteGain = null;
    }
  }

  public stopStream() {
    this.stopNodesOnly();
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.mediaStream = null;
    }
  }

  public isStreaming(): boolean {
    return this.streaming;
  }
}

export const audioStreamer = new AudioStreamer();
