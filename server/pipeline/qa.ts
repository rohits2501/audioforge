import { existsSync } from "node:fs";
import { meanVolumeDb, probeDurationMs } from "../lib/ffmpeg";
import type { QaCheck } from "../types";

const SILENCE_DB = -45;

export function qaLine(filePath: string, lineOrder: number): QaCheck {
  const notes: string[] = [];
  const hasFile = existsSync(filePath);
  if (!hasFile) {
    notes.push("missing audio file");
    return { lineOrder, hasFile: false, durationMs: 0, notSilent: false, passed: false, notes };
  }

  const durationMs = probeDurationMs(filePath);
  if (durationMs <= 200) notes.push(`duration too short (${durationMs}ms)`);

  const mean = meanVolumeDb(filePath);
  const notSilent = mean === null ? durationMs > 80 : mean > SILENCE_DB;
  if (!notSilent) notes.push(`near-silent (mean ${mean ?? "?"} dB)`);

  return {
    lineOrder,
    hasFile,
    durationMs,
    notSilent,
    passed: hasFile && durationMs > 200 && notSilent,
    notes,
  };
}

export function qaEpisode(paths: { order: number; path: string }[]): {
  checks: QaCheck[];
  passed: boolean;
  failedOrders: number[];
} {
  const checks = paths.map((p) => qaLine(p.path, p.order));
  const failedOrders = checks.filter((c) => !c.passed).map((c) => c.lineOrder);
  return { checks, passed: failedOrders.length === 0, failedOrders };
}
