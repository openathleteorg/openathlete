import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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

import { Athlete, MetricType } from '@openathlete/database';
import {
  CreateMetricDto,
  UpdateMetricDto,
  createMetricDtoSchema,
  updateMetricDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { MetricService } from '../services/metric.service';

@ApiTags('Metric')
@Controller('metric')
export class MetricController {
  constructor(private metricService: MetricService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new metric entry',
    description:
      'Creates a new metric entry for an athlete. If a metric already exists for the same type and date, it is updated instead of creating a duplicate. Coaches can create metrics for their athletes by providing athleteId. Uses CASL authorization to verify that the user can manage metrics for the athlete. The value must be positive.',
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional athlete ID. If not provided, uses authenticated user's athlete. Required for coaches creating metrics for their athletes.",
    example: 1,
    required: false,
  })
  @ApiBody({
    description: 'Metric creation data',
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: Object.values(MetricType),
          description: 'Type of metric',
          example: 'WEIGHT',
        },
        date: {
          type: 'string',
          format: 'date',
          description: 'Date of the metric entry',
          example: '2024-01-15',
        },
        value: {
          type: 'number',
          description: 'Metric value (must be positive)',
          example: 70.5,
          minimum: 0,
          exclusiveMinimum: true,
        },
        notes: {
          type: 'string',
          nullable: true,
          description: 'Optional notes for this metric entry',
          example: 'Morning weight before breakfast',
        },
      },
      required: ['type', 'date', 'value'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Metric created or updated successfully',
    schema: {
      type: 'object',
      properties: {
        athleteMetricId: { type: 'number', example: 1 },
        athleteId: { type: 'number', example: 1 },
        type: { type: 'string', example: 'WEIGHT' },
        date: { type: 'string', format: 'date', example: '2024-01-15' },
        value: { type: 'number', example: 70.5 },
        notes: {
          type: 'string',
          nullable: true,
          example: 'Morning weight before breakfast',
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid value (must be positive)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user cannot manage metrics for this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  createMetric(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMetricDtoSchema))
    dto: CreateMetricDto,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    return this.metricService.createMetric(user, dto, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing metric entry',
    description:
      'Updates an existing metric entry. Only the value and notes can be updated. If athleteId is provided, verifies that the metric belongs to that athlete. Uses CASL authorization to verify that the user can manage metrics for the athlete.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the metric to update',
    example: 1,
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      'Optional athlete ID for verification. If provided, ensures the metric belongs to this athlete.',
    example: 1,
    required: false,
  })
  @ApiBody({
    description: 'Metric update data (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
          description: 'Updated metric value',
          example: 71.0,
        },
        notes: {
          type: 'string',
          nullable: true,
          description: 'Updated notes',
          example: 'Updated morning weight',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Metric updated successfully',
    schema: {
      type: 'object',
      properties: {
        athleteMetricId: { type: 'number', example: 1 },
        athleteId: { type: 'number', example: 1 },
        type: { type: 'string', example: 'WEIGHT' },
        date: { type: 'string', format: 'date', example: '2024-01-15' },
        value: { type: 'number', example: 71.0 },
        notes: {
          type: 'string',
          nullable: true,
          example: 'Updated morning weight',
        },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user cannot manage metrics for this athlete or metric does not belong to athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - metric not found',
  })
  updateMetric(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateMetricDtoSchema))
    dto: UpdateMetricDto,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    return this.metricService.updateMetric(user, id, dto, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a metric entry',
    description:
      'Permanently deletes a metric entry. If athleteId is provided, verifies that the metric belongs to that athlete. Uses CASL authorization to verify that the user can manage metrics for the athlete. This operation cannot be undone.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the metric to delete',
    example: 1,
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      'Optional athlete ID for verification. If provided, ensures the metric belongs to this athlete.',
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Metric deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user cannot manage metrics for this athlete or metric does not belong to athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - metric not found',
  })
  deleteMetric(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    return this.metricService.deleteMetric(user, id, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all metrics for an athlete',
    description:
      "Retrieves all metric entries for an athlete, optionally filtered by type. Metrics are ordered by type (ascending) then by date (descending - most recent first). If no athleteId is provided, uses the authenticated user's athlete. Uses CASL authorization to verify that the user has read access to the athlete.",
  })
  @ApiQuery({
    name: 'type',
    type: String,
    description: 'Optional metric type to filter by',
    example: 'WEIGHT',
    required: false,
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional athlete ID. If not provided, uses authenticated user's athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of metrics retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          athleteMetricId: { type: 'number', example: 1 },
          athleteId: { type: 'number', example: 1 },
          type: { type: 'string', example: 'WEIGHT' },
          date: { type: 'string', format: 'date', example: '2024-01-15' },
          value: { type: 'number', example: 70.5 },
          notes: { type: 'string', nullable: true },
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
    status: 403,
    description: 'Forbidden - user does not have read access to this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  getMetrics(
    @JwtUser() user: AuthUser,
    @Query('type') type?: string,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    return this.metricService.getMetrics(user, type as MetricType, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('latest')
  @ApiOperation({
    summary: 'Get the latest metric value for each type',
    description:
      "Retrieves the most recent metric entry for each metric type. Returns an object where keys are metric types and values are the latest metric entry for that type. Useful for getting current values of all metrics at once. If no athleteId is provided, uses the authenticated user's athlete. Uses CASL authorization to verify that the user has read access to the athlete.",
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional athlete ID. If not provided, uses authenticated user's athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Latest metrics retrieved successfully',
    schema: {
      type: 'object',
      description:
        'Object with metric types as keys and latest metric entries as values',
      additionalProperties: {
        type: 'object',
        properties: {
          athleteMetricId: { type: 'number', example: 1 },
          athleteId: { type: 'number', example: 1 },
          type: { type: 'string', example: 'WEIGHT' },
          date: { type: 'string', format: 'date', example: '2024-01-15' },
          value: { type: 'number', example: 70.5 },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      example: {
        WEIGHT: {
          athleteMetricId: 1,
          athleteId: 1,
          type: 'WEIGHT',
          date: '2024-01-15',
          value: 70.5,
          notes: null,
        },
        HR_MAX: {
          athleteMetricId: 2,
          athleteId: 1,
          type: 'HR_MAX',
          date: '2024-01-10',
          value: 195,
          notes: null,
        },
      },
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
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  getLatestMetrics(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    return this.metricService.getLatestMetrics(user, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('history/:type')
  @ApiOperation({
    summary: 'Get metric history for a specific type',
    description:
      "Retrieves all metric entries for a specific metric type, ordered by date (ascending - oldest first). Useful for tracking the evolution of a specific metric over time. If no athleteId is provided, uses the authenticated user's athlete. Uses CASL authorization to verify that the user has read access to the athlete.",
  })
  @ApiParam({
    name: 'type',
    type: String,
    description: 'Metric type to get history for',
    example: 'WEIGHT',
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional athlete ID. If not provided, uses authenticated user's athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Metric history retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          athleteMetricId: { type: 'number', example: 1 },
          athleteId: { type: 'number', example: 1 },
          type: { type: 'string', example: 'WEIGHT' },
          date: { type: 'string', format: 'date', example: '2024-01-01' },
          value: { type: 'number', example: 70.0 },
          notes: { type: 'string', nullable: true },
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
    status: 403,
    description: 'Forbidden - user does not have read access to this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  getMetricHistory(
    @JwtUser() user: AuthUser,
    @Param('type') type: string,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    return this.metricService.getMetricHistory(
      user,
      type as MetricType,
      athleteId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('calculate/:type')
  @ApiOperation({
    summary: 'Calculate an auto-calculable metric',
    description:
      "Calculates a metric value automatically based on its dependencies. Currently supports: BMI (requires WEIGHT and HEIGHT), HR_RESERVE (requires HR_MAX and HR_REST). Returns the calculated value if all dependencies are available, or null if the metric cannot be auto-calculated or if dependencies are missing. If no athleteId is provided, uses the authenticated user's athlete. Uses CASL authorization to verify that the user has read access to the athlete.",
  })
  @ApiParam({
    name: 'type',
    type: String,
    description: 'Metric type to calculate',
    example: 'BMI',
  })
  @ApiQuery({
    name: 'athleteId',
    type: Number,
    description:
      "Optional athlete ID. If not provided, uses authenticated user's athlete.",
    example: 1,
    required: false,
  })
  @ApiResponse({
    status: 200,
    description:
      'Metric calculated successfully (or null if cannot be calculated)',
    schema: {
      type: 'number',
      nullable: true,
      description:
        'Calculated metric value, or null if calculation is not possible',
      example: 22.5,
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
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  calculateMetric(
    @JwtUser() user: AuthUser,
    @Param('type') type: string,
    @Query('athleteId') athleteId?: Athlete['athleteId'],
  ) {
    if (typeof athleteId === 'string') {
      athleteId = parseInt(athleteId);
    }
    return this.metricService.calculateMetric(
      user,
      type as MetricType,
      athleteId,
    );
  }
}
