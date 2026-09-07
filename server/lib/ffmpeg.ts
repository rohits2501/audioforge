import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

function systemFfmpeg(): string | null {
  for (const bin of ["ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]) {
    const which = spawnSync("which", [bin], { encoding: "utf8" });
    if (bin.startsWith("/") && existsSync(bin)) return bin;
    if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  }
  const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  if (probe.status === 0) return "ffmpeg";
  return null;
}

export function getFfmpegPath(): string {
  const system = systemFfmpeg();
  if (system) return system;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegStatic = require("ffmpeg-static") as string | null;
    if (ffmpegStatic && existsSync(ffmpegStatic)) return ffmpegStatic;
  } catch {
    /* package not installed yet */
  }
  throw new Error(
    "ffmpeg not found. Install ffmpeg (brew install ffmpeg) or npm i ffmpeg-static.",
  );
}

export function getFfprobePath(): string {
  const candidates = ["ffprobe", "/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe"];
  for (const bin of candidates) {
    if (bin.startsWith("/") && existsSync(bin)) return bin;
    const which = spawnSync("which", [bin], { encoding: "utf8" });
    if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffprobeStatic = require("ffprobe-static") as { path?: string };
    if (ffprobeStatic?.path && existsSync(ffprobeStatic.path)) return ffprobeStatic.path;
  } catch {
    /* optional */
  }
  return "ffprobe";
}

export function runFfmpeg(args: string[]): void {
  const bin = getFfmpegPath();
  const result = spawnSync(bin, ["-y", ...args], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed (${result.status}): ${result.stderr || result.stdout}`);
  }
}

export function probeDurationMs(filePath: string): number {
  try {
    const { durationMsFromWav } = require("./wav") as typeof import("./wav");
    if (filePath.endsWith(".wav")) {
      const wavMs = durationMsFromWav(filePath);
      if (wavMs > 0) return wavMs;
    }
  } catch {
    /* continue to ffprobe */
  }
  const bin = getFfprobePath();
  const result = spawnSync(
    bin,
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    const fallback = spawnSync(
      getFfmpegPath(),
      ["-i", filePath, "-f", "null", "-"],
      { encoding: "utf8" },
    );
    const match = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(fallback.stderr || "");
    if (!match) return 0;
    return Math.round(
      (Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])) * 1000,
    );
  }
  const seconds = Number(result.stdout.trim());
  return Number.isFinite(seconds) ? Math.round(seconds * 1000) : 0;
}

export function meanVolumeDb(filePath: string): number | null {
  try {
    const { meanDbFromWav } = require("./wav") as typeof import("./wav");
    if (filePath.endsWith(".wav")) {
      const db = meanDbFromWav(filePath);
      if (db !== null) return db;
    }
  } catch {
    /* continue */
  }
  const result = spawnSync(
    getFfmpegPath(),
    ["-i", filePath, "-af", "volumedetect", "-f", "null", "-"],
    { encoding: "utf8" },
  );
  const match = /mean_volume:\s*(-?\d+(?:\.\d+)?) dB/.exec(result.stderr || "");
  return match ? Number(match[1]) : null;
}
