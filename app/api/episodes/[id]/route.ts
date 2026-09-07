import { NextResponse } from "next/server";
import { loadEpisode } from "@/server/data/store";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const episode = loadEpisode(id);
  if (!episode) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(episode);
}
