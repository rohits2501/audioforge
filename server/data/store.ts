import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  episodeDir,
  episodeJsonPath,
  EPISODES_DIR,
  FIXTURE_EPISODES_DIR,
  generationLogPath,
} from "../lib/paths";
import type { EpisodeRecord, LineStatus } from "../types";

export function saveEpisode(record: EpisodeRecord): EpisodeRecord {
  const dir = episodeDir(record.id);
  record.updatedAt = new Date().toISOString();
  writeFileSync(join(dir, "episode.json"), JSON.stringify(record, null, 2) + "\n");
  if (record.generation) {
    writeFileSync(generationLogPath(record.id), JSON.stringify(record.generation, null, 2) + "\n");
  }
  return record;
}

export function loadEpisode(id: string): EpisodeRecord | null {
  const path = episodeJsonPath(id);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as EpisodeRecord;
}

function listEpisodeIdsFrom(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function listEpisodes(): EpisodeRecord[] {
  const ids = new Set([...listEpisodeIdsFrom(FIXTURE_EPISODES_DIR), ...listEpisodeIdsFrom(EPISODES_DIR)]);
  return [...ids]
    .map((id) => loadEpisode(id))
    .filter((e): e is EpisodeRecord => e !== null)
    .sort((a, b) => {
      if (a.id === "rain-night") return -1;
      if (b.id === "rain-night") return 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

export function createEpisode(partial: {
  id: string;
  title: string;
  language: string;
  scriptText: string;
  plan: EpisodeRecord["plan"];
}): EpisodeRecord {
  const now = new Date().toISOString();
  const lineStatuses: Record<number, LineStatus> = {};
  for (const line of partial.plan.lines) lineStatuses[line.order] = "pending";
  return saveEpisode({
    id: partial.id,
    title: partial.title,
    language: partial.language,
    scriptText: partial.scriptText,
    plan: partial.plan,
    lineStatuses,
    lineAudio: {},
    generation: null,
    createdAt: now,
    updatedAt: now,
  });
}
