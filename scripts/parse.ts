import { readFileSync } from "node:fs";
import { parseCanonicalScript } from "../server/pipeline/parse";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run parse -- fixtures/scripts/tier1-rain-night.txt");
  process.exit(1);
}

const source = readFileSync(file, "utf8");
const language = process.argv.includes("--en") ? "en-IN" : "hi-IN";
const result = parseCanonicalScript(source, language);

console.log(JSON.stringify(result.plan, null, 2));
if (result.warnings.length) {
  console.error("\nWarnings:");
  for (const w of result.warnings) console.error(`  - ${w}`);
}
console.error(
  `\n${result.plan.lines.length} lines, ${result.plan.characters.length} characters, ${result.plan.sfx.length} sfx`,
);
