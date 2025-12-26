import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { athlete, sport_type } from '@openathlete/database';

import { UserTypeGuard } from 'src/modules/auth';
import { AuthUser, JwtUser } from 'src/modules/auth/decorators/user.decorator';

import { StatisticsService } from '../services/statistics.service';

@ApiTags('Statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get statistics for a specific athlete and period',
    description:
      'Retrieves aggregated statistics for a specific athlete over a given time period. Returns overall statistics (total duration, distance, elevation gain, activity count) and breakdown by sport. Only includes activities (event_type=ACTIVITY) within the specified date range. Uses CASL authorization to verify that the user has read access to the athlete. Statistics are computed from actual activity data: duration is calculated from start_date to end_date, distance and elevation gain are summed from activity records.',
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete to get statistics for',
    example: 1,
    required: true,
  })
  @ApiQuery({
    name: 'start',
    type: String,
    format: 'date-time',
    description: 'Start date of the period (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    required: true,
  })
  @ApiQuery({
    name: 'end',
    type: String,
    format: 'date-time',
    description: 'End date of the period (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Total duration of all activities in seconds',
          example: 72000,
        },
        distance: {
          type: 'number',
          description: 'Total distance covered in meters',
          example: 50000,
        },
        elevationGain: {
          type: 'number',
          description: 'Total elevation gain in meters',
          example: 1200,
        },
        count: {
          type: 'number',
          description: 'Total number of activities',
          example: 15,
        },
        sports: {
          type: 'array',
          description: 'Statistics broken down by sport',
          items: {
            type: 'object',
            properties: {
              sport: {
                type: 'string',
                enum: Object.values(sport_type),
                example: 'RUNNING',
              },
              duration: {
                type: 'number',
                description: 'Total duration for this sport in seconds',
                example: 36000,
              },
              distance: {
                type: 'number',
                description: 'Total distance for this sport in meters',
                example: 30000,
              },
              elevationGain: {
                type: 'number',
                description: 'Total elevation gain for this sport in meters',
                example: 800,
              },
              count: {
                type: 'number',
                description: 'Number of activities for this sport',
                example: 10,
              },
            },
            required: [
              'sport',
              'duration',
              'distance',
              'elevationGain',
              'count',
            ],
          },
        },
      },
      required: ['duration', 'distance', 'elevationGain', 'count', 'sports'],
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invalid date format or start date is not before end date',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this athlete',
  })
  getStatisticsForPeriod(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId: athlete['athlete_id'],
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.statisticsService.getStatisticsForPeriod(
      user,
      athleteId,
      startDate,
      endDate,
    );
  }
}
