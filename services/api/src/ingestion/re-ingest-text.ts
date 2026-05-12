/**
 * Re-fetch and overwrite stored book text for one or more catalogue books.
 * Use this after fixing fetcher logic (Wikisource nav stripping, Gutenberg
 * narrative boundaries) to update MinIO without a full re-ingest.
 *
 * Usage:
 *   node dist/ingestion/re-ingest-text.js --book "La Odisea"
 *   node dist/ingestion/re-ingest-text.js --all-wikisource
 *   node dist/ingestion/re-ingest-text.js --all
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { SyncMap } from '../books/sync-map.entity';
import { ReadingProgress } from '../books/reading-progress.entity';
import { User } from '../users/user.entity';
import { IngestionModule } from './ingestion.module';
import { IngestionService } from './ingestion.service';
import { CATALOGUE } from './catalogue';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host:     config.get('DB_HOST', 'localhost'),
        port:     config.get<number>('DB_PORT', 5432),
        database: config.get('DB_NAME', 'noetia'),
        username: config.get('DB_USER', 'noetia'),
        password: config.get('DB_PASS', 'changeme'),
        entities: [Book, SyncMap, ReadingProgress, User],
        synchronize: false,
      }),
    }),
    IngestionModule,
  ],
})
class ReIngestModule {}

function parseArgs(): { book?: string; allWikisource?: boolean; all?: boolean } {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  return {
    book:          get('--book'),
    allWikisource: args.includes('--all-wikisource'),
    all:           args.includes('--all'),
  };
}

async function bootstrap() {
  const { book, allWikisource, all } = parseArgs();

  if (!book && !allWikisource && !all) {
    console.error('Usage: re-ingest-text.js --book "Title" | --all-wikisource | --all');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(ReIngestModule, {
    logger: ['log', 'error', 'warn'],
  });
  const service = app.get(IngestionService);

  let titles: string[];
  if (book) {
    titles = [book];
  } else if (allWikisource) {
    titles = CATALOGUE.filter((e) => e.source === 'wikisource').map((e) => e.title);
  } else {
    titles = CATALOGUE.map((e) => e.title);
  }

  for (const title of titles) {
    try {
      await service.reIngestText(title);
      console.log(`  ✓  ${title}`);
    } catch (err: unknown) {
      console.error(`  ✗  ${title}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
