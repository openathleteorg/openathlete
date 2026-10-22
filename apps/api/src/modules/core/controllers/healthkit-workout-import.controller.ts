import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  ImportHealthkitWorkoutDto,
  importHealthkitWorkoutDtoSchema,
} from '@openathlete/shared';

import { AuthUser, JwtUser } from '../../auth/decorators/user.decorator';
import { HealthkitWorkoutImportService } from '../services/healthkit-workout-import.service';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('activity-import/healthkit')
export class HealthkitWorkoutImportController {
  constructor(private readonly service: HealthkitWorkoutImportService) {}

  @Post()
  @ApiOperation({
    summary: 'Import or enrich one recorded Apple Health workout',
    description:
      'Protocol v1. Athlete ownership comes from the session. Stable workoutUuid and monotonic revision provide durable idempotency. Up to 100,000 timestamped samples and 20 MB JSON. Matching Garmin/Strava recordings share one canonical activity. Ambiguous matches are retained uncounted with needs_review. Derived processing is queued without AI feedback; receipt acknowledgement is not processing completion. See apps/web/docs/healthkit-workout-api.md for the shared JSON contract and examples.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'protocolVersion',
        'workoutUuid',
        'revision',
        'name',
        'sport',
        'startDate',
        'endDate',
        'elapsedDuration',
        'source',
      ],
      properties: {
        protocolVersion: { type: 'integer', enum: [1] },
        workoutUuid: { type: 'string', format: 'uuid' },
        revision: { type: 'integer', minimum: 1 },
        name: { type: 'string' },
        sport: { type: 'string', example: 'RUNNING' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        elapsedDuration: {
          type: 'object',
          properties: {
            value: { type: 'number' },
            unit: { type: 'string', enum: ['s'] },
          },
        },
        source: {
          type: 'object',
          properties: {
            bundleIdentifier: { type: 'string' },
            name: { type: 'string' },
            original: { type: 'boolean' },
          },
        },
        streams: {
          type: 'object',
          description:
            'Independent timestamped channels with explicit units; see the shared DTO and API guide.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'created, matched, enriched, unchanged or needs_review, with receiptId, revision and canonical IDs (nullable)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Malformed units, timestamps, bounds, fields or unsupported multisport parent',
  })
  @ApiResponse({ status: 403, description: 'No own athlete profile' })
  @ApiResponse({
    status: 409,
    description:
      'ACTIVITY_SOURCE_REVISION_CONFLICT: revision reused with different data',
  })
  @ApiResponse({ status: 413, description: 'JSON body exceeds 20 MB' })
  import(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(importHealthkitWorkoutDtoSchema))
    body: ImportHealthkitWorkoutDto,
  ) {
    return this.service.import(user, body);
  }

  @Get('receipts/:receiptId')
  @ApiOperation({
    summary: 'Read the current athlete’s HealthKit workout receipt',
    description:
      'Returns canonical IDs, revision, dispatch state and candidate activity IDs for ambiguous matches. Does not expose raw health data or claim processing completion.',
  })
  status(
    @JwtUser() user: AuthUser,
    @Param('receiptId', ParseIntPipe) receiptId: number,
  ) {
    return this.service.status(user, receiptId);
  }
}
