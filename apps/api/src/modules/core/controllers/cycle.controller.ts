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

import { Cycle } from '@openathlete/database';
import {
  CreateCycleDto,
  UpdateCycleDto,
  createCycleDtoSchema,
  updateCycleDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { CycleService } from '../services';

@ApiTags('Cycle')
@Controller('cycle')
export class CycleController {
  constructor(private cycleService: CycleService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get cycles for the authenticated user',
    description:
      'Retrieves training cycles accessible to the authenticated user. Cycles are used to organize training periods (e.g., base training, specific preparation, taper). If coach=true, returns cycles for all athletes the user coaches. If athleteId is provided, filters cycles for that specific athlete. For coaches, if athleteId is provided, verifies that the user is coaching that athlete. Each cycle includes athlete information. Uses CASL authorization to determine which cycles the user can access.',
  })
  @ApiQuery({
    name: 'coach',
    type: String,
    description:
      'If "true", returns cycles for all athletes the user coaches. Otherwise, returns cycles for the user\'s own athlete.',
    example: 'true',
    required: false,
  })
  @ApiQuery({
    name: 'athleteId',
    type: String,
    description:
      'Optional athlete ID to filter cycles. If coach=true, filters to this specific athlete and verifies coaching relationship. If coach=false, this parameter is ignored.',
    example: '1',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of cycles retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          cycleId: {
            type: 'number',
            description: 'Unique identifier for the cycle',
            example: 1,
          },
          athleteId: {
            type: 'number',
            nullable: true,
            description: 'ID of the athlete this cycle belongs to',
            example: 1,
          },
          trainingPlanId: {
            type: 'number',
            nullable: true,
            description:
              'ID of the training plan this cycle belongs to, if any',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Name of the cycle',
            example: 'Base Training Phase',
          },
          description: {
            type: 'string',
            description: 'Description of the cycle. Default: empty string',
            example: 'Focus on building aerobic base',
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Start date of the cycle',
            example: '2024-01-01T00:00:00.000Z',
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'End date of the cycle',
            example: '2024-03-31T23:59:59.999Z',
          },
          color: {
            type: 'string',
            nullable: true,
            description:
              'Hex color code for the cycle (e.g., "#FF5733"). Used for calendar display.',
            example: '#FF5733',
          },
          phase: {
            type: 'string',
            nullable: true,
            description:
              'Training phase type (BASE, SPECIFIC, TAPER, etc.). Optional.',
            example: 'BASE',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the cycle was created',
            example: '2024-01-01T10:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the cycle was last updated',
            example: '2024-01-15T14:30:00.000Z',
          },
          athlete: {
            type: 'object',
            nullable: true,
            description: 'Athlete information, if included',
          },
        },
        required: [
          'cycleId',
          'name',
          'description',
          'startDate',
          'endDate',
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
    description:
      'Forbidden - user is not coaching the specified athlete (when coach=true and athleteId provided)',
  })
  getMyCycles(
    @JwtUser() user: AuthUser,
    @Query('coach') coach: string,
    @Query('athleteId') athleteId: string,
  ) {
    return this.cycleService.getMyCycles(
      user,
      coach === 'true',
      athleteId ? Number(athleteId) : undefined,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get(':cycleId')
  @ApiOperation({
    summary: 'Get a specific cycle by ID',
    description:
      'Retrieves a single training cycle by its ID. The cycle includes athlete information. Cycles are used to organize training periods and can be associated with training plans. Uses CASL authorization to verify that the user has read access to the cycle.',
  })
  @ApiParam({
    name: 'cycleId',
    type: Number,
    description: 'ID of the cycle to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cycle retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        cycleId: {
          type: 'number',
          description: 'Unique identifier for the cycle',
          example: 1,
        },
        athleteId: {
          type: 'number',
          nullable: true,
          description: 'ID of the athlete this cycle belongs to',
          example: 1,
        },
        trainingPlanId: {
          type: 'number',
          nullable: true,
          description: 'ID of the training plan this cycle belongs to, if any',
          example: 1,
        },
        name: {
          type: 'string',
          description: 'Name of the cycle',
          example: 'Base Training Phase',
        },
        description: {
          type: 'string',
          description: 'Description of the cycle',
          example: 'Focus on building aerobic base',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          description: 'Start date of the cycle',
          example: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: 'End date of the cycle',
          example: '2024-03-31T23:59:59.999Z',
        },
        color: {
          type: 'string',
          nullable: true,
          description:
            'Hex color code for the cycle (e.g., "#FF5733"). Used for calendar display.',
          example: '#FF5733',
        },
        phase: {
          type: 'string',
          nullable: true,
          description:
            'Training phase type (BASE, SPECIFIC, TAPER, etc.). Optional.',
          example: 'BASE',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the cycle was created',
          example: '2024-01-01T10:00:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the cycle was last updated',
          example: '2024-01-15T14:30:00.000Z',
        },
        athlete: {
          type: 'object',
          nullable: true,
          description: 'Athlete information',
        },
      },
      required: [
        'cycleId',
        'name',
        'description',
        'startDate',
        'endDate',
        'createdAt',
        'updatedAt',
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this cycle',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - cycle not found',
  })
  getCycle(
    @JwtUser() user: AuthUser,
    @Param('cycleId', ParseIntPipe) cycleId: Cycle['cycleId'],
  ) {
    return this.cycleService.getCycleById(user, cycleId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new training cycle',
    description:
      "Creates a new training cycle for organizing training periods. The cycle can be assigned to an athlete (defaults to the authenticated user's athlete if not specified). Cycles are used to structure training phases (e.g., base training, specific preparation, taper) and can be associated with training plans. The color is optional and used for calendar display. Uses CASL authorization to verify that the user can create cycles for the specified athlete.",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the cycle (required, 1-100 characters)',
          example: 'Base Training Phase',
          minLength: 1,
          maxLength: 100,
        },
        description: {
          type: 'string',
          description: 'Description of the cycle. Default: empty string',
          example: 'Focus on building aerobic base',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          description: 'Start date of the cycle (required)',
          example: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: 'End date of the cycle (required)',
          example: '2024-03-31T23:59:59.999Z',
        },
        color: {
          type: 'string',
          nullable: true,
          description:
            'Hex color code for the cycle (e.g., "#FF5733"). Must match pattern ^#[0-9A-Fa-f]{6}$. Optional.',
          example: '#FF5733',
        },
        athleteId: {
          type: 'number',
          nullable: true,
          description:
            "ID of the athlete to assign this cycle to. Optional, defaults to authenticated user's athlete.",
          example: 1,
        },
      },
      required: ['name', 'startDate', 'endDate'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Cycle created successfully',
    schema: {
      type: 'object',
      properties: {
        cycleId: {
          type: 'number',
          description: 'Unique identifier for the created cycle',
          example: 1,
        },
        athleteId: {
          type: 'number',
          nullable: true,
          description: 'ID of the athlete this cycle belongs to',
          example: 1,
        },
        trainingPlanId: {
          type: 'number',
          nullable: true,
          description: 'ID of the training plan this cycle belongs to, if any',
          example: null,
        },
        name: {
          type: 'string',
          description: 'Name of the cycle',
          example: 'Base Training Phase',
        },
        description: {
          type: 'string',
          description: 'Description of the cycle',
          example: 'Focus on building aerobic base',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          description: 'Start date of the cycle',
          example: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: 'End date of the cycle',
          example: '2024-03-31T23:59:59.999Z',
        },
        color: {
          type: 'string',
          nullable: true,
          description:
            'Hex color code for the cycle (e.g., "#FF5733"). Used for calendar display.',
          example: '#FF5733',
        },
        phase: {
          type: 'string',
          nullable: true,
          description:
            'Training phase type (BASE, SPECIFIC, TAPER, etc.). Optional.',
          example: null,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the cycle was created',
          example: '2024-01-01T10:00:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the cycle was last updated',
          example: '2024-01-01T10:00:00.000Z',
        },
        athlete: {
          type: 'object',
          nullable: true,
          description: 'Athlete information',
        },
      },
      required: [
        'cycleId',
        'name',
        'description',
        'startDate',
        'endDate',
        'createdAt',
        'updatedAt',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation error (e.g., name too long, invalid color format, athlete ID required)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user is not allowed to create cycles for this athlete or athlete ID is required',
  })
  createCycle(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCycleDtoSchema)) body: CreateCycleDto,
  ) {
    return this.cycleService.createCycle(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':cycleId')
  @ApiOperation({
    summary: 'Update an existing training cycle',
    description:
      'Updates an existing training cycle. All fields are optional - only provided fields will be updated. The cycle name, description, dates, and color can be modified. Uses CASL authorization to verify that the user has update access to the cycle.',
  })
  @ApiParam({
    name: 'cycleId',
    type: Number,
    description: 'ID of the cycle to update',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'New name for the cycle (optional, 1-100 characters)',
          example: 'Base Training Phase Updated',
          minLength: 1,
          maxLength: 100,
        },
        description: {
          type: 'string',
          description: 'New description for the cycle. Optional.',
          example: 'Updated focus on building aerobic base',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          description: 'New start date for the cycle. Optional.',
          example: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: 'New end date for the cycle. Optional.',
          example: '2024-03-31T23:59:59.999Z',
        },
        color: {
          type: 'string',
          nullable: true,
          description:
            'New hex color code for the cycle (e.g., "#FF5733"). Must match pattern ^#[0-9A-Fa-f]{6}$. Optional, can be set to null.',
          example: '#8b5cf6',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cycle updated successfully',
    schema: {
      type: 'object',
      properties: {
        cycleId: {
          type: 'number',
          description: 'Unique identifier for the cycle',
          example: 1,
        },
        athleteId: {
          type: 'number',
          nullable: true,
          description: 'ID of the athlete this cycle belongs to',
          example: 1,
        },
        trainingPlanId: {
          type: 'number',
          nullable: true,
          description: 'ID of the training plan this cycle belongs to, if any',
          example: 1,
        },
        name: {
          type: 'string',
          description: 'Name of the cycle',
          example: 'Base Training Phase Updated',
        },
        description: {
          type: 'string',
          description: 'Description of the cycle',
          example: 'Updated focus on building aerobic base',
        },
        startDate: {
          type: 'string',
          format: 'date-time',
          description: 'Start date of the cycle',
          example: '2024-01-01T00:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: 'End date of the cycle',
          example: '2024-03-31T23:59:59.999Z',
        },
        color: {
          type: 'string',
          nullable: true,
          description:
            'Hex color code for the cycle (e.g., "#FF5733"). Used for calendar display.',
          example: '#8b5cf6',
        },
        phase: {
          type: 'string',
          nullable: true,
          description:
            'Training phase type (BASE, SPECIFIC, TAPER, etc.). Optional.',
          example: 'BASE',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the cycle was created',
          example: '2024-01-01T10:00:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the cycle was last updated',
          example: '2024-01-20T14:45:00.000Z',
        },
        athlete: {
          type: 'object',
          nullable: true,
          description: 'Athlete information',
        },
      },
      required: [
        'cycleId',
        'name',
        'description',
        'startDate',
        'endDate',
        'createdAt',
        'updatedAt',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation error (e.g., name too long, invalid color format)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have update access to this cycle',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - cycle not found',
  })
  updateCycle(
    @JwtUser() user: AuthUser,
    @Param('cycleId', ParseIntPipe) cycleId: Cycle['cycleId'],
    @Body(new ZodValidationPipe(updateCycleDtoSchema)) body: UpdateCycleDto,
  ) {
    return this.cycleService.updateCycle(user, cycleId, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':cycleId')
  @ApiOperation({
    summary: 'Delete a training cycle',
    description:
      'Deletes a training cycle. The cycle and all its associated data are permanently removed. This operation cannot be undone. Uses CASL authorization to verify that the user has delete access to the cycle.',
  })
  @ApiParam({
    name: 'cycleId',
    type: Number,
    description: 'ID of the cycle to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Cycle deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Indicates successful deletion',
          example: true,
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
    description: 'Forbidden - user does not have delete access to this cycle',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - cycle not found',
  })
  deleteCycle(
    @JwtUser() user: AuthUser,
    @Param('cycleId', ParseIntPipe) cycleId: Cycle['cycleId'],
  ) {
    return this.cycleService.deleteCycle(user, cycleId);
  }
}
