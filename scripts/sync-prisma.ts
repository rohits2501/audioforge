import { loadEnv } from "../server/lib/env";
import { listEpisodes } from "../server/data/store";
import { syncEpisodeToPrisma } from "../server/data/prisma-sync";

loadEnv();

async function main() {
  for (const episode of listEpisodes()) {
    await syncEpisodeToPrisma(episode);
    console.log("synced", episode.id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
