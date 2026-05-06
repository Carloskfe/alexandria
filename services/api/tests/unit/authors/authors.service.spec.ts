import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthorsService } from '../../../src/authors/authors.service';
import { Book, BookCategory } from '../../../src/books/book.entity';
import { ReadingProgress } from '../../../src/books/reading-progress.entity';
import { HostingTier, User } from '../../../src/users/user.entity';

const mockBooksRepo = {
  find: jest.fn(),
  count: jest.fn(),
};

const mockProgressRepo = {
  count: jest.fn(),
};

const mockUsersRepo = {
  findOneBy: jest.fn(),
};

const makeBook = (overrides: Partial<Book> = {}): Book =>
  ({
    id: 'b-1',
    title: 'Mi Libro',
    uploadedById: 'user-1',
    isPublished: true,
    shareCount: 0,
    textFileSizeBytes: null,
    audioFileSizeBytes: null,
    category: BookCategory.LEADERSHIP,
    ...overrides,
  }) as Book;

describe('AuthorsService', () => {
  let service: AuthorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorsService,
        { provide: getRepositoryToken(Book), useValue: mockBooksRepo },
        { provide: getRepositoryToken(ReadingProgress), useValue: mockProgressRepo },
        { provide: getRepositoryToken(User), useValue: mockUsersRepo },
      ],
    }).compile();

    service = module.get<AuthorsService>(AuthorsService);
    jest.clearAllMocks();
  });

  describe('findMyBooks', () => {
    it('returns books belonging to the given user', async () => {
      const books = [makeBook()];
      mockBooksRepo.find.mockResolvedValue(books);

      const result = await service.findMyBooks('user-1');

      expect(mockBooksRepo.find).toHaveBeenCalledWith({
        where: { uploadedById: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(books);
    });

    it('returns empty array when user has no books', async () => {
      mockBooksRepo.find.mockResolvedValue([]);
      const result = await service.findMyBooks('user-with-no-books');
      expect(result).toEqual([]);
    });
  });

  describe('getAnalytics', () => {
    it('returns per-book analytics with reader counts and totals', async () => {
      const books = [
        makeBook({ id: 'b-1', title: 'Book A', shareCount: 5, textFileSizeBytes: 1024 * 1024, audioFileSizeBytes: 2 * 1024 * 1024 }),
        makeBook({ id: 'b-2', title: 'Book B', shareCount: 3, textFileSizeBytes: null, audioFileSizeBytes: null }),
      ];
      mockBooksRepo.find.mockResolvedValue(books);
      mockProgressRepo.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);

      const result = await service.getAnalytics('user-1');

      expect(result.books).toHaveLength(2);
      expect(result.books[0]).toMatchObject({ id: 'b-1', readers: 10, shareCount: 5, storageMB: 3 });
      expect(result.books[1]).toMatchObject({ id: 'b-2', readers: 5, shareCount: 3, storageMB: 0 });
      expect(result.totalReaders).toBe(15);
      expect(result.totalShares).toBe(8);
      expect(result.totalStorageMB).toBe(3);
    });

    it('returns zeroed totals when author has no books', async () => {
      mockBooksRepo.find.mockResolvedValue([]);

      const result = await service.getAnalytics('user-1');

      expect(result.books).toEqual([]);
      expect(result.totalReaders).toBe(0);
      expect(result.totalShares).toBe(0);
      expect(result.totalStorageMB).toBe(0);
    });

    it('treats null shareCount as zero', async () => {
      const book = makeBook({ shareCount: undefined as any });
      mockBooksRepo.find.mockResolvedValue([book]);
      mockProgressRepo.count.mockResolvedValue(0);

      const result = await service.getAnalytics('user-1');

      expect(result.books[0].shareCount).toBe(0);
    });
  });

  describe('getQuota', () => {
    it('returns quota for user with BASIC tier (limit 1)', async () => {
      mockUsersRepo.findOneBy.mockResolvedValue({ hostingTier: HostingTier.BASIC });
      mockBooksRepo.count.mockResolvedValue(0);

      const result = await service.getQuota('user-1');

      expect(result).toEqual({ tier: HostingTier.BASIC, limit: 1, used: 0, remaining: 1 });
    });

    it('returns quota for user with STARTER tier (limit 3)', async () => {
      mockUsersRepo.findOneBy.mockResolvedValue({ hostingTier: HostingTier.STARTER });
      mockBooksRepo.count.mockResolvedValue(2);

      const result = await service.getQuota('user-1');

      expect(result).toEqual({ tier: HostingTier.STARTER, limit: 3, used: 2, remaining: 1 });
    });

    it('returns quota for user with PRO tier (limit 12)', async () => {
      mockUsersRepo.findOneBy.mockResolvedValue({ hostingTier: HostingTier.PRO });
      mockBooksRepo.count.mockResolvedValue(12);

      const result = await service.getQuota('user-1');

      expect(result).toEqual({ tier: HostingTier.PRO, limit: 12, used: 12, remaining: 0 });
    });

    it('defaults to BASIC tier when user is not found', async () => {
      mockUsersRepo.findOneBy.mockResolvedValue(null);
      mockBooksRepo.count.mockResolvedValue(0);

      const result = await service.getQuota('unknown-user');

      expect(result.tier).toBe(HostingTier.BASIC);
      expect(result.limit).toBe(1);
    });

    it('clamps remaining to 0 when quota is exceeded', async () => {
      mockUsersRepo.findOneBy.mockResolvedValue({ hostingTier: HostingTier.BASIC });
      mockBooksRepo.count.mockResolvedValue(5);

      const result = await service.getQuota('user-1');

      expect(result.remaining).toBe(0);
    });
  });
});
