/**
 * Parses the sample rate from a Gemini audio mimeType (e.g. "audio/pcm;rate=24000").
 * Defaults to 24000 Hz if not specified.
 */
export function parseSampleRateFromMimeType(mimeType?: string): number {
  if (!mimeType) return 24000;
  const match = mimeType.match(/rate\s*=\s*(\d+)/i);
  if (match && match[1]) {
    const parsed = parseInt(match[1], 10);
    if (parsed >= 8000 && parsed <= 96000) {
      return parsed;
    }
  }
  return 24000;
}

/**
 * Converts a base64-encoded mono 16-bit little-endian PCM chunk into a Web Audio AudioBuffer.
 * Formula: base64 -> Uint8Array -> Int16 (LE) -> Float32 (/ 32768.0) -> AudioBuffer
 */
export function decodeBase64Pcm16ToAudioBuffer(
  ctx: AudioContext,
  base64Data: string,
  mimeType?: string
): AudioBuffer | null {
  if (!base64Data) return null;

  const sampleRate = parseSampleRateFromMimeType(mimeType);
  const binaryStr = atob(base64Data);
  const byteLength = binaryStr.length;
  const sampleCount = Math.floor(byteLength / 2);
  if (sampleCount <= 0) return null;

  const bytes = new Uint8Array(sampleCount * 2);
  for (let i = 0; i < sampleCount * 2; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const audioBuffer = ctx.createBuffer(1, sampleCount, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    channelData[i] = int16 / 32768.0;
  }

  return audioBuffer;
}

/**
 * Encodes a Float32 mono audio buffer (resampled to 16000 Hz) into base64 Int16 little-endian PCM.
 */
export function encodeInt16ToBase64(int16Samples: Int16Array): string {
  const bytes = new Uint8Array(int16Samples.buffer, int16Samples.byteOffset, int16Samples.byteLength);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  return btoa(binary);
}
