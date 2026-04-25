export async function syncSubscription(): Promise<void> {
  await fetch('/api/subscriptions/sync', { method: 'POST' });
}

export async function createPortalSession(): Promise<string> {
  const res = await fetch('/api/subscriptions/portal', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create portal session');
  const { url } = await res.json();
  return url;
}

export async function createCheckoutSession(planId: string): Promise<string> {
  const res = await fetch('/api/subscriptions/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId }),
  });
  if (!res.ok) throw new Error('Failed to create checkout session');
  const { url } = await res.json();
  return url;
}
