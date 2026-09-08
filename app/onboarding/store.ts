export interface OnboardingState {
  completed: boolean;
  stepId: string | null;
  dismissedAt?: string;
}

export const ONBOARDING_KEY = "audioforge.onboarding.v1";

export const EMPTY_STATE: OnboardingState = {
  completed: false,
  stepId: null,
};

export function loadOnboarding(): OnboardingState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as OnboardingState;
    return {
      completed: Boolean(parsed.completed),
      stepId: parsed.stepId ?? null,
      dismissedAt: parsed.dismissedAt,
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveOnboarding(state: OnboardingState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_KEY, JSON.stringify(state));
}
