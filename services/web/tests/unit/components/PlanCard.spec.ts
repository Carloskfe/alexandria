import { Plan, savingsBadge, formatPrice, getPlanFeatures } from '../../../lib/plan-utils';

const PLANS: Plan[] = [
  { id: 'ind-mo', name: 'Individual Monthly', amountCents: 999,  interval: 'month', maxProfiles: 1 },
  { id: 'ind-yr', name: 'Individual Annual',  amountCents: 8900, interval: 'year',  maxProfiles: 1 },
  { id: 'duo-mo', name: 'Dual Monthly',       amountCents: 1499, interval: 'month', maxProfiles: 2 },
  { id: 'duo-yr', name: 'Dual Annual',        amountCents: 13500, interval: 'year', maxProfiles: 2 },
];

describe('formatPrice', () => {
  it('formats monthly price correctly', () => {
    const { price, period } = formatPrice(999, 'month');
    expect(price).toBe('9.99');
    expect(period).toBe('/mo');
  });

  it('formats annual price correctly', () => {
    const { price, period } = formatPrice(8900, 'year');
    expect(price).toBe('89.00');
    expect(period).toBe('/yr');
  });

  it('returns /mo for unknown interval', () => {
    const { period } = formatPrice(500, 'week');
    expect(period).toBe('/mo');
  });
});

describe('getPlanFeatures', () => {
  it('returns individual features for maxProfiles=1', () => {
    const features = getPlanFeatures(1);
    expect(features).toContain('Unlimited books');
    expect(features).toContain('Phrase-sync reader');
  });

  it('returns dual-reader features for maxProfiles=2', () => {
    const features = getPlanFeatures(2);
    expect(features).toContain('2 simultaneous profiles');
    expect(features).toContain('Shared library');
  });

  it('falls back to individual features for unknown maxProfiles', () => {
    const features = getPlanFeatures(99);
    expect(features).toContain('Unlimited books');
  });
});

describe('savingsBadge', () => {
  it('returns null for monthly plans', () => {
    const monthly = PLANS.find((p) => p.id === 'ind-mo')!;
    expect(savingsBadge(monthly, PLANS)).toBeNull();
  });

  it('returns a savings badge for individual annual plan', () => {
    const annual = PLANS.find((p) => p.id === 'ind-yr')!;
    const badge = savingsBadge(annual, PLANS);
    expect(badge).not.toBeNull();
    expect(badge).toMatch(/^Save \d+%$/);
  });

  it('returns a savings badge for dual annual plan', () => {
    const annual = PLANS.find((p) => p.id === 'duo-yr')!;
    const badge = savingsBadge(annual, PLANS);
    expect(badge).not.toBeNull();
    expect(badge).toMatch(/^Save \d+%$/);
  });

  it('returns null when no matching monthly plan exists', () => {
    const annual = PLANS.find((p) => p.id === 'ind-yr')!;
    const badge = savingsBadge(annual, [annual]);
    expect(badge).toBeNull();
  });

  it('computes Individual annual savings correctly (~26%)', () => {
    const annual = PLANS.find((p) => p.id === 'ind-yr')!;
    const badge = savingsBadge(annual, PLANS);
    const pct = parseInt(badge!.replace('Save ', '').replace('%', ''), 10);
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThanOrEqual(50);
  });
});
