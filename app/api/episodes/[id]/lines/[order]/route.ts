import { NextResponse } from "next/server";
import { setLineStatus } from "@/server/pipeline/generate";
import type { LineStatus } from "@/server/types";

const ALLOWED: LineStatus[] = [
  "generated",
  "reviewed",
  "approved",
  "needs_regeneration",
];

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; order: string }> },
) {
  const { id, order } = await context.params;
  const body = (await request.json()) as { status?: LineStatus };
  if (!body.status || !ALLOWED.includes(body.status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  try {
    const episode = setLineStatus(id, Number(order), body.status);
    return NextResponse.json(episode);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
