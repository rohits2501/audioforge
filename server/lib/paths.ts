import { existsSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

export const ROOT = process.cwd();
export const DATA_DIR = join(ROOT, "data");
export const EPISODES_DIR = join(DATA_DIR, "episodes");
export const SFX_DIR = join(ROOT, "sfx");
export const VOICES_PATH = join(DATA_DIR, "voices.json");
export const FIXTURES_DIR = join(ROOT, "fixtures", "scripts");
export const FIXTURE_EPISODES_DIR = join(ROOT, "fixtures", "episodes");

/** Read existing episode files. Seeded fixtures win only when no writable copy exists. */
export function resolveEpisodeDir(episodeId: string): string | null {
  const writable = join(EPISODES_DIR, episodeId);
  if (existsSync(join(writable, "episode.json"))) return writable;
  const seeded = join(FIXTURE_EPISODES_DIR, episodeId);
  if (existsSync(join(seeded, "episode.json"))) return seeded;
  return null;
}

/** Always write new/updated episodes under data/episodes. */
export function episodeDir(episodeId: string): string {
  const dir = join(EPISODES_DIR, episodeId);
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function lineWavPath(episodeId: string, order: number): string {
  return join(episodeDir(episodeId), `line_${String(order).padStart(3, "0")}.wav`);
}

export function episodeJsonPath(episodeId: string): string {
  const existing = resolveEpisodeDir(episodeId);
  if (existing) return join(existing, "episode.json");
  return join(episodeDir(episodeId), "episode.json");
}

export function generationLogPath(episodeId: string): string {
  return join(episodeDir(episodeId), "generation.json");
}

export function ensureDataDirs(): void {
  mkdirSync(EPISODES_DIR, { recursive: true });
  mkdirSync(SFX_DIR, { recursive: true });
  mkdirSync(resolve(ROOT, "data"), { recursive: true });
}
