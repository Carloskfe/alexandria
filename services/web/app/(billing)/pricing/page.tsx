'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PlanCard, { Plan } from '../../../components/PlanCard';

const STATIC_PLANS: Plan[] = [
  { id: 'individual-monthly', name: 'Individual Monthly', amountCents: 999,  interval: 'month', maxProfiles: 1 },
  { id: 'individual-annual',  name: 'Individual Annual',  amountCents: 8900, interval: 'year',  maxProfiles: 1 },
  { id: 'dual-monthly',       name: 'Dual Reader Monthly', amountCents: 1499, interval: 'month', maxProfiles: 2 },
  { id: 'dual-annual',        name: 'Dual Reader Annual',  amountCents: 13500,interval: 'year',  maxProfiles: 2 },
];

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(STATIC_PLANS);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/subscriptions/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.planId) setCurrentPlanId(data.planId); })
      .catch(() => {});
  }, []);

  async function handleSelect(planId: string) {
    setError(null);
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error('Checkout failed');
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Could not start checkout. Please try again.');
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">Choose your plan</h1>
      <p className="text-center text-gray-500 mb-12">
        Start with a 14-day free trial. Cancel anytime.
      </p>
      {error && (
        <p className="text-center text-red-600 mb-6">{error}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentPlanId}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </main>
  );
}
