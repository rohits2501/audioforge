# A/B/C comparison

Episode fixture: `fixtures/scripts/tier1-rain-night.txt`
Generated: 2026-09-07T10:54:09.054Z
Wall clock for B+C: 10s

| | A Human baseline | B AudioForge | C Raw TTS |
|---|---:|---:|---:|
| Preparation (human min) | | | 0 |
| Generation (clock min) | | 0.07 | 0.07 |
| Editing (human min) | | | |
| QC (human min) | | | |
| Total human min | | | |
| Finished audio min | | 0.60 | 0.67 |
| Human min / finished audio min | | | |
| API cost (₹) | | 0.00 | 0.00 |
| Failed lines | | 0 | 0 |
| Regenerations | | 0 | 0 |
| Producer score (1–10) | | | |

## Files

- B mix: `/Users/rohit/Documents/GitHub/Test/data/episodes/benchmark-b/episode.mp3`
- C mix: `/Users/rohit/Documents/GitHub/Test/data/episodes/benchmark-c/episode.mp3`

## How to score

Listen A (partner master), then B, then C on the same speakers.
If B ≈ C on quality, we built a wrapper.
If C is ~5/10 and B is ~8/10 (human ~9/10), orchestration is adding value.

Do not ask “would you use an AI audio platform?”
Ask: cost-per-finished-hour, and what is still manual.
