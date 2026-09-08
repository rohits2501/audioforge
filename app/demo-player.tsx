"use client";

import Link from "next/link";
import { useOptionalOnboarding } from "./onboarding/provider";

export function DemoPlayer({ src }: { src: string }) {
  const onboarding = useOptionalOnboarding();
  return (
    <audio
      data-tour="demo-player"
      className="mt-4 w-full"
      controls
      src={src}
      onPlay={() => onboarding?.completeAction("listen")}
    />
  );
}

export function OpenDeskLink({ href, children }: { href: string; children: React.ReactNode }) {
  const onboarding = useOptionalOnboarding();
  return (
    <Link
      href={href}
      data-tour="open-desk"
      className="rounded-md bg-[var(--accent)] px-3 py-2 text-sm text-black"
      onClick={() => onboarding?.completeAction("open-desk")}
    >
      {children}
    </Link>
  );
}
