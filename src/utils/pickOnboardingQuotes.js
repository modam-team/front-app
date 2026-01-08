import { ONBOARDING_QUOTES } from "@constants/onboardingQuotes";

export function pickOnboardingQuote(preferredGenres = []) {
  const keys = Array.isArray(preferredGenres)
    ? preferredGenres
    : [preferredGenres];

  const pool = keys.flatMap((g) => ONBOARDING_QUOTES[g] ?? []);
  const fallbackPool = Object.values(ONBOARDING_QUOTES).flat();

  const list = pool.length ? pool : fallbackPool;
  if (!list.length) return null;

  return list[Math.floor(Math.random() * list.length)];
}
