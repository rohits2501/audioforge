import { createEpisode, loadEpisode, saveEpisode } from "../data/store";
import { lineWavPath } from "../lib/paths";
import type { EpisodeRecord, LineStatus } from "../types";
import { mixEpisode } from "./mix";
import { parseCanonicalScript } from "./parse";
import { qaEpisode } from "./qa";
import { mergeGenerationLogs, synthesizePlan } from "./tts";
import { upsertAssignments } from "./voices";

export function slugId(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${base || "episode"}-${Date.now().toString(36)}`;
}

export function planFromScript(scriptText: string, language = "hi-IN") {
  return parseCanonicalScript(scriptText, language);
}

export async function generateEpisodeFromScript(input: {
  title: string;
  scriptText: string;
  language?: string;
  episodeId?: string;
}): Promise<EpisodeRecord> {
  const language = input.language ?? "hi-IN";
  const parsed = parseCanonicalScript(input.scriptText, language);
  for (const warning of parsed.warnings) console.warn(warning);

  const id = input.episodeId ?? slugId(input.title);
  upsertAssignments(parsed.plan.characters, language, "sarvam");

  let episode = loadEpisode(id);
  if (!episode) {
    episode = createEpisode({
      id,
      title: input.title,
      language,
      scriptText: input.scriptText,
      plan: parsed.plan,
    });
  } else {
    episode.plan = parsed.plan;
    episode.scriptText = input.scriptText;
    episode.language = language;
    saveEpisode(episode);
  }

  return generateExistingEpisode(id);
}

export async function generateExistingEpisode(
  episodeId: string,
  onlyOrders?: number[],
): Promise<EpisodeRecord> {
  const episode = loadEpisode(episodeId);
  if (!episode) throw new Error(`Episode ${episodeId} not found`);

  const log = await synthesizePlan(episodeId, episode.plan, { onlyOrders });
  episode.generation = mergeGenerationLogs(episode.generation, log);

  const orders = onlyOrders ?? episode.plan.lines.map((l) => l.order);
  for (const order of orders) {
    const lineLog = log.lines.find((l) => l.order === order);
    episode.lineStatuses[order] = lineLog?.error ? "needs_regeneration" : "generated";
    if (!lineLog?.error) episode.lineAudio[order] = lineWavPath(episodeId, order);
  }

  const qa = qaEpisode(
    episode.plan.lines.map((l) => ({
      order: l.order,
      path: episode.lineAudio[l.order] ?? lineWavPath(episodeId, l.order),
    })),
  );

  if (!qa.passed) {
    for (const order of qa.failedOrders) {
      episode.lineStatuses[order] = "needs_regeneration";
    }
    saveEpisode(episode);
    console.warn(`QA failed for lines: ${qa.failedOrders.join(", ")}`);
    return episode;
  }

  const linePaths = episode.plan.lines.map((l) => episode.lineAudio[l.order] ?? lineWavPath(episodeId, l.order));
  const mix = mixEpisode(episodeId, episode.plan, linePaths);
  episode.mixMp3 = mix.mp3;
  episode.mixWav = mix.wav;
  if (episode.generation) {
    episode.generation.durationMs = mix.durationMs;
  }
  saveEpisode(episode);
  return episode;
}

export function setLineStatus(episodeId: string, order: number, status: LineStatus): EpisodeRecord {
  const episode = loadEpisode(episodeId);
  if (!episode) throw new Error(`Episode ${episodeId} not found`);
  episode.lineStatuses[order] = status;
  return saveEpisode(episode);
}

export async function regenerateLines(episodeId: string, orders: number[]): Promise<EpisodeRecord> {
  const episode = loadEpisode(episodeId);
  if (!episode) throw new Error(`Episode ${episodeId} not found`);
  for (const order of orders) {
    episode.lineStatuses[order] = "needs_regeneration";
  }
  saveEpisode(episode);
  return generateExistingEpisode(episodeId, orders);
}
