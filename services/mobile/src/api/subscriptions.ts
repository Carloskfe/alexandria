export type SubscriptionStatus =
  | 'none'
  | 'trialing'
  | 'active'
  | 'canceling'
  | 'past_due'
  | 'canceled';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
}

export async function fetchSubscriptionStatus(apiUrl: string): Promise<SubscriptionStatus> {
  const res = await fetch(`${apiUrl}/subscriptions/me`);
  if (!res.ok) return 'none';
  const data: SubscriptionInfo = await res.json();
  return data.status ?? 'none';
}

export function requiresPaywall(status: SubscriptionStatus): boolean {
  return status === 'none' || status === 'canceled' || status === 'past_due';
}
