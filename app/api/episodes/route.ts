import { NextResponse } from "next/server";
import { createEpisode, listEpisodes } from "@/server/data/store";
import { syncEpisodeToPrisma } from "@/server/data/prisma-sync";
import { planFromScript, slugId } from "@/server/pipeline/generate";
import { upsertAssignments } from "@/server/pipeline/voices";

export async function GET() {
  return NextResponse.json(listEpisodes());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      scriptText?: string;
      language?: string;
    };
    if (!body.scriptText?.trim()) {
      return NextResponse.json({ error: "scriptText required" }, { status: 400 });
    }
    const language = body.language ?? "hi-IN";
    const parsed = planFromScript(body.scriptText, language);
    const id = slugId(body.title || "episode");
    upsertAssignments(parsed.plan.characters, language, "sarvam");
    const episode = createEpisode({
      id,
      title: body.title || "Untitled episode",
      language,
      scriptText: body.scriptText,
      plan: parsed.plan,
    });
    await syncEpisodeToPrisma(episode);
    return NextResponse.json({ id: episode.id, episode });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
