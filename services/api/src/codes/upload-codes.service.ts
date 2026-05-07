import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { UploadCode } from './upload-code.entity';

// Unambiguous alphabet: no 0/O/1/I to avoid visual confusion when reading codes aloud
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class UploadCodesService {
  constructor(
    @InjectRepository(UploadCode) private readonly repo: Repository<UploadCode>,
  ) {}

  /** Generate one or more codes. Each code costs one future upload slot. */
  async generate(
    count: number,
    createdById: string,
    notes?: string,
    expiresAt?: Date,
  ): Promise<UploadCode[]> {
    const created: UploadCode[] = [];
    for (let i = 0; i < count; i++) {
      const code = this.generateCode();
      const entity = this.repo.create({ code, createdById, notes: notes ?? null, expiresAt: expiresAt ?? null });
      created.push(await this.repo.save(entity));
    }
    return created;
  }

  /** Returns the code entity if valid; throws BadRequestException otherwise. */
  async validate(code: string): Promise<UploadCode> {
    const normalized = code.trim().toUpperCase();
    const entity = await this.repo.findOneBy({ code: normalized, usedBy: IsNull() });

    if (!entity) {
      throw new BadRequestException('Código inválido o ya utilizado');
    }
    if (entity.expiresAt && entity.expiresAt < new Date()) {
      throw new BadRequestException('Este código ha expirado');
    }
    return entity;
  }

  /** Mark the code as consumed by the given user. Call only after the book is saved. */
  async consume(code: string, userId: string): Promise<void> {
    const normalized = code.trim().toUpperCase();
    await this.repo.update(
      { code: normalized, usedBy: IsNull() },
      { usedBy: userId, usedAt: new Date() },
    );
  }

  /** List all codes (admin view), newest first. */
  findAll(): Promise<UploadCode[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  private generateCode(): string {
    // 8 random characters from ALPHABET, formatted as NOETIA-XXXX-XXXX
    const bytes = randomBytes(8);
    const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]);
    return `NOETIA-${chars.slice(0, 4).join('')}-${chars.slice(4).join('')}`;
  }
}
