import { NextResponse } from "next/server";
import { syncEpisodeToPrisma } from "@/server/data/prisma-sync";
import { generateExistingEpisode } from "@/server/pipeline/generate";

export const maxDuration = 300;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const episode = await generateExistingEpisode(id);
    await syncEpisodeToPrisma(episode);
    return NextResponse.json(episode);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
