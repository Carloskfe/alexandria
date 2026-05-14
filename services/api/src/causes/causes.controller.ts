import { Body, Controller, Get, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CausesService } from './causes.service';
import { SavePreferencesDto } from './dto/save-preferences.dto';

@Controller('causes')
export class CausesController {
  constructor(private readonly causesService: CausesService) {}

  @Get()
  getCauses() {
    return this.causesService.findAllActive();
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  getPreferences(@Request() req: any) {
    return this.causesService.getPreferences(req.user.id);
  }

  @Post('preferences')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  savePreferences(@Request() req: any, @Body() dto: SavePreferencesDto) {
    return this.causesService.savePreferences(req.user.id, dto);
  }
}
