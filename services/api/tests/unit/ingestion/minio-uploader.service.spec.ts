import { Test, TestingModule } from '@nestjs/testing';
import { MinioUploaderService } from '../../../src/ingestion/minio-uploader.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
    PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  };
});

describe('MinioUploaderService', () => {
  let service: MinioUploaderService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [MinioUploaderService],
    }).compile();

    service = module.get<MinioUploaderService>(MinioUploaderService);
  });

  describe('upload', () => {
    it('sends a PutObjectCommand with the correct bucket and key', async () => {
      mockSend.mockResolvedValue({});

      await service.upload('abc-123.txt', 'Hello world');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const [cmd] = mockSend.mock.calls[0];
      expect(cmd.input).toMatchObject({
        Bucket: 'books',
        Key: 'abc-123.txt',
        ContentType: 'text/plain; charset=utf-8',
      });
    });

    it('encodes text as a UTF-8 buffer', async () => {
      mockSend.mockResolvedValue({});
      const text = 'Ñoño';

      await service.upload('key.txt', text);

      const [cmd] = mockSend.mock.calls[0];
      expect(Buffer.isBuffer(cmd.input.Body)).toBe(true);
      expect((cmd.input.Body as Buffer).toString('utf-8')).toBe(text);
    });

    it('propagates errors from S3Client', async () => {
      mockSend.mockRejectedValue(new Error('S3 error'));

      await expect(service.upload('key.txt', 'text')).rejects.toThrow('S3 error');
    });
  });
});
