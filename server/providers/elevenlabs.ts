import { getElevenLabsApiKey } from "../lib/env";
import type { AudioResult, TtsInput, Voice } from "../types";
import type { AudioProvider } from "./types";

const DEFAULT_VOICES: Voice[] = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", language: "en" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", language: "en" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", language: "en" },
];

export const elevenLabsProvider: AudioProvider = {
  id: "elevenlabs",

  supports(language: string): boolean {
    return language.startsWith("en");
  },

  async listVoices(): Promise<Voice[]> {
    return DEFAULT_VOICES;
  },

  async synthesize(input: TtsInput): Promise<AudioResult> {
    const apiKey = getElevenLabsApiKey();
    if (!apiKey) {
      throw new Error("ELEVENLABS_API_KEY is not set");
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(input.voiceId)}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: input.text,
          model_id: "eleven_multilingual_v2",
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ElevenLabs TTS ${res.status}: ${body}`);
    }

    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      mimeType: "audio/mpeg",
    };
  },
};
