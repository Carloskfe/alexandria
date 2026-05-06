import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, IsNull, Repository } from 'typeorm';
import { Book, BookCategory } from './book.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { HostingTier, HOSTING_TIER_LIMITS, User } from '../users/user.entity';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly repo: Repository<Book>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  findAll(category?: BookCategory, isFree?: boolean, standalone = true): Promise<Book[]> {
    const where: FindOptionsWhere<Book> = { isPublished: true };
    if (category) where.category = category;
    if (isFree !== undefined) where.isFree = isFree;
    // Exclude books that belong to a collection from the general catalog by default.
    // Pass standalone=false to include them (e.g. admin views, collection detail pages).
    if (standalone) where.collection = IsNull();
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<Book> {
    const book = await this.repo.findOneBy({ id });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  findPending(): Promise<Book[]> {
    return this.repo.find({
      where: { isPublished: false },
      relations: ['uploadedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async publish(id: string): Promise<Book> {
    const book = await this.findById(id);
    book.isPublished = true;
    return this.repo.save(book);
  }

  async remove(id: string): Promise<void> {
    const book = await this.findById(id);
    await this.repo.remove(book);
  }

  async checkUploadQuota(userId: string): Promise<void> {
    const user = await this.userRepo.findOneBy({ id: userId });
    const tier = user?.hostingTier ?? HostingTier.BASIC;
    const limit = HOSTING_TIER_LIMITS[tier];
    const count = await this.repo.count({ where: { uploadedById: userId } });
    if (count >= limit) {
      throw new ForbiddenException(
        `Tu plan ${tier} permite hasta ${limit} libro(s). Actualiza tu plan para subir más.`,
      );
    }
  }

  create(
    dto: CreateBookDto,
    textFileKey?: string,
    audioFileKey?: string,
    uploadedById?: string,
    isPublished = false,
    textFileSizeBytes?: number,
    audioFileSizeBytes?: number,
  ): Promise<Book> {
    const book = this.repo.create({
      ...dto,
      language: dto.language ?? 'es',
      textFileKey: textFileKey ?? null,
      audioFileKey: audioFileKey ?? null,
      uploadedById: uploadedById ?? null,
      isPublished,
      textFileSizeBytes: textFileSizeBytes ?? null,
      audioFileSizeBytes: audioFileSizeBytes ?? null,
    });
    return this.repo.save(book);
  }
}
