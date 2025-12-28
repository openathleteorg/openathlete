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

import {
  InviteAthleteDto,
  InviteCoachDto,
  UpdateAthleteSettingsDto,
  inviteAthleteSchema,
  inviteCoachSchema,
  updateAthleteSettingsDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { AthleteInvitationService } from 'src/modules/auth/services/athlete-invitation.service';

import { AthleteSettingsService } from '../services/athlete-settings.service';
import { AthleteService } from '../services/athlete.service';

@ApiTags('Athlete')
@Controller('athlete')
export class AthleteController {
  constructor(
    private athleteService: AthleteService,
    private athleteSettingsService: AthleteSettingsService,
    private athleteInvitationService: AthleteInvitationService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Get current user athlete profile',
    description:
      "Retrieves the authenticated user's athlete profile including training zones, user information, and all related data. If no training zones exist, default 5-zone heart rate zones (Recovery, Endurance, Tempo, Threshold, VO2 Max) are automatically created for all sports.",
  })
  @ApiResponse({
    status: 200,
    description: 'Athlete profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        athleteId: {
          type: 'number',
          example: 1,
        },
        userId: {
          type: 'number',
          example: 1,
        },
        trainingZones: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              trainingZoneId: { type: 'number' },
              name: { type: 'string', example: 'Zone 1' },
              description: { type: 'string', example: 'Recovery' },
              index: { type: 'number' },
              type: { type: 'string', example: 'HEARTRATE' },
              color: { type: 'string', example: '#9CA3AF' },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' },
                    sports: { type: 'array', items: { type: 'string' } },
                  },
                },
              },
            },
          },
        },
        user: {
          type: 'object',
          properties: {
            userId: { type: 'number' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
          },
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
    description: 'Forbidden - not allowed to access this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found for user',
  })
  getMyAthlete(@JwtUser() user: AuthUser) {
    return this.athleteService.getAthleteByUserId(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('coached')
  @ApiOperation({
    summary: 'Get all athletes coached by the current user',
    description:
      'Retrieves a list of all athletes that the authenticated user (coach) is currently coaching. Returns athlete profiles with training zones and user information.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of coached athletes retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          athleteId: { type: 'number' },
          userId: { type: 'number' },
          trainingZones: { type: 'array' },
          user: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
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
  getMyCoachedAthletes(@JwtUser() user: AuthUser) {
    return this.athleteService.getMyCoachedAthletes(user.userId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('coaches')
  @ApiOperation({
    summary: 'Get all coaches for the current athlete',
    description:
      'Retrieves a list of all coaches that are currently coaching the authenticated user (athlete). Returns user information for each coach.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of coaches retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'number' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getMyCoaches(@JwtUser() user: AuthUser) {
    return this.athleteService.getMyCoaches(user.userId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('invite/coach')
  @ApiOperation({
    summary: 'Invite a coach to coach the current athlete',
    description:
      "Sends an invitation to a coach to become the authenticated user's coach. If the coach already has an account, they receive an email with a link to accept the invitation. If they don't have an account, they receive an email with a link to create an account using the invitation token. The invitation is valid for 7 days. Cannot invite yourself or someone already linked as your coach.",
  })
  @ApiBody({
    description: 'Coach invitation data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'coach@example.com',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Coach invitation sent successfully',
    schema: {
      type: 'object',
      properties: {
        coachInvitationId: { type: 'number' },
        email: { type: 'string' },
        athleteUserId: { type: 'number' },
        status: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot invite yourself',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - coach already linked or invitation already sent to this email',
  })
  inviteCoach(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(inviteCoachSchema)) body: InviteCoachDto,
  ) {
    return this.athleteService.inviteCoach(user.userId, body.email);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('invite/athlete')
  @ApiOperation({
    summary: 'Invite an athlete to be coached by the current user',
    description:
      "Sends an invitation to an athlete to be coached by the authenticated user (coach). If the athlete already has an account, they receive an email with a link to accept the invitation. If they don't have an account, they receive an email with a link to create an account using the invitation token. The invitation is valid for 7 days. Cannot invite yourself or someone already linked as your athlete. Checks subscription limits before sending.",
  })
  @ApiBody({
    description: 'Athlete invitation data',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'athlete@example.com',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Athlete invitation sent successfully',
    schema: {
      type: 'object',
      properties: {
        athleteInvitationId: { type: 'number' },
        email: { type: 'string' },
        userId: { type: 'number' },
        token: { type: 'string', nullable: true },
        status: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - cannot invite yourself or coach has reached athlete limit',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - coach not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - athlete already linked or invitation already sent to this email',
  })
  inviteAthlete(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(inviteAthleteSchema)) body: InviteAthleteDto,
  ) {
    return this.athleteService.inviteAthlete(user.userId, body.email);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('invitations/athletes/sent')
  @ApiOperation({
    summary: 'Get all sent athlete invitations',
    description:
      'Retrieves a list of all athlete invitations sent by the authenticated user (coach). Returns both pending invitations (with token for account creation) and invitations awaiting acceptance (status PENDING).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sent athlete invitations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          athleteInvitationId: { type: 'number' },
          email: { type: 'string' },
          userId: { type: 'number' },
          token: { type: 'string', nullable: true },
          status: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getSentAthleteInvitations(@JwtUser() user: AuthUser) {
    return this.athleteService.getSentAthleteInvitations(user.userId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete('invitations/athletes/:invitationId')
  @ApiOperation({
    summary: 'Cancel a sent athlete invitation',
    description:
      'Cancels and deletes an athlete invitation that was previously sent. Only pending invitations can be cancelled. Once accepted or rejected, invitations cannot be cancelled.',
  })
  @ApiParam({
    name: 'invitationId',
    type: Number,
    description: 'ID of the athlete invitation to cancel',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Athlete invitation cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invitation can no longer be cancelled',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - invitation not found or not owned by user',
  })
  cancelAthleteInvitation(
    @JwtUser() user: AuthUser,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.athleteService.cancelAthleteInvitation(
      user.userId,
      invitationId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('invitations/coaches/sent')
  @ApiOperation({
    summary: 'Get all sent coach invitations',
    description:
      'Retrieves a list of all coach invitations sent by the authenticated user (athlete). Returns pending invitations that are awaiting acceptance.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of sent coach invitations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          coachInvitationId: { type: 'number' },
          email: { type: 'string' },
          athleteUserId: { type: 'number' },
          coachUserId: { type: 'number', nullable: true },
          status: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getSentCoachInvitations(@JwtUser() user: AuthUser) {
    return this.athleteService.getSentCoachInvitations(user.userId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete('invitations/coaches/:invitationId')
  @ApiOperation({
    summary: 'Cancel a sent coach invitation',
    description:
      'Cancels and deletes a coach invitation that was previously sent. Only pending invitations can be cancelled.',
  })
  @ApiParam({
    name: 'invitationId',
    type: Number,
    description: 'ID of the coach invitation to cancel',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Coach invitation cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invitation can no longer be cancelled',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - invitation not found or not owned by user',
  })
  cancelCoachInvitation(
    @JwtUser() user: AuthUser,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.athleteService.cancelCoachInvitation(user.userId, invitationId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':athleteId')
  @ApiOperation({
    summary: 'Remove an athlete from coach relationship',
    description:
      'Removes the coaching relationship between the authenticated user (coach) and the specified athlete. This deletes the coach-athlete link, effectively ending the coaching relationship.',
  })
  @ApiParam({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete to remove from coaching relationship',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Athlete removed from coaching relationship successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  removeAthlete(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
  ) {
    return this.athleteService.removeAthlete(user.userId, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete('coach/:coachId')
  @ApiOperation({
    summary: 'Remove a coach from athlete relationship',
    description:
      'Removes the coaching relationship between the authenticated user (athlete) and the specified coach. This deletes the coach-athlete link, effectively ending the coaching relationship.',
  })
  @ApiParam({
    name: 'coachId',
    type: Number,
    description: 'ID of the coach to remove from relationship',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Coach removed from relationship successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - coach or athlete not found',
  })
  removeCoach(
    @JwtUser() user: AuthUser,
    @Param('coachId', ParseIntPipe) coachId: number,
  ) {
    return this.athleteService.removeCoach(user.userId, coachId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get(':athleteId/settings')
  @ApiOperation({
    summary: 'Get athlete settings',
    description:
      "Retrieves the settings for a specific athlete. If settings don't exist, default settings are created automatically. Requires read access to the athlete (coach or the athlete themselves). Default values: requireRpe=false, requireComment=false, requireFeedbackQuestions=true.",
  })
  @ApiParam({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete whose settings to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Athlete settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        athleteSettingsId: { type: 'number' },
        athleteId: { type: 'number' },
        requireRpe: {
          type: 'boolean',
          description: 'Whether RPE (Rate of Perceived Exertion) is required',
          example: false,
        },
        requireComment: {
          type: 'boolean',
          description: 'Whether comments are required',
          example: false,
        },
        requireFeedbackQuestions: {
          type: 'boolean',
          description: 'Whether feedback questions are required',
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
    description: 'Forbidden - not allowed to access this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  getAthleteSettings(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
  ) {
    return this.athleteSettingsService.getSettingsForAthlete(user, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':athleteId/settings')
  @ApiOperation({
    summary: 'Update athlete settings',
    description:
      "Updates the settings for a specific athlete. Only provided fields will be updated. If settings don't exist, they will be created. Requires update access to the athlete (coach or the athlete themselves).",
  })
  @ApiParam({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete whose settings to update',
    example: 1,
  })
  @ApiBody({
    description: 'Athlete settings update data',
    schema: {
      type: 'object',
      properties: {
        requireRpe: {
          type: 'boolean',
          description: 'Whether RPE (Rate of Perceived Exertion) is required',
          example: true,
        },
        requireComment: {
          type: 'boolean',
          description: 'Whether comments are required',
          example: true,
        },
        requireFeedbackQuestions: {
          type: 'boolean',
          description: 'Whether feedback questions are required',
          example: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Athlete settings updated successfully',
    schema: {
      type: 'object',
      properties: {
        athleteSettingsId: { type: 'number' },
        athleteId: { type: 'number' },
        requireRpe: { type: 'boolean' },
        requireComment: { type: 'boolean' },
        requireFeedbackQuestions: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not allowed to update this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  updateAthleteSettings(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
    @Body(new ZodValidationPipe(updateAthleteSettingsDtoSchema))
    dto: UpdateAthleteSettingsDto,
  ) {
    return this.athleteSettingsService.updateSettings(user, athleteId, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('invitations/pending')
  @ApiOperation({
    summary: 'Get pending invitations for the current athlete',
    description:
      "Retrieves all pending athlete invitations (from coaches) that are awaiting acceptance by the authenticated user. These are invitations where the athlete's email matches and the status is PENDING.",
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending invitations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          athleteInvitationId: { type: 'number' },
          email: { type: 'string' },
          userId: { type: 'number' },
          status: { type: 'string', example: 'PENDING' },
          createdAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              userId: { type: 'number' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              email: { type: 'string' },
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
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  getPendingInvitations(@JwtUser() user: AuthUser) {
    return this.athleteInvitationService.getPendingInvitationsForAthlete(
      user.userId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('invitations/:invitationId/accept')
  @ApiOperation({
    summary: 'Accept a pending athlete invitation',
    description:
      "Accepts a pending athlete invitation from a coach. Creates the coach-athlete relationship and updates the invitation status to ACCEPTED. Verifies that the invitation is for the authenticated user's email and checks subscription limits before accepting.",
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
    return this.athleteInvitationService.acceptInvitation(
      user.userId,
      invitationId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('invitations/:invitationId/reject')
  @ApiOperation({
    summary: 'Reject a pending athlete invitation',
    description:
      "Rejects a pending athlete invitation from a coach. Updates the invitation status to REJECTED without creating a coach-athlete relationship. Verifies that the invitation is for the authenticated user's email.",
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
    description: 'Not found - invitation or athlete not found',
  })
  rejectInvitation(
    @JwtUser() user: AuthUser,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.athleteInvitationService.rejectInvitation(
      user.userId,
      invitationId,
    );
  }
}
