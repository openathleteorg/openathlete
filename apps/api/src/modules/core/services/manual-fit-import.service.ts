import { createHash } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';

import { Athlete, Prisma } from '@openathlete/database';
import {
  CompressedActivityStream,
  SPORT_TYPE,
  isValidGpsPoint,
} from '@openathlete/shared';

import { AuthUser } from '../../auth/decorators/user.decorator';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { uncompressActivityStream } from '../helpers/activity-stream';
import {
  MAX_MANUAL_FIT_BYTES,
  prepareManualFit,
} from '../helpers/manual-fit-import';
import { prepareManualGpx } from '../helpers/manual-gpx-import';
import { FitParserStrategy } from '../helpers/strategies/fit-parser.strategy';

export type ManualFitFile = {
  originalname: string;
  size: number;
  buffer: Buffer;
};

type FileFormat = 'FIT' | 'GPX';
type PreparedActivity =
  ReturnType<typeof prepareManualFit> | ReturnType<typeof prepareManualGpx>;

@Injectable()
export class ManualFitImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
  ) {}

  /** The activity always goes to the caller's own athlete profile. */
  private async ownAthlete(user: AuthUser) {
    const athlete = await this.prisma.athlete.findUnique({
      where: { userId: user.userId },
    });
    if (!athlete) throw new ForbiddenException();
    return athlete;
  }

  private checkFile(
    file: ManualFitFile | undefined,
    format: FileFormat,
  ): asserts file is ManualFitFile {
    if (
      !file?.buffer?.length ||
      !file.originalname.toLowerCase().endsWith(`.${format.toLowerCase()}`)
    )
      throw new BadRequestException(`${format}_INVALID`);
    if (
      file.size > MAX_MANUAL_FIT_BYTES ||
      file.buffer.length > MAX_MANUAL_FIT_BYTES
    )
      throw new PayloadTooLargeException(`${format}_LIMIT`);
  }

  async import(user: AuthUser, file: ManualFitFile | undefined, name: string) {
    const athlete = await this.ownAthlete(user);
    this.checkFile(file, 'FIT');
    let fit: ReturnType<typeof prepareManualFit>;
    try {
      fit = prepareManualFit(
        await new FitParserStrategy().parse(
          Uint8Array.from(file.buffer).buffer,
        ),
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('FIT_INVALID');
    }
    return this.save(athlete, fit, file, name, 'FIT');
  }

  /**
   * A recorded GPX activity. GPX has no reliable sport, so the athlete can
   * choose it; otherwise the track's type is used when known.
   */
  async importGpx(
    user: AuthUser,
    file: ManualFitFile | undefined,
    name: string,
    sport?: SPORT_TYPE,
  ) {
    const athlete = await this.ownAthlete(user);
    this.checkFile(file, 'GPX');
    return this.save(
      athlete,
      prepareManualGpx(file.buffer, sport),
      file,
      name,
      'GPX',
    );
  }

  /**
   * Stores a prepared file once: the same file again restores only missing
   * GPS, another activity with the same start is refused, and new activities
   * go through the normal processing pipeline without AI feedback.
   */
  private async save(
    athlete: Athlete,
    fit: PreparedActivity,
    file: ManualFitFile,
    name: string,
    format: FileFormat,
  ) {
    const externalId = `${format.toLowerCase()}-manual:${athlete.athleteId}:${createHash('sha256').update(file.buffer).digest('hex')}`;
    const findExisting = () =>
      this.prisma.eventActivity.findUnique({
        where: { externalId },
        include: { event: true },
      });
    const store = () =>
      this.prisma.$transaction(
        async (tx) => {
          const existing = await tx.eventActivity.findUnique({
            where: { externalId },
            include: { event: true },
          });
          if (existing) {
            // Restore only missing GPS from the exact same owned file. Keep
            // name, feedback, summaries, laps and processed sensor data intact.
            const stored = (existing.stream ?? {}) as CompressedActivityStream;
            const oldStream = uncompressActivityStream(stored);
            const newStream = uncompressActivityStream(fit.details.stream);
            if (
              !oldStream.latlng?.some(isValidGpsPoint) &&
              newStream.latlng?.some(isValidGpsPoint) &&
              oldStream.time?.length === newStream.time?.length &&
              oldStream.time?.every((t, i) => t === newStream.time?.[i])
            ) {
              await tx.eventActivity.update({
                where: { eventActivityId: existing.eventActivityId },
                data: {
                  stream: {
                    ...stored,
                    latlng: fit.details.stream.latlng,
                  } as Prisma.InputJsonObject,
                },
              });
            }
            return { activity: existing, alreadyImported: true };
          }
          const sameStart = await tx.event.findFirst({
            where: {
              athleteId: athlete.athleteId,
              type: 'ACTIVITY',
              startDate: fit.startDate,
            },
          });
          if (sameStart)
            throw new ConflictException(`${format}_DUPLICATE_TIME`);
          const event = await tx.event.create({
            data: {
              athleteId: athlete.athleteId,
              type: 'ACTIVITY',
              name,
              startDate: fit.startDate,
              endDate: fit.endDate,
              activity: {
                create: {
                  ...fit.activity,
                  externalId,
                  provider: null,
                  stream: fit.details
                    .stream as unknown as Prisma.InputJsonObject,
                  segments: { create: fit.details.segments },
                },
              },
            },
            include: { activity: true },
          });
          return {
            activity: { ...event.activity!, event },
            alreadyImported: false,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 15000,
        },
      );
    // Concurrent serializable imports, from other athletes too, can fail to
    // serialize: retry them before reporting a conflict.
    let saved: Awaited<ReturnType<typeof store>> | undefined;
    for (let attempt = 1; !saved; attempt++) {
      try {
        saved = await store();
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !['P2002', 'P2034'].includes(error.code)
        )
          throw error;
        const existing = await findExisting();
        if (existing) saved = { activity: existing, alreadyImported: true };
        else if (error.code === 'P2002' || attempt >= 3)
          throw new ConflictException(`${format}_CONFLICT`);
      }
    }
    let processingQueued = true;
    try {
      // Historical file import uses the normal pipeline without generating AI feedback.
      // Reimporting an identical file can retry queue submission without duplicating data.
      await this.queue.addActivityProcessingJob(
        saved.activity.eventActivityId,
        saved.activity.eventId,
        true,
      );
    } catch {
      processingQueued = false;
    }
    return {
      eventId: saved.activity.eventId,
      startDate: saved.activity.event.startDate,
      name: saved.activity.event.name,
      alreadyImported: saved.alreadyImported,
      processingQueued,
      warnings: fit.warnings,
    };
  }
}
