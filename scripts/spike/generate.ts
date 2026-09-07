/**
 * Days 1–2 raw audio spike.
 * Hard-coded 3 characters, ~10 lines, Sarvam (or offline fallback), FFmpeg MP3.
 * Listen to data/episodes/spike/episode_spike.mp3 before building anything else.
 */
import { copyFileSync, writeFileSync } from "node:fs";
import { getSarvamApiKey, loadEnv } from "../../server/lib/env";
import { ensureDataDirs, generationLogPath, lineWavPath } from "../../server/lib/paths";
import { mixEpisode } from "../../server/pipeline/mix";
import { synthesizePlan } from "../../server/pipeline/tts";
import { saveVoiceAssignments } from "../../server/pipeline/voices";
import type { ProductionPlan } from "../../server/types";

loadEnv();
ensureDataDirs();

const EPISODE = "spike";

const plan: ProductionPlan = {
  language: "hi-IN",
  characters: [
    { name: "NARRATOR", role: "narrator" },
    { name: "ARJUN", role: "speaker" },
    { name: "MEERA", role: "speaker" },
  ],
  scenes: [{ index: 0, heading: "INT. HOUSE - NIGHT", ambience: "RAIN" }],
  lines: [
    {
      character: "NARRATOR",
      text: "बारिश बाहर गिर रही थी। घर के अंदर एक पुरानी घड़ी टिक टिक कर रही थी।",
      emotion: "tense",
      sceneIndex: 0,
      order: 0,
    },
    {
      character: "ARJUN",
      text: "कौन है बाहर? इस वक्त?",
      emotion: "tense",
      sceneIndex: 0,
      order: 1,
    },
    {
      character: "MEERA",
      text: "मैं हूँ, अर्जुन। दरवाज़ा खोलो।",
      emotion: "urgent",
      sceneIndex: 0,
      order: 2,
    },
    {
      character: "NARRATOR",
      text: "दरवाज़ा धीरे से खुला। हवा के साथ बारिश का ठंडा पानी अंदर आया।",
      sceneIndex: 0,
      order: 3,
    },
    {
      character: "ARJUN",
      text: "मीरा? तुम भीग गई हो। क्या हुआ?",
      emotion: "worried",
      sceneIndex: 0,
      order: 4,
    },
    {
      character: "MEERA",
      text: "वो वापस आ गया है। मैंने उसे गली में देखा।",
      emotion: "afraid",
      sceneIndex: 0,
      order: 5,
    },
    {
      character: "ARJUN",
      text: "ये मुमकिन नहीं। पुलिस ने कहा था वो शहर छोड़ चुका है।",
      sceneIndex: 0,
      order: 6,
    },
    {
      character: "MEERA",
      text: "मैंने उसकी गाड़ी देखी, अर्जुन। वही लाल स्कूटर।",
      emotion: "urgent",
      sceneIndex: 0,
      order: 7,
    },
    {
      character: "NARRATOR",
      text: "बाहर गड़गड़ाहट हुई। कमरे की रोशनी एक पल के लिए काँपी।",
      sceneIndex: 0,
      order: 8,
    },
    {
      character: "ARJUN",
      text: "अंदर आओ। दरवाज़ा बंद करो। आज रात कोई बाहर नहीं जाएगा।",
      emotion: "determined",
      sceneIndex: 0,
      order: 9,
    },
  ],
  sfx: [
    { tag: "DOOR_OPEN", sceneIndex: 0, afterLineIndex: 2 },
    { tag: "THUNDER", sceneIndex: 0, afterLineIndex: 8 },
  ],
};

async function main() {
  saveVoiceAssignments([
    { character: "NARRATOR", language: "hi-IN", provider: "sarvam", providerVoiceId: "shubh" },
    { character: "ARJUN", language: "hi-IN", provider: "sarvam", providerVoiceId: "aditya" },
    { character: "MEERA", language: "hi-IN", provider: "sarvam", providerVoiceId: "ritu" },
  ]);

  const mode = getSarvamApiKey() ? "sarvam" : "offline (macOS say / tones)";
  console.log(`Spike generation via ${mode}`);
  console.log("If this MP3 sounds terrible, stop. Fix generation. Do not build UI.");

  const log = await synthesizePlan(EPISODE, plan);
  const failed = log.lines.filter((l) => l.error);
  if (failed.length === log.lines.length) {
    throw new Error(`All ${failed.length} lines failed. First error: ${failed[0]?.error}`);
  }

  const linePaths = plan.lines
    .filter((l) => !log.lines.find((x) => x.order === l.order)?.error)
    .map((l) => lineWavPath(EPISODE, l.order));

  const mix = mixEpisode(EPISODE, plan, linePaths);
  log.durationMs = mix.durationMs;
  writeFileSync(generationLogPath(EPISODE), JSON.stringify(log, null, 2) + "\n");

  console.log("");
  const spikeMp3 = mix.mp3.replace(/episode\.mp3$/, "episode_spike.mp3");
  if (spikeMp3 !== mix.mp3) copyFileSync(mix.mp3, spikeMp3);
  console.log(`MP3: ${spikeMp3}`);
  console.log(`WAV: ${mix.wav}`);
  console.log(`Audio ${(mix.durationMs / 1000).toFixed(1)}s`);
  console.log(`Cost ₹${log.costInr.toFixed(2)} · latency ${log.latencyMs}ms · provider ${log.provider}`);
  console.log("Listen before you write another line of product code.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
