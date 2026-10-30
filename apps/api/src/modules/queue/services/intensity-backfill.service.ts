import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

import { Prisma } from '@openathlete/database';

import {
  INTENSITY_VERSION,
  IntensityProcessor,
} from '../../core/services/pipeline/processors/intensity.processor';
import { PrismaService } from '../../prisma/services/prisma.service';

const BATCH_SIZE = 50;

/** Editing zones marks activities from the API: the worker sees it from here */
const SWEEP_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Recomputes the intensity of activities marked out of date, by a new version
 * or by a change of zones. Runs on the containers that process activities, a
 * batch at a time, at startup and then regularly.
 */
@Injectable()
export class IntensityBackfillService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(IntensityBackfillService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly intensity: IntensityProcessor,
  ) {}

  onApplicationBootstrap() {
    this.sweep();
    this.timer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    this.timer.unref();
  }

  onApplicationShutdown() {
    clearInterval(this.timer);
  }

  private sweep() {
    if (this.running) return;
    this.running = true;
    // Not awaited: the backfill must not delay startup
    void this.run()
      .catch((error: unknown) =>
        this.logger.error(
          `Intensity backfill stopped: ${error instanceof Error ? error.message : String(error)}`,
        ),
      )
      .finally(() => {
        this.running = false;
      });
  }

  async run(): Promise<number> {
    let done = 0;
    for (;;) {
      const batch = await this.prisma.eventActivity.findMany({
        where: {
          intensityVersion: { lt: INTENSITY_VERSION },
          stream: { not: Prisma.DbNull },
        },
        select: { eventActivityId: true, eventId: true },
        orderBy: { eventActivityId: 'asc' },
        take: BATCH_SIZE,
      });
      if (batch.length === 0) break;
      for (const ctx of batch) {
        try {
          await this.intensity.run(ctx);
        } catch (error) {
          this.logger.warn(
            `Intensity of activity ${ctx.eventActivityId} could not be computed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        // Done, or failed: not to retry forever
        await this.prisma.eventActivity.update({
          where: { eventActivityId: ctx.eventActivityId },
          data: { intensityVersion: INTENSITY_VERSION },
        });
        done++;
        // The worker also runs import jobs: let them through
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
    if (done > 0) {
      this.logger.log(`Recomputed the intensity of ${done} activities`);
    }
    return done;
  }
}
