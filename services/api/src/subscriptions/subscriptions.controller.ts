import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  getStatus(@Request() req: any) {
    return this.subscriptionsService.getSubscriptionStatus(req.user.id);
  }

  @Post('checkout')
  @HttpCode(200)
  createCheckout(@Request() req: any, @Body() dto: CreateCheckoutDto) {
    return this.subscriptionsService.createCheckoutSession(req.user.id, dto.planId);
  }

  @Post('portal')
  @HttpCode(200)
  createPortal(@Request() req: any) {
    return this.subscriptionsService.createPortalSession(req.user.id);
  }

  @Post('cancel')
  @HttpCode(200)
  cancel(@Request() req: any) {
    return this.subscriptionsService.cancelSubscription(req.user.id);
  }

  @Post('resume')
  @HttpCode(200)
  resume(@Request() req: any) {
    return this.subscriptionsService.resumeSubscription(req.user.id);
  }

  @Post('sync')
  @HttpCode(200)
  sync(@Request() req: any) {
    return this.subscriptionsService.syncSubscription(req.user.id);
  }
}
