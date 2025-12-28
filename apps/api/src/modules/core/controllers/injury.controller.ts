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

import { Athlete } from '@openathlete/database';
import { AthleteInjury, INJURY_STATUS } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { InjuryService } from '../services/injury.service';

@ApiTags('Injury')
@Controller('injury')
export class InjuryController {
  constructor(private injuryService: InjuryService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all injuries for an athlete',
    description:
      "Retrieves all injury entries for an athlete. Injuries are ordered by most recently updated first. Injuries are typically extracted automatically from activity feedback using AI, but can also be manually created. Each injury includes location (body part), pain score (0.0 to 1.0), context description, status (WORSENING, IMPROVING, STABLE, RESOLVED), and optionally the source activity ID if extracted from feedback. If no athleteId is provided, uses the authenticated user's athlete. Uses CASL authorization to verify that the user has read access to the athlete.",
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
    description: 'List of injuries retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          athleteInjuryId: {
            type: 'number',
            description: 'Unique identifier for the injury entry',
            example: 1,
          },
          athleteId: {
            type: 'number',
            description: 'ID of the athlete this injury belongs to',
            example: 1,
          },
          location: {
            type: 'string',
            description:
              'Body part location of the injury (e.g., "genou gauche", "mollet droit", "épaule")',
            example: 'genou gauche',
          },
          painScore: {
            type: 'number',
            description: 'Pain score from 0.0 (no pain) to 1.0 (severe pain)',
            example: 0.6,
            minimum: 0,
            maximum: 1,
          },
          context: {
            type: 'string',
            description:
              'Brief description of the injury from athlete feedback or notes',
            example:
              'Douleur au genou gauche pendant la course, surtout en descente',
          },
          status: {
            type: 'string',
            enum: Object.values(INJURY_STATUS),
            description:
              'Injury status: WORSENING (pain increased, getting worse), IMPROVING (pain decreased, healing), STABLE (unchanged), RESOLVED (pain gone, healed)',
            example: 'IMPROVING',
          },
          sourceActivityId: {
            type: 'number',
            nullable: true,
            description:
              'ID of the activity (event_activity) from which this injury was extracted. Null if manually created.',
            example: 123,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the injury was first recorded',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the injury was last updated',
            example: '2024-01-20T14:45:00.000Z',
          },
        },
        required: [
          'athleteInjuryId',
          'athleteId',
          'location',
          'painScore',
          'context',
          'status',
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
  getInjuries(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId?: Athlete['athleteId'],
  ): Promise<AthleteInjury[]> {
    return this.injuryService.getInjuries(user, athleteId);
  }
}
