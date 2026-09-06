/**
 * Audio processing and WAV encoding utilities for Gemini TTS
 */

/**
 * Converts a Base64 string to a Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes raw 16-bit PCM audio samples to a standard RIFF/WAVE Blob
 */
export function convertPcmToWav(
  pcmData: Uint8Array,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Blob {
  // Check if data is already a valid WAV file (starts with 'RIFF')
  if (
    pcmData.length >= 12 &&
    pcmData[0] === 0x52 && // R
    pcmData[1] === 0x49 && // I
    pcmData[2] === 0x46 && // F
    pcmData[3] === 0x46    // F
  ) {
    return new Blob([pcmData], { type: "audio/wav" });
  }

  const headerLength = 44;
  const wavBuffer = new ArrayBuffer(headerLength + pcmData.byteLength);
  const view = new DataView(wavBuffer);

  // 1. "RIFF" chunk descriptor
  writeString(view, 0, "RIFF");
  // Total file size - 8 bytes
  view.setUint32(4, 36 + pcmData.byteLength, true);
  // "WAVE" format
  writeString(view, 8, "WAVE");

  // 2. "fmt " subchunk
  writeString(view, 12, "fmt ");
  // Subchunk1 size: 16 for PCM
  view.setUint32(16, 16, true);
  // AudioFormat: 1 = Linear PCM (uncompressed)
  view.setUint16(20, 1, true);
  // Number of channels
  view.setUint16(22, numChannels, true);
  // Sample rate (e.g. 24000)
  view.setUint32(24, sampleRate, true);
  // Byte rate = SampleRate * NumChannels * BitsPerSample / 8
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  view.setUint32(28, byteRate, true);
  // Block align = NumChannels * BitsPerSample / 8
  const blockAlign = (numChannels * bitsPerSample) / 8;
  view.setUint16(32, blockAlign, true);
  // Bits per sample
  view.setUint16(34, bitsPerSample, true);

  // 3. "data" subchunk
  writeString(view, 36, "data");
  // Subchunk2 size: PCM data size in bytes
  view.setUint32(40, pcmData.byteLength, true);

  // 4. Copy raw PCM data into destination buffer
  const wavBytes = new Uint8Array(wavBuffer);
  wavBytes.set(pcmData, headerLength);

  return new Blob([wavBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Calculates audio duration in seconds from raw PCM byte length
 */
export function calculatePcmDuration(
  byteLength: number,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): number {
  const bytesPerSecond = (sampleRate * numChannels * bitsPerSample) / 8;
  if (bytesPerSecond === 0) return 0;
  return byteLength / bytesPerSecond;
}

/**
 * Formats duration in seconds to MM:SS or M:SS.S
 */
export function formatDuration(seconds: number, includeTenths = false): string {
  if (isNaN(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  if (includeTenths && mins === 0) {
    return `${secs}.${tenths}s`;
  }
  return `${mins}:${paddedSecs}`;
}

/**
 * Returns approximate words per minute based on profile pacing
 */
export function getSpeakingRateWpm(pace?: string): number {
  switch (pace?.toLowerCase()) {
    case "slow":
      return 125;
    case "natural":
      return 150;
    case "fast":
      return 180;
    case "rapid fire":
      return 215;
    default:
      return 150;
  }
}

/**
 * Estimates narration duration in seconds based on text length and pacing style
 */
export function estimateNarrationDuration(text: string, pace?: string): number {
  if (!text || !text.trim()) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;

  const wpm = getSpeakingRateWpm(pace);
  return (words / wpm) * 60;
}

// In-memory runtime audio cache to ensure any audio created in the session can always be played and downloaded
const runtimeAudioCache = new Map<string, { blob: Blob; url: string; base64?: string }>();

export function cacheRuntimeAudio(id: string, blob: Blob, url: string, base64?: string): void {
  runtimeAudioCache.set(id, { blob, url, base64 });
}

export function getRuntimeAudio(id: string): { blob: Blob; url: string; base64?: string } | undefined {
  return runtimeAudioCache.get(id);
}

/**
 * Triggers a client-side file download for an audio Blob
 */
export function triggerAudioDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".wav") ? filename : `${filename}.wav`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Cleans a string to be a safe filename
 */
export function sanitizeFilename(name: string): string {
  return name
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-");
}
