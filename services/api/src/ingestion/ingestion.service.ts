import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book, BookCategory } from '../books/book.entity';
import { SyncMap } from '../books/sync-map.entity';
import { CATALOGUE, CatalogueEntry } from './catalogue';
import { GutenbergFetcherService } from './gutenberg-fetcher.service';
import { WikisourceFetcherService } from './wikisource-fetcher.service';
import { PhraseSplitterService } from './phrase-splitter.service';
import { MinioUploaderService } from './minio-uploader.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly gutenbergFetcher: GutenbergFetcherService,
    private readonly wikisourceFetcher: WikisourceFetcherService,
    private readonly phraseSplitter: PhraseSplitterService,
    private readonly minioUploader: MinioUploaderService,
    @InjectRepository(Book) private readonly bookRepo: Repository<Book>,
    @InjectRepository(SyncMap) private readonly syncMapRepo: Repository<SyncMap>,
  ) {}

  async ingestAll(): Promise<void> {
    for (const entry of CATALOGUE) {
      try {
        await this.ingestOne(entry);
        this.logger.log(`Ingested: ${entry.title}`);
      } catch (err: unknown) {
        this.logger.error(
          `Failed: ${entry.title}`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }
  }

  async ingestOne(entry: CatalogueEntry): Promise<Book> {
    const existing = await this.bookRepo.findOneBy({
      title: entry.title,
      author: entry.author,
    });
    if (existing) {
      this.logger.log(`Skipping (already exists): ${entry.title}`);
      return existing;
    }

    const text =
      entry.source === 'gutenberg'
        ? await this.gutenbergFetcher.fetch(entry.gutenbergId!)
        : await this.wikisourceFetcher.fetch(entry.wikisourceTitle!);

    const phrases = this.phraseSplitter.split(text);

    const book = this.bookRepo.create({
      title: entry.title,
      author: entry.author,
      description: entry.description,
      category: BookCategory.CLASSIC,
      isFree: true,
      isPublished: true,
      language: 'es',
      audioFileKey: entry.librivoxAudioUrl,
    });
    const saved = await this.bookRepo.save(book);

    const textKey = `${saved.id}.txt`;
    await this.minioUploader.upload(textKey, text);

    saved.textFileKey = textKey;
    await this.bookRepo.save(saved);

    const syncMap = this.syncMapRepo.create({ bookId: saved.id, phrases });
    await this.syncMapRepo.save(syncMap);

    return saved;
  }
}
