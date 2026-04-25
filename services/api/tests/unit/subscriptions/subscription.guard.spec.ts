import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Subscription } from '../../../src/subscriptions/subscription.entity';
import { SubscriptionGuard } from '../../../src/subscriptions/subscription.guard';

const mockSubRepo = { findOneBy: jest.fn() };

const makeContext = (userId?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user: userId ? { id: userId } : undefined }),
    }),
  } as unknown as ExecutionContext);

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        { provide: getRepositoryToken(Subscription), useValue: mockSubRepo },
      ],
    }).compile();

    guard = module.get(SubscriptionGuard);
  });

  it('allows active subscriber', async () => {
    mockSubRepo.findOneBy.mockResolvedValue({ status: 'active' });
    await expect(guard.canActivate(makeContext('u1'))).resolves.toBe(true);
  });

  it('allows trialing subscriber', async () => {
    mockSubRepo.findOneBy.mockResolvedValue({ status: 'trialing' });
    await expect(guard.canActivate(makeContext('u1'))).resolves.toBe(true);
  });

  it('allows canceling subscriber', async () => {
    mockSubRepo.findOneBy.mockResolvedValue({ status: 'canceling' });
    await expect(guard.canActivate(makeContext('u1'))).resolves.toBe(true);
  });

  it('throws 403 subscription_required for non-subscriber', async () => {
    mockSubRepo.findOneBy.mockResolvedValue(null);
    await expect(guard.canActivate(makeContext('u1'))).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(makeContext('u1'))).rejects.toMatchObject({
      response: { error: 'subscription_required' },
    });
  });

  it('throws 403 subscription_required for canceled subscriber', async () => {
    mockSubRepo.findOneBy.mockResolvedValue({ status: 'canceled' });
    await expect(guard.canActivate(makeContext('u1'))).rejects.toThrow(ForbiddenException);
  });

  it('throws 403 payment_required with billingPortalHint for past_due subscriber', async () => {
    mockSubRepo.findOneBy.mockResolvedValue({ status: 'past_due' });
    await expect(guard.canActivate(makeContext('u1'))).rejects.toMatchObject({
      response: { error: 'payment_required', billingPortalHint: true },
    });
  });

  it('throws 403 for unauthenticated request (no user on req)', async () => {
    mockSubRepo.findOneBy.mockResolvedValue(null);
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(ForbiddenException);
  });
});
