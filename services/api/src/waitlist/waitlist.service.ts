import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WaitlistEntry } from './waitlist-entry.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(WaitlistEntry) private readonly repo: Repository<WaitlistEntry>,
    private readonly emailService: EmailService,
  ) {}

  async join(email: string, name?: string, isAuthor = false, message?: string): Promise<WaitlistEntry> {
    const existing = await this.repo.findOneBy({ email: email.toLowerCase() });
    if (existing) throw new ConflictException('Este correo ya está en la lista de espera');

    const entry = this.repo.create({
      email: email.toLowerCase(),
      name: name ?? null,
      isAuthor,
      message: message ?? null,
    });
    const saved = await this.repo.save(entry);

    // Send confirmation — fire and forget, never blocks the response
    void this.emailService.sendWaitlistConfirmation(saved.email, saved.name ?? 'lector/a');

    return saved;
  }

  findAll(): Promise<WaitlistEntry[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async invite(id: string): Promise<void> {
    const entry = await this.repo.findOneBy({ id });
    if (!entry) throw new NotFoundException('Entrada no encontrada');

    await this.emailService.sendWaitlistInvite(entry.email, entry.name ?? 'lector/a');
    entry.invitedAt = new Date();
    await this.repo.save(entry);
  }

  async stats(): Promise<{ total: number; authors: number; invited: number }> {
    const [total, authors, invited] = await Promise.all([
      this.repo.count(),
      this.repo.countBy({ isAuthor: true }),
      this.repo.createQueryBuilder('e').where('e.invitedAt IS NOT NULL').getCount(),
    ]);
    return { total, authors, invited };
  }
}
