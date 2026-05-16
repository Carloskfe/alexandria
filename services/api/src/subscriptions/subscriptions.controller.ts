import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EmailConfirmedGuard } from '../auth/email-confirmed.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.plansService.findAll();
  }

  @Get('token-packages')
  getTokenPackages() {
    return this.plansService.findActiveTokenPackages();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getStatus(@Request() req: any) {
    return this.subscriptionsService.getSubscriptionStatus(req.user.id);
  }

  @Post('checkout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, EmailConfirmedGuard)
  createCheckout(@Request() req: any, @Body() dto: CreateCheckoutDto) {
    return this.subscriptionsService.createCheckoutSession(req.user.id, dto.planId);
  }

  @Post('tokens/purchase')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, EmailConfirmedGuard)
  purchaseTokenPackage(@Request() req: any, @Body() dto: { packageId: string }) {
    return this.subscriptionsService.createTokenPackageSession(req.user.id, dto.packageId);
  }

  @Post('portal')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, EmailConfirmedGuard)
  createPortal(@Request() req: any) {
    return this.subscriptionsService.createPortalSession(req.user.id);
  }

  @Post('cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, EmailConfirmedGuard)
  cancel(@Request() req: any) {
    return this.subscriptionsService.cancelSubscription(req.user.id);
  }

  @Post('resume')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, EmailConfirmedGuard)
  resume(@Request() req: any) {
    return this.subscriptionsService.resumeSubscription(req.user.id);
  }

  @Post('sync')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  sync(@Request() req: any) {
    return this.subscriptionsService.syncSubscription(req.user.id);
  }

  @Post('books/:bookId/purchase')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, EmailConfirmedGuard)
  purchaseBook(@Request() req: any, @Param('bookId') bookId: string) {
    return this.subscriptionsService.createPurchaseSession(req.user.id, bookId);
  }

  @Post('books/:bookId/redeem')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, EmailConfirmedGuard)
  redeemBook(@Request() req: any, @Param('bookId') bookId: string) {
    return this.subscriptionsService.redeemToken(req.user.id, bookId);
  }
}
