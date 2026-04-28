import { Test, TestingModule } from '@nestjs/testing';
import { AudioDownloaderService } from '../../../src/ingestion/audio-downloader.service';

const mockSend = jest.fn();
const mockFetch = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

beforeAll(() => {
  globalThis.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AudioDownloaderService', () => {
  let service: AudioDownloaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudioDownloaderService],
    }).compile();

    service = module.get<AudioDownloaderService>(AudioDownloaderService);
  });

  describe('downloadAndStore', () => {
    it('downloads the zip and uploads to the audio bucket with the given key', async () => {
      const fakeBuffer = Buffer.from('fake zip content');
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: async () => fakeBuffer.buffer,
        headers: { get: () => null },
      });
      mockSend.mockResolvedValue({});

      await service.downloadAndStore('https://archive.org/download/foo/foo.zip', 'book-id.zip');

      expect(mockSend).toHaveBeenCalledTimes(1);
      const [cmd] = mockSend.mock.calls[0];
      expect(cmd.input).toMatchObject({
        Bucket: 'audio',
        Key: 'book-id.zip',
        ContentType: 'application/zip',
      });
    });

    it('sets ContentLength equal to the downloaded buffer size', async () => {
      const ab = new ArrayBuffer(42);
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: async () => ab,
        headers: { get: () => null },
      });
      mockSend.mockResolvedValue({});

      await service.downloadAndStore('https://archive.org/x.zip', 'x.zip');

      const [cmd] = mockSend.mock.calls[0];
      expect(cmd.input.ContentLength).toBe(42);
    });

    it('throws when the download response is not ok', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(
        service.downloadAndStore('https://archive.org/missing.zip', 'k.zip'),
      ).rejects.toThrow('HTTP 404');
    });

    it('propagates S3 upload errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.alloc(0).buffer,
        headers: { get: () => null },
      });
      mockSend.mockRejectedValue(new Error('S3 write error'));

      await expect(
        service.downloadAndStore('https://archive.org/ok.zip', 'k.zip'),
      ).rejects.toThrow('S3 write error');
    });
  });
});
