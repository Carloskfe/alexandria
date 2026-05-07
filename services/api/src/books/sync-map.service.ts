import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncMap, SyncPhrase, SyncSource } from './sync-map.entity';
import { BooksService } from './books.service';

@Injectable()
export class SyncMapService {
  constructor(
    @InjectRepository(SyncMap) private readonly repo: Repository<SyncMap>,
    private readonly booksService: BooksService,
  ) {}

  async findByBook(bookId: string): Promise<SyncMap | null> {
    return this.repo.findOneBy({ bookId });
  }

  async upsert(
    bookId: string,
    phrases: SyncPhrase[],
    syncSource: SyncSource = 'auto',
  ): Promise<SyncMap> {
    await this.booksService.findById(bookId); // throws 404 if book missing

    const existing = await this.repo.findOneBy({ bookId });
    if (existing) {
      existing.phrases = phrases;
      existing.syncSource = syncSource;
      existing.updatedAt = new Date();
      return this.repo.save(existing);
    }

    const record = this.repo.create({ bookId, phrases, syncSource });
    return this.repo.save(record);
  }
}
