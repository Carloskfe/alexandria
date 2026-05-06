import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../../../src/email/email.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
const mockCreateTransport = nodemailer.createTransport as jest.Mock;

beforeEach(() => {
  mockCreateTransport.mockReturnValue({ sendMail: mockSendMail });
  mockSendMail.mockClear();
});

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();
    service = module.get(EmailService);
  });

  describe('sendEmailConfirmation', () => {
    it('sends email with confirmation link', async () => {
      await service.sendEmailConfirmation('user@example.com', 'Carlos', 'abc123token');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('Confirma');
      expect(call.html).toContain('abc123token');
      expect(call.html).toContain('Carlos');
    });

    it('escapes HTML in user name', async () => {
      await service.sendEmailConfirmation('user@example.com', '<script>alert(1)</script>', 'tok');

      const call = mockSendMail.mock.calls[0][0];
      expect(call.html).not.toContain('<script>');
      expect(call.html).toContain('&lt;script&gt;');
    });

    it('does not throw if sendMail fails (swallows and logs)', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP down'));
      await expect(
        service.sendEmailConfirmation('user@example.com', 'Carlos', 'tok'),
      ).resolves.not.toThrow();
    });
  });

  describe('sendPasswordReset', () => {
    it('sends email with reset link', async () => {
      await service.sendPasswordReset('user@example.com', 'Carlos', 'resettoken123');

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      const call = mockSendMail.mock.calls[0][0];
      expect(call.to).toBe('user@example.com');
      expect(call.subject).toContain('contraseña');
      expect(call.html).toContain('resettoken123');
    });

    it('does not throw if sendMail fails', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Connection refused'));
      await expect(
        service.sendPasswordReset('user@example.com', 'Carlos', 'tok'),
      ).resolves.not.toThrow();
    });
  });
});
