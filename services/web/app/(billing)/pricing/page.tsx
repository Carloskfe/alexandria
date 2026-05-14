'use client';

import { useEffect, useState } from 'react';
import PlanCard, { Plan } from '../../../components/PlanCard';
import CauseSelector from '@/components/CauseSelector';

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasPreferences, setHasPreferences] = useState(true);

  // planId waiting to be checked out — held while CauseSelector is open
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/subscriptions/plans').then((r) => r.ok ? r.json() : []),
      fetch('/api/subscriptions/me').then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/causes/preferences').then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([fetchedPlans, status, prefs]) => {
      setPlans(fetchedPlans);
      if (status?.planId) setCurrentPlanId(status.planId);
      setHasPreferences(!!prefs);
    }).finally(() => setLoading(false));
  }, []);

  async function checkout(planId: string) {
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
      setError('No pudimos iniciar el pago. Por favor intenta de nuevo.');
    }
  }

  async function handleSelect(planId: string) {
    if (!hasPreferences) {
      setPendingPlanId(planId);
    } else {
      await checkout(planId);
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-center mb-4">Elige tu plan</h1>
      <p className="text-center text-gray-500 mb-2">
        14 días de prueba gratuita. Cancela cuando quieras.
      </p>
      <p className="text-center text-xs text-slate-400 mb-12">
        El 2,22% de tu pago apoya causas sociales en América Latina.{' '}
        <a href="/causas" className="underline hover:text-slate-600">Conoce más →</a>
      </p>

      {error && <p className="text-center text-red-600 mb-6">{error}</p>}

      {loading ? (
        <p className="text-center text-gray-400">Cargando planes…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              allPlans={plans}
              isCurrentPlan={plan.id === currentPlanId}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {pendingPlanId && (
        <CauseSelector
          onSave={() => {
            setHasPreferences(true);
            checkout(pendingPlanId);
            setPendingPlanId(null);
          }}
          onSkip={() => {
            checkout(pendingPlanId);
            setPendingPlanId(null);
          }}
        />
      )}
    </main>
  );
}
