# Performance budgets

The number this app holds is **gzipped JavaScript** for each page, the same figure `next build` prints as **First Load JS** (level-9 gzip). `npm run build` runs the check after Next finishes. A build fails when a page is over its ceiling, a budgeted page disappears, or a new page ships with no ceiling.

Ceilings started as the measured size, rounded up to the next KiB, plus 8 KiB. Raise `maxBytes` in the same change that grows the page, and say why. `baselineBytes` is the measurement the ceiling was set from.

| Route | Baseline | Ceiling |
|---|---:|---:|
| `/` | 111.8 kB (111809) | 120.8 kB (120832) |
| `/review/[episodeId]` | 110.3 kB (110253) | 118.8 kB (118784) |
| `/_not-found` | 103.5 kB (103532) | 112.6 kB (112640) |

Home is the page someone loads before they can listen or create. The review desk is smaller than home. Most of both numbers is the shared client runtime plus the onboarding shell in the root layout.

Route handlers are not gated. They are not a document the browser loads.

## Web vitals

LCP 2500 ms, INP 200 ms, CLS 0.1. These are the Core Web Vitals "good" thresholds, not a measured baseline. A session that crosses one logs a structured `web-vital over budget` warning in the browser. There is no collector behind it. Source: `perf/field-budgets.ts`.

The production-labor benchmark (human minutes per finished audio minute) is a different number. It lives in [benchmark.md](../benchmark.md).

## Commands

```bash
npm run build        # production build, then the budget check
npm run perf:budget  # re-check the existing .next output
node scripts/check-bundle-budget.mjs --print
```
