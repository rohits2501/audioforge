import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { episodeDir } from "@/server/lib/paths";

const ALLOWED = /^[a-zA-Z0-9._-]+$/;

export async function GET(
  _request: Request,
  context: { params: Promise<{ episodeId: string; file: string }> },
) {
  const { episodeId, file } = await context.params;
  if (!ALLOWED.test(episodeId) || !ALLOWED.test(file)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }
  const path = join(episodeDir(episodeId), file);
  if (!existsSync(path)) return NextResponse.json({ error: "missing" }, { status: 404 });
  const buf = readFileSync(path);
  const type = file.endsWith(".mp3") ? "audio/mpeg" : "audio/wav";
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": type,
      "Content-Length": String(buf.length),
    },
  });
}
