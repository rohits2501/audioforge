import { parseCanonicalScript } from "../server/pipeline/parse";
import { loadVoiceAssignments, saveVoiceAssignments, upsertAssignments } from "../server/pipeline/voices";
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? "fixtures/scripts/tier1-five-minute.txt";
const source = readFileSync(file, "utf8");
const { plan } = parseCanonicalScript(source, "hi-IN");
const assignments = upsertAssignments(plan.characters, plan.language, "sarvam");

console.log("Character → voice (series-level, reused across episodes)\n");
for (const a of assignments) {
  console.log(`  ${a.character.padEnd(12)} ${a.language}  ${a.provider}:${a.providerVoiceId}`);
}
saveVoiceAssignments(assignments);
console.log(`\nWrote data/voices.json (${loadVoiceAssignments().length} rows)`);
