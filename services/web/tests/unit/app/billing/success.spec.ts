import { syncSubscription, createPortalSession, createCheckoutSession } from '../../../../lib/billing-utils';

afterEach(() => jest.restoreAllMocks());

function mockFetch(ok: boolean, body: unknown) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
}

describe('syncSubscription', () => {
  it('calls POST /api/subscriptions/sync on mount', async () => {
    mockFetch(true, {});
    await syncSubscription();
    expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/sync', { method: 'POST' });
  });

  it('resolves even when the response is not ok', async () => {
    mockFetch(false, {});
    await expect(syncSubscription()).resolves.toBeUndefined();
  });
});

describe('createPortalSession', () => {
  it('returns the portal URL on success', async () => {
    mockFetch(true, { url: 'https://billing.stripe.com/session/abc' });
    const url = await createPortalSession();
    expect(url).toBe('https://billing.stripe.com/session/abc');
  });

  it('throws when the response is not ok', async () => {
    mockFetch(false, {});
    await expect(createPortalSession()).rejects.toThrow('Failed to create portal session');
  });

  it('calls POST /api/subscriptions/portal', async () => {
    mockFetch(true, { url: 'https://billing.stripe.com/session/x' });
    await createPortalSession();
    expect(global.fetch).toHaveBeenCalledWith('/api/subscriptions/portal', { method: 'POST' });
  });
});

describe('createCheckoutSession', () => {
  it('returns the checkout URL on success', async () => {
    mockFetch(true, { url: 'https://checkout.stripe.com/pay/cs_test_abc' });
    const url = await createCheckoutSession('ind-mo');
    expect(url).toBe('https://checkout.stripe.com/pay/cs_test_abc');
  });

  it('calls POST /api/subscriptions/checkout with planId', async () => {
    mockFetch(true, { url: 'https://checkout.stripe.com/pay/cs_test_abc' });
    await createCheckoutSession('duo-yr');
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('/api/subscriptions/checkout');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ planId: 'duo-yr' });
  });

  it('throws when the response is not ok', async () => {
    mockFetch(false, {});
    await expect(createCheckoutSession('bad-plan')).rejects.toThrow('Failed to create checkout session');
  });
});
