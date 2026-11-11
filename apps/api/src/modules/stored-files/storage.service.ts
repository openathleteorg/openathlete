import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import type { Readable } from 'node:stream';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { ApiEnvSchemaType } from '@openathlete/shared';

/** Every object of the instance lives under this prefix */
export const IMAGE_KEY_PREFIX = 'images/';

/**
 * The instance's S3-compatible bucket (S3_*), for images in notes and
 * messages. Optional: unconfigured, images are off and their endpoints
 * answer 503. The client is created on first use.
 */
@Injectable()
export class StorageService {
  private client?: S3Client;

  constructor(private readonly config: ConfigService<ApiEnvSchemaType, true>) {}

  isEnabled(): boolean {
    return (
      !!this.config.get('S3_BUCKET') &&
      !!this.config.get('S3_ACCESS_KEY_ID') &&
      !!this.config.get('S3_SECRET_ACCESS_KEY')
    );
  }

  /** 503 when the instance has no bucket */
  assertEnabled(): void {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException(
        'Images are not available on this instance',
      );
    }
  }

  private bucket(): string {
    return this.config.get('S3_BUCKET');
  }

  private s3(): S3Client {
    this.assertEnabled();
    if (!this.client) {
      const endpoint = this.config.get('S3_ENDPOINT');
      this.client = new S3Client({
        endpoint,
        region:
          this.config.get('S3_REGION') ||
          (isCloudflareR2(endpoint) ? 'auto' : 'us-east-1'),
        forcePathStyle: this.config.get('S3_FORCE_PATH_STYLE') === true,
        credentials: {
          accessKeyId: this.config.get('S3_ACCESS_KEY_ID'),
          secretAccessKey: this.config.get('S3_SECRET_ACCESS_KEY'),
        },
      });
    }
    return this.client;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3().send(
      new PutObjectCommand({
        Bucket: this.bucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Readable> {
    const object = await this.s3().send(
      new GetObjectCommand({ Bucket: this.bucket(), Key: key }),
    );
    return object.Body as Readable;
  }

  /** Deletes the objects, by batches of the 1000 S3 accepts */
  async delete(keys: string[]): Promise<void> {
    for (let i = 0; i < keys.length; i += 1000) {
      const batch = keys.slice(i, i + 1000);
      const result = await this.s3().send(
        new DeleteObjectsCommand({
          Bucket: this.bucket(),
          Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
        }),
      );
      if (result.Errors?.length) {
        throw new Error(
          `Storage refused to delete ${result.Errors.length} object(s): ${result.Errors[0].Code}`,
        );
      }
    }
  }

  /** Every object key under the prefix, with when it was written */
  async *list(
    prefix: string,
  ): AsyncGenerator<{ key: string; lastModified?: Date }> {
    let token: string | undefined;
    do {
      const page = await this.s3().send(
        new ListObjectsV2Command({
          Bucket: this.bucket(),
          Prefix: prefix,
          ContinuationToken: token,
        }),
      );
      for (const object of page.Contents ?? []) {
        if (object.Key)
          yield { key: object.Key, lastModified: object.LastModified };
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
  }
}

/** R2 takes the region `auto`; other S3 services default to us-east-1 */
function isCloudflareR2(endpoint: string | undefined): boolean {
  if (!endpoint) return false;
  try {
    return new URL(endpoint).hostname.endsWith('.r2.cloudflarestorage.com');
  } catch {
    return false;
  }
}
