import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WaitlistService } from '../../../src/waitlist/waitlist.service';
import { WaitlistEntry } from '../../../src/waitlist/waitlist-entry.entity';
import { EmailService } from '../../../src/email/email.service';

const mockRepo = {
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  countBy: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockEmailService = {
  sendWaitlistConfirmation: jest.fn().mockResolvedValue(undefined),
  sendWaitlistInvite: jest.fn().mockResolvedValue(undefined),
};

describe('WaitlistService', () => {
  let service: WaitlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistService,
        { provide: getRepositoryToken(WaitlistEntry), useValue: mockRepo },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();
    service = module.get(WaitlistService);
    jest.clearAllMocks();
  });

  describe('join', () => {
    it('creates and saves a new entry', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      const entry = { id: 'u1', email: 'a@b.com', name: 'Ana', isAuthor: false } as WaitlistEntry;
      mockRepo.create.mockReturnValue(entry);
      mockRepo.save.mockResolvedValue(entry);

      const result = await service.join('a@b.com', 'Ana');

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com', name: 'Ana', isAuthor: false }),
      );
      expect(result).toBe(entry);
    });

    it('lowercases the email before saving', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      mockRepo.create.mockImplementation((d) => d);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      await service.join('TEST@EXAMPLE.COM');

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
    });

    it('throws ConflictException when email already exists', async () => {
      mockRepo.findOneBy.mockResolvedValue({ id: 'existing' } as WaitlistEntry);

      await expect(service.join('a@b.com')).rejects.toThrow(ConflictException);
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('fires confirmation email after saving', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      const entry = { id: 'u1', email: 'a@b.com', name: 'Ana' } as WaitlistEntry;
      mockRepo.create.mockReturnValue(entry);
      mockRepo.save.mockResolvedValue(entry);

      await service.join('a@b.com', 'Ana');

      // Allow microtask queue to settle (fire-and-forget)
      await new Promise((r) => setTimeout(r, 0));
      expect(mockEmailService.sendWaitlistConfirmation).toHaveBeenCalledWith('a@b.com', 'Ana');
    });

    it('sets isAuthor=true when flag is passed', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      mockRepo.create.mockImplementation((d) => d);
      mockRepo.save.mockImplementation((e) => Promise.resolve(e));

      await service.join('author@b.com', 'Carlos', true);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ isAuthor: true }));
    });
  });

  describe('invite', () => {
    it('sends invite email and sets invitedAt', async () => {
      const entry = { id: 'u1', email: 'a@b.com', name: 'Ana', invitedAt: null } as WaitlistEntry;
      mockRepo.findOneBy.mockResolvedValue(entry);
      mockRepo.save.mockResolvedValue(entry);

      await service.invite('u1');

      expect(mockEmailService.sendWaitlistInvite).toHaveBeenCalledWith('a@b.com', 'Ana');
      expect(entry.invitedAt).not.toBeNull();
    });

    it('throws NotFoundException when entry does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.invite('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('stats', () => {
    it('returns total, authors, and invited counts', async () => {
      const qb = { where: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(3) };
      mockRepo.count.mockResolvedValue(50);
      mockRepo.countBy.mockResolvedValue(8);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.stats();

      expect(result).toEqual({ total: 50, authors: 8, invited: 3 });
    });
  });
});
