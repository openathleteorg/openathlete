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

import { ProgressionService } from '../services/progression.service';

@ApiTags('Progression')
@Controller('progression')
export class ProgressionController {
  constructor(private progressionService: ProgressionService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('first-activity-date')
  @ApiOperation({
    summary: 'Get the date of the first activity for an athlete',
    description:
      'Retrieves the date of the first recorded activity for a specific athlete. If a sport is provided, returns the first activity date for that specific sport only. Only considers activities (event_type=ACTIVITY) that have associated activity data. Uses CASL authorization to verify that the user has read access to the athlete. Returns null if no activities are found.',
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete to get the first activity date for',
    example: 1,
    required: true,
  })
  @ApiQuery({
    name: 'sport',
    type: String,
    enum: Object.values(sport_type),
    description: 'Optional sport type to filter by',
    example: 'RUNNING',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description:
      'First activity date retrieved successfully (or null if no activities)',
    schema: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      example: '2024-01-01T08:00:00.000Z',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this athlete',
  })
  getFirstActivityDate(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId: athlete['athlete_id'],
    @Query('sport') sport?: string,
  ) {
    return this.progressionService.getFirstActivityDate(
      user,
      athleteId,
      sport as sport_type | undefined,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get progression data for an athlete over a period',
    description:
      'Retrieves aggregated progression data for a specific athlete over a given time period. Data is automatically aggregated by week (if period <= 120 days) or by month (if period > 120 days). Each data point includes metrics like total distance, average speed, elevation gain, heart rate, cadence, and efficiency. If a sport is provided, filters activities to that specific sport only. Only includes activities (event_type=ACTIVITY) with associated activity data. Uses CASL authorization to verify that the user has read access to the athlete. Efficiency is calculated as averageGapSpeed / averageHeartrate when both are available.',
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete to get progression data for',
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
    example: '2024-12-31T23:59:59.999Z',
    required: true,
  })
  @ApiQuery({
    name: 'sport',
    type: String,
    enum: Object.values(sport_type),
    description: 'Optional sport type to filter activities by',
    example: 'RUNNING',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Progression data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        aggregationType: {
          type: 'string',
          enum: ['week', 'month'],
          description:
            'How the data is aggregated: "week" for periods <= 120 days, "month" for periods > 120 days',
          example: 'month',
        },
        data: {
          type: 'array',
          description:
            'Array of progression data points, sorted by period (oldest first)',
          items: {
            type: 'object',
            properties: {
              period: {
                type: 'string',
                format: 'date-time',
                description:
                  'ISO date string for the start of the period (Monday for weeks, 1st of month for months)',
                example: '2024-01-01T00:00:00.000Z',
              },
              totalDistance: {
                type: 'number',
                description: 'Total distance covered in this period (meters)',
                example: 50000,
              },
              averageDistancePerActivity: {
                type: 'number',
                description:
                  'Average distance per activity in this period (meters)',
                example: 5000,
              },
              averageSpeed: {
                type: 'number',
                description:
                  'Average speed across all activities in this period (m/s)',
                example: 3.5,
              },
              averageGapSpeed: {
                type: 'number',
                nullable: true,
                description:
                  'Average gap-adjusted speed (m/s). Null if no gap speed data available.',
                example: 3.6,
              },
              efficiency: {
                type: 'number',
                nullable: true,
                description:
                  'Efficiency metric calculated as averageGapSpeed / averageHeartrate. Null if gap speed or heart rate data is missing.',
                example: 0.045,
              },
              totalElevationGain: {
                type: 'number',
                description: 'Total elevation gain in this period (meters)',
                example: 1200,
              },
              averageElevationGainPerActivity: {
                type: 'number',
                description:
                  'Average elevation gain per activity in this period (meters)',
                example: 120,
              },
              averageHeartrate: {
                type: 'number',
                nullable: true,
                description:
                  'Average heart rate across all activities (bpm). Null if no HR data available.',
                example: 150,
              },
              averageCadence: {
                type: 'number',
                nullable: true,
                description:
                  'Average cadence across all activities (rpm). Null if no cadence data available.',
                example: 180,
              },
              activityCount: {
                type: 'number',
                description: 'Number of activities in this period',
                example: 10,
              },
            },
            required: [
              'period',
              'totalDistance',
              'averageDistancePerActivity',
              'averageSpeed',
              'totalElevationGain',
              'averageElevationGainPerActivity',
              'activityCount',
            ],
          },
        },
      },
      required: ['aggregationType', 'data'],
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
  getProgressionData(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId: athlete['athlete_id'],
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('sport') sport?: string,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.progressionService.getProgressionData(
      user,
      athleteId,
      startDate,
      endDate,
      sport as sport_type | undefined,
    );
  }
}
