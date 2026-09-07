# Week 4 validation — A / B / C

Same episode. Three versions. Almost no new features this week.

| Version | What it is |
|---|---|
| **A** | Human baseline — Pocket / Kuku / Varun (or your own timed) existing production |
| **B** | AudioForge: parse → characters → mix → review → export |
| **C** | Raw TTS: every line through one Sarvam speaker, concatenated, no orchestration |

## How to run B and C

```bash
npm run benchmark -- fixtures/scripts/tier1-five-minute.txt
# or a partner script once you have one (Tier 3)
npm run benchmark -- fixtures/scripts/tier2-station.txt
```

This writes `docs/benchmark-last-run.md` and:

- `data/episodes/benchmark-b/episode.mp3`
- `data/episodes/benchmark-c/episode.mp3`

Fill the producer scores by listening. Version A times come from the partner, not from this repo.

## Comparison sheet

Copy into a new dated file when you sit with a producer.

| | A Human | B AudioForge | C Raw TTS |
|---|---:|---:|---:|
| Preparation (human min) | | | |
| Generation (clock / human min) | | | |
| Editing (human min) | | | |
| QC (human min) | | | |
| **Total human min** | | | |
| Finished audio min | | | |
| **Human min / finished audio min** | | | |
| API cost (₹) | | | |
| Rework / failed lines | | | |
| Regenerations | | | |
| Producer score (1–10) | | | |

Target worth taking to Pocket/Kuku: **2 human minutes per finished audio minute** (example: 30 human min / 15 finished min), versus ~12 today.

## Decision rule

- B quality ≈ C quality → we built a wrapper. Find the real bottleneck. Do not add features.
- C ~5/10, B ~8/10, A ~9/10 → orchestration is adding value.
- Production time does **not** improve → ask what is still manual (QC? edit? continuity?). That becomes the wedge.
- Production time **does** improve → deepen only the layer the data supports (character / localization / QA / routing).

Do not pre-commit to V1.1.

## ElevenLabs benchmark (optional)

Set `ELEVENLABS_API_KEY` and re-run English premium lines only. TTS only. No Music API. No model-picker UI.

Localization (same episode, second language) only after Hindi is acceptable.
