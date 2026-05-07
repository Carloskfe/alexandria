import { Controller, Get, Header, Param } from '@nestjs/common';
import { CollectionsService } from './collections.service';

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
  findAll() {
    return this.collectionsService.findAll();
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=120, stale-while-revalidate=600')
  findOne(@Param('slug') slug: string) {
    return this.collectionsService.findBySlug(slug);
  }
}
