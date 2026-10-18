import type { Metadata } from "next";
import { OnboardingShell } from "./onboarding/shell";
import { WebVitals } from "./web-vitals";
import "./globals.css";

export const metadata: Metadata = {
  title: "AudioForge",
  description: "Script in. Hindi multi-character episode out.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <OnboardingShell>{children}</OnboardingShell>
        <WebVitals />
      </body>
    </html>
  );
}
