"use client";

import { StepBadge } from "./badge";
import { useOnboarding } from "./provider";
import { formatKn } from "./steps";

export function OnboardingPopup() {
  const { completed, paused, step, index, total, next, skip, pause } = useOnboarding();
  if (completed || paused || !step || step.kind !== "popup") return null;

  const finish = step.id === "done";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button
        type="button"
        aria-label="Dismiss"
        className="absolute inset-0 bg-black/60"
        onClick={pause}
      />
      <div className="relative w-full max-w-md rounded-lg border border-[var(--line)] bg-[var(--panel)] p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <StepBadge index={index} total={total} />
          <button type="button" onClick={pause} className="text-sm text-[var(--muted)]">
            ×
          </button>
        </div>
        <h2 className="mt-4 text-2xl">{step.title}</h2>
        <p className="mt-2 text-[var(--muted)]">{step.body}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={skip} className="text-sm text-[var(--muted)]">
            Skip
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-[var(--accent)] px-4 py-2 text-black"
          >
            {finish ? "Finish" : "Start"}
          </button>
        </div>
        <p className="mono mt-4 text-xs text-[var(--muted)]">{formatKn(index, total)}</p>
      </div>
    </div>
  );
}
