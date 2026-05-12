/**
 * Generate a phrase-level sync map from a Whisper transcription file.
 *
 * Usage:
 *   docker compose exec api npx ts-node -r tsconfig-paths/register \
 *     src/ingestion/seed-sync-whisper.ts \
 *     --book "Lazarillo de Tormes" \
 *     --transcript /path/to/lazarillo.vtt
 *
 * The transcript can be a .vtt or .json file produced by Whisper:
 *   whisper audio.mp3 --language es --word_timestamps True --output_format vtt
 *   whisper audio.mp3 --language es --output_format json
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Book } from '../books/book.entity';
import { SyncMap } from '../books/sync-map.entity';
import { User } from '../users/user.entity';
import { StorageModule } from '../storage/storage.module';
import { WhisperSyncService } from './whisper-sync.service';
import { PhraseSplitterService } from './phrase-splitter.service';

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
        entities: [Book, SyncMap, User],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([Book, SyncMap]),
    StorageModule,
  ],
  providers: [WhisperSyncService, PhraseSplitterService],
})
class WhisperSyncModule {}

function parseArgs(): { book: string; transcript: string } {
  const args = process.argv.slice(2);
  const get = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };
  const book = get('--book');
  const transcript = get('--transcript');
  if (!book || !transcript) {
    console.error('Usage: seed-sync-whisper.ts --book "Title" --transcript path/to/file.vtt');
    process.exit(1);
  }
  return { book, transcript };
}

async function bootstrap() {
  const { book, transcript } = parseArgs();

  const app = await NestFactory.createApplicationContext(WhisperSyncModule, {
    logger: ['log', 'error', 'warn'],
  });

  const service = app.get(WhisperSyncService);
  const result = await service.syncBook(book, transcript);

  console.log('\n── Alignment summary ──────────────────────────────');
  console.log(`Book:            ${result.title}`);
  console.log(`Phrases aligned: ${result.stats.aligned} / ${result.stats.total}`);
  console.log(`Exceptions:      ${result.stats.exceptions} (not found in audio)`);
  console.log(`Avg confidence:  ${(result.stats.avgConfidence * 100).toFixed(1)}%`);
  console.log(`Low-confidence:  ${result.stats.lowConfidence} phrases`);
  if (result.stats.exceptionPhrases.length > 0) {
    console.log('\nException phrases (content not in audio — skipped):');
    for (const p of result.stats.exceptionPhrases.slice(0, 20)) {
      console.log(`  [${p.index}] "${p.text}"`);
    }
    if (result.stats.exceptionPhrases.length > 20) {
      console.log(`  ... and ${result.stats.exceptionPhrases.length - 20} more`);
    }
  }
  if (result.stats.lowConfidencePhrases.length > 0) {
    console.log('\nLow-confidence phrases to spot-check:');
    for (const p of result.stats.lowConfidencePhrases) {
      console.log(`  [${p.index}] ${(p.confidence * 100).toFixed(0)}% — "${p.text}"`);
    }
  }
  console.log('───────────────────────────────────────────────────\n');

  await app.close();
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
