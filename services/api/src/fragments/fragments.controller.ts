import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateFragmentDto } from './dto/create-fragment.dto';
import { UpdateFragmentDto } from './dto/update-fragment.dto';
import { FragmentsService } from './fragments.service';

@Controller('fragments')
export class FragmentsController {
  constructor(private readonly fragmentsService: FragmentsService) {}

  @Post()
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  create(@Request() req: any, @Body() dto: CreateFragmentDto) {
    return this.fragmentsService.create(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateFragmentDto) {
    return this.fragmentsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req: any) {
    return this.fragmentsService.remove(id, req.user.id);
  }

  @Post('combine')
  @HttpCode(201)
  @UseGuards(JwtAuthGuard)
  combine(@Request() req: any, @Body() body: { fragmentIds: string[] }) {
    return this.fragmentsService.combine(req.user.id, body.fragmentIds);
  }
}
