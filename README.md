# Script → Episode Engine

> AI audio generation is commoditizing. The valuable layer is orchestration + character continuity + production automation + QA + production data.
>
> Those four layers are hypotheses to test, not assumed moats.

**Internal name:** AudioForge  
**One sentence:** Upload a script → get a production-ready multi-character audio episode.

This is a 30-day experiment, not a product launch. The question is:

> Can this turn a serialized-fiction script into acceptable production audio with dramatically less human intervention?

## Metric that matters

**Human minutes per finished audio minute.**

| | Human min | Finished min | Human min / audio min |
|---|---:|---:|---:|
| Current (example) | 180 | 15 | 12 |
| AudioForge target | 30 | 15 | 2 |

They are not buying AI. They are buying lower production labor per finished minute.

Also record: preparation time, generation time, editing time, QC time, API cost, rework, failed lines, producer score (1–10).

Week 4 three-way benchmark (same episode):

- **A** — Human baseline
- **B** — AudioForge (parse → characters → mix → review → export)
- **C** — Raw TTS (each line through one voice, concatenated, no orchestration)

If B ≈ C on quality, we built a wrapper. If C is ~5/10 and B is ~8/10 (human ~9/10), orchestration is adding value.

Fill [`docs/benchmark.md`](docs/benchmark.md).

## What this is not

Not Higgsfield-for-audio. Not a model marketplace. Not a DAW. Not music generation. Not video. Not billing. Not a creator social product. Not Pocket FLOW.

## Days 1–2: listen before you build

```bash
cp .env.example .env.local
# put SARVAM_API_KEY in .env.local for real Hindi TTS (bulbul:v3)
# without a key, the spike uses macOS `say` + Lekha so the mix path still runs

npm install
npm run sfx:init
npm run spike
# listen: data/episodes/spike/episode_spike.mp3
```

Already generated locally (offline TTS, no Sarvam key):

- Spike (~36s): `data/episodes/spike/episode_spike.mp3`
- Tier 1 five-minute scene (5:28): `data/episodes/tier1-five-minute/episode.mp3`
- Tier 2 station episode (7:23): `data/episodes/tier2-station/episode.mp3`
- Week 4 B vs C: `data/episodes/benchmark-b/episode.mp3` and `data/episodes/benchmark-c/episode.mp3`

If the first scene sounds terrible, **stop and fix generation**. Do not start Clerk, Prisma UI, or a five-screen app.

## Pipeline

```
Canonical script → deterministic parser → production plan
  → per-line TTS → basic technical QA → human review
  → regenerate (same voice assignment) or approve
  → FFmpeg mix (lines + local SFX + ambience) → MP3 + WAV
```

Default routing (not intelligent): Indic languages → Sarvam `bulbul:v3`. English premium / benchmark → ElevenLabs. SFX → local library only.

## Commands

| Command | What it does |
|---|---|
| `npm run spike` | Hard-coded 10-line scene → MP3 |
| `npm run parse -- fixtures/scripts/tier1-rain-night.txt` | Canonical script → JSON |
| `npm run voices` | Write character → Sarvam speaker map |
| `npm run generate -- fixtures/scripts/tier1-five-minute.txt` | Parse + TTS + QA + mix a fixture |
| `npm run sfx:init` | Write the 12 local SFX clips |
| `npm run mix -- <episodeId>` | Remix an existing episode |
| `npm run benchmark -- fixtures/scripts/tier1-five-minute.txt` | Produce B vs C + comparison sheet |
| `npm run perf:budget` | Check gzipped first-load JS against [`docs/perf/budgets.md`](docs/perf/budgets.md) |
| `npm run dev` | Review UI — Create Hindi episode |

## Stack (grows only when the audio works)

- Next.js App Router + TypeScript + Tailwind
- Local JSON + wavs on disk, then Prisma (SQLite locally; Postgres when you need it)
- FFmpeg via `ffmpeg-static` (system `ffmpeg` used if on PATH)
- Sarvam first. ElevenLabs TTS only, as a week-4 benchmark. No Music API.
- No auth, orgs, billing, Redis, or R2 until the pipeline is listenable.

## Character continuity (first real Character Engine behavior)

`data/voices.json` maps `character × language → provider + providerVoiceId`.  
**Regenerate must reuse that assignment.** Same Arjun on episode 2 and on line 36 take 3.

## Experiment log

Every generation writes `generation.json` (provider, characters, duration, latency, cost, voice, language, episode). The Review screen surfaces:

`Episode — Generation cost ₹X — Audio M:SS — Regenerations N`
