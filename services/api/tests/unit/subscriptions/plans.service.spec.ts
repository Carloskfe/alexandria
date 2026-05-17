import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from '../../../src/subscriptions/plan.entity';
import { TokenPackage } from '../../../src/subscriptions/token-package.entity';
import { PlansService } from '../../../src/subscriptions/plans.service';

const mockPlanRepo = {
  find: jest.fn(),
  findOneBy: jest.fn(),
};

const mockPackageRepo = {
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
        { provide: getRepositoryToken(TokenPackage), useValue: mockPackageRepo },
      ],
    }).compile();
    service = module.get(PlansService);
  });

  describe('findAll', () => {
    it('returns all plans ordered by amount', async () => {
      const plans = [{ id: 'p1', name: 'Individual' }];
      mockPlanRepo.find.mockResolvedValue(plans);
      const result = await service.findAll();
      expect(result).toEqual(plans);
      expect(mockPlanRepo.find).toHaveBeenCalledWith({ order: { amountCents: 'ASC' } });
    });
  });

  describe('findById', () => {
    it('returns plan when found', async () => {
      const plan = { id: 'p1', name: 'Individual' };
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

  describe('findActiveTokenPackages', () => {
    it('returns active packages ordered by tokenCount', async () => {
      const packages = [{ id: 'pkg1', tokenCount: 1 }, { id: 'pkg3', tokenCount: 3 }];
      mockPackageRepo.find.mockResolvedValue(packages);
      const result = await service.findActiveTokenPackages();
      expect(result).toEqual(packages);
      expect(mockPackageRepo.find).toHaveBeenCalledWith({
        where: { active: true },
        order: { tokenCount: 'ASC' },
      });
    });
  });

  describe('findTokenPackageById', () => {
    it('returns active package when found', async () => {
      const pkg = { id: 'pkg1', tokenCount: 1, active: true };
      mockPackageRepo.findOneBy.mockResolvedValue(pkg);
      const result = await service.findTokenPackageById('pkg1');
      expect(result).toEqual(pkg);
      expect(mockPackageRepo.findOneBy).toHaveBeenCalledWith({ id: 'pkg1', active: true });
    });

    it('returns null when package not found', async () => {
      mockPackageRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findTokenPackageById('missing');
      expect(result).toBeNull();
    });
  });

  describe('findTokenPackageByStripePriceId', () => {
    it('returns active package for a given Stripe price ID', async () => {
      const pkg = { id: 'pkg1', stripePriceId: 'price_abc', active: true };
      mockPackageRepo.findOneBy.mockResolvedValue(pkg);
      const result = await service.findTokenPackageByStripePriceId('price_abc');
      expect(result).toEqual(pkg);
      expect(mockPackageRepo.findOneBy).toHaveBeenCalledWith({ stripePriceId: 'price_abc', active: true });
    });

    it('returns null when no package matches the price ID', async () => {
      mockPackageRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findTokenPackageByStripePriceId('price_unknown');
      expect(result).toBeNull();
    });
  });
});
