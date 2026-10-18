/**
 * Core Web Vitals "good" thresholds. The client logs a structured warning when a session
 * crosses one. These are not measured baselines and they are not the CI bundle gate.
 */
export const webVitals = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
} as const;

export interface VitalBreach {
  name: string;
  value: number;
  max: number;
}

const vitalLimits: Record<string, number> = webVitals;

export function vitalBreach(name: string, value: number): VitalBreach | null {
  const max = vitalLimits[name];
  if (typeof max !== "number" || !(value > max)) return null;
  return { name, value, max };
}
