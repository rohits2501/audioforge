"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Surface, Text } from "@house/react";
import type { EpisodeRecord, LineStatus } from "@/server/types";
import { useOptionalOnboarding } from "../../onboarding/provider";

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

function lineStarts(episode: EpisodeRecord): number[] {
  let t = 0;
  return episode.plan.lines.map((line) => {
    const start = t;
    const log = episode.generation?.lines.find((l) => l.order === line.order);
    t += log?.durationMs ?? 2500;
    if (episode.plan.sfx.some((s) => s.afterLineIndex === line.order)) t += 600;
    return start;
  });
}

function voicesFor(episode: EpisodeRecord): { character: string; voice: string }[] {
  const seen = new Map<string, string>();
  for (const line of episode.generation?.lines ?? []) {
    if (!seen.has(line.character)) seen.set(line.character, line.voice);
  }
  return [...seen.entries()].map(([character, voice]) => ({ character, voice }));
}

export function ReviewDesk({ episode: initial }: { episode: EpisodeRecord }) {
  const [episode, setEpisode] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<number | null>(null);
  const onboarding = useOptionalOnboarding();
  const mixRef = useRef<HTMLAudioElement | null>(null);
  const starts = useMemo(() => lineStarts(episode), [episode]);
  const voices = useMemo(() => voicesFor(episode), [episode]);
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
      <Link href="/" className="text-sm text-[var(--text-muted)]">
        ← Use cases
      </Link>
      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mono text-xs uppercase tracking-widest text-[var(--text-muted)]">Review desk</p>
          <h1 className="mt-1 text-3xl">{episode.title}</h1>
          <p className="mono mt-2 text-sm text-[var(--text-muted)]">
            ₹{(g?.costInr ?? 0).toFixed(2)} · {clock(g?.durationMs ?? 0)} · Regenerations{" "}
            {g?.regenerations ?? 0}
          </p>
          {voices.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {voices.map((v) => (
                <span
                  key={v.character}
                  className="rounded-full border border-[var(--border)] px-2 py-1 text-xs"
                >
                  {v.character} → {v.voice}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            data-tour="generate"
            disabled={!!busy}
            onClick={() => run(`/api/episodes/${episode.id}/generate`, undefined, "generating")}
          >
            {busy === "generating" ? "Generating…" : "Generate"}
          </Button>
          <Button
            disabled={!!busy || flagged.length === 0}
            onClick={() =>
              run(`/api/episodes/${episode.id}/regenerate`, { orders: flagged }, "regen-flagged")
            }
          >
            Regenerate flagged ({flagged.length})
          </Button>
          <Button
            disabled={!!busy}
            onClick={() => run(`/api/episodes/${episode.id}/mix`, undefined, "mixing")}
          >
            {busy === "mixing" ? "Mixing…" : "Remix"}
          </Button>
        </div>
      </header>

      {error && (
        <Text as="p" status="danger" className="mt-4">
          {error}
        </Text>
      )}

      {episode.mixMp3 && (
        <Surface as="section" data-tour="mix-player" className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-muted)]">Final mix</p>
            <a
              className="text-sm text-[var(--accent)]"
              href={`/api/audio/${episode.id}/episode.mp3`}
              download
            >
              Download MP3
            </a>
          </div>
          <audio
            ref={mixRef}
            className="mt-3 w-full"
            controls
            src={`/api/audio/${episode.id}/episode.mp3`}
            onTimeUpdate={(event) => {
              const ms = event.currentTarget.currentTime * 1000;
              let order = episode.plan.lines[0]?.order ?? null;
              for (let i = 0; i < starts.length; i += 1) {
                if (ms >= starts[i]!) order = episode.plan.lines[i]!.order;
              }
              setActiveOrder(order);
            }}
          />
        </Surface>
      )}

      <p className="mono mt-8 text-sm text-[var(--text-muted)]">
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
              data-tour={line.order === episode.plan.lines[0]?.order ? "line-0" : undefined}
              onClick={() => {
                const start = starts[episode.plan.lines.findIndex((l) => l.order === line.order)];
                if (mixRef.current && start != null) {
                  mixRef.current.currentTime = start / 1000;
                  void mixRef.current.play();
                }
                setActiveOrder(line.order);
                if (line.order === episode.plan.lines[0]?.order) {
                  onboarding?.completeAction("line");
                }
              }}
              className={`cursor-pointer rounded-lg border bg-[var(--surface)] px-4 py-3 ${
                activeOrder === line.order
                  ? "border-[var(--accent)]"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="mono text-xs text-[var(--text-muted)]">
                    {statusIcon(status)} {line.order} · {line.character}
                    {line.emotion ? ` · ${line.emotion}` : ""}
                  </p>
                  <p className="mt-1 leading-relaxed">{line.text}</p>
                </div>
                <div
                  data-tour={line.order === episode.plan.lines[0]?.order ? "line-actions" : undefined}
                  className="flex flex-wrap items-center gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  {episode.lineAudio[line.order] && (
                    <audio
                      controls
                      className="h-8 w-44"
                      src={`/api/audio/${episode.id}/line_${String(line.order).padStart(3, "0")}.wav`}
                    />
                  )}
                  <Button
                    size="sm"
                    disabled={!!busy}
                    onClick={() => {
                      onboarding?.completeAction("qa");
                      void run(
                        `/api/episodes/${episode.id}/regenerate`,
                        { orders: [line.order] },
                        `regen-${line.order}`,
                      );
                    }}
                  >
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    disabled={!!busy}
                    aria-pressed={status === "needs_regeneration"}
                    onClick={() => {
                      onboarding?.completeAction("qa");
                      void run(`/api/episodes/${episode.id}/lines/${line.order}`, {
                        status: "needs_regeneration",
                      });
                    }}
                  >
                    Flag
                  </Button>
                  <Button
                    size="sm"
                    disabled={!!busy}
                    aria-pressed={status === "approved"}
                    onClick={() => {
                      onboarding?.completeAction("qa");
                      void run(`/api/episodes/${episode.id}/lines/${line.order}`, { status: "approved" });
                    }}
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}
