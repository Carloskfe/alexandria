import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class AudioDownloaderService {
  private readonly client: S3Client;
  private readonly bucket = 'audio';

  constructor() {
    const endpoint = process.env.MINIO_ENDPOINT ?? 'storage';
    const port = parseInt(process.env.MINIO_PORT ?? '9000', 10);
    const useSsl = process.env.MINIO_USE_SSL === 'true';

    this.client = new S3Client({
      endpoint: `${useSsl ? 'https' : 'http'}://${endpoint}:${port}`,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async downloadAndStore(zipUrl: string, key: string): Promise<void> {
    const res = await globalThis.fetch(zipUrl);
    if (!res.ok) {
      throw new Error(`Audio download failed: HTTP ${res.status} — ${zipUrl}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/zip',
        ContentLength: buffer.length,
      }),
    );
  }
}
