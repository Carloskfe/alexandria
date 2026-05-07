import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadCodesService } from './upload-codes.service';

class GenerateCodesDto {
  count: number = 1;
  notes?: string;
  expiresAt?: string; // ISO date string
}

@Controller('admin/codes')
@UseGuards(JwtAuthGuard)
export class CodesController {
  constructor(private readonly codesService: UploadCodesService) {}

  @Post()
  @HttpCode(201)
  async generate(@Request() req: any, @Body() dto: GenerateCodesDto) {
    if (!req.user.isAdmin) throw new ForbiddenException();
    const count = Math.min(Math.max(Math.floor(Number(dto.count) || 1), 1), 100);
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const codes = await this.codesService.generate(count, req.user.id, dto.notes, expiresAt);
    return codes;
  }

  @Get()
  async findAll(@Request() req: any) {
    if (!req.user.isAdmin) throw new ForbiddenException();
    return this.codesService.findAll();
  }
}
