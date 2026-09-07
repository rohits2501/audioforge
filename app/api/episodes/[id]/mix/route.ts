import { NextResponse } from "next/server";
import { loadEpisode, saveEpisode } from "@/server/data/store";
import { lineWavPath } from "@/server/lib/paths";
import { mixEpisode } from "@/server/pipeline/mix";
import { qaEpisode } from "@/server/pipeline/qa";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const episode = loadEpisode(id);
  if (!episode) return NextResponse.json({ error: "not found" }, { status: 404 });

  const paths = episode.plan.lines.map((l) => ({
    order: l.order,
    path: episode.lineAudio[l.order] ?? lineWavPath(id, l.order),
  }));
  const qa = qaEpisode(paths);
  if (!qa.passed) {
    return NextResponse.json(
      { error: `QA failed for lines ${qa.failedOrders.join(", ")}`, qa },
      { status: 400 },
    );
  }

  const mix = mixEpisode(
    id,
    episode.plan,
    paths.map((p) => p.path),
  );
  episode.mixMp3 = mix.mp3;
  episode.mixWav = mix.wav;
  saveEpisode(episode);
  return NextResponse.json(episode);
}
