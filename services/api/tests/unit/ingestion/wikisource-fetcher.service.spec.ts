import { Test, TestingModule } from '@nestjs/testing';
import { WikisourceFetcherService } from '../../../src/ingestion/wikisource-fetcher.service';

const mockFetch = jest.fn();

beforeAll(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  jest.resetAllMocks();
});

const LINKS_RESPONSE = (title: string, subs: string[]) => ({
  ok: true,
  json: async () => ({
    parse: { links: subs.map((s) => ({ '*': s })) },
  }),
});

const HTML_RESPONSE = (html: string) => ({
  ok: true,
  json: async () => ({ parse: { text: html } }),
});

describe('WikisourceFetcherService', () => {
  let service: WikisourceFetcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WikisourceFetcherService],
    }).compile();

    service = module.get<WikisourceFetcherService>(WikisourceFetcherService);
  });

  describe('fetch — single-page book (no subpages)', () => {
    it('returns text from the single page when no subpages exist', async () => {
      mockFetch
        .mockResolvedValueOnce(LINKS_RESPONSE('Romeo y Julieta', []))
        .mockResolvedValueOnce(HTML_RESPONSE('<p>Acto I. Escena primera.</p>'));

      const result = await service.fetch('Romeo y Julieta');

      expect(result).toBe('Acto I. Escena primera.');
    });

    it('strips HTML tags and decodes entities', async () => {
      mockFetch
        .mockResolvedValueOnce(LINKS_RESPONSE('TestPage', []))
        .mockResolvedValueOnce(
          HTML_RESPONSE('<p>Él dijo &quot;hola&quot; &amp; adiós.</p>'),
        );

      const result = await service.fetch('TestPage');

      expect(result).toBe('Él dijo "hola" & adiós.');
    });

    it('throws when the page request is not ok', async () => {
      mockFetch
        .mockResolvedValueOnce(LINKS_RESPONSE('Page', []))
        .mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(service.fetch('Page')).rejects.toThrow('HTTP 404');
    });

    it('throws when the API returns an error field', async () => {
      mockFetch
        .mockResolvedValueOnce(LINKS_RESPONSE('Page', []))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ error: { info: 'Page not found' } }),
        });

      await expect(service.fetch('Page')).rejects.toThrow('Page not found');
    });

    it('throws when parse.text is absent', async () => {
      mockFetch
        .mockResolvedValueOnce(LINKS_RESPONSE('Page', []))
        .mockResolvedValueOnce({ ok: true, json: async () => ({ parse: {} }) });

      await expect(service.fetch('Page')).rejects.toThrow('No text returned');
    });
  });

  describe('fetch — multi-page book (subpages)', () => {
    const TITLE = 'Viaje al centro de la Tierra';

    it('fetches each subpage and concatenates the text', async () => {
      const ch1 = '<p>' + 'Capítulo I. '.repeat(12) + '</p>';
      const ch2 = '<p>' + 'Capítulo II. '.repeat(12) + '</p>';
      mockFetch
        .mockResolvedValueOnce(
          LINKS_RESPONSE(TITLE, [`${TITLE}/I`, `${TITLE}/II`]),
        )
        .mockResolvedValueOnce(HTML_RESPONSE(ch1))
        .mockResolvedValueOnce(HTML_RESPONSE(ch2));

      const result = await service.fetch(TITLE);

      expect(result).toContain('Capítulo I.');
      expect(result).toContain('Capítulo II');  // II appears in both II. and II repeated text
    });

    it('sorts subpages before fetching so chapters arrive in order', async () => {
      const fetchOrder: string[] = [];
      mockFetch.mockImplementation(async (url: string) => {
        if (url.includes('prop=links')) {
          return LINKS_RESPONSE(TITLE, [`${TITLE}/III`, `${TITLE}/I`, `${TITLE}/II`]);
        }
        fetchOrder.push(url as string);
        return HTML_RESPONSE('<p>Lorem ipsum dolor sit amet consectetuer.</p>');
      });

      await service.fetch(TITLE);

      // URLs are percent-encoded so '/' becomes '%2F'
      expect(fetchOrder[0]).toContain('%2FI&');
      expect(fetchOrder[1]).toContain('%2FII&');
      expect(fetchOrder[2]).toContain('%2FIII&');
    });

    it('skips subpages with near-empty text without failing', async () => {
      mockFetch
        .mockResolvedValueOnce(
          LINKS_RESPONSE(TITLE, [`${TITLE}/I`, `${TITLE}/II`]),
        )
        .mockResolvedValueOnce(HTML_RESPONSE('<p>ok</p>')) // too short — skipped
        .mockResolvedValueOnce(
          HTML_RESPONSE('<p>' + 'A'.repeat(200) + '.</p>'),
        );

      const result = await service.fetch(TITLE);

      expect(result).not.toContain('ok');
      expect(result.length).toBeGreaterThan(100);
    });

    it('falls back to the main page if all subpage fetches fail', async () => {
      mockFetch
        .mockResolvedValueOnce(LINKS_RESPONSE(TITLE, [`${TITLE}/I`]))
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce(HTML_RESPONSE('<p>Fallback main page text here.</p>'));

      const result = await service.fetch(TITLE);

      expect(result).toBe('Fallback main page text here.');
    });

    it('only uses links that are direct subpages of the requested title', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            parse: {
              links: [
                { '*': `${TITLE}/I` },
                { '*': 'Otro Libro/I' },       // different book — excluded
                { '*': `${TITLE}` },            // root page — excluded
              ],
            },
          }),
        })
        .mockResolvedValueOnce(
          HTML_RESPONSE('<p>' + 'B'.repeat(200) + '.</p>'),
        );

      await service.fetch(TITLE);

      // Only one subpage fetch should have happened (the /I one)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetch — links API failure', () => {
    it('falls back to single-page fetch when the links API call fails', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: false, status: 503 }) // links call fails
        .mockResolvedValueOnce(HTML_RESPONSE('<p>Direct page text here.</p>'));

      const result = await service.fetch('SomePage');

      expect(result).toBe('Direct page text here.');
    });
  });
});
