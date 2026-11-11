import { randomUUID } from 'node:crypto';
import type { Readable } from 'node:stream';

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { StoredFilePurpose } from '@openathlete/database';
import {
  IMAGE_MAX_BYTES,
  STORED_FILE_PURPOSE,
  type UploadImageDto,
  type UploadedImageDto,
  imageIdsIn,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import { detectImageType } from './image-type';
import { IMAGE_KEY_PREFIX, StorageService } from './storage.service';

export type ImageUpload = { buffer: Buffer; size: number };

/** An upload is kept this long before a text has to reference it */
export const UNREFERENCED_GRACE_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StoredFileService {
  private readonly logger = new Logger(StoredFileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async uploadImage(
    user: AuthUser,
    file: ImageUpload | undefined,
    dto: UploadImageDto,
  ): Promise<UploadedImageDto> {
    this.storage.assertEnabled();
    if (!file) throw new BadRequestException('No file');
    if (file.size > IMAGE_MAX_BYTES) {
      throw new PayloadTooLargeException('Image too large');
    }
    const contentType = detectImageType(file.buffer);
    if (!contentType) throw new BadRequestException('Not an image');

    let messageThreadId: number | null = null;
    if (dto.purpose === STORED_FILE_PURPOSE.MESSAGE) {
      if (!dto.messageThreadId) {
        throw new BadRequestException('messageThreadId is required');
      }
      await this.assertParticipant(user, dto.messageThreadId);
      messageThreadId = dto.messageThreadId;
    }

    const storedFileId = randomUUID();
    const key = `${IMAGE_KEY_PREFIX}${storedFileId}`;
    await this.storage.put(key, file.buffer, contentType);
    await this.prisma.storedFile.create({
      data: {
        storedFileId,
        key,
        contentType,
        size: file.size,
        purpose: dto.purpose as StoredFilePurpose,
        ownerUserId: user.userId,
        messageThreadId,
      },
    });
    return { fileId: storedFileId };
  }

  /**
   * An image and its type, for whoever may see it: its owner, and the
   * participants of the conversation of a message image. Anything else
   * reads as missing.
   */
  async open(
    user: AuthUser,
    storedFileId: string,
  ): Promise<{ body: Readable; contentType: string }> {
    const file = await this.prisma.storedFile.findUnique({
      where: { storedFileId },
      select: {
        key: true,
        contentType: true,
        ownerUserId: true,
        messageThread: {
          select: {
            participants: {
              where: { userId: user.userId },
              select: { userId: true },
            },
          },
        },
      },
    });
    const allowed =
      file &&
      (file.ownerUserId === user.userId ||
        (file.messageThread?.participants.length ?? 0) > 0);
    if (!allowed) throw new NotFoundException('File not found');
    return {
      body: await this.storage.get(file.key),
      contentType: file.contentType,
    };
  }

  private async assertParticipant(user: AuthUser, messageThreadId: number) {
    const participant = await this.prisma.messageThreadParticipant.findUnique({
      where: {
        messageThreadId_userId: { messageThreadId, userId: user.userId },
      },
      select: { userId: true },
    });
    if (!participant) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
  }

  /**
   * Deletes the images no text shows anymore, a day after their upload,
   * and the objects left without a row (a conversation or an account
   * deleted with its rows). Objects go first: a failure keeps the row, and
   * the next run retries.
   */
  async deleteUnreferenced(now = new Date()): Promise<number> {
    if (!this.storage.isEnabled()) return 0;
    const before = new Date(now.getTime() - UNREFERENCED_GRACE_MS);
    const unreferenced = [
      ...(await this.unreferencedNoteImages(before)),
      ...(await this.unreferencedMessageImages(before)),
    ];

    const known = new Set(
      (await this.prisma.storedFile.findMany({ select: { key: true } })).map(
        (file) => file.key,
      ),
    );
    const orphanKeys: string[] = [];
    for await (const object of this.storage.list(IMAGE_KEY_PREFIX)) {
      if (
        !known.has(object.key) &&
        object.lastModified &&
        object.lastModified < before
      ) {
        orphanKeys.push(object.key);
      }
    }

    const keys = [...unreferenced.map((file) => file.key), ...orphanKeys];
    if (keys.length === 0) return 0;
    await this.storage.delete(keys);
    await this.prisma.storedFile.deleteMany({
      where: {
        storedFileId: { in: unreferenced.map((file) => file.storedFileId) },
      },
    });
    this.logger.log(`Deleted ${keys.length} unreferenced image(s)`);
    return keys.length;
  }

  private async unreferencedNoteImages(before: Date) {
    const files = await this.prisma.storedFile.findMany({
      where: { purpose: 'COACH_NOTE', createdAt: { lt: before } },
      select: { storedFileId: true, key: true, ownerUserId: true },
    });
    const owners = [...new Set(files.map((file) => file.ownerUserId))];
    const referenced = new Set<string>();
    for (const ownerUserId of owners) {
      const [notes, notebook] = await Promise.all([
        this.prisma.coachNote.findMany({
          where: { coachUserId: ownerUserId },
          select: { content: true },
        }),
        this.prisma.coachNotebook.findUnique({
          where: { coachUserId: ownerUserId },
          select: { content: true },
        }),
      ]);
      for (const text of [
        ...notes.map((note) => note.content),
        notebook?.content ?? '',
      ]) {
        for (const id of imageIdsIn(text)) referenced.add(id);
      }
    }
    return files.filter((file) => !referenced.has(file.storedFileId));
  }

  private async unreferencedMessageImages(before: Date) {
    const files = await this.prisma.storedFile.findMany({
      where: { purpose: 'MESSAGE', createdAt: { lt: before } },
      select: { storedFileId: true, key: true, messageThreadId: true },
    });
    const threads = [
      ...new Set(
        files.flatMap((file) =>
          file.messageThreadId ? [file.messageThreadId] : [],
        ),
      ),
    ];
    const referenced = new Set<string>();
    for (const messageThreadId of threads) {
      const messages = await this.prisma.message.findMany({
        where: { messageThreadId, content: { contains: '](file:' } },
        select: { content: true },
      });
      for (const message of messages) {
        for (const id of imageIdsIn(message.content)) referenced.add(id);
      }
    }
    return files.filter((file) => !referenced.has(file.storedFileId));
  }
}
