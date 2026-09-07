import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { loadEnv } from "../server/lib/env";
import { ensureDataDirs } from "../server/lib/paths";
import { generateEpisodeFromScript } from "../server/pipeline/generate";
import { syncEpisodeToPrisma } from "../server/data/prisma-sync";

loadEnv();
ensureDataDirs();

const file = process.argv[2] ?? "fixtures/scripts/tier1-five-minute.txt";
const title = process.argv[3] ?? basename(file, ".txt");
const source = readFileSync(file, "utf8");

async function main() {
  console.log(`Generate: ${title}`);
  const episode = await generateEpisodeFromScript({
    title,
    scriptText: source,
    language: "hi-IN",
    episodeId: title.replace(/[^a-z0-9-]+/gi, "-").toLowerCase(),
  });
  await syncEpisodeToPrisma(episode);
  const g = episode.generation;
  console.log("");
  console.log(`Episode ${episode.id}`);
  console.log(`Generation cost ₹${(g?.costInr ?? 0).toFixed(2)}`);
  console.log(`Audio ${formatClock(g?.durationMs ?? 0)}`);
  console.log(`Human intervention (this run): generation only`);
  console.log(`Regenerations ${g?.regenerations ?? 0}`);
  if (episode.mixMp3) console.log(`MP3 ${episode.mixMp3}`);
}

function formatClock(ms: number): string {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
