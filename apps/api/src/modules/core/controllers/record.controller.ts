import {
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

import { Athlete, RecordType, SportType } from '@openathlete/database';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { RecordService } from '../services/record.service';

@ApiTags('Record')
@Controller('record')
export class RecordController {
  constructor(private recordService: RecordService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get best records for an athlete',
    description:
      "Retrieves the best records (personal bests) for an athlete, optionally filtered by sport. Records are automatically calculated from activity data and represent the best performance for each record type (SPEED, HEARTRATE, POWER, ELEVATION_GAIN, ELEVATION_LOSS, CADENCE) at each distance. The service filters records to return only the best performance for each type-distance combination: for SPEED records, it returns the record with the lowest value (fastest time), while for all other types (HEARTRATE, POWER, ELEVATION_GAIN, ELEVATION_LOSS, CADENCE), it returns the record with the highest value (best performance). If no athleteId is provided, uses the authenticated user's athlete. Uses CASL authorization to verify that the user has read access to the athlete.",
  })
  @ApiQuery({
    name: 'sport',
    type: String,
    description:
      'Optional sport type to filter records. Examples: RUNNING, TRAIL_RUNNING, CYCLING, SWIMMING, ROCK_CLIMBING, HIKING, STRENGTH, CROSSFIT, YOGA, etc.',
    example: 'RUNNING',
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
    description: 'List of best records retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          recordId: {
            type: 'number',
            description: 'Unique identifier for the record',
            example: 1,
          },
          athleteId: {
            type: 'number',
            description: 'ID of the athlete this record belongs to',
            example: 1,
          },
          eventActivityId: {
            type: 'number',
            nullable: true,
            description:
              'ID of the activity (event_activity) from which this record was extracted. Null if manually created.',
            example: 123,
          },
          type: {
            type: 'string',
            enum: Object.values(RecordType),
            description:
              'Type of record: SPEED (best time, lowest value), HEARTRATE (highest heart rate), POWER (highest power), ELEVATION_GAIN (highest elevation gain), ELEVATION_LOSS (highest elevation loss), CADENCE (highest cadence)',
            example: 'SPEED',
          },
          distance: {
            type: 'number',
            description: 'Distance in meters for which this record applies',
            example: 5000,
          },
          value: {
            type: 'number',
            description:
              'Record value. Unit depends on type: SPEED (seconds), HEARTRATE (bpm), POWER (watts), ELEVATION_GAIN/LOSS (meters), CADENCE (rpm)',
            example: 1200.5,
          },
          date: {
            type: 'string',
            format: 'date-time',
            description: 'Date when this record was achieved',
            example: '2024-01-15T10:30:00.000Z',
          },
          startDuration: {
            type: 'number',
            nullable: true,
            description:
              'Start duration in seconds for the segment where this record was achieved',
            example: 300,
          },
          endDuration: {
            type: 'number',
            nullable: true,
            description:
              'End duration in seconds for the segment where this record was achieved',
            example: 600,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the record was created',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the record was last updated',
            example: '2024-01-20T14:45:00.000Z',
          },
        },
        required: [
          'recordId',
          'athleteId',
          'type',
          'distance',
          'value',
          'date',
          'createdAt',
          'updatedAt',
        ],
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
  getRecords(
    @JwtUser() user: AuthUser,
    @Query('sport') sport?: string,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ) {
    return this.recordService.getRecords(user, sport as SportType, athleteId);
  }
}
