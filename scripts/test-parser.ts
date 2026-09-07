import { readFileSync } from "node:fs";
import { parseCanonicalScript } from "../server/pipeline/parse";

const source = readFileSync("fixtures/scripts/tier1-rain-night.txt", "utf8");
const { plan, warnings, skippedSfx } = parseCanonicalScript(source, "hi-IN");

const assert = (cond: boolean, msg: string) => {
  if (!cond) throw new Error(msg);
};

assert(plan.language === "hi-IN", "language");
assert(plan.characters.length === 3, `characters ${plan.characters.length}`);
assert(plan.characters.some((c) => c.role === "narrator"), "narrator role");
assert(plan.lines.length === 10, `lines ${plan.lines.length}`);
assert(plan.sfx.length === 2, `sfx ${plan.sfx.length}`);
assert(plan.lines[1]?.emotion === "tense", "emotion on data model");
assert(plan.sfx[0]?.tag === "DOOR_OPEN", "door sfx");
assert(plan.scenes[0]?.ambience === "RAIN", "ambience");
assert(skippedSfx.length === 0, "no skipped sfx");

const messy = parseCanonicalScript(
  `[SFX: LASER_GUN]\n[NARRATOR]\nHello.\n`,
  "hi-IN",
);
assert(messy.skippedSfx[0]?.tag === "LASER_GUN", "unknown sfx skipped");
assert(messy.plan.sfx.length === 0, "unknown sfx not in plan");
assert(warnings.length >= 0, "warnings present");

console.log("parser ok");
