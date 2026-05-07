import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UploadCodesService } from '../../../src/codes/upload-codes.service';
import { UploadCode } from '../../../src/codes/upload-code.entity';

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  find: jest.fn(),
};

describe('UploadCodesService', () => {
  let service: UploadCodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadCodesService,
        { provide: getRepositoryToken(UploadCode), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(UploadCodesService);
    jest.clearAllMocks();
  });

  // ── generate ─────────────────────────────────────────────────────────────

  describe('generate', () => {
    it('creates and returns the requested number of codes', async () => {
      const entity = { id: 'uuid-1', code: 'NOETIA-ABCD-EFGH' } as UploadCode;
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      const result = await service.generate(3, 'admin-1');

      expect(mockRepo.create).toHaveBeenCalledTimes(3);
      expect(mockRepo.save).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(3);
    });

    it('passes notes and expiresAt when provided', async () => {
      const expiry = new Date('2030-01-01');
      const entity = { id: 'u', code: 'NOETIA-XXXX-YYYY' } as UploadCode;
      mockRepo.create.mockReturnValue(entity);
      mockRepo.save.mockResolvedValue(entity);

      await service.generate(1, 'admin-1', 'Beta author invite', expiry);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Beta author invite', expiresAt: expiry }),
      );
    });

    it('generates codes in NOETIA-XXXX-XXXX format', async () => {
      mockRepo.create.mockImplementation((data: Partial<UploadCode>) => data);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      const [result] = await service.generate(1, 'admin-1');
      expect(result.code).toMatch(/^NOETIA-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });

    it('generates unique codes across multiple calls', async () => {
      const codes = new Set<string>();
      mockRepo.create.mockImplementation((data: Partial<UploadCode>) => data);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      for (let i = 0; i < 20; i++) {
        const [result] = await service.generate(1, 'admin-1');
        codes.add(result.code);
      }
      expect(codes.size).toBe(20);
    });
  });

  // ── validate ──────────────────────────────────────────────────────────────

  describe('validate', () => {
    it('returns the entity when the code is unused and not expired', async () => {
      const entity = { id: 'u', code: 'NOETIA-ABCD-EFGH', usedBy: null, expiresAt: null } as UploadCode;
      mockRepo.findOneBy.mockResolvedValue(entity);

      const result = await service.validate('NOETIA-ABCD-EFGH');
      expect(result).toBe(entity);
    });

    it('normalizes input to uppercase before lookup', async () => {
      mockRepo.findOneBy.mockResolvedValue({ id: 'u', code: 'NOETIA-ABCD-EFGH', expiresAt: null } as UploadCode);

      await service.validate('noetia-abcd-efgh');

      expect(mockRepo.findOneBy).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NOETIA-ABCD-EFGH' }),
      );
    });

    it('throws BadRequestException when the code does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.validate('NOETIA-XXXX-XXXX')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when the code is already used', async () => {
      mockRepo.findOneBy.mockResolvedValue(null); // findOneBy with usedBy: IsNull() returns null = already used
      await expect(service.validate('NOETIA-USED-CODE')).rejects.toThrow('ya utilizado');
    });

    it('throws BadRequestException when the code is expired', async () => {
      const pastDate = new Date('2020-01-01');
      mockRepo.findOneBy.mockResolvedValue({ id: 'u', code: 'X', usedBy: null, expiresAt: pastDate } as UploadCode);
      await expect(service.validate('NOETIA-ABCD-EFGH')).rejects.toThrow('expirado');
    });

    it('accepts a code with a future expiry date', async () => {
      const futureDate = new Date(Date.now() + 1_000_000_000);
      const entity = { id: 'u', code: 'X', usedBy: null, expiresAt: futureDate } as UploadCode;
      mockRepo.findOneBy.mockResolvedValue(entity);
      await expect(service.validate('NOETIA-ABCD-EFGH')).resolves.toBe(entity);
    });
  });

  // ── consume ───────────────────────────────────────────────────────────────

  describe('consume', () => {
    it('marks the code as used by the given user', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });

      await service.consume('NOETIA-ABCD-EFGH', 'user-99');

      expect(mockRepo.update).toHaveBeenCalledWith(
        { code: 'NOETIA-ABCD-EFGH', usedBy: expect.anything() },
        expect.objectContaining({ usedBy: 'user-99' }),
      );
    });

    it('normalizes code to uppercase before updating', async () => {
      mockRepo.update.mockResolvedValue({ affected: 1 });
      await service.consume('noetia-abcd-efgh', 'user-1');
      expect(mockRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NOETIA-ABCD-EFGH' }),
        expect.anything(),
      );
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('returns all codes ordered by createdAt DESC', async () => {
      const codes = [{ id: '1' }, { id: '2' }] as UploadCode[];
      mockRepo.find.mockResolvedValue(codes);

      const result = await service.findAll();

      expect(mockRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toBe(codes);
    });
  });
});
