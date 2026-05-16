import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  stripePriceId: string;

  @Column({ type: 'varchar' })
  interval: string;

  @Column({ type: 'int' })
  amountCents: number;

  @Column({ type: 'int', default: 1 })
  maxProfiles: number;

  @Column({ type: 'int', default: 1 })
  tokensPerCycle: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
