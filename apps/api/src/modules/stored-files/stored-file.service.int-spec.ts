import { Readable } from 'node:stream';

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  PayloadTooLargeException,
} from '@nestjs/common';

import {
  IMAGE_MAX_BYTES,
  STORED_FILE_PURPOSE,
  imageRef,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { accountFixtureSql } from 'src/modules/auth/services/account-deletion.fixture';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

import type { StorageService } from './storage.service';
import {
  StoredFileService,
  UNREFERENCED_GRACE_MS,
} from './stored-file.service';

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
if (!databaseUrl)
  throw new Error(
    'INTEGRATION_DATABASE_URL must point to a disposable test database',
  );

// Users 1001 and 1002 share conversation 3802; nobody else is in it
const athlete: AuthUser = {
  userId: 1001,
  email: 'athlete@example.com',
  athlete: { athleteId: 2001 },
  coachAthletes: [],
};
const coach: AuthUser = {
  userId: 1002,
  email: 'coach@example.com',
  athlete: { athleteId: 2002 },
  coachAthletes: [{ athleteId: 2001 }],
};
const stranger: AuthUser = {
  userId: 999,
  email: 'stranger@example.com',
  athlete: null,
  coachAthletes: [],
};
const THREAD = 3802;
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

/** A bucket in memory */
class FakeStorage {
  objects = new Map<string, { body: Buffer; lastModified: Date }>();
  isEnabled = () => true;
  assertEnabled = () => undefined;
  put = async (key: string, body: Buffer) => {
    this.objects.set(key, { body, lastModified: new Date() });
  };
  get = async (key: string) => Readable.from(this.objects.get(key)!.body);
  delete = async (keys: string[]) => {
    for (const key of keys) this.objects.delete(key);
  };
  async *list(prefix: string) {
    for (const [key, object] of this.objects) {
      if (key.startsWith(prefix)) yield { key, ...object };
    }
  }
}

describe('StoredFileService (PostgreSQL)', () => {
  let prisma: PrismaService;
  let storage: FakeStorage;
  let service: StoredFileService;

  beforeAll(async () => {
    prisma = new PrismaService({ datasourceUrl: databaseUrl });
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    const tables = await prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> '_prisma_migrations'`;
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.table_name}"`).join(', ')} RESTART IDENTITY CASCADE`,
    );
    for (const sql of accountFixtureSql) await prisma.$executeRawUnsafe(sql);
    // Only this test's own images
    await prisma.storedFile.deleteMany();
    storage = new FakeStorage();
    service = new StoredFileService(
      prisma,
      storage as unknown as StorageService,
    );
  });

  const upload = (
    user: AuthUser,
    purpose: STORED_FILE_PURPOSE,
    messageThreadId?: number,
  ) =>
    service.uploadImage(
      user,
      { buffer: JPEG, size: JPEG.length },
      { purpose, messageThreadId },
    );

  const age = (fileId: string, ms: number) =>
    prisma.storedFile.update({
      where: { storedFileId: fileId },
      data: { createdAt: new Date(Date.now() - ms) },
    });

  it("keeps a note's image to its uploader", async () => {
    const { fileId } = await upload(coach, STORED_FILE_PURPOSE.COACH_NOTE);

    const opened = await service.open(coach, fileId);
    expect(opened.contentType).toBe('image/jpeg');
    await expect(service.open(athlete, fileId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("shows a message's image to the conversation only", async () => {
    const { fileId } = await upload(coach, STORED_FILE_PURPOSE.MESSAGE, THREAD);

    await expect(service.open(athlete, fileId)).resolves.toBeDefined();
    await expect(service.open(stranger, fileId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(
      upload(stranger, STORED_FILE_PURPOSE.MESSAGE, THREAD),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      upload(coach, STORED_FILE_PURPOSE.MESSAGE),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuses what is not an image, or too large', async () => {
    await expect(
      service.uploadImage(
        coach,
        { buffer: Buffer.from('<svg/>'), size: 6 },
        { purpose: STORED_FILE_PURPOSE.COACH_NOTE },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.uploadImage(
        coach,
        { buffer: JPEG, size: IMAGE_MAX_BYTES + 1 },
        { purpose: STORED_FILE_PURPOSE.COACH_NOTE },
      ),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    expect(storage.objects.size).toBe(0);
  });

  it('deletes the images no text shows, a day after their upload', async () => {
    const inNote = await upload(coach, STORED_FILE_PURPOSE.COACH_NOTE);
    const inNotebook = await upload(coach, STORED_FILE_PURPOSE.COACH_NOTE);
    const inMessage = await upload(coach, STORED_FILE_PURPOSE.MESSAGE, THREAD);
    const dropped = await upload(coach, STORED_FILE_PURPOSE.COACH_NOTE);
    const droppedInChat = await upload(
      coach,
      STORED_FILE_PURPOSE.MESSAGE,
      THREAD,
    );
    const fresh = await upload(coach, STORED_FILE_PURPOSE.COACH_NOTE);
    await prisma.coachNote.update({
      where: { coachNoteId: 9002 },
      data: { content: `Squat ${imageRef(inNote.fileId)}` },
    });
    await prisma.coachNotebook.update({
      where: { coachUserId: coach.userId },
      data: { content: imageRef(inNotebook.fileId) },
    });
    await prisma.message.update({
      where: { messageId: 5001 },
      data: { content: `Like this ${imageRef(inMessage.fileId)}` },
    });
    for (const file of [inNote, inNotebook, inMessage, dropped, droppedInChat])
      await age(file.fileId, UNREFERENCED_GRACE_MS + 60_000);
    // An object a deleted conversation left behind
    storage.objects.set('images/left-behind', {
      body: JPEG,
      lastModified: new Date(Date.now() - UNREFERENCED_GRACE_MS - 60_000),
    });

    expect(await service.deleteUnreferenced()).toBe(3);

    const kept = (await prisma.storedFile.findMany()).map(
      (f) => f.storedFileId,
    );
    expect(kept.sort()).toEqual(
      [inNote, inNotebook, inMessage, fresh].map((f) => f.fileId).sort(),
    );
    expect([...storage.objects.keys()].sort()).toEqual(
      kept.map((id) => `images/${id}`).sort(),
    );
  });

  it("does not count another user's note as a reference", async () => {
    const mine = await upload(athlete, STORED_FILE_PURPOSE.COACH_NOTE);
    // The coach's note shows the athlete's image id: it is not theirs
    await prisma.coachNote.update({
      where: { coachNoteId: 9002 },
      data: { content: imageRef(mine.fileId) },
    });
    await age(mine.fileId, UNREFERENCED_GRACE_MS + 60_000);

    expect(await service.deleteUnreferenced()).toBe(1);
  });
});
