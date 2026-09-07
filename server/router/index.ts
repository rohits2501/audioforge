import { getElevenLabsApiKey, getSarvamApiKey } from "../lib/env";
import { elevenLabsProvider } from "../providers/elevenlabs";
import { offlineProvider } from "../providers/offline";
import { sarvamProvider } from "../providers/sarvam";
import type { AudioProvider } from "../providers/types";
import type { ProviderId, RouterInput } from "../types";

/**
 * Routing abstraction without pretending we have intelligent routing.
 * Default: Indic → Sarvam. English premium → ElevenLabs. SFX is never routed here.
 */
export function routeProvider(input: RouterInput): AudioProvider {
  if (input.task === "sfx") {
    throw new Error("SFX is local-library only — do not route to a TTS provider");
  }

  if (input.qualityHint === "premium" && input.language.startsWith("en") && getElevenLabsApiKey()) {
    return elevenLabsProvider;
  }

  if (input.language.endsWith("-IN") && input.language !== "en-IN") {
    return getSarvamApiKey() ? sarvamProvider : offlineProvider;
  }

  if (input.language.startsWith("en") && getElevenLabsApiKey()) {
    return elevenLabsProvider;
  }

  return getSarvamApiKey() ? sarvamProvider : offlineProvider;
}

export function providerById(id: ProviderId): AudioProvider {
  if (id === "elevenlabs") return elevenLabsProvider;
  if (id === "sarvam") return getSarvamApiKey() ? sarvamProvider : offlineProvider;
  return offlineProvider;
}
