export type CharacterRole = "narrator" | "speaker";

export type LineStatus =
  | "pending"
  | "generated"
  | "reviewed"
  | "approved"
  | "needs_regeneration";

export type ProviderId = "sarvam" | "elevenlabs" | "offline";

export interface Character {
  name: string;
  role: CharacterRole;
}

export interface Scene {
  index: number;
  heading?: string;
  ambience?: string;
}

export interface Delivery {
  pace?: number;
  intensity?: number;
}

export interface DialogueLine {
  character: string;
  text: string;
  emotion?: string;
  sceneIndex: number;
  order: number;
  pronunciationHints?: string;
  delivery?: Delivery;
}

export interface SfxEvent {
  tag: string;
  sceneIndex: number;
  afterLineIndex: number;
}

export interface ProductionPlan {
  language: string;
  characters: Character[];
  scenes: Scene[];
  lines: DialogueLine[];
  sfx: SfxEvent[];
}

export interface VoiceAssignment {
  character: string;
  language: string;
  provider: ProviderId;
  providerVoiceId: string;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: string;
}

export interface TtsInput {
  text: string;
  language: string;
  voiceId: string;
  pace?: number;
  emotion?: string;
}

export interface AudioResult {
  buffer: Buffer;
  mimeType: string;
  requestId?: string;
}

export interface RouterInput {
  language: string;
  characterId?: string;
  task: "narration" | "dialogue" | "sfx";
  costHint?: "low" | "balanced";
  qualityHint?: "standard" | "premium";
}

export interface LineGenerationLog {
  order: number;
  character: string;
  provider: ProviderId;
  voice: string;
  language: string;
  characters: number;
  durationMs: number;
  latencyMs: number;
  costInr: number;
  error?: string;
}

export interface GenerationLog {
  episode: string;
  language: string;
  provider: ProviderId;
  characters: string[];
  lines: LineGenerationLog[];
  durationMs: number;
  latencyMs: number;
  costInr: number;
  regenerations: number;
  createdAt: string;
}

export interface QaCheck {
  lineOrder: number;
  hasFile: boolean;
  durationMs: number;
  notSilent: boolean;
  passed: boolean;
  notes: string[];
}

export interface EpisodeRecord {
  id: string;
  title: string;
  language: string;
  scriptText: string;
  plan: ProductionPlan;
  lineStatuses: Record<number, LineStatus>;
  lineAudio: Record<number, string>;
  generation: GenerationLog | null;
  mixMp3?: string;
  mixWav?: string;
  createdAt: string;
  updatedAt: string;
}
