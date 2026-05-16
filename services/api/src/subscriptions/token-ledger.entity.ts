import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type TokenType = 'paid' | 'promotional' | 'courtesy';
export type TokenStatus = 'active' | 'redeemed' | 'expired';

@Entity('token_ledger')
export class TokenLedger {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid', nullable: true })
  subscriptionId: string | null;

  @Column({ type: 'varchar', default: 'paid' })
  type: TokenType;

  @Column({ type: 'varchar', default: 'active' })
  status: TokenStatus;

  @Column({ type: 'timestamptz' })
  issuedAt: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  redeemedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  bookId: string | null;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
