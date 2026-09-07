import type { AudioResult, ProviderId, TtsInput, Voice } from "../types";

export interface AudioProvider {
  id: ProviderId;
  supports(language: string): boolean;
  listVoices(language: string): Promise<Voice[]>;
  synthesize(input: TtsInput): Promise<AudioResult>;
}
