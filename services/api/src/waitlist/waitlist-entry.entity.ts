import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('waitlist_entries')
export class WaitlistEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true, type: 'varchar' })
  name: string | null;

  @Column({ default: false })
  isAuthor: boolean;

  @Column({ nullable: true, type: 'text' })
  message: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  invitedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
