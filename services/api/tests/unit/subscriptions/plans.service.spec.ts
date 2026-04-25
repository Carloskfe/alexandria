import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from '../../../src/subscriptions/plan.entity';
import { PlansService } from '../../../src/subscriptions/plans.service';

const mockPlanRepo = {
  find: jest.fn(),
  findOneBy: jest.fn(),
};

describe('PlansService', () => {
  let service: PlansService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlansService,
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
      ],
    }).compile();
    service = module.get(PlansService);
  });

  describe('findAll', () => {
    it('returns all plans', async () => {
      const plans = [{ id: 'p1', name: 'Individual Monthly' }];
      mockPlanRepo.find.mockResolvedValue(plans);
      const result = await service.findAll();
      expect(result).toEqual(plans);
      expect(mockPlanRepo.find).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('returns plan when found', async () => {
      const plan = { id: 'p1', name: 'Individual Monthly' };
      mockPlanRepo.findOneBy.mockResolvedValue(plan);
      const result = await service.findById('p1');
      expect(result).toEqual(plan);
    });

    it('returns null when plan not found', async () => {
      mockPlanRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findById('missing');
      expect(result).toBeNull();
    });
  });
});
