import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { getFfmpegPath, probeDurationMs, runFfmpeg } from "../lib/ffmpeg";
import { episodeDir } from "../lib/paths";
import {
  concatWithGaps,
  fade,
  loopOverlay,
  overlayAt,
  peakNormalize,
  readWav,
  resample,
  writeWav,
} from "../lib/wav";
import type { ProductionPlan } from "../types";
import { AMBIENCE_TAGS, sfxPath } from "./sfx";

const GAP_MS = 350;
const FADE_MS = 75;
const SAMPLE_RATE = 24000;
const TARGET_LUFS = -16;

export interface MixResult {
  mp3: string;
  wav: string;
  durationMs: number;
  lineStartsMs: number[];
}

export function mixEpisode(
  episodeId: string,
  plan: ProductionPlan,
  linePaths: string[],
): MixResult {
  const dir = episodeDir(episodeId);
  const wav = join(dir, "episode.wav");
  const mp3 = join(dir, "episode.mp3");

  const parts = linePaths.map((path) => {
    const w = readWav(path);
    return resample(w.samples, w.sampleRate, SAMPLE_RATE);
  });

  const gapSamples = Math.round((GAP_MS / 1000) * SAMPLE_RATE);
  const lineStartsMs: number[] = [];
  let cursor = 0;
  for (let i = 0; i < parts.length; i += 1) {
    lineStartsMs.push(Math.round((cursor / SAMPLE_RATE) * 1000));
    cursor += parts[i]!.length;
    if (i < parts.length - 1) cursor += gapSamples;
  }

  const dialogue = concatWithGaps(parts, gapSamples);
  const mix = new Float32Array(dialogue);
  mix.set(dialogue);

  for (const event of plan.sfx) {
    const path = sfxPath(event.tag);
    if (!path) continue;
    const sfx = readWav(path);
    const samples = resample(sfx.samples, sfx.sampleRate, SAMPLE_RATE);
    const after = lineStartsMs[event.afterLineIndex] ?? 0;
    const afterDur = Math.round(((parts[event.afterLineIndex]?.length ?? 0) / SAMPLE_RATE) * 1000);
    overlayAt(mix, samples, Math.round(((after + afterDur) / 1000) * SAMPLE_RATE), 0.55);
  }

  for (const scene of plan.scenes) {
    if (!scene.ambience) continue;
    const tag = scene.ambience.toUpperCase();
    if (!AMBIENCE_TAGS.has(tag)) continue;
    const path = sfxPath(tag);
    if (!path) continue;
    const bed = readWav(path);
    loopOverlay(mix, resample(bed.samples, bed.sampleRate, SAMPLE_RATE), 0.16);
  }

  fade(mix, Math.round((FADE_MS / 1000) * SAMPLE_RATE));
  peakNormalize(mix, 0.2);
  writeWav(wav, mix, SAMPLE_RATE);

  if (ffmpegAvailable()) {
    try {
      const faded = join(dir, "episode_loud.wav");
      const durationSec = mix.length / SAMPLE_RATE;
      const fadeSec = FADE_MS / 1000;
      runFfmpeg([
        "-i",
        wav,
        "-af",
        `loudnorm=I=${TARGET_LUFS}:TP=-1.5:LRA=11,afade=t=in:st=0:d=${fadeSec},afade=t=out:st=${Math.max(0, durationSec - fadeSec)}:d=${fadeSec}`,
        "-ar",
        "48000",
        faded,
      ]);
      copyFileSync(faded, wav);
    } catch {
      /* peak-normalized WAV is enough */
    }
    try {
      runFfmpeg(["-i", wav, "-b:a", "192k", mp3]);
    } catch {
      copyFileSync(wav, mp3);
    }
  } else {
    copyFileSync(wav, mp3);
  }

  return {
    mp3,
    wav,
    durationMs: probeDurationMs(wav),
    lineStartsMs,
  };
}

export function ffmpegAvailable(): boolean {
  try {
    getFfmpegPath();
    return true;
  } catch {
    return false;
  }
}
