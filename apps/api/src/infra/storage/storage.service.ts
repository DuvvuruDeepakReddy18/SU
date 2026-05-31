import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

@Injectable()
export class StorageService {
  private readonly log = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? 'skillverify';
    this.publicUrl = process.env.S3_PUBLIC_URL ?? `http://localhost:9000/${this.bucket}`;
    if (!process.env.S3_ENDPOINT || !process.env.S3_KEY || !process.env.S3_SECRET) {
      this.log.warn('S3 not configured — file uploads will return a clear error.');
      this.client = null;
      return;
    }
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_KEY,
        secretAccessKey: process.env.S3_SECRET,
      },
      forcePathStyle: true,
    });
  }

  async upload(prefix: string, file: { buffer: Buffer; mimetype: string; originalname: string }) {
    if (!this.client) {
      throw new Error(
        'File storage is not configured. Set S3_ENDPOINT, S3_KEY, S3_SECRET, S3_BUCKET.',
      );
    }
    const ext = file.originalname.split('.').pop() ?? 'bin';
    const key = `${prefix}/${randomUUID()}.${ext}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );
    return { key, url: `${this.publicUrl}/${key}` };
  }

  async getSignedDownloadUrl(key: string, expiresIn = 60) {
    if (!this.client) throw new Error('File storage is not configured.');
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn,
    });
  }

  publicUrlFor(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async delete(key: string) {
    if (!this.client) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (e) {
      this.log.warn(`Failed to delete ${key}: ${(e as Error).message}`);
    }
  }
}
