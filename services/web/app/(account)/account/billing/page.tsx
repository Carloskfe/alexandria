'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SubscriptionStatus {
  status: 'none' | 'trialing' | 'active' | 'canceling' | 'past_due' | 'canceled';
  planId?: string | null;
  currentPeriodEnd?: string | null;
  trialEnd?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',     color: 'bg-green-100 text-green-700' },
  trialing:  { label: 'Trial',      color: 'bg-blue-100 text-blue-700' },
  canceling: { label: 'Canceling',  color: 'bg-yellow-100 text-yellow-700' },
  past_due:  { label: 'Past due',   color: 'bg-red-100 text-red-700' },
  canceled:  { label: 'Canceled',   color: 'bg-gray-100 text-gray-600' },
  none:      { label: 'No plan',    color: 'bg-gray-100 text-gray-600' },
};

export default function BillingSettingsPage() {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    const res = await fetch('/api/subscriptions/me');
    const data = await res.json();
    setSub(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleManageBilling() {
    const res = await fetch('/api/subscriptions/portal', { method: 'POST' });
    const { url } = await res.json();
    window.location.href = url;
  }

  async function handleRefresh() {
    setSyncing(true);
    await fetch('/api/subscriptions/sync', { method: 'POST' });
    await load();
    setSyncing(false);
  }

  async function handleResume() {
    await fetch('/api/subscriptions/resume', { method: 'POST' });
    await load();
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>;

  const status = sub?.status ?? 'none';
  const badge = STATUS_LABELS[status] ?? STATUS_LABELS.none;
  const renewalDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString()
    : null;

  if (status === 'none' || status === 'canceled') {
    return (
      <main className="max-w-lg mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold mb-6">Billing</h1>
        <p className="text-gray-500 mb-6">You don't have an active plan.</p>
        <Link href="/pricing" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          View plans
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>
      <div className="border rounded-xl p-6 bg-white shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Plan</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
            {badge.label}
          </span>
        </div>
        {renewalDate && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{status === 'canceling' ? 'Access ends' : 'Renews on'}</span>
            <span>{renewalDate}</span>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handleManageBilling}
            className="w-full py-2 px-4 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            Manage billing
          </button>
          {status === 'canceling' && (
            <button
              onClick={handleResume}
              className="w-full py-2 px-4 rounded-lg border border-indigo-600 text-indigo-600 font-medium hover:bg-indigo-50"
            >
              Resume subscription
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={syncing}
            className="w-full py-2 px-4 rounded-lg border text-gray-600 font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? 'Refreshing…' : 'Refresh status'}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/causas" className="text-sm text-slate-400 hover:text-slate-600 transition">
          🌿 Ver Causas Noetia — el 2,22% de tu pago apoya causas sociales
        </Link>
      </div>
    </main>
  );
}
