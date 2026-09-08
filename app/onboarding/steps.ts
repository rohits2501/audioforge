export type StepPage = "home" | "review" | "any";
export type Advance = "next" | "action";
export type StepKind = "popup" | "tour";

export interface Step {
  id: string;
  index: number;
  title: string;
  body: string;
  page: StepPage;
  target?: string;
  advance: Advance;
  kind: StepKind;
  cheat?: string[];
}

export const STEPS: Step[] = [
  {
    id: "welcome",
    index: 1,
    title: "Script in. Episode out.",
    body: "34 seconds of Hindi audio, then the desk. That loop is the product.",
    page: "home",
    advance: "next",
    kind: "popup",
  },
  {
    id: "listen",
    index: 2,
    title: "Listen first",
    body: "Play the seeded mix. Cost, length, and three locked voices are already on the card.",
    page: "home",
    target: "demo-player",
    advance: "action",
    kind: "tour",
  },
  {
    id: "use-case",
    index: 3,
    title: "Pick a use case",
    body: "Night scene, station, or a 30s spot. Each one loads a script.",
    page: "home",
    target: "use-cases",
    advance: "action",
    kind: "tour",
  },
  {
    id: "parse",
    index: 4,
    title: "Watch the parse",
    body: "Characters, line count, and SFX appear before you generate.",
    page: "home",
    target: "parse-panel",
    advance: "next",
    kind: "tour",
    cheat: ["[CHARACTER]", "[SFX: TAG]", "[EMOTION:]"],
  },
  {
    id: "open-desk",
    index: 5,
    title: "Open the desk",
    body: "Generate lives on the next screen. Start from the seeded episode.",
    page: "home",
    target: "open-desk",
    advance: "action",
    kind: "tour",
  },
  {
    id: "mix",
    index: 6,
    title: "Play the mix",
    body: "Lines highlight as it plays. This is the review desk.",
    page: "review",
    target: "mix-player",
    advance: "next",
    kind: "tour",
  },
  {
    id: "line",
    index: 7,
    title: "Click a line",
    body: "The mix seeks to that line. Hear one take at a time.",
    page: "review",
    target: "line-0",
    advance: "action",
    kind: "tour",
  },
  {
    id: "qa",
    index: 8,
    title: "Flag, regenerate, approve",
    body: "Wrong take? Flag it. Same voice comes back. Approve the ones that work.",
    page: "review",
    target: "line-actions",
    advance: "action",
    kind: "tour",
  },
  {
    id: "generate",
    index: 9,
    title: "Generate is here",
    body: "New audio is made on the desk, not on Home. Skip this if you are only listening.",
    page: "review",
    target: "generate",
    advance: "next",
    kind: "tour",
  },
  {
    id: "done",
    index: 10,
    title: "That’s the product.",
    body: "Listen. Parse. Review. Regenerate the bad lines. How to stays in the header if you want it again.",
    page: "any",
    advance: "next",
    kind: "popup",
  },
];

export const TOTAL = STEPS.length;

export function stepById(id: string | null): Step | null {
  if (!id) return null;
  return STEPS.find((step) => step.id === id) ?? null;
}

export function stepByIndex(index: number): Step | null {
  return STEPS.find((step) => step.index === index) ?? null;
}

export function formatKn(index: number, total = TOTAL): string {
  return `${index}/${total}`;
}
