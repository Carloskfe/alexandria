import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MEILI_INDEX } from './search.constants';

export { MEILI_INDEX };

@Module({
  providers: [
    {
      provide: MEILI_INDEX,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const client = new MeiliSearch({
          host: config.get('MEILI_HOST', 'http://search:7700'),
          apiKey: config.get('MEILI_MASTER_KEY', 'changeme'),
        });
        return client.index('books');
      },
    },
    SearchService,
  ],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
