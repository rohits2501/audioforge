import { listEpisodes } from "@/server/data/store";
import { CreateEpisodeForm } from "./create-form";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const episodes = listEpisodes();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="mono text-xs tracking-widest text-[var(--muted)] uppercase">
        Script → Episode Engine
      </p>
      <h1 className="mt-3 text-4xl leading-tight">Create Hindi episode</h1>
      <p className="mt-3 max-w-xl text-[var(--muted)]">
        Paste a canonical script. Generate. Review each line. Regenerate the ones
        that sound wrong. Download the mix. That loop is the product.
      </p>
      <CreateEpisodeForm />
      {episodes.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm uppercase tracking-widest text-[var(--muted)]">Recent</h2>
          <ul className="mt-4 space-y-2">
            {episodes.map((ep) => (
              <li key={ep.id}>
                <a
                  href={`/review/${ep.id}`}
                  className="block rounded-lg border border-[var(--line)] bg-[var(--panel)] px-4 py-3 hover:border-[var(--accent)]"
                >
                  <div className="flex justify-between gap-4">
                    <span>{ep.title}</span>
                    <span className="mono text-sm text-[var(--muted)]">
                      {ep.plan.lines.length} lines
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
