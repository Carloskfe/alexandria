import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../books/book.entity';
import { Subscription } from './subscription.entity';

const ACTIVE_STATUSES = ['active', 'trialing', 'canceling'];

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const bookId = req.params?.id as string | undefined;
    if (bookId) {
      const book = await this.bookRepo.findOneBy({ id: bookId });
      if (book?.isFree) return true;
    }

    const userId = req.user?.id;
    const sub = userId ? await this.subRepo.findOneBy({ userId }) : null;

    if (sub?.status === 'past_due') {
      throw new ForbiddenException({ error: 'payment_required', billingPortalHint: true });
    }

    if (!sub || !ACTIVE_STATUSES.includes(sub.status)) {
      throw new ForbiddenException({ error: 'subscription_required' });
    }

    return true;
  }
}
