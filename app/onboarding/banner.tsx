"use client";

import { Button } from "@house/react";
import { StepBadge } from "./badge";
import { useOnboarding } from "./provider";

export function OnboardingBanner() {
  const { completed, paused, step, index, total, next, back, skip } = useOnboarding();
  if (completed || paused || !step || step.kind !== "tour") return null;

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
        <StepBadge index={index} total={total} />
        <p className="min-w-0 flex-1 text-sm">
          <span className="text-[var(--text)]">{step.title}. </span>
          <span className="text-[var(--text-muted)]">{step.body}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {index > 1 && (
            <Button size="sm" onClick={back}>
              Back
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={next}>
            Next
          </Button>
          <button type="button" onClick={skip} className="text-sm text-[var(--text-muted)]">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
