"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLE = `[SCENE: INT. HOUSE - NIGHT]
[AMBIENCE: RAIN]

[NARRATOR]
बारिश बाहर गिर रही थी।

[ARJUN]
कौन है बाहर?

[MEERA]
मैं हूँ। दरवाज़ा खोलो।

[SFX: DOOR_OPEN]
`;

export function CreateEpisodeForm() {
  const router = useRouter();
  const [title, setTitle] = useState("Rain night");
  const [script, setScript] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block text-sm text-[var(--muted)]">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-[var(--text)]"
        />
      </label>
      <label className="block text-sm text-[var(--muted)]">
        Canonical script
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={16}
          className="mt-1 w-full rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 font-mono text-sm text-[var(--text)]"
        />
      </label>
      {error && <p className="text-[var(--bad)]">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-[var(--accent)] px-4 py-2 text-black disabled:opacity-50"
      >
        {busy ? "Creating…" : "Create Hindi episode"}
      </button>
    </form>
  );
}
