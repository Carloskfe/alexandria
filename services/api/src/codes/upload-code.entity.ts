import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('upload_codes')
export class UploadCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({ nullable: true, type: 'varchar' })
  notes: string | null;

  @Column({ type: 'uuid' })
  createdById: string;

  @Column({ nullable: true, type: 'uuid' })
  usedBy: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  usedAt: Date | null;

  @Column({ nullable: true, type: 'timestamptz' })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
