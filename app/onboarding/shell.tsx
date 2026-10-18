"use client";

import { OnboardingBanner } from "./banner";
import { OnboardingCoachmark } from "./coachmark";
import { HowToMenu } from "./menu";
import { OnboardingPopup } from "./popup";
import { OnboardingProvider } from "./provider";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <div className="sticky top-0 z-40 flex justify-end border-b border-[var(--border)] bg-[var(--bg)]/90 px-6 py-3 backdrop-blur">
        <HowToMenu />
      </div>
      <OnboardingBanner />
      {children}
      <OnboardingPopup />
      <OnboardingCoachmark />
    </OnboardingProvider>
  );
}
