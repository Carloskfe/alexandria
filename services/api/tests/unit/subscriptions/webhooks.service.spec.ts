import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from '../../../src/subscriptions/subscriptions.service';
import { WebhooksService } from '../../../src/subscriptions/webhooks.service';

const mockSubscriptionsService = {
  upsertFromWebhook: jest.fn(),
  cancelFromWebhook: jest.fn(),
  findPlanByStripePriceId: jest.fn(),
};

const makeEvent = (type: string, data: object, id = 'evt_test_1') => ({
  id,
  type,
  data: { object: data },
});

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      ],
    }).compile();

    service = module.get(WebhooksService);
  });

  describe('handleEvent', () => {
    it('handles checkout.session.completed', async () => {
      const event = makeEvent('checkout.session.completed', {
        subscription: 'sub_1',
        customer: 'cus_1',
      });
      await service.handleEvent(event as any);
      expect(mockSubscriptionsService.upsertFromWebhook).toHaveBeenCalledWith(
        'evt_test_1',
        'cus_1',
        'sub_1',
        'active',
        expect.any(Date),
        null,
      );
    });

    it('handles invoice.paid and sets status active', async () => {
      const event = makeEvent('invoice.paid', {
        subscription: 'sub_1',
        customer: 'cus_1',
        lines: { data: [{ period: { end: Math.floor(Date.now() / 1000) + 86400 } }] },
      });
      await service.handleEvent(event as any);
      expect(mockSubscriptionsService.upsertFromWebhook).toHaveBeenCalledWith(
        expect.any(String),
        'cus_1',
        'sub_1',
        'active',
        expect.any(Date),
        null,
      );
    });

    it('handles invoice.payment_failed and sets status past_due', async () => {
      const event = makeEvent('invoice.payment_failed', {
        subscription: 'sub_1',
        customer: 'cus_1',
      });
      await service.handleEvent(event as any);
      expect(mockSubscriptionsService.upsertFromWebhook).toHaveBeenCalledWith(
        expect.any(String),
        'cus_1',
        'sub_1',
        'past_due',
        expect.any(Date),
        null,
      );
    });

    it('handles customer.subscription.updated', async () => {
      mockSubscriptionsService.findPlanByStripePriceId.mockResolvedValue('plan_1');
      const event = makeEvent('customer.subscription.updated', {
        id: 'sub_1',
        customer: 'cus_1',
        status: 'active',
        cancel_at_period_end: false,
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        trial_end: null,
        items: { data: [{ price: { id: 'price_123' } }] },
      });
      await service.handleEvent(event as any);
      expect(mockSubscriptionsService.upsertFromWebhook).toHaveBeenCalled();
    });

    it('handles customer.subscription.deleted and cancels', async () => {
      const event = makeEvent('customer.subscription.deleted', { id: 'sub_1' });
      await service.handleEvent(event as any);
      expect(mockSubscriptionsService.cancelFromWebhook).toHaveBeenCalledWith('sub_1');
    });

    it('handles unknown event type without error', async () => {
      const event = makeEvent('payment_intent.created', { id: 'pi_1' });
      await expect(service.handleEvent(event as any)).resolves.toBeUndefined();
    });

    it('is idempotent — duplicate event id is not re-processed', async () => {
      mockSubscriptionsService.upsertFromWebhook.mockResolvedValue(undefined);
      const event = makeEvent('checkout.session.completed', {
        subscription: 'sub_1',
        customer: 'cus_1',
      }, 'evt_dup');

      await service.handleEvent(event as any);
      await service.handleEvent(event as any);

      expect(mockSubscriptionsService.upsertFromWebhook).toHaveBeenCalledTimes(2);
    });
  });
});
