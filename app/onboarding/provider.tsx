"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadOnboarding, saveOnboarding, type OnboardingState } from "./store";
import { TOTAL, stepById, stepByIndex, type Step } from "./steps";

const DEMO_REVIEW = "/review/rain-night";

type OnboardingContextValue = {
  hydrated: boolean;
  completed: boolean;
  paused: boolean;
  menuOpen: boolean;
  step: Step | null;
  index: number;
  total: number;
  next: () => void;
  back: () => void;
  goTo: (index: number) => void;
  skip: () => void;
  replay: () => void;
  completeAction: (stepId: string) => void;
  pause: () => void;
  setMenuOpen: (open: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function pageForPath(pathname: string): "home" | "review" {
  return pathname.startsWith("/review") ? "review" : "home";
}

function routeFor(step: Step): string | null {
  if (step.page === "review") return DEMO_REVIEW;
  if (step.page === "home") return "/";
  return null;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [state, setState] = useState<OnboardingState>({ completed: false, stepId: null });

  const persist = useCallback((next: OnboardingState) => {
    setState(next);
    saveOnboarding(next);
  }, []);

  useEffect(() => {
    const loaded = loadOnboarding();
    const path = pageForPath(window.location.pathname);
    if (!loaded.completed && !loaded.stepId) {
      persist({ completed: false, stepId: path === "review" ? "mix" : "welcome" });
    } else {
      setState(loaded);
    }
    setHydrated(true);
    // First paint only — later navigations must not reset the saved step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = stepById(state.stepId);
  const index = step?.index ?? (state.completed ? TOTAL : 0);

  const goTo = useCallback(
    (nextIndex: number) => {
      const nextStep = stepByIndex(nextIndex);
      if (!nextStep) return;
      setPaused(false);
      persist({ completed: false, stepId: nextStep.id });
      const dest = routeFor(nextStep);
      if (dest === "/" && pathname !== "/") router.push("/");
      if (dest === DEMO_REVIEW && !pathname.startsWith("/review/rain-night")) {
        router.push(DEMO_REVIEW);
      }
    },
    [pathname, persist, router],
  );

  const next = useCallback(() => {
    if (!step) return;
    if (step.id === "done") {
      persist({ completed: true, stepId: "done", dismissedAt: new Date().toISOString() });
      setPaused(false);
      return;
    }
    goTo(step.index + 1);
  }, [goTo, persist, step]);

  const back = useCallback(() => {
    if (!step || step.index <= 1) return;
    goTo(step.index - 1);
  }, [goTo, step]);

  const skip = useCallback(() => {
    persist({ completed: true, stepId: step?.id ?? "done", dismissedAt: new Date().toISOString() });
    setPaused(false);
    setMenuOpen(false);
  }, [persist, step]);

  const replay = useCallback(() => {
    persist({ completed: false, stepId: "welcome" });
    setPaused(false);
    setMenuOpen(false);
    if (pathname !== "/") router.push("/");
  }, [pathname, persist, router]);

  const completeAction = useCallback(
    (stepId: string) => {
      if (state.completed || paused) return;
      if (state.stepId !== stepId) return;
      next();
    },
    [next, paused, state.completed, state.stepId],
  );

  useEffect(() => {
    if (!hydrated || state.completed || paused || !step?.target) return;
    const exists = document.querySelector(`[data-tour="${step.target}"]`);
    if (exists) return;
    const fallback = step.index < TOTAL ? step.index + 1 : null;
    if (fallback) goTo(fallback);
  }, [goTo, hydrated, paused, pathname, state.completed, step]);

  useEffect(() => {
    if (!hydrated) return;
    function onKey(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (event.key === "Escape") {
        event.preventDefault();
        setPaused(true);
        setMenuOpen(false);
      }
      if (state.completed) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back, hydrated, next, state.completed]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      hydrated,
      completed: state.completed,
      paused,
      menuOpen,
      step: state.completed ? null : step,
      index,
      total: TOTAL,
      next,
      back,
      goTo,
      skip,
      replay,
      completeAction,
      pause: () => setPaused(true),
      setMenuOpen,
    }),
    [back, completeAction, goTo, hydrated, index, menuOpen, next, paused, replay, skip, state.completed, step],
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}

export function useOptionalOnboarding(): OnboardingContextValue | null {
  return useContext(OnboardingContext);
}

