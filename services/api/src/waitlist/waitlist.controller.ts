import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WaitlistService } from './waitlist.service';

class JoinWaitlistDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isAuthor?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  join(@Body() dto: JoinWaitlistDto) {
    return this.waitlistService.join(dto.email, dto.name, dto.isAuthor ?? false, dto.message);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException();
    return this.waitlistService.findAll();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  stats(@Request() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException();
    return this.waitlistService.stats();
  }

  @Post(':id/invite')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async invite(@Param('id') id: string, @Request() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException();
    await this.waitlistService.invite(id);
    return { ok: true };
  }
}
