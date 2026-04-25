import { fetchSubscriptionStatus, requiresPaywall } from '../../../src/api/subscriptions';

afterEach(() => jest.restoreAllMocks());

function mockFetch(ok: boolean, body: unknown) {
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);
}

describe('fetchSubscriptionStatus', () => {
  it('returns status from API response', async () => {
    mockFetch(true, { status: 'active' });
    const result = await fetchSubscriptionStatus('http://api.test');
    expect(result).toBe('active');
    expect(global.fetch).toHaveBeenCalledWith('http://api.test/subscriptions/me');
  });

  it('returns trialing status', async () => {
    mockFetch(true, { status: 'trialing' });
    expect(await fetchSubscriptionStatus('http://api.test')).toBe('trialing');
  });

  it('returns canceling status', async () => {
    mockFetch(true, { status: 'canceling' });
    expect(await fetchSubscriptionStatus('http://api.test')).toBe('canceling');
  });

  it('returns none when response is not ok', async () => {
    mockFetch(false, {});
    const result = await fetchSubscriptionStatus('http://api.test');
    expect(result).toBe('none');
  });

  it('returns none when status field is missing', async () => {
    mockFetch(true, {});
    const result = await fetchSubscriptionStatus('http://api.test');
    expect(result).toBe('none');
  });

  it('appends path correctly to base URL', async () => {
    mockFetch(true, { status: 'active' });
    await fetchSubscriptionStatus('http://api.test');
    expect(global.fetch).toHaveBeenCalledWith('http://api.test/subscriptions/me');
  });
});

describe('requiresPaywall', () => {
  it('returns true for none', () => {
    expect(requiresPaywall('none')).toBe(true);
  });

  it('returns true for canceled', () => {
    expect(requiresPaywall('canceled')).toBe(true);
  });

  it('returns true for past_due', () => {
    expect(requiresPaywall('past_due')).toBe(true);
  });

  it('returns false for active', () => {
    expect(requiresPaywall('active')).toBe(false);
  });

  it('returns false for trialing', () => {
    expect(requiresPaywall('trialing')).toBe(false);
  });

  it('returns false for canceling', () => {
    expect(requiresPaywall('canceling')).toBe(false);
  });
});
