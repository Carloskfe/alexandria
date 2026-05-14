import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Cause } from './cause.entity';

@Entity('user_cause_preferences')
export class UserCausePreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => Cause, { nullable: true, eager: true })
  cause1: Cause | null;

  @Column({ type: 'uuid', nullable: true })
  cause1Id: string | null;

  @ManyToOne(() => Cause, { nullable: true, eager: true })
  cause2: Cause | null;

  @Column({ type: 'uuid', nullable: true })
  cause2Id: string | null;

  @Column({ type: 'boolean', default: false })
  randomDistribution: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
