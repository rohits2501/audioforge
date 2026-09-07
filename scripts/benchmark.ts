/**
 * Week 4: same episode, versions B (AudioForge) and C (raw TTS concat).
 * Version A is the partner's human baseline — fill docs/benchmark.md by hand.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "../server/lib/env";
import { ensureDataDirs, episodeDir, lineWavPath } from "../server/lib/paths";
import { parseCanonicalScript } from "../server/pipeline/parse";
import { generateEpisodeFromScript } from "../server/pipeline/generate";
import { mixEpisode } from "../server/pipeline/mix";
import { synthesizePlan } from "../server/pipeline/tts";
import type { ProductionPlan, VoiceAssignment } from "../server/types";

loadEnv();
ensureDataDirs();

const file = process.argv[2] ?? "fixtures/scripts/tier1-five-minute.txt";
const source = readFileSync(file, "utf8");

function rawPlan(plan: ProductionPlan): { plan: ProductionPlan; assignments: VoiceAssignment[] } {
  return {
    plan: {
      ...plan,
      sfx: [],
      scenes: plan.scenes.map((s) => ({ ...s, ambience: undefined })),
    },
    assignments: plan.characters.map((c) => ({
      character: c.name,
      language: plan.language,
      provider: "sarvam" as const,
      providerVoiceId: "shubh",
    })),
  };
}

async function main() {
  const started = Date.now();
  console.log("Version B — AudioForge orchestration");
  const b = await generateEpisodeFromScript({
    title: "benchmark-b",
    scriptText: source,
    language: "hi-IN",
    episodeId: "benchmark-b",
  });

  console.log("\nVersion C — raw TTS, one voice, concat, no SFX/mix craft");
  const parsed = parseCanonicalScript(source, "hi-IN");
  const { plan, assignments } = rawPlan(parsed.plan);
  const cLog = await synthesizePlan("benchmark-c", plan, { assignments });
  const cPaths = plan.lines
    .filter((l) => !cLog.lines.find((x) => x.order === l.order)?.error)
    .map((l) => lineWavPath("benchmark-c", l.order));
  const cMix = mixEpisode("benchmark-c", { ...plan, sfx: [], scenes: plan.scenes.map((s) => ({ ...s, ambience: undefined })) }, cPaths);
  writeFileSync(join(episodeDir("benchmark-c"), "generation.json"), JSON.stringify(cLog, null, 2));

  const sheet = `# A/B/C comparison

Episode fixture: \`${file}\`
Generated: ${new Date().toISOString()}
Wall clock for B+C: ${Math.round((Date.now() - started) / 1000)}s

| | A Human baseline | B AudioForge | C Raw TTS |
|---|---:|---:|---:|
| Preparation (human min) | | | 0 |
| Generation (clock min) | | ${((b.generation?.latencyMs ?? 0) / 60000).toFixed(2)} | ${(cLog.latencyMs / 60000).toFixed(2)} |
| Editing (human min) | | | |
| QC (human min) | | | |
| Total human min | | | |
| Finished audio min | | ${((b.generation?.durationMs ?? 0) / 60000).toFixed(2)} | ${(cMix.durationMs / 60000).toFixed(2)} |
| Human min / finished audio min | | | |
| API cost (₹) | | ${(b.generation?.costInr ?? 0).toFixed(2)} | ${cLog.costInr.toFixed(2)} |
| Failed lines | | ${b.generation?.lines.filter((l) => l.error).length ?? 0} | ${cLog.lines.filter((l) => l.error).length} |
| Regenerations | | ${b.generation?.regenerations ?? 0} | 0 |
| Producer score (1–10) | | | |

## Files

- B mix: \`${b.mixMp3 ?? ""}\`
- C mix: \`${cMix.mp3}\`

## How to score

Listen A (partner master), then B, then C on the same speakers.
If B ≈ C on quality, we built a wrapper.
If C is ~5/10 and B is ~8/10 (human ~9/10), orchestration is adding value.

Do not ask “would you use an AI audio platform?”
Ask: cost-per-finished-hour, and what is still manual.
`;

  const out = join(process.cwd(), "docs", "benchmark-last-run.md");
  mkdirSync(join(process.cwd(), "docs"), { recursive: true });
  writeFileSync(out, sheet);
  console.log(`\nWrote ${out}`);
  console.log(`B: ${b.mixMp3}`);
  console.log(`C: ${cMix.mp3}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
