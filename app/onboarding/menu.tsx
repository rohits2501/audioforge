"use client";

import { useOnboarding } from "./provider";
import { STEPS, formatKn } from "./steps";

export function HowToMenu() {
  const { completed, index, total, menuOpen, setMenuOpen, goTo, replay } = useOnboarding();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="mono rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 text-xs"
      >
        {completed ? "How to · Done" : `How to · ${formatKn(Math.max(index, 1), total)}`}
      </button>
      {menuOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-3 shadow-xl">
          <p className="mono text-xs uppercase tracking-widest text-[var(--muted)]">How to</p>
          <ol className="mt-2 space-y-1">
            {STEPS.map((item) => {
              const current = !completed && item.index === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      goTo(item.index);
                      setMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                      current ? "bg-[var(--bg)] text-[var(--accent)]" : "hover:bg-[var(--bg)]"
                    }`}
                  >
                    <span className="mono text-xs text-[var(--muted)]">
                      {formatKn(item.index, total)}
                    </span>
                    <span>{item.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={replay}
            className="mt-3 text-sm text-[var(--muted)]"
          >
            Replay from 1/{total}
          </button>
        </div>
      )}
    </div>
  );
}
