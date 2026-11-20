import { BadRequestException, Injectable } from '@nestjs/common';

import { SEOPlanData } from '@openathlete/shared';

import { validTimeZone, zonedClock } from 'src/common/utils/time-zone';

import { AuthUser } from '../../auth/decorators/user.decorator';
import { PrismaService } from '../../prisma/services/prisma.service';
import { TrainingPlanLibraryService } from './training-plan-library.service';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly library: TrainingPlanLibraryService,
  ) {}

  /**
   * Imports a plan of the website, starting on `startDate`. It goes through
   * the library's apply path: one transaction, and the sessions linked to the
   * plan so it can be moved or removed as a whole.
   */
  async importSeoPlan(
    user: AuthUser,
    planData: SEOPlanData,
    startDate: Date | string,
  ) {
    const athleteId = user?.athlete?.athleteId;
    if (!athleteId) {
      throw new BadRequestException('Athlete ID is required');
    }
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    if (isNaN(start.getTime())) {
      throw new BadRequestException('Invalid start date provided');
    }

    const athlete = await this.prisma.athlete.findUniqueOrThrow({
      where: { athleteId },
      select: { user: { select: { timeZone: true } } },
    });
    // The app sends the chosen day's local midnight as an instant
    const day = zonedClock(start, validTimeZone(athlete.user.timeZone)).date;

    const { trainingPlanId } = await this.library.applyWebsitePlan(
      user,
      planData,
      day,
    );

    return this.prisma.trainingPlan.findUnique({
      where: { trainingPlanId },
      include: {
        cycles: {
          include: {
            weeks: {
              include: {
                sessions: true,
              },
            },
          },
        },
      },
    });
  }
}
