import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from '../../../src/search/search.controller';
import { SearchService } from '../../../src/search/search.service';

const mockSearchService = {
  search: jest.fn(),
};

describe('SearchController', () => {
  let controller: SearchController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [{ provide: SearchService, useValue: mockSearchService }],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('calls searchService.search with the query and no filters when none provided', async () => {
      mockSearchService.search.mockResolvedValue({ hits: [] });

      await controller.search('quijote');

      expect(mockSearchService.search).toHaveBeenCalledWith('quijote', {
        category: undefined,
        isFree: undefined,
      });
    });

    it('passes category filter to searchService', async () => {
      mockSearchService.search.mockResolvedValue({ hits: [] });

      await controller.search('', 'classic');

      expect(mockSearchService.search).toHaveBeenCalledWith('', {
        category: 'classic',
        isFree: undefined,
      });
    });

    it('converts isFree=true string to boolean true', async () => {
      mockSearchService.search.mockResolvedValue({ hits: [] });

      await controller.search('', undefined, 'true');

      expect(mockSearchService.search).toHaveBeenCalledWith('', {
        category: undefined,
        isFree: true,
      });
    });

    it('converts isFree=false string to boolean false', async () => {
      mockSearchService.search.mockResolvedValue({ hits: [] });

      await controller.search('', undefined, 'false');

      expect(mockSearchService.search).toHaveBeenCalledWith('', {
        category: undefined,
        isFree: false,
      });
    });

    it('defaults q to empty string when not provided', async () => {
      mockSearchService.search.mockResolvedValue({ hits: [] });

      await controller.search();

      expect(mockSearchService.search).toHaveBeenCalledWith('', expect.anything());
    });

    it('returns the result from searchService', async () => {
      const result = { hits: [{ id: 'b-1', title: 'Don Quijote' }], estimatedTotalHits: 1 };
      mockSearchService.search.mockResolvedValue(result);

      const response = await controller.search('quijote');

      expect(response).toEqual(result);
    });
  });
});
