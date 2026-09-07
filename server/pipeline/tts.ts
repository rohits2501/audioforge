import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { probeDurationMs, runFfmpeg } from "../lib/ffmpeg";
import { lineWavPath } from "../lib/paths";
import { estimateSarvamCostInr } from "../providers/sarvam";
import { providerById, routeProvider } from "../router";
import type {
  DialogueLine,
  GenerationLog,
  LineGenerationLog,
  ProductionPlan,
  ProviderId,
  VoiceAssignment,
} from "../types";
import { assignmentFor } from "./voices";

async function toWav(buffer: Buffer, mimeType: string, dest: string): Promise<void> {
  if (mimeType.includes("wav") || buffer.subarray(0, 4).toString() === "RIFF") {
    writeFileSync(dest, buffer);
    return;
  }
  const dir = mkdtempSync(join(tmpdir(), "af-tts-"));
  const src = join(dir, "in.bin");
  try {
    writeFileSync(src, buffer);
    runFfmpeg(["-i", src, "-ar", "24000", "-ac", "1", dest]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function synthesizeLine(
  episodeId: string,
  line: DialogueLine,
  language: string,
  assignment: VoiceAssignment,
): Promise<LineGenerationLog> {
  const started = Date.now();
  const dest = lineWavPath(episodeId, line.order);
  const task = line.character.toUpperCase() === "NARRATOR" ? "narration" : "dialogue";
  const provider = assignment.provider
    ? providerById(assignment.provider)
    : routeProvider({ language, task, characterId: line.character });

  try {
    const result = await provider.synthesize({
      text: line.text,
      language,
      voiceId: assignment.providerVoiceId,
      pace: line.delivery?.pace,
      emotion: line.emotion,
    });
    await toWav(result.buffer, result.mimeType, dest);
    const durationMs = probeDurationMs(dest);
    const latencyMs = Date.now() - started;
    const characters = line.text.length;
    return {
      order: line.order,
      character: line.character,
      provider: provider.id,
      voice: assignment.providerVoiceId,
      language,
      characters,
      durationMs,
      latencyMs,
      costInr: provider.id === "sarvam" ? estimateSarvamCostInr(characters) : 0,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      order: line.order,
      character: line.character,
      provider: provider.id,
      voice: assignment.providerVoiceId,
      language,
      characters: line.text.length,
      durationMs: 0,
      latencyMs: Date.now() - started,
      costInr: 0,
      error: message,
    };
  }
}

export async function synthesizePlan(
  episodeId: string,
  plan: ProductionPlan,
  options?: { onlyOrders?: number[]; assignments?: VoiceAssignment[] },
): Promise<GenerationLog> {
  const logs: LineGenerationLog[] = [];
  const lines = options?.onlyOrders
    ? plan.lines.filter((l) => options.onlyOrders!.includes(l.order))
    : plan.lines;

  for (const line of lines) {
    const assignment = assignmentFor(line.character, plan.language, options?.assignments);
    const log = await synthesizeLine(episodeId, line, plan.language, assignment);
    logs.push(log);
    if (log.error) {
      console.warn(`  line ${line.order} failed: ${log.error}`);
    } else {
      console.log(
        `  ✓ ${String(line.order).padStart(2, "0")} ${line.character} ${assignment.providerVoiceId} ${log.durationMs}ms`,
      );
    }
  }

  return {
    episode: episodeId,
    language: plan.language,
    provider: (logs[0]?.provider ?? "offline") as ProviderId,
    characters: [...new Set(plan.lines.map((l) => l.character))],
    lines: logs,
    durationMs: logs.reduce((a, l) => a + l.durationMs, 0),
    latencyMs: logs.reduce((a, l) => a + l.latencyMs, 0),
    costInr: logs.reduce((a, l) => a + l.costInr, 0),
    regenerations: options?.onlyOrders ? options.onlyOrders.length : 0,
    createdAt: new Date().toISOString(),
  };
}

export function mergeGenerationLogs(base: GenerationLog | null, next: GenerationLog): GenerationLog {
  if (!base) return next;
  const byOrder = new Map(base.lines.map((l) => [l.order, l]));
  for (const line of next.lines) byOrder.set(line.order, line);
  const lines = [...byOrder.values()].sort((a, b) => a.order - b.order);
  return {
    ...base,
    provider: next.provider,
    lines,
    durationMs: lines.reduce((a, l) => a + l.durationMs, 0),
    latencyMs: base.latencyMs + next.latencyMs,
    costInr: lines.reduce((a, l) => a + l.costInr, 0),
    regenerations: base.regenerations + next.regenerations,
    createdAt: next.createdAt,
  };
}

export function readLineWav(episodeId: string, order: number): Buffer | null {
  try {
    return readFileSync(lineWavPath(episodeId, order));
  } catch {
    return null;
  }
}
