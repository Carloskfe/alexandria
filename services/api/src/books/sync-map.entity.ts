import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Book } from './book.entity';

export interface SyncPhrase {
  index: number;
  text: string;
  startTime: number;
  endTime: number;
  type?: 'text' | 'heading' | 'paragraph-break';
  /** True when the phrase could not be matched in the audio (no corresponding
   *  content found — e.g. appendix, glossary, footnotes not read aloud).
   *  The reader skips these phrases during playback sync. */
  exception?: boolean;
}

export type SyncSource = 'auto' | 'srt' | 'vtt' | 'manual' | 'whisper';

@Entity('sync_maps')
export class SyncMap {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookId: string;

  @ManyToOne(() => Book, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bookId' })
  book: Book;

  @Column({ type: 'jsonb', default: [] })
  phrases: SyncPhrase[];

  @Column({ type: 'varchar', default: 'auto' })
  syncSource: SyncSource;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
