import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private readonly client: S3Client;

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

  async upload(bucket: string, key: string, buffer: Buffer, mimetype: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: mimetype }),
    );
  }

  async presign(bucket: string, key: string, ttlSeconds: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const signed = await getSignedUrl(this.client, command, { expiresIn: ttlSeconds });
    // Rewrite internal Docker hostname to the public URL so browsers can reach MinIO
    const publicBase = process.env.MINIO_PUBLIC_URL;
    if (publicBase) {
      const url = new URL(signed);
      const internal = `${url.protocol}//${url.host}`;
      return signed.replace(internal, publicBase);
    }
    return signed;
  }

  async getText(key: string, bucket = 'books'): Promise<string> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const stream = res.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf-8');
  }

  /** Returns a permanent public URL — requires the bucket to allow public reads (set in prod). */
  publicUrl(bucket: string, key: string): string {
    const base = process.env.MINIO_PUBLIC_URL ?? `http://storage:9000`;
    return `${base}/${bucket}/${key}`;
  }
}
