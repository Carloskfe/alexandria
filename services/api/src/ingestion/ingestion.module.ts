import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { SyncMap } from '../books/sync-map.entity';
import { GutenbergFetcherService } from './gutenberg-fetcher.service';
import { WikisourceFetcherService } from './wikisource-fetcher.service';
import { PhraseSplitterService } from './phrase-splitter.service';
import { MinioUploaderService } from './minio-uploader.service';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book, SyncMap])],
  providers: [
    GutenbergFetcherService,
    WikisourceFetcherService,
    PhraseSplitterService,
    MinioUploaderService,
    IngestionService,
  ],
  exports: [IngestionService],
})
export class IngestionModule {}
