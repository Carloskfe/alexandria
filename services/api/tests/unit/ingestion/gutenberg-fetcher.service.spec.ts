import { Test, TestingModule } from '@nestjs/testing';
import { GutenbergFetcherService } from '../../../src/ingestion/gutenberg-fetcher.service';

const mockFetch = jest.fn();

beforeAll(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('GutenbergFetcherService', () => {
  let service: GutenbergFetcherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GutenbergFetcherService],
    }).compile();

    service = module.get<GutenbergFetcherService>(GutenbergFetcherService);
  });

  describe('fetch', () => {
    it('fetches the correct Gutenberg URL and returns stripped text', async () => {
      const raw =
        'Some preamble\n' +
        '*** START OF THE PROJECT GUTENBERG EBOOK FOO ***\n' +
        'Chapter 1. The beginning.\n' +
        '*** END OF THE PROJECT GUTENBERG EBOOK FOO ***\n' +
        'Some postamble';
      mockFetch.mockResolvedValue({ ok: true, text: async () => raw });

      const result = await service.fetch(320);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.gutenberg.org/cache/epub/320/pg320.txt',
      );
      expect(result).toBe('Chapter 1. The beginning.');
    });

    it('strips THIS PROJECT GUTENBERG variant header', async () => {
      const raw =
        '*** START OF THIS PROJECT GUTENBERG EBOOK BAR ***\n' +
        'Content here.\n' +
        '*** END OF THIS PROJECT GUTENBERG EBOOK BAR ***';
      mockFetch.mockResolvedValue({ ok: true, text: async () => raw });

      const result = await service.fetch(100);

      expect(result).toBe('Content here.');
    });

    it('returns the full text when no Gutenberg markers are found', async () => {
      const raw = 'Plain text without markers.';
      mockFetch.mockResolvedValue({ ok: true, text: async () => raw });

      const result = await service.fetch(999);

      expect(result).toBe('Plain text without markers.');
    });

    it('throws when response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(service.fetch(0)).rejects.toThrow('HTTP 404');
    });

    it('propagates network errors', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));

      await expect(service.fetch(320)).rejects.toThrow('network error');
    });
  });
});
