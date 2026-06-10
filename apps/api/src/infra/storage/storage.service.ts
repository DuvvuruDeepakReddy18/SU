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
    // Trim every value. A stray trailing newline/space from a pasted env var
    // (very common in hosting dashboards) corrupts the SigV4 `Authorization`
    // header the AWS SDK builds — the access key id and region go straight into
    // it — and Node then throws ERR_INVALID_CHAR on every upload.
    const endpoint = process.env.S3_ENDPOINT?.trim();
    const accessKeyId = process.env.S3_KEY?.trim();
    const secretAccessKey = process.env.S3_SECRET?.trim();
    this.bucket = (process.env.S3_BUCKET ?? 'skillverify').trim();
    this.publicUrl = process.env.S3_PUBLIC_URL?.trim() || `http://localhost:9000/${this.bucket}`;
    if (!endpoint || !accessKeyId || !secretAccessKey) {
      this.log.warn('S3 not configured — file uploads will return a clear error.');
      this.client = null;
      return;
    }
    this.client = new S3Client({
      endpoint,
      region: (process.env.S3_REGION ?? 'us-east-1').trim(),
      credentials: { accessKeyId, secretAccessKey },
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

  /**
   * Trade a stored full URL for a short-lived signed URL. PII like college IDs
   * and marksheet scans should never be served from a permanent public URL;
   * admin/owner-only endpoints replace the persisted URL with this just-in-time
   * download link (default 10 min — long enough for an admin to load several
   * images, short enough that a leaked log line goes stale fast).
   *
   * Falls back to the input URL when S3 isn't configured (dev) or when the
   * stored URL doesn't share the configured public prefix (legacy / migration).
   */
  async signedDownloadFor(
    storedUrl: string | null | undefined,
    expiresIn = 600,
  ): Promise<string | null> {
    if (!storedUrl) return null;
    if (!this.client) return storedUrl;
    const prefix = `${this.publicUrl}/`;
    if (!storedUrl.startsWith(prefix)) return storedUrl;
    const key = storedUrl.slice(prefix.length);
    if (!key) return storedUrl;
    try {
      return await this.getSignedDownloadUrl(key, expiresIn);
    } catch (e) {
      this.log.warn(`Failed to sign URL for key ${key}: ${(e as Error).message}`);
      return storedUrl;
    }
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
