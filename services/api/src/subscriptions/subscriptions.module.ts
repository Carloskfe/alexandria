import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Plan } from './plan.entity';
import { PlansService } from './plans.service';
import { Subscription } from './subscription.entity';
import { SubscriptionGuard } from './subscription.guard';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Plan]), UsersModule],
  providers: [SubscriptionsService, PlansService, WebhooksService, SubscriptionGuard],
  controllers: [SubscriptionsController, WebhooksController],
  exports: [SubscriptionsService, SubscriptionGuard],
})
export class SubscriptionsModule {}
