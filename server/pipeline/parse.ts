import type { Character, DialogueLine, ProductionPlan, Scene, SfxEvent } from "../types";

const HEADER = /^\[([^\]]+)\]\s*$/;

const KNOWN_SFX = new Set([
  "DOOR",
  "DOOR_OPEN",
  "DOOR_CLOSE",
  "FOOTSTEPS",
  "RAIN",
  "THUNDER",
  "PHONE",
  "KNOCK",
  "CROWD",
  "CAR",
  "GLASS",
  "GUNSHOT",
  "HEARTBEAT",
  "WIND",
]);

export interface ParseResult {
  plan: ProductionPlan;
  skippedSfx: { tag: string; line: number }[];
  warnings: string[];
}

function roleFor(name: string): Character["role"] {
  return name.toUpperCase() === "NARRATOR" ? "narrator" : "speaker";
}

/**
 * Deterministic canonical-format parser. No LLM.
 *
 *   [NARRATOR]
 *   The rain was falling outside.
 *
 *   [ARJUN]
 *   Who's there?
 *
 *   [SFX: DOOR_OPEN]
 *   [SCENE: INT. HOUSE - NIGHT]
 *   [AMBIENCE: RAIN]
 */
export function parseCanonicalScript(
  source: string,
  language = "hi-IN",
): ParseResult {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const characters = new Map<string, Character>();
  const scenes: Scene[] = [];
  const dialogue: DialogueLine[] = [];
  const sfx: SfxEvent[] = [];
  const skippedSfx: { tag: string; line: number }[] = [];
  const warnings: string[] = [];

  let sceneIndex = 0;
  scenes.push({ index: 0 });

  let currentCharacter: string | null = null;
  let buffer: string[] = [];

  const flushDialogue = () => {
    const text = buffer.join("\n").trim();
    buffer = [];
    if (!text || !currentCharacter) return;
    dialogue.push({
      character: currentCharacter,
      text,
      sceneIndex,
      order: dialogue.length,
    });
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const header = HEADER.exec(raw.trim());
    if (!header) {
      if (currentCharacter) buffer.push(raw);
      else if (raw.trim()) {
        warnings.push(`Line ${i + 1}: text before any character header was ignored`);
      }
      continue;
    }

    flushDialogue();
    const inner = header[1]!.trim();
    const upper = inner.toUpperCase();

    if (upper.startsWith("SFX:") || upper.startsWith("SFX ")) {
      const tag = inner.replace(/^SFX:\s*/i, "").trim().toUpperCase().replace(/\s+/g, "_");
      if (!KNOWN_SFX.has(tag)) {
        skippedSfx.push({ tag, line: i + 1 });
        warnings.push(`Unknown SFX tag [${tag}] on line ${i + 1} — skipped, not sent to an API`);
        continue;
      }
      sfx.push({
        tag,
        sceneIndex,
        afterLineIndex: Math.max(0, dialogue.length - 1),
      });
      continue;
    }

    if (upper.startsWith("SCENE:") || upper.startsWith("SCENE ")) {
      const heading = inner.replace(/^SCENE:\s*/i, "").trim();
      if (dialogue.length > 0 || (scenes[0] && scenes[0].heading)) {
        sceneIndex += 1;
        scenes.push({ index: sceneIndex, heading });
      } else {
        scenes[0] = { index: 0, heading };
      }
      continue;
    }

    if (upper.startsWith("AMBIENCE:") || upper.startsWith("AMBIENCE ")) {
      const ambience = inner.replace(/^AMBIENCE:\s*/i, "").trim().toUpperCase();
      const scene = scenes[sceneIndex] ?? scenes[0];
      if (scene) scene.ambience = ambience;
      continue;
    }

    if (upper.startsWith("EMOTION:") && currentCharacter) {
      const emotion = inner.replace(/^EMOTION:\s*/i, "").trim();
      const last = dialogue[dialogue.length - 1];
      if (last) last.emotion = emotion;
      else warnings.push(`Line ${i + 1}: [EMOTION] with no preceding line`);
      continue;
    }

    const name = inner.trim();
    if (!name) continue;
    currentCharacter = name;
    if (!characters.has(name.toUpperCase())) {
      characters.set(name.toUpperCase(), { name, role: roleFor(name) });
    }
  }

  flushDialogue();

  if (dialogue.length === 0) {
    throw new Error("Parser found no dialogue lines. Use [CHARACTER] headers.");
  }

  return {
    plan: {
      language,
      characters: [...characters.values()],
      scenes,
      lines: dialogue,
      sfx,
    },
    skippedSfx,
    warnings,
  };
}
