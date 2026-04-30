import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q = '',
    @Query('category') category?: string,
    @Query('isFree') isFree?: string,
  ) {
    const isFreeFilter =
      isFree === 'true' ? true : isFree === 'false' ? false : undefined;
    return this.searchService.search(q, { category, isFree: isFreeFilter });
  }
}
