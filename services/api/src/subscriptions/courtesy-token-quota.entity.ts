import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export type CourtesyRole = 'author' | 'publisher' | 'narrator';

@Entity('courtesy_token_quotas')
export class CourtesyTokenQuota {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  bookId: string;

  @Column({ type: 'uuid' })
  creatorId: string;

  @Column({ type: 'varchar' })
  role: CourtesyRole;

  @Column({ type: 'int', default: 0 })
  maxQuota: number;

  @Column({ type: 'int', default: 0 })
  issuedCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
