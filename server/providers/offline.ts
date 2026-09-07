import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeWav } from "../lib/wav";
import type { AudioResult, TtsInput, Voice } from "../types";
import type { AudioProvider } from "./types";

const RATE: Record<string, number> = {
  shubh: 155,
  aditya: 175,
  ritu: 195,
  priya: 200,
  narrator: 155,
};

function sayVoice(language: string, voiceId: string): string {
  if (language.startsWith("hi")) return "Lekha";
  if (voiceId === "ritu" || voiceId === "priya") return "Samantha";
  return "Rishi";
}

function wavFromSay(text: string, voice: string, rate: number): Buffer {
  const dir = mkdtempSync(join(tmpdir(), "audioforge-"));
  const aiff = join(dir, "line.aiff");
  const wav = join(dir, "line.wav");
  try {
    const said = spawnSync("say", ["-v", voice, "-r", String(rate), "-o", aiff, text], {
      encoding: "utf8",
    });
    if (said.status !== 0) {
      throw new Error(said.stderr || "macOS say failed");
    }
    const af = spawnSync("afconvert", ["-f", "WAVE", "-d", "LEI16@24000", aiff, wav], {
      encoding: "utf8",
    });
    if (af.status !== 0) {
      const af2 = spawnSync("afconvert", ["-f", "WAVE", "-d", "LEI16", aiff, wav], {
        encoding: "utf8",
      });
      if (af2.status !== 0) {
        throw new Error(af.stderr || af2.stderr || "aiff→wav failed");
      }
    }
    const buf = readFileSync(wav);
    if (buf.length < 2000) throw new Error("say produced near-empty audio");
    return buf;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function toneWav(text: string, voiceId: string): Buffer {
  const seconds = Math.min(10, Math.max(1.4, text.length * 0.07));
  const sampleRate = 24000;
  const n = Math.round(seconds * sampleRate);
  const freq = 140 + (hash(voiceId) % 160);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const t = i / sampleRate;
    const env = Math.min(1, i / (0.02 * sampleRate)) * Math.min(1, (n - i) / (0.05 * sampleRate));
    samples[i] =
      env *
      (0.22 * Math.sin(2 * Math.PI * freq * t) + 0.08 * Math.sin(2 * Math.PI * freq * 2 * t));
  }
  const dir = mkdtempSync(join(tmpdir(), "audioforge-tone-"));
  const wav = join(dir, "line.wav");
  try {
    writeWav(wav, samples, sampleRate);
    return readFileSync(wav);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function hash(s: string): number {
  return [...s].reduce((a, c) => a + c.charCodeAt(0), 0);
}

export const offlineProvider: AudioProvider = {
  id: "offline",

  supports(): boolean {
    return true;
  },

  async listVoices(language: string): Promise<Voice[]> {
    return ["shubh", "aditya", "ritu", "priya"].map((id) => ({ id, name: id, language }));
  },

  async synthesize(input: TtsInput): Promise<AudioResult> {
    const rate = RATE[input.voiceId] ?? 170;
    const voice = sayVoice(input.language, input.voiceId);
    try {
      return { buffer: wavFromSay(input.text, voice, rate), mimeType: "audio/wav" };
    } catch {
      try {
        return { buffer: wavFromSay(input.text, "Lekha", rate), mimeType: "audio/wav" };
      } catch {
        return { buffer: toneWav(input.text, input.voiceId), mimeType: "audio/wav" };
      }
    }
  },
};
