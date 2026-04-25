'use client';

import { useState } from 'react';

export interface Plan {
  id: string;
  name: string;
  amountCents: number;
  interval: string;
  maxProfiles: number;
}

interface PlanCardProps {
  plan: Plan;
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
}

function savingsBadge(plan: Plan, allPlans: Plan[]): string | null {
  if (plan.interval !== 'year') return null;
  const monthly = allPlans.find(
    (p) => p.interval === 'month' && p.maxProfiles === plan.maxProfiles,
  );
  if (!monthly) return null;
  const annualMonthly = plan.amountCents / 12;
  const saving = Math.round((1 - annualMonthly / monthly.amountCents) * 100);
  return saving > 0 ? `Save ${saving}%` : null;
}

const FEATURES: Record<number, string[]> = {
  1: ['Unlimited books', 'Phrase-sync reader', 'Fragment sheets', 'Quote card sharing'],
  2: ['Everything in Individual', '2 simultaneous profiles', 'Shared library'],
};

export default function PlanCard({ plan, isCurrentPlan = false, onSelect }: PlanCardProps) {
  const [loading, setLoading] = useState(false);

  const price = (plan.amountCents / 100).toFixed(2);
  const period = plan.interval === 'year' ? '/yr' : '/mo';
  const features = FEATURES[plan.maxProfiles] ?? FEATURES[1];

  async function handleSelect() {
    setLoading(true);
    try {
      onSelect(plan.id);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-xl p-6 flex flex-col gap-4 bg-white shadow-sm relative">
      {isCurrentPlan && (
        <span className="absolute top-3 right-3 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          Current plan
        </span>
      )}
      <div>
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="text-3xl font-bold mt-1">
          ${price}
          <span className="text-base font-normal text-gray-500">{period}</span>
        </p>
      </div>
      <ul className="flex flex-col gap-1 text-sm text-gray-600 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="text-green-500">✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={handleSelect}
        disabled={loading || isCurrentPlan}
        className="mt-2 w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCurrentPlan ? 'Current plan' : loading ? 'Loading…' : 'Get started'}
      </button>
    </div>
  );
}
