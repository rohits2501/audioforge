"use client";

import { Button, Surface } from "@house/react";
import { useOnboarding } from "./provider";
import { STEPS, formatKn } from "./steps";

export function HowToMenu() {
  const { completed, index, total, menuOpen, setMenuOpen, goTo, replay } = useOnboarding();

  return (
    <div className="relative">
      <Button
        size="sm"
        className="mono"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        {completed ? "How to · Done" : `How to · ${formatKn(Math.max(index, 1), total)}`}
      </Button>
      {menuOpen && (
        <Surface raised padding={3} className="absolute right-0 z-50 mt-2 w-72">
          <p className="mono text-xs uppercase tracking-widest text-[var(--text-muted)]">How to</p>
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
                      current
                        ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
                        : "hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <span className="mono text-xs text-[var(--text-muted)]">
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
            className="mt-3 text-sm text-[var(--text-muted)]"
          >
            Replay from 1/{total}
          </button>
        </Surface>
      )}
    </div>
  );
}
