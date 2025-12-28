import {
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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { InvitationStatus } from '@openathlete/database';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { CoachInvitationService } from 'src/modules/auth/services/coach-invitation.service';

import { CoachService } from '../services/coach.service';

@ApiTags('Coach')
@Controller('coach')
export class CoachController {
  constructor(
    private coachService: CoachService,
    private coachInvitationService: CoachInvitationService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('dashboard')
  @ApiOperation({
    summary: 'Get coach dashboard data',
    description:
      'Retrieves comprehensive dashboard data for the authenticated coach, including statistics for all coached athletes over a specified period. If no period is provided, defaults to the last 4 weeks. For each athlete, returns planned training sessions, completed activities, planned/completed time, completed distance, last activity date, and compliance percentage (completed sessions / planned sessions * 100).',
  })
  @ApiQuery({
    name: 'start',
    type: String,
    description:
      'Start date of the period (ISO 8601 format). If not provided, defaults to 28 days ago.',
    required: false,
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'end',
    type: String,
    description:
      'End date of the period (ISO 8601 format). If not provided, defaults to now. Both start and end must be provided together.',
    required: false,
    example: '2024-01-28T23:59:59.999Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: {
          type: 'object',
          properties: {
            start: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-01T00:00:00.000Z',
            },
            end: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-28T23:59:59.999Z',
            },
          },
        },
        athletes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              athleteId: { type: 'number', example: 1 },
              firstName: { type: 'string', nullable: true, example: 'John' },
              lastName: { type: 'string', nullable: true, example: 'Doe' },
              email: {
                type: 'string',
                format: 'email',
                nullable: true,
                example: 'athlete@example.com',
              },
              start: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00.000Z',
              },
              end: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-28T23:59:59.999Z',
              },
              plannedSessions: {
                type: 'number',
                description: 'Number of planned training sessions',
                example: 12,
              },
              completedSessions: {
                type: 'number',
                description: 'Number of completed activity sessions',
                example: 10,
              },
              plannedTime: {
                type: 'number',
                description: 'Total planned time in seconds',
                example: 14400,
              },
              completedTime: {
                type: 'number',
                description: 'Total completed activity time in seconds',
                example: 12000,
              },
              completedDistance: {
                type: 'number',
                description: 'Total completed distance in meters',
                example: 50000,
              },
              lastActivityAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                description: 'ISO timestamp of the last completed activity',
                example: '2024-01-27T14:30:00.000Z',
              },
              compliancePercent: {
                type: 'number',
                description:
                  'Compliance percentage (completed sessions / planned sessions * 100)',
                example: 83,
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getDashboard(
    @JwtUser() user: AuthUser,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ) {
    const period =
      start && end ? { start: new Date(start), end: new Date(end) } : undefined;
    return this.coachService.getCoachDashboard(user, period);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('invitations/pending')
  @ApiOperation({
    summary: 'Get pending coach invitations',
    description:
      "Retrieves all pending coach invitations (from athletes) that are awaiting acceptance by the authenticated user. These are invitations where the coach's email matches and the status is PENDING. Returns invitations with athlete user information.",
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending invitations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          coachInvitationId: { type: 'number', example: 1 },
          email: {
            type: 'string',
            format: 'email',
            example: 'coach@example.com',
          },
          token: {
            type: 'string',
            nullable: true,
            description: 'Invitation token (null if coach already has account)',
            example: 'abc123def456...',
          },
          status: {
            type: 'string',
            enum: Object.values(InvitationStatus),
            example: 'PENDING',
          },
          athleteUserId: { type: 'number', example: 1 },
          coachUserId: {
            type: 'number',
            nullable: true,
            description:
              'Coach user ID (null if coach does not have account yet)',
            example: 2,
          },
          athleteUser: {
            type: 'object',
            properties: {
              userId: { type: 'number', example: 1 },
              firstName: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              email: {
                type: 'string',
                format: 'email',
                example: 'athlete@example.com',
              },
            },
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getPendingInvitations(@JwtUser() user: AuthUser) {
    return this.coachInvitationService.getPendingInvitationsForCoach(
      user.userId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('invitations/:invitationId/accept')
  @ApiOperation({
    summary: 'Accept a pending coach invitation',
    description:
      'Accepts a pending coach invitation from an athlete. Creates the coach-athlete relationship and updates the invitation status to ACCEPTED. Verifies that the invitation is for the authenticated user and checks subscription limits (athlete limit for coach) before accepting.',
  })
  @ApiParam({
    name: 'invitationId',
    type: Number,
    description: 'ID of the invitation to accept',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invitation not for this user, no longer pending, or coach has reached athlete limit',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - invitation or athlete not found',
  })
  acceptInvitation(
    @JwtUser() user: AuthUser,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.coachInvitationService.acceptInvitation(
      user.userId,
      invitationId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('invitations/:invitationId/reject')
  @ApiOperation({
    summary: 'Reject a pending coach invitation',
    description:
      'Rejects a pending coach invitation from an athlete. Updates the invitation status to REJECTED without creating a coach-athlete relationship. Verifies that the invitation is for the authenticated user.',
  })
  @ApiParam({
    name: 'invitationId',
    type: Number,
    description: 'ID of the invitation to reject',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation rejected successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - invitation not for this user or no longer pending',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - invitation not found',
  })
  rejectInvitation(
    @JwtUser() user: AuthUser,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.coachInvitationService.rejectInvitation(
      user.userId,
      invitationId,
    );
  }
}
