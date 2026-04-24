import { SHARE_PLATFORMS, shareFragment } from '../../../lib/share-utils';

const mockStorage: Record<string, string> = {};
const sessionStorageMock = {
  getItem: jest.fn((key: string) => mockStorage[key] ?? null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock, writable: true });
});

describe('SHARE_PLATFORMS', () => {
  it('includes all four platforms', () => {
    const ids = SHARE_PLATFORMS.map((p) => p.id);
    expect(ids).toContain('linkedin');
    expect(ids).toContain('instagram');
    expect(ids).toContain('facebook');
    expect(ids).toContain('whatsapp');
  });

  it('has a label for each platform', () => {
    SHARE_PLATFORMS.forEach(({ label }) => {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe('shareFragment', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the URL from a successful share call', async () => {
    const expectedUrl = 'http://storage/images/card.png?token=abc';
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: expectedUrl }),
    } as Response);

    const result = await shareFragment('frag-1', 'linkedin');
    expect(result).toBe(expectedUrl);
  });

  it('calls the correct API endpoint with the platform', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ url: 'http://example.com/img.png' }),
    } as Response);

    await shareFragment('frag-42', 'instagram');

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/fragments/frag-42/share');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.platform).toBe('instagram');
  });

  it('throws when the API returns an error', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ message: 'image generation failed' }),
    } as Response);

    await expect(shareFragment('frag-1', 'facebook')).rejects.toThrow();
  });
});
