import {
  ForbiddenException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fragment } from './fragment.entity';
import { CreateFragmentDto } from './dto/create-fragment.dto';
import { UpdateFragmentDto } from './dto/update-fragment.dto';

@Injectable()
export class FragmentsService {
  constructor(
    @InjectRepository(Fragment)
    private readonly repo: Repository<Fragment>,
  ) {}

  create(userId: string, dto: CreateFragmentDto): Promise<Fragment> {
    const fragment = this.repo.create({
      userId,
      bookId: dto.bookId,
      startPhraseIndex: dto.startPhraseIndex,
      endPhraseIndex: dto.endPhraseIndex,
      text: dto.text,
    });
    return this.repo.save(fragment);
  }

  findByUserAndBook(userId: string, bookId: string): Promise<Fragment[]> {
    return this.repo.find({
      where: { userId, bookId },
      order: { startPhraseIndex: 'ASC' },
    });
  }

  findOne(id: string): Promise<Fragment | null> {
    return this.repo.findOneBy({ id });
  }

  async update(id: string, userId: string, dto: UpdateFragmentDto): Promise<Fragment> {
    const fragment = await this.repo.findOneBy({ id });
    if (!fragment || fragment.userId !== userId) throw new ForbiddenException();
    Object.assign(fragment, dto);
    return this.repo.save(fragment);
  }

  async remove(id: string, userId: string): Promise<void> {
    const fragment = await this.repo.findOneBy({ id });
    if (!fragment || fragment.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(fragment);
  }

  async combine(userId: string, fragmentIds: string[]): Promise<Fragment> {
    if (!fragmentIds || fragmentIds.length < 2) {
      throw new UnprocessableEntityException('At least two fragment IDs are required');
    }

    const fragments = await Promise.all(fragmentIds.map((id) => this.repo.findOneBy({ id })));

    for (const f of fragments) {
      if (!f || f.userId !== userId) throw new ForbiddenException();
    }

    const validFragments = fragments as Fragment[];
    const bookIds = new Set(validFragments.map((f) => f.bookId));
    if (bookIds.size > 1) {
      throw new UnprocessableEntityException('All fragments must belong to the same book');
    }

    const sorted = [...validFragments].sort((a, b) => a.startPhraseIndex - b.startPhraseIndex);

    const parts: string[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].startPhraseIndex > sorted[i - 1].endPhraseIndex + 1) {
        parts.push(' … ');
      }
      parts.push(sorted[i].text);
    }

    const combined = this.repo.create({
      userId,
      bookId: sorted[0].bookId,
      startPhraseIndex: sorted[0].startPhraseIndex,
      endPhraseIndex: sorted[sorted.length - 1].endPhraseIndex,
      text: parts.join(''),
    });

    const saved = await this.repo.save(combined);
    await this.repo.remove(validFragments);
    return saved;
  }
}
