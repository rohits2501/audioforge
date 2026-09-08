import Link from "next/link";
import { listEpisodes } from "@/server/data/store";
import { CreateEpisodeForm } from "./create-form";
import { DemoPlayer, OpenDeskLink } from "./demo-player";

export const dynamic = "force-dynamic";

function clock(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export default function HomePage() {
  const episodes = listEpisodes();
  const demo = episodes.find((ep) => ep.id === "rain-night");
  const others = episodes.filter((ep) => ep.id !== "rain-night");
  const g = demo?.generation;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="mono text-xs tracking-widest text-[var(--muted)] uppercase">AudioForge</p>
      <h1 className="mt-3 text-4xl leading-tight">Script in. Episode out.</h1>
      <p className="mt-3 max-w-xl text-[var(--muted)]">
        Hindi multi-character audio from a canonical script. Listen first. Then try a
        use case.
      </p>

      {demo && (
        <section className="mt-10 rounded-lg border border-[var(--accent)] bg-[var(--panel)] p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="mono text-xs uppercase tracking-widest text-[var(--muted)]">
                Seeded demo
              </p>
              <h2 className="mt-1 text-2xl">{demo.title}</h2>
              <p className="mono mt-2 text-sm text-[var(--muted)]">
                ₹{(g?.costInr ?? 0).toFixed(2)} · {clock(g?.durationMs ?? 0)} ·{" "}
                {demo.plan.lines.length} lines · {demo.plan.characters.length} voices
              </p>
            </div>
            <OpenDeskLink href={`/review/${demo.id}`}>Open review desk</OpenDeskLink>
          </div>
          <DemoPlayer src={`/api/audio/${demo.id}/episode.mp3`} />
        </section>
      )}

      <section className="mt-14">
        <h2 className="text-2xl">Try a use case</h2>
        <p className="mt-2 text-[var(--muted)]">
          Pick one, watch the parse, then open the desk. Generate lives on the next
          screen.
        </p>
        <CreateEpisodeForm />
      </section>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm uppercase tracking-widest text-[var(--muted)]">Recent</h2>
          <ul className="mt-4 space-y-2">
            {others.map((ep) => (
              <li key={ep.id}>
                <Link
                  href={`/review/${ep.id}`}
                  className="block rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-3 hover:border-[var(--accent)]"
                >
                  <div className="flex justify-between gap-4">
                    <span>{ep.title}</span>
                    <span className="mono text-sm text-[var(--muted)]">
                      {ep.plan.lines.length} lines
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
