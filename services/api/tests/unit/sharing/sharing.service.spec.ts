import { BadGatewayException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SharingService } from '../../../src/sharing/sharing.service';
import { Fragment } from '../../../src/fragments/fragment.entity';
import { Book } from '../../../src/books/book.entity';

const mockFragment = (): Partial<Fragment> => ({
  id: 'frag-1',
  userId: 'user-1',
  bookId: 'book-1',
  text: 'El conocimiento es poder.',
  startPhraseIndex: null,
  endPhraseIndex: null,
  note: null,
});

const mockBook = (): Partial<Book> => ({
  id: 'book-1',
  title: 'Meditationes Sacrae',
  author: 'Francis Bacon',
});

describe('SharingService', () => {
  let service: SharingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SharingService],
    }).compile();

    service = module.get<SharingService>(SharingService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('generateShareUrl', () => {
    it('returns URL from image-gen on success', async () => {
      const expectedUrl = 'http://storage:9000/images/uuid.png?token=abc';
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: expectedUrl }),
      } as Response);

      const result = await service.generateShareUrl(
        mockFragment() as Fragment,
        mockBook() as Book,
        'linkedin',
      );

      expect(result).toBe(expectedUrl);
    });

    it('sends correct payload to image-gen including style', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'http://example.com/img.png' }),
      } as Response);

      await service.generateShareUrl(
        mockFragment() as Fragment,
        mockBook() as Book,
        'instagram',
        'warm',
      );

      const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('/generate');
      const body = JSON.parse(options.body);
      expect(body).toMatchObject({
        text: 'El conocimiento es poder.',
        author: 'Francis Bacon',
        title: 'Meditationes Sacrae',
        platform: 'instagram',
        style: 'warm',
      });
    });

    it('defaults style to classic when not provided', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'http://example.com/img.png' }),
      } as Response);

      await service.generateShareUrl(
        mockFragment() as Fragment,
        mockBook() as Book,
        'instagram',
      );

      const [, options] = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(options.body);
      expect(body.style).toBe('classic');
    });

    it('throws BadGatewayException when image-gen returns non-200', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'unsupported platform' }),
      } as Response);

      await expect(
        service.generateShareUrl(mockFragment() as Fragment, mockBook() as Book, 'tiktok'),
      ).rejects.toThrow(BadGatewayException);
    });

    it('throws BadGatewayException when fetch rejects', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'));

      await expect(
        service.generateShareUrl(mockFragment() as Fragment, mockBook() as Book, 'linkedin'),
      ).rejects.toThrow();
    });
  });
});
