"use client";

import { StepBadge } from "./badge";
import { useOnboarding } from "./provider";

export function OnboardingBanner() {
  const { completed, paused, step, index, total, next, back, skip } = useOnboarding();
  if (completed || paused || !step || step.kind !== "tour") return null;

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--panel)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
        <StepBadge index={index} total={total} />
        <p className="min-w-0 flex-1 text-sm">
          <span className="text-[var(--text)]">{step.title}. </span>
          <span className="text-[var(--muted)]">{step.body}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {index > 1 && (
            <button
              type="button"
              onClick={back}
              className="rounded border border-[var(--line)] px-2 py-1 text-sm"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-[var(--accent)] px-3 py-1 text-sm text-black"
          >
            Next
          </button>
          <button type="button" onClick={skip} className="text-sm text-[var(--muted)]">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
