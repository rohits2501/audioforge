"use client";

import { formatKn } from "./steps";

export function StepBadge({ index, total }: { index: number; total: number }) {
  return (
    <span className="mono rounded-full border border-[var(--accent)] bg-[var(--accent-subtle)] px-2 py-0.5 text-xs text-[var(--accent)]">
      {formatKn(index, total)}
    </span>
  );
}
