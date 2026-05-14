import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CausesService } from '../../../src/causes/causes.service';
import { Cause } from '../../../src/causes/cause.entity';
import { UserCausePreference } from '../../../src/causes/user-cause-preference.entity';

const mockCause = (slug: string): Cause => ({
  id: `cause-${slug}`,
  slug,
  name: slug,
  description: 'desc',
  statFact: 'fact',
  icon: '🐾',
  active: true,
  createdAt: new Date(),
});

const mockCauseRepo = {
  find: jest.fn(),
};

const mockPrefRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};

describe('CausesService', () => {
  let service: CausesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CausesService,
        { provide: getRepositoryToken(Cause), useValue: mockCauseRepo },
        { provide: getRepositoryToken(UserCausePreference), useValue: mockPrefRepo },
      ],
    }).compile();
    service = module.get(CausesService);
  });

  describe('findAllActive', () => {
    it('returns active causes ordered by createdAt ASC', async () => {
      const causes = [mockCause('bienestar-animal'), mockCause('ninez-y-juventud')];
      mockCauseRepo.find.mockResolvedValue(causes);
      const result = await service.findAllActive();
      expect(mockCauseRepo.find).toHaveBeenCalledWith({ where: { active: true }, order: { createdAt: 'ASC' } });
      expect(result).toHaveLength(2);
    });
  });

  describe('getPreferences', () => {
    it('returns preference when found', async () => {
      const pref = { userId: 'u1', randomDistribution: false, cause1Id: 'c1', cause2Id: null };
      mockPrefRepo.findOne.mockResolvedValue(pref);
      const result = await service.getPreferences('u1');
      expect(result).toEqual(pref);
    });

    it('returns null when no preference exists', async () => {
      mockPrefRepo.findOne.mockResolvedValue(null);
      expect(await service.getPreferences('u1')).toBeNull();
    });
  });

  describe('savePreferences', () => {
    it('creates a new preference when none exists', async () => {
      mockPrefRepo.findOne.mockResolvedValue(null);
      const newPref: any = { userId: 'u1' };
      mockPrefRepo.create.mockReturnValue(newPref);
      mockPrefRepo.save.mockResolvedValue({ ...newPref, cause1Id: 'c1', randomDistribution: false });

      const result = await service.savePreferences('u1', { cause1Id: 'c1', cause2Id: null, randomDistribution: false });

      expect(mockPrefRepo.create).toHaveBeenCalledWith({ userId: 'u1' });
      expect(mockPrefRepo.save).toHaveBeenCalled();
      expect(result.cause1Id).toBe('c1');
    });

    it('updates an existing preference', async () => {
      const existing: any = { userId: 'u1', cause1Id: 'old', cause2Id: null, randomDistribution: false };
      mockPrefRepo.findOne.mockResolvedValue(existing);
      mockPrefRepo.save.mockImplementation(async (p) => p);

      const result = await service.savePreferences('u1', { cause1Id: null, cause2Id: null, randomDistribution: true });

      expect(mockPrefRepo.create).not.toHaveBeenCalled();
      expect(result.randomDistribution).toBe(true);
      expect(result.cause1Id).toBeNull();
    });

    it('sets cause2Id to null when not provided', async () => {
      mockPrefRepo.findOne.mockResolvedValue(null);
      const newPref: any = { userId: 'u1' };
      mockPrefRepo.create.mockReturnValue(newPref);
      mockPrefRepo.save.mockImplementation(async (p) => p);

      const result = await service.savePreferences('u1', { cause1Id: 'c1', randomDistribution: false });

      expect(result.cause2Id).toBeNull();
    });
  });
});
