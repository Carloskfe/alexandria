import {
  BadRequestException,
  Controller,
  Headers,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import Stripe from 'stripe';
import { WebhooksService } from './webhooks.service';

@SkipThrottle({ global: true })
@Controller('webhooks')
export class WebhooksController {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow('STRIPE_SECRET_KEY'));
    this.webhookSecret = this.config.getOrThrow('STRIPE_WEBHOOK_SECRET');
  }

  @Post('stripe')
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    let event: any;

    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody!, sig, this.webhookSecret);
    } catch (err: any) {
      this.logger.warn(`Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook error: ${err.message}`);
    }

    await this.webhooksService.handleEvent(event);
    return { received: true };
  }
}
