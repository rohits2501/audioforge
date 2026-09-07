"use client";

import { useMemo, useState } from "react";
import type { EpisodeRecord, LineStatus } from "@/server/types";

function statusIcon(status: LineStatus): string {
  if (status === "approved") return "✓";
  if (status === "needs_regeneration") return "!";
  if (status === "generated" || status === "reviewed") return "·";
  return "○";
}

function clock(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ReviewDesk({ episode: initial }: { episode: EpisodeRecord }) {
  const [episode, setEpisode] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const flagged = useMemo(
    () =>
      episode.plan.lines
        .filter((l) => episode.lineStatuses[l.order] === "needs_regeneration")
        .map((l) => l.order),
    [episode],
  );

  async function refresh() {
    const res = await fetch(`/api/episodes/${episode.id}`, { cache: "no-store" });
    const json = (await res.json()) as EpisodeRecord;
    setEpisode(json);
  }

  async function run(path: string, body?: unknown, label = "working") {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Request failed");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  const g = episode.generation;
  const approved = episode.plan.lines.filter((l) => episode.lineStatuses[l.order] === "approved").length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <a href="/" className="text-sm text-[var(--muted)]">
        ← Create Hindi episode
      </a>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-xs uppercase tracking-widest text-[var(--muted)]">Review episode</p>
          <h1 className="mt-1 text-3xl">{episode.title}</h1>
          <p className="mono mt-2 text-sm text-[var(--muted)]">
            {episode.id} — Generation cost ₹{(g?.costInr ?? 0).toFixed(2)} — Audio{" "}
            {clock(g?.durationMs ?? 0)} — Regenerations {g?.regenerations ?? 0}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={!!busy}
            onClick={() => run(`/api/episodes/${episode.id}/generate`, undefined, "generating")}
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-black disabled:opacity-50"
          >
            {busy === "generating" ? "Generating…" : "Generate"}
          </button>
          <button
            disabled={!!busy || flagged.length === 0}
            onClick={() =>
              run(`/api/episodes/${episode.id}/regenerate`, { orders: flagged }, "regen-flagged")
            }
            className="rounded-md border border-[var(--line)] px-3 py-2 disabled:opacity-40"
          >
            Regenerate flagged ({flagged.length})
          </button>
          <button
            disabled={!!busy}
            onClick={() => run(`/api/episodes/${episode.id}/mix`, undefined, "mixing")}
            className="rounded-md border border-[var(--line)] px-3 py-2 disabled:opacity-40"
          >
            {busy === "mixing" ? "Mixing…" : "Remix"}
          </button>
        </div>
      </header>

      {error && <p className="mt-4 text-[var(--bad)]">{error}</p>}

      {episode.mixMp3 && (
        <section className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted)]">Final mix</p>
            <a
              className="text-sm text-[var(--accent)]"
              href={`/api/audio/${episode.id}/episode.mp3`}
              download
            >
              Download MP3
            </a>
          </div>
          <audio className="mt-3 w-full" controls src={`/api/audio/${episode.id}/episode.mp3`} />
        </section>
      )}

      <p className="mono mt-8 text-sm text-[var(--muted)]">
        {episode.plan.lines
          .map((l) => {
            const s = episode.lineStatuses[l.order];
            return s === "approved" ? `✓ ${l.order}` : `${l.order}`;
          })
          .join("  ")}
        <span className="ml-3">
          {approved}/{episode.plan.lines.length} approved
        </span>
      </p>

      <ol className="mt-4 space-y-2">
        {episode.plan.lines.map((line) => {
          const status = episode.lineStatuses[line.order] ?? "pending";
          return (
            <li
              key={line.order}
              className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mono text-xs text-[var(--muted)]">
                    {statusIcon(status)} {line.order} · {line.character}
                    {line.emotion ? ` · ${line.emotion}` : ""}
                  </p>
                  <p className="mt-1 leading-relaxed">{line.text}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {episode.lineAudio[line.order] && (
                    <audio
                      controls
                      className="h-8 w-44"
                      src={`/api/audio/${episode.id}/line_${String(line.order).padStart(3, "0")}.wav`}
                    />
                  )}
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      run(
                        `/api/episodes/${episode.id}/regenerate`,
                        { orders: [line.order] },
                        `regen-${line.order}`,
                      )
                    }
                    className="rounded border border-[var(--line)] px-2 py-1 text-sm"
                  >
                    Regenerate
                  </button>
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      run(`/api/episodes/${episode.id}/lines/${line.order}`, {
                        status: "needs_regeneration",
                      })
                    }
                    className="rounded border border-[var(--line)] px-2 py-1 text-sm"
                  >
                    Flag
                  </button>
                  <button
                    disabled={!!busy}
                    onClick={() =>
                      run(`/api/episodes/${episode.id}/lines/${line.order}`, { status: "approved" })
                    }
                    className="rounded border border-[var(--ok)] px-2 py-1 text-sm text-[var(--ok)]"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
