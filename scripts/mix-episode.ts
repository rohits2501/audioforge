import { loadEpisode, saveEpisode } from "../server/data/store";
import { lineWavPath } from "../server/lib/paths";
import { mixEpisode } from "../server/pipeline/mix";

const id = process.argv[2];
if (!id) {
  console.error("Usage: npm run mix -- <episodeId>");
  process.exit(1);
}

const episode = loadEpisode(id);
if (!episode) {
  console.error(`No episode ${id}`);
  process.exit(1);
}

const paths = episode.plan.lines.map((l) => episode.lineAudio[l.order] ?? lineWavPath(id, l.order));
const mix = mixEpisode(id, episode.plan, paths);
episode.mixMp3 = mix.mp3;
episode.mixWav = mix.wav;
saveEpisode(episode);
console.log(mix.mp3);
console.log(mix.wav);
console.log(`${(mix.durationMs / 1000).toFixed(1)}s`);
