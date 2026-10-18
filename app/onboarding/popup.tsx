"use client";

import { Button, IconButton, Surface } from "@house/react";
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
        className="absolute inset-0 bg-[var(--scrim)]"
        onClick={pause}
      />
      <Surface raised padding={6} className="relative w-full max-w-md">
        <div className="flex items-center justify-between gap-3">
          <StepBadge index={index} total={total} />
          <IconButton size="sm" label="Pause tour" icon="×" onClick={pause} />
        </div>
        <h2 className="mt-4 text-2xl">{step.title}</h2>
        <p className="mt-2 text-[var(--text-muted)]">{step.body}</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={skip} className="text-sm text-[var(--text-muted)]">
            Skip
          </button>
          <Button variant="primary" onClick={next}>
            {finish ? "Finish" : "Start"}
          </Button>
        </div>
        <p className="mono mt-4 text-xs text-[var(--text-muted)]">{formatKn(index, total)}</p>
      </Surface>
    </div>
  );
}
