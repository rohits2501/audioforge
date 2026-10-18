"use client";

import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Stack, Surface, Text } from "@house/react";
import { USE_CASES, type UseCaseId } from "@/lib/use-cases";
import { parseCanonicalScript } from "@/server/pipeline/parse";
import { useOptionalOnboarding } from "./onboarding/provider";

function tryParse(script: string) {
  try {
    return parseCanonicalScript(script, "hi-IN");
  } catch {
    return null;
  }
}

export function CreateEpisodeForm() {
  const router = useRouter();
  const onboarding = useOptionalOnboarding();
  const [active, setActive] = useState<UseCaseId>("night-scene");
  const selected = USE_CASES.find((c) => c.id === active)!;
  const [title, setTitle] = useState(selected.episodeTitle);
  const [script, setScript] = useState(selected.script);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scriptId = useId();

  const parsed = useMemo(() => tryParse(script), [script]);

  function pick(id: UseCaseId) {
    const next = USE_CASES.find((c) => c.id === id)!;
    setActive(id);
    setTitle(next.episodeTitle);
    setScript(next.script);
    setError(null);
    onboarding?.completeAction("use-case");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, scriptText: script, language: "hi-IN" }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !json.id) throw new Error(json.error || "Create failed");
      router.push(`/review/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div>
        <p className="text-sm uppercase tracking-widest text-[var(--text-muted)]">Use case</p>
        <div data-tour="use-cases" className="mt-3 grid gap-3 sm:grid-cols-3">
          {USE_CASES.map((useCase) => {
            const on = useCase.id === active;
            return (
              <button
                key={useCase.id}
                type="button"
                onClick={() => pick(useCase.id)}
                className={`rounded-lg border px-3 py-3 text-left ${
                  on
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border)] bg-transparent hover:border-[var(--accent)]"
                }`}
                aria-pressed={on}
              >
                <p className="text-sm">{useCase.title}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{useCase.who}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  {useCase.blurb}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_16rem]">
        <Stack gap={4}>
          <Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Stack gap={1}>
            <Text as="label" size="sm" weight="medium" htmlFor={scriptId}>
              Script
            </Text>
            <textarea
              id={scriptId}
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={16}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 font-mono text-sm text-[var(--text)]"
            />
          </Stack>
        </Stack>

        <Surface as="aside" data-tour="parse-panel" className="h-fit">
          <p className="mono text-xs uppercase tracking-widest text-[var(--text-muted)]">Parse</p>
          {parsed ? (
            <>
              <p className="mt-3 text-2xl">{parsed.plan.lines.length}</p>
              <p className="text-xs text-[var(--text-muted)]">
                lines · {parsed.plan.sfx.length} SFX
              </p>
              <div className="mt-4 space-y-2">
                {parsed.plan.characters.map((character) => (
                  <p key={character.name} className="text-sm">
                    {character.name}
                    <span className="mono ml-2 text-xs text-[var(--text-muted)]">
                      {character.role}
                    </span>
                  </p>
                ))}
              </div>
              {parsed.plan.sfx.length > 0 && (
                <p className="mono mt-4 text-xs text-[var(--text-muted)]">
                  {parsed.plan.sfx.map((s) => s.tag).join(" · ")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Add [CHARACTER] headers to see the plan.
            </p>
          )}
        </Surface>
      </div>

      {error && (
        <Text as="p" status="danger">
          {error}
        </Text>
      )}
      <Button type="submit" variant="primary" disabled={busy || !parsed}>
        {busy ? "Creating…" : "Open review desk"}
      </Button>
    </form>
  );
}
