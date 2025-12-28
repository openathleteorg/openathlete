import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Athlete, TrainingLoadCalculationType } from '@openathlete/database';
import { DailyTrainingLoad, TrainingLoadMetrics } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { TrainingLoadService } from '../services/training-load.service';

@ApiTags('Training Load')
@Controller('training-load')
export class TrainingLoadController {
  constructor(private trainingLoadService: TrainingLoadService) {}

  /**
   * Calculate training load for a specific activity
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('calculate/:activityId')
  @ApiOperation({
    summary: 'Calculate training load for a specific activity',
    description:
      'Calculates and stores training load for a specific activity using the specified calculation method. Supports two methods: FOSTER_RPE (RPE × duration in minutes) and TRIMP (exponential HR-based weighting). For FOSTER_RPE, requires RPE value on the activity. For TRIMP, requires HR_MAX and HR_REST metrics, activity stream with heart rate data, and uses gender-specific coefficients. Creates or updates the training load entry for the activity. The calculation is stored with metadata including calculation parameters.',
  })
  @ApiParam({
    name: 'activityId',
    type: Number,
    description: 'ID of the activity (event) to calculate training load for',
    example: 1,
  })
  @ApiBody({
    description: 'Calculation type',
    schema: {
      type: 'object',
      properties: {
        calculationType: {
          type: 'string',
          enum: Object.values(TrainingLoadCalculationType),
          description:
            'Training load calculation method. FOSTER_RPE uses RPE × duration. TRIMP uses exponential HR weighting with gender-specific coefficients.',
          example: 'TRIMP',
        },
      },
      required: ['calculationType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Training load calculated and stored successfully',
    schema: {
      type: 'object',
      properties: {
        trainingLoadEntryId: { type: 'number', example: 1 },
        calculationId: { type: 'number', example: 1 },
        activityId: { type: 'number', example: 1 },
        date: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-15T00:00:00.000Z',
        },
        value: {
          type: 'number',
          description: 'Calculated training load value',
          example: 45.5,
        },
        metadata: {
          type: 'object',
          description: 'Calculation metadata',
          properties: {
            calculationType: {
              type: 'string',
              enum: Object.values(TrainingLoadCalculationType),
            },
            rpe: { type: 'number', nullable: true },
            duration: { type: 'number', nullable: true },
            avgHr: { type: 'number', nullable: true },
            hrMax: { type: 'number', nullable: true },
            hrRest: { type: 'number', nullable: true },
            hrReserve: { type: 'number', nullable: true },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - missing required data (RPE for FOSTER_RPE, HR metrics/stream for TRIMP)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Athlete or activity not found',
  })
  async calculateActivityLoad(
    @JwtUser() user: AuthUser,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body('calculationType') calculationType: TrainingLoadCalculationType,
  ) {
    return this.trainingLoadService.calculateActivityLoad(
      user,
      activityId,
      calculationType,
    );
  }

  /**
   * Get training load entries by period
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('period')
  @ApiOperation({
    summary: 'Get daily training load entries for a period',
    description:
      "Retrieves daily training load entries aggregated by date for a specific period. Returns one entry per day with total load and activity count. If no athleteId is provided, uses the authenticated user's Athlete. Uses CASL authorization to verify access to the Athlete.",
  })
  @ApiQuery({
    name: 'calculationType',
    type: String,
    enum: Object.values(TrainingLoadCalculationType),
    description: 'Training load calculation method to filter by',
    example: 'TRIMP',
    required: true,
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    format: 'date-time',
    description: 'Start date of the period (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    required: true,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    format: 'date-time',
    description: 'End date of the period (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    required: true,
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional Athlete ID. If not provided, uses authenticated user's Athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Daily training load entries retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Date of the training load entry',
            example: '2024-01-15T00:00:00.000Z',
          },
          load: {
            type: 'number',
            description: 'Total training load for this day',
            example: 45.5,
          },
          activityCount: {
            type: 'number',
            description: "Number of activities contributing to this day's load",
            example: 2,
          },
        },
        required: ['date', 'load', 'activityCount'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this Athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Athlete not found',
  })
  async getTrainingLoadByPeriod(
    @JwtUser() user: AuthUser,
    @Query('calculationType') calculationType: TrainingLoadCalculationType,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ): Promise<DailyTrainingLoad[]> {
    return this.trainingLoadService.getTrainingLoadByPeriod(
      user,
      calculationType,
      new Date(startDate),
      new Date(endDate),
      athleteId,
    );
  }

  /**
   * Get current training load metrics (ATL, CTL, TSB)
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('metrics')
  @ApiOperation({
    summary: 'Get current training load metrics (ATL, CTL, TSB)',
    description:
      'Retrieves current training load metrics for a specific date (defaults to today). Calculates ATL (Acute Training Load - 7-day exponentially weighted moving average), CTL (Chronic Training Load - 42-day exponentially weighted moving average), and TSB (Training Stress Balance = CTL - ATL). Also provides recommended load range for the next week based on 10% progression rule and training status (overreaching, optimal, or detraining) based on TSB thresholds. Uses data from the last 42 days for CTL calculation. Uses CASL authorization to verify access to the Athlete.',
  })
  @ApiQuery({
    name: 'calculationType',
    type: String,
    enum: Object.values(TrainingLoadCalculationType),
    description: 'Training load calculation method',
    example: 'TRIMP',
    required: true,
  })
  @ApiQuery({
    name: 'targetDate',
    type: String,
    format: 'date-time',
    description: 'Target date for metrics calculation (defaults to today)',
    example: '2024-01-15T00:00:00.000Z',
    required: false,
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional Athlete ID. If not provided, uses authenticated user's Athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Training load metrics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        atl: {
          type: 'number',
          description:
            'Acute Training Load - 7-day exponentially weighted moving average',
          example: 45.5,
        },
        ctl: {
          type: 'number',
          description:
            'Chronic Training Load - 42-day exponentially weighted moving average',
          example: 50.2,
        },
        tsb: {
          type: 'number',
          description:
            'Training Stress Balance (CTL - ATL). Positive = fresh, negative = fatigued',
          example: 4.7,
        },
        totalLoad: {
          type: 'number',
          description: 'Total training load for the period',
          example: 350.5,
        },
        trainingDays: {
          type: 'number',
          description: 'Number of days with training in the period',
          example: 15,
        },
        recommendedLoadRange: {
          type: 'object',
          description:
            'Recommended load range for next week based on 10% progression rule',
          properties: {
            min: { type: 'number', example: 40 },
            max: { type: 'number', example: 55 },
          },
        },
        status: {
          type: 'string',
          enum: ['overreaching', 'optimal', 'detraining'],
          description:
            'Training status based on TSB: overreaching (TSB < threshold), optimal (normal range), detraining (TSB > threshold)',
          example: 'optimal',
        },
      },
      required: [
        'atl',
        'ctl',
        'tsb',
        'totalLoad',
        'trainingDays',
        'recommendedLoadRange',
        'status',
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this Athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Athlete not found',
  })
  async getTrainingLoadMetrics(
    @JwtUser() user: AuthUser,
    @Query('calculationType') calculationType: TrainingLoadCalculationType,
    @Query('targetDate') targetDate?: string,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ): Promise<TrainingLoadMetrics> {
    const date = targetDate ? new Date(targetDate) : new Date();
    return this.trainingLoadService.getTrainingLoadMetrics(
      user,
      calculationType,
      date,
      athleteId,
    );
  }

  /**
   * Get historical training load with ATL/CTL/TSB over time
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('history')
  @ApiOperation({
    summary: 'Get historical training load with ATL/CTL/TSB over time',
    description:
      'Retrieves historical training load data with rolling ATL, CTL, and TSB calculations for each day in the specified period. Data is fetched starting 42 days before startDate to ensure accurate CTL calculations. Includes all days in the period, even those without activities (0 load). ATL and CTL are calculated using exponentially weighted moving averages (EWMA) that decay even on rest days, simulating fitness decay. Uses CASL authorization to verify access to the Athlete.',
  })
  @ApiQuery({
    name: 'calculationType',
    type: String,
    enum: Object.values(TrainingLoadCalculationType),
    description: 'Training load calculation method',
    example: 'TRIMP',
    required: true,
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    format: 'date-time',
    description: 'Start date of the period (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    required: true,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    format: 'date-time',
    description: 'End date of the period (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    required: true,
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional Athlete ID. If not provided, uses authenticated user's Athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Historical training load data retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Date of the entry',
            example: '2024-01-15T00:00:00.000Z',
          },
          load: {
            type: 'number',
            description: 'Training load for this day (0 for rest days)',
            example: 45.5,
          },
          atl: {
            type: 'number',
            description: 'Acute Training Load (7-day EWMA) for this day',
            example: 45.2,
          },
          ctl: {
            type: 'number',
            description: 'Chronic Training Load (42-day EWMA) for this day',
            example: 50.1,
          },
          tsb: {
            type: 'number',
            description: 'Training Stress Balance (CTL - ATL) for this day',
            example: 4.9,
          },
        },
        required: ['date', 'load', 'atl', 'ctl', 'tsb'],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this Athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Athlete not found',
  })
  async getTrainingLoadHistory(
    @JwtUser() user: AuthUser,
    @Query('calculationType') calculationType: TrainingLoadCalculationType,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    const history = await this.trainingLoadService.getTrainingLoadHistory(
      user,
      calculationType,
      new Date(startDate),
      new Date(endDate),
      athleteId,
    );

    return history;
  }

  /**
   * Get weekly TRIMP summary (actual + estimated load)
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('weekly-summary')
  @ApiOperation({
    summary: 'Get weekly TRIMP summary with actual and estimated loads',
    description:
      'Retrieves weekly TRIMP load summaries for a period, including actual loads (from completed activities) and estimated loads (from planned training sessions). Each week includes ACWR (Acute:Chronic Workload Ratio) calculation and status, recommended load range, and whether recommendations were adjusted based on ACWR. Includes a projected future week if applicable. Weeks are normalized to start on Monday. Uses CASL authorization to verify access to the Athlete.',
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    format: 'date-time',
    description: 'Start date of the period (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    required: true,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    format: 'date-time',
    description: 'End date of the period (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    required: true,
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional Athlete ID. If not provided, uses authenticated user's Athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly TRIMP summaries retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          weekStart: {
            type: 'string',
            format: 'date-time',
            description: 'Week start date (Monday)',
            example: '2024-01-01T00:00:00.000Z',
          },
          weekEnd: {
            type: 'string',
            format: 'date-time',
            description: 'Week end date (Sunday)',
            example: '2024-01-07T23:59:59.999Z',
          },
          actualLoad: {
            type: 'number',
            description: 'Actual TRIMP load from completed activities',
            example: 150.5,
          },
          estimatedLoad: {
            type: 'number',
            description: 'Estimated TRIMP load from planned training sessions',
            example: 50.0,
          },
          totalLoad: {
            type: 'number',
            description: 'Total load (actual + estimated)',
            example: 200.5,
          },
          recommendedMin: {
            type: 'number',
            description: 'Recommended minimum load for this week',
            example: 180.0,
          },
          recommendedMax: {
            type: 'number',
            description: 'Recommended maximum load for this week',
            example: 220.0,
          },
          acwr: {
            type: 'number',
            nullable: true,
            description: 'Acute:Chronic Workload Ratio (ATL/CTL)',
            example: 1.2,
          },
          acwrStatus: {
            type: 'string',
            enum: ['safe', 'optimal', 'moderate_risk', 'high_risk'],
            nullable: true,
            description: 'ACWR status based on risk thresholds',
            example: 'optimal',
          },
          acwrAdjusted: {
            type: 'boolean',
            nullable: true,
            description: 'Whether recommendations were adjusted based on ACWR',
            example: false,
          },
        },
        required: [
          'weekStart',
          'weekEnd',
          'actualLoad',
          'estimatedLoad',
          'totalLoad',
          'recommendedMin',
          'recommendedMax',
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - startDate and endDate are required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this Athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Athlete not found',
  })
  async getWeeklyTrimpSummary(
    @JwtUser() user: AuthUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    return this.trainingLoadService.getWeeklyTrimpSummary(
      user,
      new Date(startDate),
      new Date(endDate),
      athleteId,
    );
  }

  /**
   * Get all training load entries for a specific activity
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('activity/:activityId')
  @ApiOperation({
    summary: 'Get all training load entries for a specific activity',
    description:
      "Retrieves all training load entries (across all calculation types) for a specific activity. An activity can have multiple training load entries if it has been calculated using different methods (e.g., both FOSTER_RPE and TRIMP). Verifies that the activity belongs to the authenticated user's Athlete.",
  })
  @ApiParam({
    name: 'activityId',
    type: Number,
    description: 'ID of the activity (event) to get training load entries for',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Training load entries retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trainingLoadEntryId: { type: 'number', example: 1 },
          calculationId: { type: 'number', example: 1 },
          activityId: { type: 'number', example: 1 },
          date: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T00:00:00.000Z',
          },
          value: { type: 'number', example: 45.5 },
          metadata: {
            type: 'object',
            properties: {
              calculationType: {
                type: 'string',
                enum: Object.values(TrainingLoadCalculationType),
              },
              rpe: { type: 'number', nullable: true },
              duration: { type: 'number', nullable: true },
              avgHr: { type: 'number', nullable: true },
              hrMax: { type: 'number', nullable: true },
              hrRest: { type: 'number', nullable: true },
              hrReserve: { type: 'number', nullable: true },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Athlete or activity not found',
  })
  async getActivityTrainingLoads(
    @JwtUser() user: AuthUser,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.trainingLoadService.getActivityTrainingLoads(user, activityId);
  }

  /**
   * Recalculate all training loads for the Athlete
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('recalculate')
  @ApiOperation({
    summary: 'Recalculate all training loads for the Athlete',
    description:
      'Recalculates training loads for all activities of the authenticated Athlete using the specified calculation method. Useful when HR metrics (HR_MAX, HR_REST) are updated or for bulk recalculation. Processes all activities and returns the count of successfully processed entries and errors. Errors are logged but do not stop the process.',
  })
  @ApiBody({
    description: 'Calculation type',
    schema: {
      type: 'object',
      properties: {
        calculationType: {
          type: 'string',
          enum: Object.values(TrainingLoadCalculationType),
          description:
            'Training load calculation method to use for recalculation',
          example: 'TRIMP',
        },
      },
      required: ['calculationType'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Recalculation completed',
    schema: {
      type: 'object',
      properties: {
        processed: {
          type: 'number',
          description: 'Number of activities successfully processed',
          example: 150,
        },
        errors: {
          type: 'number',
          description: 'Number of activities that failed to process',
          example: 2,
        },
      },
      required: ['processed', 'errors'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - Athlete not found',
  })
  async recalculateAllLoads(
    @JwtUser() user: AuthUser,
    @Body('calculationType') calculationType: TrainingLoadCalculationType,
  ) {
    return this.trainingLoadService.recalculateAllLoads(user, calculationType);
  }
}
