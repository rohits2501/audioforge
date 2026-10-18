"use client";

import { useReportWebVitals } from "next/web-vitals";
import { vitalBreach } from "@/perf/field-budgets";

/** Logs one structured line when a session crosses a Core Web Vitals ceiling. */
export function WebVitals() {
  useReportWebVitals((metric) => {
    const breach = vitalBreach(metric.name, metric.value);
    if (!breach) return;
    console.warn(
      JSON.stringify({
        level: "warn",
        message: "web-vital over budget",
        name: breach.name,
        value: breach.value,
        max: breach.max,
        rating: metric.rating,
        id: metric.id,
      }),
    );
  });
  return null;
}
