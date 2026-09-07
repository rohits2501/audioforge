import { existsSync } from "node:fs";
import { join } from "node:path";
import { SFX_DIR } from "../lib/paths";

export const SFX_LIBRARY: Record<string, string> = {
  DOOR: "door.wav",
  DOOR_OPEN: "door.wav",
  DOOR_CLOSE: "door.wav",
  FOOTSTEPS: "footsteps.wav",
  RAIN: "rain.wav",
  THUNDER: "thunder.wav",
  PHONE: "phone.wav",
  KNOCK: "knock.wav",
  CROWD: "crowd.wav",
  CAR: "car.wav",
  GLASS: "glass.wav",
  GUNSHOT: "gunshot.wav",
  HEARTBEAT: "heartbeat.wav",
  WIND: "wind.wav",
};

export const AMBIENCE_TAGS = new Set(["RAIN", "WIND", "CROWD"]);

export function sfxPath(tag: string): string | null {
  const file = SFX_LIBRARY[tag.toUpperCase()];
  if (!file) return null;
  const path = join(SFX_DIR, file);
  return existsSync(path) ? path : null;
}
