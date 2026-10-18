"use client";

import { useEffect, useState } from "react";
import { Button, Surface } from "@house/react";
import { StepBadge } from "./badge";
import { useOnboarding } from "./provider";

type Rect = { top: number; left: number; width: number; height: number };

function readRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!(el instanceof HTMLElement)) return null;
  const box = el.getBoundingClientRect();
  if (box.width === 0 && box.height === 0) return null;
  return { top: box.top, left: box.left, width: box.width, height: box.height };
}

export function OnboardingCoachmark() {
  const { completed, paused, step, index, total, next, back } = useOnboarding();
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (completed || paused || !step?.target || step.kind !== "tour") {
      setRect(null);
      return;
    }
    const update = () => {
      const nextRect = readRect(step.target!);
      setRect(nextRect);
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el instanceof HTMLElement) el.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [completed, paused, step]);

  if (completed || paused || !step || step.kind !== "tour" || !step.target || !rect) return null;

  const pad = 8;
  const hole = {
    top: Math.max(4, rect.top - pad),
    left: Math.max(4, rect.left - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
  const below = hole.top + hole.height + 12 + 180 < window.innerHeight;
  const tipTop = below ? hole.top + hole.height + 12 : Math.max(8, hole.top - 168);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div
        className="absolute rounded-lg"
        style={{
          top: hole.top,
          left: hole.left,
          width: hole.width,
          height: hole.height,
          boxShadow: "0 0 0 9999px var(--scrim)",
        }}
      />
      <div
        className="absolute"
        style={{ top: hole.top - 10, left: hole.left - 10 }}
      >
        <StepBadge index={index} total={total} />
      </div>
      <Surface
        raised
        className="pointer-events-auto absolute w-[min(20rem,calc(100vw-2rem))]"
        style={{
          top: tipTop,
          left: Math.min(hole.left, window.innerWidth - 336),
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <StepBadge index={index} total={total} />
        </div>
        <p className="mt-2 text-sm">{step.title}</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{step.body}</p>
        {step.cheat && (
          <ul className="mono mt-3 space-y-1 text-xs text-[var(--accent)]">
            {step.cheat.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        <div className="mt-3 flex gap-2">
          {index > 1 && (
            <Button size="sm" onClick={back}>
              Back
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={next}>
            Next
          </Button>
        </div>
      </Surface>
    </div>
  );
}
