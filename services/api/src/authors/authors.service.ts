import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { ReadingProgress } from '../books/reading-progress.entity';
import { HostingTier, HOSTING_TIER_LIMITS, User } from '../users/user.entity';

export interface BookAnalytics {
  id: string;
  title: string;
  isPublished: boolean;
  readers: number;
  shareCount: number;
  storageMB: number;
}

export interface AnalyticsResult {
  books: BookAnalytics[];
  totalReaders: number;
  totalShares: number;
  totalStorageMB: number;
}

export interface QuotaResult {
  tier: HostingTier;
  limit: number;
  used: number;
  remaining: number;
}

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Book) private readonly booksRepo: Repository<Book>,
    @InjectRepository(ReadingProgress) private readonly progressRepo: Repository<ReadingProgress>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findMyBooks(userId: string): Promise<Book[]> {
    return this.booksRepo.find({
      where: { uploadedById: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAnalytics(userId: string): Promise<AnalyticsResult> {
    const books = await this.booksRepo.find({ where: { uploadedById: userId } });

    const bookAnalytics = await Promise.all(
      books.map(async (book) => {
        const readers = await this.progressRepo.count({ where: { bookId: book.id } });
        const storageMB =
          Math.round(
            (((book.textFileSizeBytes ?? 0) + (book.audioFileSizeBytes ?? 0)) / (1024 * 1024)) * 100,
          ) / 100;
        return {
          id: book.id,
          title: book.title,
          isPublished: book.isPublished,
          readers,
          shareCount: book.shareCount ?? 0,
          storageMB,
        };
      }),
    );

    return {
      books: bookAnalytics,
      totalReaders: bookAnalytics.reduce((sum, b) => sum + b.readers, 0),
      totalShares: bookAnalytics.reduce((sum, b) => sum + b.shareCount, 0),
      totalStorageMB:
        Math.round(bookAnalytics.reduce((sum, b) => sum + b.storageMB, 0) * 100) / 100,
    };
  }

  async getQuota(userId: string): Promise<QuotaResult> {
    const user = await this.usersRepo.findOneBy({ id: userId });
    const tier = user?.hostingTier ?? HostingTier.BASIC;
    const limit = HOSTING_TIER_LIMITS[tier];
    const used = await this.booksRepo.count({ where: { uploadedById: userId } });
    return {
      tier,
      limit,
      used,
      remaining: Math.max(0, limit - used),
    };
  }
}
