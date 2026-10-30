import { ZodValidationPipe } from 'nestjs-zod';

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { SportType } from '@openathlete/database';
import {
  GetStatisticsFiltersQueryDto,
  GetStatisticsOverviewQueryDto,
  GetStatisticsSectionQueryDto,
  GetStatisticsTrendsQueryDto,
  getStatisticsFiltersQuerySchema,
  getStatisticsOverviewQuerySchema,
  getStatisticsSectionQuerySchema,
  getStatisticsTrendsQuerySchema,
} from '@openathlete/shared';

import { UserTypeGuard } from 'src/modules/auth';
import { AuthUser, JwtUser } from 'src/modules/auth/decorators/user.decorator';

import { StatisticsService } from '../services/statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('filters')
  @ApiOperation({
    summary: 'Sports and first activity of an athlete',
    description:
      'What the statistics page offers as filters: the sports of the athlete, the most practised first, and the date of their first activity.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getFilters(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsFiltersQuerySchema))
    query: GetStatisticsFiltersQueryDto,
  ) {
    return this.statisticsService.getFilters(user, query.athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('overview')
  @ApiOperation({
    summary: 'Totals of a period',
    description:
      'Time in motion, distance, elevation gain, activity count and TRIMP load of a period, overall and by sport, and the totals of a period to compare with.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType, required: false })
  @ApiQuery({
    name: 'group',
    enum: ['RUNNING', 'CYCLING', 'SKIING'],
    required: false,
  })
  @ApiQuery({
    name: 'compareFrom',
    type: String,
    format: 'date-time',
    required: false,
  })
  @ApiQuery({
    name: 'compareTo',
    type: String,
    format: 'date-time',
    required: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid period' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getOverview(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsOverviewQuerySchema))
    query: GetStatisticsOverviewQueryDto,
  ) {
    return this.statisticsService.getOverview(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('volume')
  @ApiOperation({
    summary: 'Volume of a period, bucket by bucket',
    description:
      "Time in motion, distance, elevation gain and activity count by sport, by day, week or month depending on the period. Buckets follow the athlete's calendar; empty ones are included, and those the period cuts or that are still running are marked partial.",
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType, required: false })
  @ApiQuery({
    name: 'group',
    enum: ['RUNNING', 'CYCLING', 'SKIING'],
    required: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid period' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getVolume(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsSectionQuerySchema))
    query: GetStatisticsSectionQueryDto,
  ) {
    return this.statisticsService.getVolume(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('days')
  @ApiOperation({
    summary: 'Active days of a period',
    description:
      "Time in motion, distance, elevation gain and activity count of each day with an activity, on the athlete's calendar.",
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType, required: false })
  @ApiQuery({
    name: 'group',
    enum: ['RUNNING', 'CYCLING', 'SKIING'],
    required: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid period' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getDays(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsSectionQuerySchema))
    query: GetStatisticsSectionQueryDto,
  ) {
    return this.statisticsService.getDays(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('intensity')
  @ApiOperation({
    summary: 'Time in the intensity domains',
    description:
      "Seconds below, between and above the two thresholds, from the athlete's heart rate zones, bucket by bucket, with efficiency and aerobic decoupling on steady outings.",
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType, required: false })
  @ApiQuery({
    name: 'group',
    enum: ['RUNNING', 'CYCLING', 'SKIING'],
    required: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid period' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getIntensity(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsSectionQuerySchema))
    query: GetStatisticsSectionQueryDto,
  ) {
    return this.statisticsService.getIntensity(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('long-runs')
  @ApiOperation({
    summary: 'Runs well beyond the usual longest',
    description:
      'Runs of the period over 10% longer than the longest of the 30 days before them.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiResponse({ status: 400, description: 'Invalid period' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getLongRuns(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsSectionQuerySchema))
    query: GetStatisticsSectionQueryDto,
  ) {
    return this.statisticsService.getLongRuns(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('terrain')
  @ApiOperation({
    summary: 'Vertical speed by slope',
    description:
      'Median vertical speed and its middle half by percent of slope, read on the activities of a sport, and the metres climbed and descended by class of slope.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType })
  @ApiResponse({ status: 400, description: 'Invalid period or sport' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getTerrain(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsTrendsQuerySchema))
    query: GetStatisticsTrendsQueryDto,
  ) {
    return this.statisticsService.getTerrain(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('cardiac-cost')
  @ApiOperation({
    summary: 'Heart rate by speed or power',
    description:
      'Median heart rate and its middle half at each band of grade adjusted speed, or of power on a bike.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType })
  @ApiResponse({ status: 400, description: 'Invalid period or sport' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getCardiacCost(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsTrendsQuerySchema))
    query: GetStatisticsTrendsQueryDto,
  ) {
    return this.statisticsService.getCardiacCost(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('durability')
  @ApiOperation({
    summary: 'How efforts hold over time',
    description:
      'Drift of output and heart rate between the first and last third of outings of an hour or more, by their length.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType })
  @ApiResponse({ status: 400, description: 'Invalid period or sport' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getDurability(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsTrendsQuerySchema))
    query: GetStatisticsTrendsQueryDto,
  ) {
    return this.statisticsService.getDurability(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('trends')
  @ApiOperation({
    summary: "How a sport's averages evolve",
    description:
      'Distance and elevation per activity, and speed, grade adjusted speed, heart rate, cadence and power averaged over time in motion, bucket by bucket. Averages only mean something within a sport, so the sport is required.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType })
  @ApiResponse({ status: 400, description: 'Invalid period or sport' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getTrends(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsTrendsQuerySchema))
    query: GetStatisticsTrendsQueryDto,
  ) {
    return this.statisticsService.getTrends(user, query);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('load')
  @ApiOperation({
    summary: 'Load and form of a period',
    description:
      'TRIMP load, session RPE, fitness (CTL), fatigue (ATL) and form (TSB), by day, or by week on periods over 400 days, of one sport or all of them. Without a sport, a period reaching today goes on six weeks over the planned sessions.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'from', type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', type: String, format: 'date-time' })
  @ApiQuery({ name: 'sport', enum: SportType, required: false })
  @ApiQuery({
    name: 'group',
    enum: ['RUNNING', 'CYCLING', 'SKIING'],
    required: false,
  })
  @ApiResponse({ status: 400, description: 'Invalid period' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getLoad(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getStatisticsSectionQuerySchema))
    query: GetStatisticsSectionQueryDto,
  ) {
    return this.statisticsService.getLoad(user, query);
  }
}
