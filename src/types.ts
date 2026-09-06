export interface VoiceProfile {
  id: string;
  name: string;
  channelName: string;
  description?: string;
  gender: 'Male' | 'Female' | string;
  accent: string;
  voice: string;
  style: string;
  pace: string;
  voiceDirection: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationDraft {
  projectTitle: string;
  scene: string;
  sampleContext: string;
  text: string;
}

export interface VoiceOption {
  name: string;
  description: string;
  gender: 'Male' | 'Female' | string;
  category: string;
}

export interface GenerationResult {
  id: string;
  audioBase64: string;
  mimeType: string;
  sampleRate: number;
  latencyMs: number;
  voice: string;
  model: string;
  usageMetadata?: any;
  durationSec: number;
  wavBlob: Blob;
  wavUrl: string;
  filename: string;
  profileName: string;
  channelName: string;
  text: string;
  generatedAt: string;
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: string;
  profileId?: string;
  profileName: string;
  channelName: string;
  voice: string;
  projectTitle?: string;
  textSnippet: string;
  fullText: string;
  sceneSnippet?: string;
  durationSec: number;
  latencyMs: number;
  filename: string;
  sampleRate: number;
  audioBase64?: string;
}
