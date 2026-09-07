import { NextResponse } from "next/server";
import { syncEpisodeToPrisma } from "@/server/data/prisma-sync";
import { regenerateLines } from "@/server/pipeline/generate";

export const maxDuration = 300;

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json()) as { orders?: number[] };
  if (!body.orders?.length) {
    return NextResponse.json({ error: "orders required" }, { status: 400 });
  }
  try {
    const episode = await regenerateLines(id, body.orders);
    await syncEpisodeToPrisma(episode);
    return NextResponse.json(episode);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
