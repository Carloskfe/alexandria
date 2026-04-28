import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IngestionService } from '../../../src/ingestion/ingestion.service';
import { GutenbergFetcherService } from '../../../src/ingestion/gutenberg-fetcher.service';
import { WikisourceFetcherService } from '../../../src/ingestion/wikisource-fetcher.service';
import { PhraseSplitterService } from '../../../src/ingestion/phrase-splitter.service';
import { MinioUploaderService } from '../../../src/ingestion/minio-uploader.service';
import { Book, BookCategory } from '../../../src/books/book.entity';
import { SyncMap } from '../../../src/books/sync-map.entity';
import { CatalogueEntry } from '../../../src/ingestion/catalogue';

const mockBookRepo = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

const mockSyncMapRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockGutenbergFetcher = { fetch: jest.fn() };
const mockWikisourceFetcher = { fetch: jest.fn() };
const mockPhraseSplitter = { split: jest.fn() };
const mockMinioUploader = { upload: jest.fn() };

const gutenbergEntry: CatalogueEntry = {
  title: 'Test Book',
  author: 'Test Author',
  description: 'A test book.',
  source: 'gutenberg',
  gutenbergId: 123,
  librivoxAudioUrl: 'https://librivox.org/test-book/',
};

const wikisourceEntry: CatalogueEntry = {
  title: 'Wikisource Book',
  author: 'Wikisource Author',
  description: 'A wikisource book.',
  source: 'wikisource',
  wikisourceTitle: 'Wikisource Book',
  librivoxAudioUrl: 'https://librivox.org/wikisource-book/',
};

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: GutenbergFetcherService, useValue: mockGutenbergFetcher },
        { provide: WikisourceFetcherService, useValue: mockWikisourceFetcher },
        { provide: PhraseSplitterService, useValue: mockPhraseSplitter },
        { provide: MinioUploaderService, useValue: mockMinioUploader },
        { provide: getRepositoryToken(Book), useValue: mockBookRepo },
        { provide: getRepositoryToken(SyncMap), useValue: mockSyncMapRepo },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  describe('ingestOne', () => {
    it('fetches from Gutenberg and creates book + syncmap records', async () => {
      const savedBook = { id: 'book-uuid', textFileKey: null } as Book;
      mockBookRepo.findOneBy.mockResolvedValue(null);
      mockGutenbergFetcher.fetch.mockResolvedValue('Chapter 1. The beginning.');
      mockPhraseSplitter.split.mockReturnValue([
        { index: 0, text: 'Chapter 1. The beginning.', startTime: 0, endTime: 0 },
      ]);
      mockBookRepo.create.mockReturnValue(savedBook);
      mockBookRepo.save.mockResolvedValue(savedBook);
      mockMinioUploader.upload.mockResolvedValue(undefined);
      mockSyncMapRepo.create.mockReturnValue({});
      mockSyncMapRepo.save.mockResolvedValue({});

      const result = await service.ingestOne(gutenbergEntry);

      expect(mockGutenbergFetcher.fetch).toHaveBeenCalledWith(123);
      expect(mockMinioUploader.upload).toHaveBeenCalledWith('book-uuid.txt', 'Chapter 1. The beginning.');
      expect(mockBookRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Book',
          author: 'Test Author',
          category: BookCategory.CLASSIC,
          isFree: true,
          isPublished: true,
          language: 'es',
          audioFileKey: 'https://librivox.org/test-book/',
        }),
      );
      expect(mockSyncMapRepo.save).toHaveBeenCalled();
      expect(result).toBe(savedBook);
    });

    it('fetches from Wikisource for wikisource-source entries', async () => {
      const savedBook = { id: 'ws-uuid', textFileKey: null } as Book;
      mockBookRepo.findOneBy.mockResolvedValue(null);
      mockWikisourceFetcher.fetch.mockResolvedValue('Acto I. Escena I.');
      mockPhraseSplitter.split.mockReturnValue([]);
      mockBookRepo.create.mockReturnValue(savedBook);
      mockBookRepo.save.mockResolvedValue(savedBook);
      mockMinioUploader.upload.mockResolvedValue(undefined);
      mockSyncMapRepo.create.mockReturnValue({});
      mockSyncMapRepo.save.mockResolvedValue({});

      await service.ingestOne(wikisourceEntry);

      expect(mockWikisourceFetcher.fetch).toHaveBeenCalledWith('Wikisource Book');
      expect(mockGutenbergFetcher.fetch).not.toHaveBeenCalled();
    });

    it('returns existing book and skips ingestion when book already exists', async () => {
      const existing = { id: 'existing-uuid' } as Book;
      mockBookRepo.findOneBy.mockResolvedValue(existing);

      const result = await service.ingestOne(gutenbergEntry);

      expect(result).toBe(existing);
      expect(mockGutenbergFetcher.fetch).not.toHaveBeenCalled();
      expect(mockMinioUploader.upload).not.toHaveBeenCalled();
    });

    it('sets textFileKey on the book after uploading to MinIO', async () => {
      const savedBook = { id: 'tf-uuid', textFileKey: null } as Book;
      mockBookRepo.findOneBy.mockResolvedValue(null);
      mockGutenbergFetcher.fetch.mockResolvedValue('Some text.');
      mockPhraseSplitter.split.mockReturnValue([]);
      mockBookRepo.create.mockReturnValue(savedBook);
      mockBookRepo.save.mockResolvedValue(savedBook);
      mockMinioUploader.upload.mockResolvedValue(undefined);
      mockSyncMapRepo.create.mockReturnValue({});
      mockSyncMapRepo.save.mockResolvedValue({});

      await service.ingestOne(gutenbergEntry);

      expect(savedBook.textFileKey).toBe('tf-uuid.txt');
      expect(mockBookRepo.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('ingestAll', () => {
    it('calls ingestOne for every entry in CATALOGUE', async () => {
      const ingestOneSpy = jest
        .spyOn(service, 'ingestOne')
        .mockResolvedValue({} as Book);

      await service.ingestAll();

      const { CATALOGUE } = await import('../../../src/ingestion/catalogue');
      expect(ingestOneSpy).toHaveBeenCalledTimes(CATALOGUE.length);
    });

    it('continues processing remaining entries when one fails', async () => {
      const ingestOneSpy = jest
        .spyOn(service, 'ingestOne')
        .mockRejectedValueOnce(new Error('fetch error'))
        .mockResolvedValue({} as Book);

      await expect(service.ingestAll()).resolves.toBeUndefined();
      expect(ingestOneSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
