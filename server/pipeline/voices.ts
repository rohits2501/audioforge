import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { VOICES_PATH } from "../lib/paths";
import type { Character, ProviderId, VoiceAssignment } from "../types";

const DEFAULT_SPEAKERS: Record<string, string> = {
  NARRATOR: "shubh",
  ARJUN: "aditya",
  MEERA: "ritu",
};

const MALE_POOL = ["aditya", "rahul", "rohan", "amit", "dev", "ratan", "varun", "kabir"];
const FEMALE_POOL = ["ritu", "priya", "neha", "pooja", "simran", "kavya", "ishita", "shreya"];

export function defaultSpeakerFor(name: string, role: Character["role"]): string {
  const key = name.toUpperCase();
  if (DEFAULT_SPEAKERS[key]) return DEFAULT_SPEAKERS[key];
  if (role === "narrator") return "shubh";
  const femaleHint = /(a|i|ee|ya|ika)$/i.test(name) || /MEERA|PRIYA|ANANYA|KAVYA|NEHA/i.test(name);
  const pool = femaleHint ? FEMALE_POOL : MALE_POOL;
  const idx = [...key].reduce((a, c) => a + c.charCodeAt(0), 0) % pool.length;
  return pool[idx]!;
}

export function loadVoiceAssignments(): VoiceAssignment[] {
  if (!existsSync(VOICES_PATH)) return [];
  return JSON.parse(readFileSync(VOICES_PATH, "utf8")) as VoiceAssignment[];
}

export function saveVoiceAssignments(assignments: VoiceAssignment[]): void {
  mkdirSync(dirname(VOICES_PATH), { recursive: true });
  writeFileSync(VOICES_PATH, JSON.stringify(assignments, null, 2) + "\n");
}

export function upsertAssignments(
  characters: Character[],
  language: string,
  provider: ProviderId = "sarvam",
): VoiceAssignment[] {
  const existing = loadVoiceAssignments();
  for (const character of characters) {
    const found = existing.find(
      (a) => a.character.toUpperCase() === character.name.toUpperCase() && a.language === language,
    );
    if (found) continue;
    existing.push({
      character: character.name,
      language,
      provider,
      providerVoiceId: defaultSpeakerFor(character.name, character.role),
    });
  }
  saveVoiceAssignments(existing);
  return existing;
}

export function assignmentFor(
  character: string,
  language: string,
  assignments = loadVoiceAssignments(),
): VoiceAssignment {
  const found = assignments.find(
    (a) => a.character.toUpperCase() === character.toUpperCase() && a.language === language,
  );
  if (found) return found;
  return {
    character,
    language,
    provider: "sarvam",
    providerVoiceId: defaultSpeakerFor(character, character.toUpperCase() === "NARRATOR" ? "narrator" : "speaker"),
  };
}
