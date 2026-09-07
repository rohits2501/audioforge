import { getSarvamApiKey } from "../lib/env";
import type { AudioResult, TtsInput, Voice } from "../types";
import type { AudioProvider } from "./types";

const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";
const SARVAM_COST_INR_PER_10K = 30;

export const SARVAM_V3_SPEAKERS = [
  "shubh",
  "aditya",
  "ritu",
  "priya",
  "neha",
  "rahul",
  "pooja",
  "rohan",
  "simran",
  "kavya",
  "amit",
  "dev",
  "ishita",
  "shreya",
  "ratan",
  "varun",
  "manan",
  "sumit",
  "roopa",
  "kabir",
] as const;

const INDIC = new Set([
  "hi-IN",
  "bn-IN",
  "gu-IN",
  "kn-IN",
  "ml-IN",
  "mr-IN",
  "od-IN",
  "pa-IN",
  "ta-IN",
  "te-IN",
  "en-IN",
]);

export function estimateSarvamCostInr(charCount: number): number {
  return (charCount / 10_000) * SARVAM_COST_INR_PER_10K;
}

export const sarvamProvider: AudioProvider = {
  id: "sarvam",

  supports(language: string): boolean {
    return INDIC.has(language);
  },

  async listVoices(language: string): Promise<Voice[]> {
    return SARVAM_V3_SPEAKERS.map((id) => ({
      id,
      name: id,
      language,
    }));
  },

  async synthesize(input: TtsInput): Promise<AudioResult> {
    const apiKey = getSarvamApiKey();
    if (!apiKey) {
      throw new Error("SARVAM_API_KEY is not set");
    }
    if (input.text.length > 2500) {
      throw new Error("Sarvam bulbul:v3 max is 2,500 characters per request");
    }

    const res = await fetch(SARVAM_TTS_URL, {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: input.text,
        language_code: input.language,
        speaker: input.voiceId,
        model: "bulbul:v3",
        pace: input.pace ?? 1,
        output_audio_codec: "wav",
        speech_sample_rate: 24000,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Sarvam TTS ${res.status}: ${body}`);
    }

    const json = (await res.json()) as {
      request_id?: string;
      audios?: string[];
    };
    const b64 = json.audios?.[0];
    if (!b64) throw new Error("Sarvam TTS returned no audio");

    return {
      buffer: Buffer.from(b64, "base64"),
      mimeType: "audio/wav",
      requestId: json.request_id,
    };
  },
};
