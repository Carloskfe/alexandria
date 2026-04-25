export interface Plan {
  id: string;
  name: string;
  amountCents: number;
  interval: 'month' | 'year';
  maxProfiles: number;
}

const FEATURES: Record<number, string[]> = {
  1: ['Unlimited books', 'Phrase-sync reader', 'Fragment sheets', 'Quote card sharing'],
  2: ['Everything in Individual', '2 simultaneous profiles', 'Shared library'],
};

export function getPlanFeatures(maxProfiles: number): string[] {
  return FEATURES[maxProfiles] ?? FEATURES[1];
}

export function formatPrice(amountCents: number, interval: string): { price: string; period: string } {
  return {
    price: (amountCents / 100).toFixed(2),
    period: interval === 'year' ? '/yr' : '/mo',
  };
}

export function savingsBadge(plan: Plan, allPlans: Plan[]): string | null {
  if (plan.interval !== 'year') return null;
  const monthly = allPlans.find(
    (p) => p.interval === 'month' && p.maxProfiles === plan.maxProfiles,
  );
  if (!monthly) return null;
  const annualMonthly = plan.amountCents / 12;
  const saving = Math.round((1 - annualMonthly / monthly.amountCents) * 100);
  return saving > 0 ? `Save ${saving}%` : null;
}
