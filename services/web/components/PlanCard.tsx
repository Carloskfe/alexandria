'use client';

import { useState } from 'react';
import { Plan, formatPrice, getPlanFeatures, savingsBadge } from '@/lib/plan-utils';

export type { Plan };

interface PlanCardProps {
  plan: Plan;
  allPlans?: Plan[];
  isCurrentPlan?: boolean;
  onSelect: (planId: string) => void;
}

export default function PlanCard({ plan, allPlans = [], isCurrentPlan = false, onSelect }: PlanCardProps) {
  const [loading, setLoading] = useState(false);

  const { price, period } = formatPrice(plan.amountCents, plan.interval);
  const features = getPlanFeatures(plan.maxProfiles);
  const badge = allPlans.length ? savingsBadge(plan, allPlans) : null;

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
      {badge && (
        <span className="absolute top-3 left-3 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
          {badge}
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
