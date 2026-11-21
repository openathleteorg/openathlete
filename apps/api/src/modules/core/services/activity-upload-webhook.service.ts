import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  PayloadTooLargeException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  ActivityUploadWebhookCredentialsDto,
  ActivityUploadWebhookStatusDto,
  ApiEnvSchemaType,
  MAX_ACTIVITY_FILE_BYTES,
  WebhookConnector,
} from '@openathlete/shared';

import { ACTIVITY_WEBHOOK_UPLOAD_PATH } from '../../../common/security/payload-limits';
import { AiCredentialCipher } from '../../ai/services/ai-credential-cipher';
import { mcpUrls } from '../../mcp/mcp-urls';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';

const TOKEN_PREFIX = 'oa_upload_';
const TOKEN_FORMAT = /^oa_upload_[A-Za-z0-9_-]{43}$/;

@Injectable()
export class ActivityUploadWebhookService {
  private readonly cipher: AiCredentialCipher;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<ApiEnvSchemaType, true>,
    private readonly queue: QueueService,
  ) {
    this.cipher = new AiCredentialCipher(
      this.config.getOrThrow('HASH_PEPPER'),
      'openathlete/activity-upload-webhook',
    );
  }

  async status(
    userId: number,
    connector: WebhookConnector,
  ): Promise<ActivityUploadWebhookStatusDto> {
    const webhook = await this.prisma.activityUploadWebhook.findUnique({
      where: { userId_connector: { userId, connector } },
      select: { userId: true },
    });
    return { enabled: !!webhook };
  }

  async generate(
    userId: number,
    connector: WebhookConnector,
  ): Promise<ActivityUploadWebhookCredentialsDto> {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId },
      select: { athleteId: true },
    });
    if (!athlete) throw new ForbiddenException();

    const token = TOKEN_PREFIX + randomBytes(32).toString('base64url');
    const passkey =
      connector === 'rungap' ? randomBytes(32).toString('base64url') : null;
    const credential = {
      tokenHash: hashToken(token),
      encryptedPasskey: passkey ? this.cipher.encrypt(passkey) : null,
    };
    await this.prisma.activityUploadWebhook.upsert({
      where: { userId_connector: { userId, connector } },
      create: { userId, connector, ...credential },
      update: credential,
    });
    return {
      url: `${mcpUrls(this.config).issuer}${ACTIVITY_WEBHOOK_UPLOAD_PATH}/${token}`,
      token,
      passkey,
    };
  }

  async revoke(userId: number, connector: WebhookConnector): Promise<void> {
    await this.prisma.activityUploadWebhook.deleteMany({
      where: { userId, connector },
    });
  }

  async receive(
    token: string | undefined,
    body: unknown,
    contentType: string | undefined,
    signature: string | undefined,
  ): Promise<{ queued: true }> {
    if (!token || !TOKEN_FORMAT.test(token)) throw new UnauthorizedException();

    const webhook = await this.prisma.activityUploadWebhook.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { userId: true, encryptedPasskey: true },
    });
    if (!webhook) throw new UnauthorizedException();

    if (webhook.encryptedPasskey) {
      if (
        !Buffer.isBuffer(body) ||
        !signature ||
        !/^[0-9a-f]{64}$/i.test(signature)
      )
        throw new UnauthorizedException();
      let passkey: string;
      try {
        passkey = this.cipher.decrypt(webhook.encryptedPasskey);
      } catch {
        throw new UnauthorizedException();
      }
      const expected = createHmac('sha256', passkey).update(body).digest();
      if (!timingSafeEqual(expected, Buffer.from(signature, 'hex')))
        throw new UnauthorizedException();
    }

    if (!Buffer.isBuffer(body) || !body.length || !contentType)
      throw new BadRequestException('Expected a FIT upload');
    const mediaType = contentType.split(';', 1)[0].trim().toLowerCase();
    if (
      mediaType !== 'multipart/form-data' &&
      mediaType !== 'application/octet-stream'
    )
      throw new BadRequestException('Expected a FIT upload');
    const upload =
      mediaType === 'multipart/form-data'
        ? await readMultipartFit(body, contentType)
        : { file: body, name: 'FIT activity' };
    if (!upload.file.length)
      throw new BadRequestException('Expected a FIT file');
    if (upload.file.length > MAX_ACTIVITY_FILE_BYTES)
      throw new PayloadTooLargeException();

    try {
      await this.queue.addWebhookFitImportJob(
        webhook.userId,
        upload.file,
        upload.name,
      );
    } catch {
      throw new ServiceUnavailableException('Could not queue the FIT upload');
    }
    return { queued: true };
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function readMultipartFit(body: Buffer, contentType: string) {
  let form: FormData;
  try {
    form = await new Response(new Uint8Array(body), {
      headers: { 'Content-Type': contentType },
    }).formData();
  } catch {
    throw new BadRequestException('Invalid multipart upload');
  }

  const files = Array.from(form.values()).filter(
    (part) => typeof part !== 'string',
  );
  const metadata =
    files.find(
      (part) =>
        part.type === 'application/json' ||
        part.name.toLowerCase().endsWith('.json'),
    ) ?? form.get('metadata');
  const fit = files.filter(
    (part) =>
      part !== metadata &&
      (part.name.toLowerCase().endsWith('.fit') ||
        part.type === 'application/octet-stream'),
  );
  if (fit.length !== 1) throw new BadRequestException('Expected one FIT file');
  const [file] = fit;
  if (file.size > MAX_ACTIVITY_FILE_BYTES) throw new PayloadTooLargeException();

  const filename = file.name.replace(/\.fit$/i, '').trim();
  const name = (
    (await readRunGapTitle(metadata)) ||
    filename ||
    'FIT activity'
  ).slice(0, 100);
  return { file: Buffer.from(await file.arrayBuffer()), name };
}

async function readRunGapTitle(
  part: FormDataEntryValue | null,
): Promise<string> {
  if (
    part === null ||
    (typeof part === 'string' ? part.length : part.size) > 64 * 1024
  )
    return '';
  try {
    const value: unknown = JSON.parse(
      typeof part === 'string' ? part : await part.text(),
    );
    if (
      value &&
      typeof value === 'object' &&
      'title' in value &&
      typeof value.title === 'string'
    )
      return value.title.trim();
  } catch {
    // The file can still import without a usable title.
  }
  return '';
}
