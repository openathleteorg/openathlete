import { Injectable } from '@nestjs/common';

import { SportType } from '@openathlete/database';
import {
  LabTeaserDto,
  ProfileFigure,
  SPORT_TYPE,
  climbAt,
  criticalFit,
  descentAt,
  profileProgress,
  referenceOutput,
  strongestChanges,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { RecordService } from './record.service';
import { StatisticsService } from './statistics.service';

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * The one Lab figure a non-Supporter sees: the capacity of the Lab profile
 * that progressed the most, the last twelve months against the twelve
 * before, computed as the Lab computes it. Never a figure the free views
 * already show.
 */
@Injectable()
export class LabTeaserService {
  constructor(
    private readonly statistics: StatisticsService,
    private readonly records: RecordService,
  ) {}

  async teaser(
    user: AuthUser,
    { athleteId, sport }: { athleteId: number; sport: SPORT_TYPE },
    now = new Date(),
  ): Promise<LabTeaserDto> {
    const yearAgo = new Date(now.getTime() - YEAR_MS);
    const recent = { athleteId, sport, from: yearAgo, to: now };
    const before = {
      athleteId,
      sport,
      from: new Date(now.getTime() - 2 * YEAR_MS),
      to: yearAgo,
    };
    const asRecords = (query: typeof recent) =>
      this.records.getRecords(user, {
        ...query,
        sport: sport as unknown as SportType,
      });
    const [terrain, terrainBefore, cost, costBefore, records, recordsBefore] =
      await Promise.all([
        this.statistics.getTerrain(user, recent),
        this.statistics.getTerrain(user, before),
        this.statistics.getCardiacCost(user, recent),
        this.statistics.getCardiacCost(user, before),
        asRecords(recent),
        asRecords(before),
      ]);

    const reference = referenceOutput(cost, costBefore);
    const fit = criticalFit(records, sport);
    const fitBefore = criticalFit(recordsBefore, sport);
    const figures: ProfileFigure[] = [
      {
        axis: 'climb',
        current: climbAt(terrain),
        previous: climbAt(terrainBefore),
        higherIsBetter: true,
      },
      {
        axis: 'descent',
        current: descentAt(terrain),
        previous: descentAt(terrainBefore),
        higherIsBetter: true,
      },
      {
        axis: 'critical',
        current: fit?.critical ?? null,
        // A fit of another kind (speed then power) compares nothing
        previous:
          fitBefore?.kind === fit?.kind ? (fitBefore?.critical ?? null) : null,
        higherIsBetter: true,
      },
      {
        axis: 'cost',
        current: reference?.current ?? null,
        previous: reference?.previous ?? null,
        higherIsBetter: false,
      },
    ];
    const { best } = strongestChanges(figures);
    const change = best ? profileProgress(best) : null;
    if (!best || best.current === null || change === null) return null;
    return {
      axis: best.axis as 'climb' | 'descent' | 'critical' | 'cost',
      value: best.current,
      change,
      unit:
        best.axis === 'critical'
          ? (fit?.kind ?? null)
          : best.axis === 'cost'
            ? cost.unit
            : null,
      reference: best.axis === 'cost' ? (reference?.bin ?? null) : null,
    };
  }
}
