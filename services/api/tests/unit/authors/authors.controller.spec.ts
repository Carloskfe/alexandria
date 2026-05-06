import { Test, TestingModule } from '@nestjs/testing';
import { AuthorsController } from '../../../src/authors/authors.controller';
import { AuthorsService } from '../../../src/authors/authors.service';
import { JwtAuthGuard } from '../../../src/auth/jwt-auth.guard';
import { HostingTier } from '../../../src/users/user.entity';

const mockAuthorsService = {
  findMyBooks: jest.fn(),
  getAnalytics: jest.fn(),
  getQuota: jest.fn(),
};

const mockUser = { id: 'user-1', userType: 'author', isAdmin: false };

describe('AuthorsController', () => {
  let controller: AuthorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorsController],
      providers: [
        { provide: AuthorsService, useValue: mockAuthorsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthorsController>(AuthorsController);
    jest.clearAllMocks();
  });

  describe('GET /authors/me/books', () => {
    it('returns the books for the authenticated user', async () => {
      const books = [{ id: 'b-1', title: 'Mi Libro' }];
      mockAuthorsService.findMyBooks.mockResolvedValue(books);

      const result = await controller.getMyBooks({ user: mockUser });

      expect(mockAuthorsService.findMyBooks).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(books);
    });

    it('returns empty array when user has no books', async () => {
      mockAuthorsService.findMyBooks.mockResolvedValue([]);
      const result = await controller.getMyBooks({ user: mockUser });
      expect(result).toEqual([]);
    });
  });

  describe('GET /authors/me/analytics', () => {
    it('returns analytics for the authenticated user', async () => {
      const analytics = {
        books: [{ id: 'b-1', title: 'Mi Libro', readers: 10, shareCount: 5, storageMB: 3 }],
        totalReaders: 10,
        totalShares: 5,
        totalStorageMB: 3,
      };
      mockAuthorsService.getAnalytics.mockResolvedValue(analytics);

      const result = await controller.getAnalytics({ user: mockUser });

      expect(mockAuthorsService.getAnalytics).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(analytics);
    });

    it('returns zeroed totals when user has no books', async () => {
      const empty = { books: [], totalReaders: 0, totalShares: 0, totalStorageMB: 0 };
      mockAuthorsService.getAnalytics.mockResolvedValue(empty);

      const result = await controller.getAnalytics({ user: mockUser });

      expect(result.books).toEqual([]);
    });
  });

  describe('GET /authors/me/quota', () => {
    it('returns quota for the authenticated user', async () => {
      const quota = { tier: HostingTier.STARTER, limit: 3, used: 1, remaining: 2 };
      mockAuthorsService.getQuota.mockResolvedValue(quota);

      const result = await controller.getQuota({ user: mockUser });

      expect(mockAuthorsService.getQuota).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(quota);
    });

    it('returns remaining=0 when quota is exhausted', async () => {
      const quota = { tier: HostingTier.BASIC, limit: 1, used: 1, remaining: 0 };
      mockAuthorsService.getQuota.mockResolvedValue(quota);

      const result = await controller.getQuota({ user: mockUser });

      expect(result.remaining).toBe(0);
    });
  });
});
