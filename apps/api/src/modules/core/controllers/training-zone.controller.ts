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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { sport_type, training_zone_type } from '@openathlete/database';
import {
  CreateTrainingZoneDto,
  UpdateTrainingZoneDto,
  createTrainingZoneDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { TrainingZoneService } from '../services/training-zone.service';

@ApiTags('Training Zone')
@Controller('training-zone')
export class TrainingZoneController {
  constructor(private readonly trainingZoneService: TrainingZoneService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('athlete/:athleteId')
  @ApiOperation({
    summary: 'Get all training zones for an athlete',
    description:
      'Retrieves all training zones for a specific athlete. Zones are ordered by index (ascending). Each zone includes its values (min, max, associated sports). Uses CASL authorization to verify that the user has read access to the athlete.',
  })
  @ApiParam({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete to get training zones for',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of training zones retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trainingZoneId: { type: 'number', example: 1 },
          athleteId: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Zone 1 - Recovery' },
          description: {
            type: 'string',
            example: 'Easy recovery pace',
          },
          index: {
            type: 'number',
            description: 'Zone index for ordering (0-based)',
            example: 0,
          },
          type: {
            type: 'string',
            enum: Object.values(training_zone_type),
            description: 'Type of training zone',
            example: 'HEARTRATE',
          },
          color: {
            type: 'string',
            description: 'Color code for the zone (hex or CSS color)',
            example: '#00FF00',
          },
          values: {
            type: 'array',
            description: 'Zone values (min, max, sports)',
            items: {
              type: 'object',
              properties: {
                trainingZoneValueId: { type: 'number', example: 1 },
                trainingZoneId: { type: 'number', example: 1 },
                min: {
                  type: 'number',
                  description:
                    'Minimum value for the zone (unit depends on type)',
                  example: 120,
                },
                max: {
                  type: 'number',
                  description:
                    'Maximum value for the zone (unit depends on type)',
                  example: 140,
                },
                sports: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Sports this zone value applies to',
                  example: ['RUNNING', 'TRAIL_RUNNING'],
                },
              },
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
    status: 403,
    description: 'Forbidden - user does not have read access to this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  getAllForAthlete(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
  ) {
    return this.trainingZoneService.getAllForAthlete(user, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new training zone',
    description:
      'Creates a new training zone for an athlete. The zone index is automatically set based on the number of existing zones of the same type. A zone value is automatically created with the provided min, max, and sports. Uses CASL authorization to verify that the user has update access to the athlete.',
  })
  @ApiBody({
    description: 'Training zone creation data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Zone name (minimum 1 character)',
          example: 'Zone 1 - Recovery',
          minLength: 1,
        },
        description: {
          type: 'string',
          nullable: true,
          description: 'Zone description',
          example: 'Easy recovery pace for active recovery',
        },
        type: {
          type: 'string',
          enum: Object.values(training_zone_type),
          description: 'Type of training zone',
          example: 'HEARTRATE',
        },
        min: {
          type: 'number',
          description:
            'Minimum value for the zone. Unit depends on type: bpm for HEARTRATE, watts for POWER, m/s for PACE',
          example: 120,
        },
        max: {
          type: 'number',
          description:
            'Maximum value for the zone. Unit depends on type: bpm for HEARTRATE, watts for POWER, m/s for PACE',
          example: 140,
        },
        color: {
          type: 'string',
          description: 'Color code for the zone (hex or CSS color)',
          example: '#00FF00',
        },
        sports: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(sport_type),
          },
          description: 'Array of sports this zone applies to',
          example: ['RUNNING', 'TRAIL_RUNNING'],
          minItems: 1,
        },
        athleteId: {
          type: 'number',
          description: 'ID of the athlete to create the zone for',
          example: 1,
        },
      },
      required: ['name', 'type', 'min', 'max', 'color', 'sports', 'athleteId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Training zone created successfully',
    schema: {
      type: 'object',
      properties: {
        trainingZoneId: { type: 'number', example: 1 },
        athleteId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Zone 1 - Recovery' },
        description: { type: 'string', example: 'Easy recovery pace' },
        index: {
          type: 'number',
          description: 'Zone index (automatically assigned)',
          example: 0,
        },
        type: {
          type: 'string',
          enum: Object.values(training_zone_type),
          example: 'HEARTRATE',
        },
        color: { type: 'string', example: '#00FF00' },
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trainingZoneValueId: { type: 'number', example: 1 },
              trainingZoneId: { type: 'number', example: 1 },
              min: { type: 'number', example: 120 },
              max: { type: 'number', example: 140 },
              sports: {
                type: 'array',
                items: { type: 'string' },
                example: ['RUNNING', 'TRAIL_RUNNING'],
              },
            },
          },
        },
        createdAt: { type: 'string', format: 'date-time' },
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
    description: 'Forbidden - user does not have update access to this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  async create(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTrainingZoneDtoSchema))
    dto: CreateTrainingZoneDto,
  ) {
    return this.trainingZoneService.create(user, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':trainingZoneId')
  @ApiOperation({
    summary: 'Update a training zone',
    description:
      'Updates an existing training zone. Only the zone owner (athlete or their coach) can update it. Currently updates only the first zone value. The type can be changed, but this should be done carefully as it affects how the zone is used. Uses CASL authorization to verify that the user has update access to the athlete.',
  })
  @ApiParam({
    name: 'trainingZoneId',
    type: Number,
    description: 'ID of the training zone to update',
    example: 1,
  })
  @ApiBody({
    description: 'Training zone update data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Updated zone name (minimum 1 character)',
          example: 'Zone 1 - Recovery (Updated)',
          minLength: 1,
        },
        description: {
          type: 'string',
          nullable: true,
          description: 'Updated zone description',
          example: 'Updated easy recovery pace',
        },
        type: {
          type: 'string',
          enum: Object.values(training_zone_type),
          description: 'Updated zone type (optional)',
          example: 'HEARTRATE',
        },
        min: {
          type: 'number',
          description:
            'Updated minimum value. Unit depends on type: bpm for HEARTRATE, watts for POWER, m/s for PACE',
          example: 115,
        },
        max: {
          type: 'number',
          description:
            'Updated maximum value. Unit depends on type: bpm for HEARTRATE, watts for POWER, m/s for PACE',
          example: 135,
        },
        color: {
          type: 'string',
          description: 'Updated color code',
          example: '#00FF00',
        },
        sports: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(sport_type),
          },
          description: 'Updated array of sports',
          example: ['RUNNING'],
        },
      },
      required: ['name', 'min', 'max', 'color', 'sports'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Training zone updated successfully',
    schema: {
      type: 'object',
      properties: {
        trainingZoneId: { type: 'number', example: 1 },
        athleteId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Zone 1 - Recovery (Updated)' },
        description: { type: 'string', example: 'Updated easy recovery pace' },
        index: { type: 'number', example: 0 },
        type: {
          type: 'string',
          enum: Object.values(training_zone_type),
          example: 'HEARTRATE',
        },
        color: { type: 'string', example: '#00FF00' },
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trainingZoneValueId: { type: 'number', example: 1 },
              trainingZoneId: { type: 'number', example: 1 },
              min: { type: 'number', example: 115 },
              max: { type: 'number', example: 135 },
              sports: {
                type: 'array',
                items: { type: 'string' },
                example: ['RUNNING'],
              },
            },
          },
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
    description: 'Forbidden - user does not have update access to this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - training zone or athlete not found',
  })
  async update(
    @JwtUser() user: AuthUser,
    @Param('trainingZoneId', ParseIntPipe) trainingZoneId: number,
    @Body() dto: UpdateTrainingZoneDto,
  ) {
    return this.trainingZoneService.update(user, trainingZoneId, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':trainingZoneId')
  @ApiOperation({
    summary: 'Delete a training zone',
    description:
      'Permanently deletes a training zone and all its associated values. Only the zone owner (athlete or their coach) can delete it. Uses CASL authorization to verify that the user has update access to the athlete. This operation cannot be undone.',
  })
  @ApiParam({
    name: 'trainingZoneId',
    type: Number,
    description: 'ID of the training zone to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Training zone deleted successfully',
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
    description: 'Forbidden - user does not have update access to this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - training zone or athlete not found',
  })
  delete(
    @JwtUser() user: AuthUser,
    @Param('trainingZoneId', ParseIntPipe) trainingZoneId: number,
  ) {
    return this.trainingZoneService.delete(user, trainingZoneId);
  }
}
