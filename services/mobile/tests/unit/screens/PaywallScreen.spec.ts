import { fetchSubscriptionStatus, requiresPaywall } from '../../../src/api/subscriptions';
import { Linking } from 'react-native';
import { PaywallScreen } from '../../../src/screens/PaywallScreen';

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

describe('PaywallScreen', () => {
  const mockLinking = Linking.openURL as jest.Mock;

  beforeEach(() => jest.clearAllMocks());

  it('exports PaywallScreen as a function', () => {
    expect(typeof PaywallScreen).toBe('function');
  });

  it('renders without throwing', () => {
    expect(() => PaywallScreen()).not.toThrow();
  });

  it('renders a root View element', () => {
    const element = PaywallScreen() as any;
    expect(element.type).toBe('View');
  });

  it('renders the "Noetia Premium" title', () => {
    const element = PaywallScreen() as any;
    const title = element.props.children[0];
    expect(title.type).toBe('Text');
    expect(title.props.children).toBe('Noetia Premium');
  });

  it('renders a plan card for each plan', () => {
    const element = PaywallScreen() as any;
    const planCards = element.props.children[2]; // third child is the map result
    expect(Array.isArray(planCards)).toBe(true);
    expect(planCards).toHaveLength(2);
  });

  it('renders the Individual plan', () => {
    const element = PaywallScreen() as any;
    const planCards = element.props.children[2];
    const individualCard = planCards[0];
    const planName = individualCard.props.children[0];
    expect(planName.props.children).toBe('Individual');
  });

  it('renders the Dual Reader plan', () => {
    const element = PaywallScreen() as any;
    const planCards = element.props.children[2];
    const dualCard = planCards[1];
    const planName = dualCard.props.children[0];
    expect(planName.props.children).toBe('Dual Reader');
  });

  it('renders a Subscribe CTA button', () => {
    const element = PaywallScreen() as any;
    const cta = element.props.children[3];
    expect(cta.type).toBe('TouchableOpacity');
    expect(cta.props.accessibilityLabel).toBe('Subscribe now');
  });

  it('CTA button opens the pricing URL', () => {
    const element = PaywallScreen() as any;
    const cta = element.props.children[3];
    cta.props.onPress();
    expect(mockLinking).toHaveBeenCalledWith('https://noetia.app/pricing');
  });
});
