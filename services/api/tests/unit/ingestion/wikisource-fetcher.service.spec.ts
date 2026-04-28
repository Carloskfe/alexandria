import { Test, TestingModule } from '@nestjs/testing';
import { WikisourceFetcherService } from '../../../src/ingestion/wikisource-fetcher.service';

const mockFetch = jest.fn();

beforeAll(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('WikisourceFetcherService', () => {
  let service: WikisourceFetcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WikisourceFetcherService],
    }).compile();

    service = module.get<WikisourceFetcherService>(WikisourceFetcherService);
  });

  describe('fetch', () => {
    it('calls the Wikisource API with the encoded page title', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parse: { text: '<p>Hola mundo.</p>' } }),
      });

      await service.fetch('Romeo y Julieta');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Romeo%20y%20Julieta'),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('es.wikisource.org'),
      );
    });

    it('strips HTML tags and decodes entities from the API response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          parse: { text: '<p>Él dijo &quot;hola&quot; &amp; adiós.</p>' },
        }),
      });

      const result = await service.fetch('TestPage');

      expect(result).toBe('Él dijo "hola" & adiós.');
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500 });

      await expect(service.fetch('SomePage')).rejects.toThrow('HTTP 500');
    });

    it('throws when API returns an error field', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ error: { info: 'Page not found' } }),
      });

      await expect(service.fetch('MissingPage')).rejects.toThrow('Page not found');
    });

    it('throws when parse.text is absent', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parse: {} }),
      });

      await expect(service.fetch('EmptyPage')).rejects.toThrow('No text returned');
    });

    it('collapses multiple whitespace characters into a single space', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ parse: { text: '<p>One   two\n\nthree</p>' } }),
      });

      const result = await service.fetch('SpacePage');

      expect(result).toBe('One two three');
    });
  });
});
