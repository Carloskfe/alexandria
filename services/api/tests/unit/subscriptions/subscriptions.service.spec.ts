import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../src/users/user.entity';
import { UsersService } from '../../../src/users/users.service';
import { PlansService } from '../../../src/subscriptions/plans.service';
import { Subscription } from '../../../src/subscriptions/subscription.entity';
import { SubscriptionsService } from '../../../src/subscriptions/subscriptions.service';

const mockStripe = {
  customers: { create: jest.fn() },
  checkout: { sessions: { create: jest.fn() } },
  billingPortal: { sessions: { create: jest.fn() } },
  subscriptions: {
    update: jest.fn(),
    retrieve: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripe);
});

const mockUserRepo = {
  update: jest.fn(),
  findOneBy: jest.fn(),
};

const mockSubRepo = {
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  upsert: jest.fn(),
};

const mockUsersService = {
  findById: jest.fn(),
};

const mockPlansService = {
  findById: jest.fn(),
  findAll: jest.fn(),
};

const mockConfig = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock';
    throw new Error(`Missing config: ${key}`);
  }),
  get: jest.fn((key: string, fallback?: string) => fallback ?? ''),
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: UsersService, useValue: mockUsersService },
        { provide: PlansService, useValue: mockPlansService },
        { provide: getRepositoryToken(Subscription), useValue: mockSubRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get(SubscriptionsService);
  });

  describe('getOrCreateStripeCustomer', () => {
    it('returns existing stripeCustomerId without creating new customer', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_existing' });
      const result = await service.getOrCreateStripeCustomer('u1');
      expect(result).toBe('cus_existing');
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('creates Stripe customer and saves id when user has none', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'u1', email: 'a@b.com', stripeCustomerId: null });
      mockStripe.customers.create.mockResolvedValue({ id: 'cus_new' });
      mockUserRepo.update.mockResolvedValue(undefined);

      const result = await service.getOrCreateStripeCustomer('u1');
      expect(result).toBe('cus_new');
      expect(mockStripe.customers.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com' }),
      );
      expect(mockUserRepo.update).toHaveBeenCalledWith('u1', { stripeCustomerId: 'cus_new' });
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUsersService.findById.mockResolvedValue(null);
      await expect(service.getOrCreateStripeCustomer('ghost')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCheckoutSession', () => {
    it('returns checkout url for valid plan', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_1' });
      mockPlansService.findById.mockResolvedValue({ id: 'plan1', stripePriceId: 'price_123' });
      mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://checkout.stripe.com/xxx' });

      const result = await service.createCheckoutSession('u1', 'plan1');
      expect(result).toEqual({ url: 'https://checkout.stripe.com/xxx' });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_data: { trial_period_days: 14 } }),
      );
    });

    it('throws BadRequestException for invalid planId', async () => {
      mockPlansService.findById.mockResolvedValue(null);
      await expect(service.createCheckoutSession('u1', 'bad-plan')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelSubscription', () => {
    it('sets cancel_at_period_end and updates status to canceling', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({
        id: 'sub1',
        userId: 'u1',
        stripeSubscriptionId: 'sub_stripe_1',
      });
      mockStripe.subscriptions.update.mockResolvedValue({
        cancel_at: Math.floor(Date.now() / 1000) + 86400,
      });
      mockSubRepo.update.mockResolvedValue(undefined);

      const result = await service.cancelSubscription('u1');
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_stripe_1', {
        cancel_at_period_end: true,
      });
      expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', { status: 'canceling' });
      expect(result).toHaveProperty('cancelAt');
    });

    it('throws NotFoundException when user has no subscription', async () => {
      mockSubRepo.findOneBy.mockResolvedValue(null);
      await expect(service.cancelSubscription('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resumeSubscription', () => {
    it('sets cancel_at_period_end to false and reverts status to active', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({
        id: 'sub1',
        userId: 'u1',
        stripeSubscriptionId: 'sub_stripe_1',
      });
      mockStripe.subscriptions.update.mockResolvedValue({});
      mockSubRepo.update.mockResolvedValue(undefined);
      mockSubRepo.findOne.mockResolvedValue({ status: 'active', planId: null, currentPeriodEnd: null, trialEnd: null });

      await service.resumeSubscription('u1');
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_stripe_1', {
        cancel_at_period_end: false,
      });
      expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', { status: 'active' });
    });

    it('throws NotFoundException when user has no subscription', async () => {
      mockSubRepo.findOneBy.mockResolvedValue(null);
      await expect(service.resumeSubscription('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPortalSession', () => {
    it('returns portal url for user with stripeCustomerId', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'u1', stripeCustomerId: 'cus_1' });
      mockStripe.billingPortal.sessions.create.mockResolvedValue({ url: 'https://billing.stripe.com/xxx' });
      const result = await service.createPortalSession('u1');
      expect(result).toEqual({ url: 'https://billing.stripe.com/xxx' });
    });

    it('throws NotFoundException when user has no stripeCustomerId', async () => {
      mockUsersService.findById.mockResolvedValue({ id: 'u1', stripeCustomerId: null });
      await expect(service.createPortalSession('u1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns none when no subscription record', async () => {
      mockSubRepo.findOne.mockResolvedValue(null);
      const result = await service.getSubscriptionStatus('u1');
      expect(result).toEqual({ status: 'none' });
    });

    it('returns subscription data when record exists', async () => {
      mockSubRepo.findOne.mockResolvedValue({ status: 'active', planId: 'p1', currentPeriodEnd: new Date(), trialEnd: null });
      const result = await service.getSubscriptionStatus('u1');
      expect(result.status).toBe('active');
    });
  });

  describe('upsertFromWebhook', () => {
    it('skips duplicate event (same stripeEventId)', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({ id: 'sub1', stripeEventId: 'evt_dup' });
      await service.upsertFromWebhook('evt_dup', 'cus_1', 'sub_1', 'active', new Date(), null);
      expect(mockSubRepo.upsert).not.toHaveBeenCalled();
    });

    it('skips upsert when no user found for customerId', async () => {
      mockSubRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.findOneBy.mockResolvedValue(null);
      await service.upsertFromWebhook('evt_1', 'cus_ghost', 'sub_1', 'active', new Date(), null);
      expect(mockSubRepo.upsert).not.toHaveBeenCalled();
    });

    it('upserts subscription for new event', async () => {
      mockSubRepo.findOneBy.mockResolvedValue(null);
      mockUserRepo.findOneBy.mockResolvedValue({ id: 'u1' });
      mockSubRepo.upsert.mockResolvedValue(undefined);
      await service.upsertFromWebhook('evt_new', 'cus_1', 'sub_1', 'active', new Date(), null, 'plan_1');
      expect(mockSubRepo.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ stripeEventId: 'evt_new', status: 'active', planId: 'plan_1' }),
        expect.anything(),
      );
    });
  });

  describe('cancelFromWebhook', () => {
    it('updates subscription status to canceled', async () => {
      mockSubRepo.update.mockResolvedValue(undefined);
      await service.cancelFromWebhook('sub_1');
      expect(mockSubRepo.update).toHaveBeenCalledWith({ stripeSubscriptionId: 'sub_1' }, { status: 'canceled' });
    });
  });

  describe('findPlanByStripePriceId', () => {
    it('returns plan id when price matches', async () => {
      mockPlansService.findAll.mockResolvedValue([{ id: 'plan_1', stripePriceId: 'price_123' }]);
      const result = await service.findPlanByStripePriceId('price_123');
      expect(result).toBe('plan_1');
    });

    it('returns null when price does not match any plan', async () => {
      mockPlansService.findAll.mockResolvedValue([{ id: 'plan_1', stripePriceId: 'price_other' }]);
      const result = await service.findPlanByStripePriceId('price_unknown');
      expect(result).toBeNull();
    });
  });

  describe('syncSubscription', () => {
    it('returns none status when no subscription record exists', async () => {
      mockSubRepo.findOneBy.mockResolvedValue(null);
      const result = await service.syncSubscription('u1');
      expect(result).toEqual({ status: 'none' });
    });

    it('updates local record from Stripe and returns updated status', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({
        id: 'sub1',
        userId: 'u1',
        stripeSubscriptionId: 'sub_stripe_1',
      });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        cancel_at_period_end: false,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        trial_end: null,
      });
      mockSubRepo.update.mockResolvedValue(undefined);
      mockSubRepo.findOne.mockResolvedValue({ status: 'active', planId: null, currentPeriodEnd: new Date(), trialEnd: null });

      await service.syncSubscription('u1');
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_stripe_1');
      expect(mockSubRepo.update).toHaveBeenCalled();
    });

    it('maps trialing status correctly', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({ id: 'sub1', userId: 'u1', stripeSubscriptionId: 'sub_1' });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        status: 'trialing',
        cancel_at_period_end: false,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        trial_end: Math.floor(Date.now() / 1000) + 86400,
      });
      mockSubRepo.update.mockResolvedValue(undefined);
      mockSubRepo.findOne.mockResolvedValue({ status: 'trialing', planId: null, currentPeriodEnd: new Date(), trialEnd: new Date() });

      const result = await service.syncSubscription('u1');
      expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', expect.objectContaining({ status: 'trialing' }));
    });

    it('maps past_due status correctly', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({ id: 'sub1', userId: 'u1', stripeSubscriptionId: 'sub_1' });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        status: 'past_due',
        cancel_at_period_end: false,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        trial_end: null,
      });
      mockSubRepo.update.mockResolvedValue(undefined);
      mockSubRepo.findOne.mockResolvedValue({ status: 'past_due', planId: null, currentPeriodEnd: new Date(), trialEnd: null });

      await service.syncSubscription('u1');
      expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', expect.objectContaining({ status: 'past_due' }));
    });

    it('maps canceled status correctly', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({ id: 'sub1', userId: 'u1', stripeSubscriptionId: 'sub_1' });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        status: 'canceled',
        cancel_at_period_end: false,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        trial_end: null,
      });
      mockSubRepo.update.mockResolvedValue(undefined);
      mockSubRepo.findOne.mockResolvedValue({ status: 'canceled', planId: null, currentPeriodEnd: new Date(), trialEnd: null });

      await service.syncSubscription('u1');
      expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', expect.objectContaining({ status: 'canceled' }));
    });

    it('maps unknown status to none', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({ id: 'sub1', userId: 'u1', stripeSubscriptionId: 'sub_1' });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        status: 'unpaid',
        cancel_at_period_end: false,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        trial_end: null,
      });
      mockSubRepo.update.mockResolvedValue(undefined);
      mockSubRepo.findOne.mockResolvedValue({ status: 'none', planId: null, currentPeriodEnd: new Date(), trialEnd: null });

      await service.syncSubscription('u1');
      expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', expect.objectContaining({ status: 'none' }));
    });

    it('maps canceling when cancel_at_period_end is true', async () => {
      mockSubRepo.findOneBy.mockResolvedValue({ id: 'sub1', userId: 'u1', stripeSubscriptionId: 'sub_1' });
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        status: 'active',
        cancel_at_period_end: true,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        trial_end: null,
      });
      mockSubRepo.update.mockResolvedValue(undefined);
      mockSubRepo.findOne.mockResolvedValue({ status: 'canceling', planId: null, currentPeriodEnd: new Date(), trialEnd: null });

      await service.syncSubscription('u1');
      expect(mockSubRepo.update).toHaveBeenCalledWith('sub1', expect.objectContaining({ status: 'canceling' }));
    });
  });
});
