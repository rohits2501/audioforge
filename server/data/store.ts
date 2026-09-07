import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { episodeDir, episodeJsonPath, EPISODES_DIR, generationLogPath } from "../lib/paths";
import type { EpisodeRecord, GenerationLog, LineStatus } from "../types";

export function saveEpisode(record: EpisodeRecord): EpisodeRecord {
  episodeDir(record.id);
  record.updatedAt = new Date().toISOString();
  writeFileSync(episodeJsonPath(record.id), JSON.stringify(record, null, 2) + "\n");
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

export function listEpisodes(): EpisodeRecord[] {
  if (!existsSync(EPISODES_DIR)) return [];
  return readdirSync(EPISODES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => loadEpisode(d.name))
    .filter((e): e is EpisodeRecord => e !== null)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
