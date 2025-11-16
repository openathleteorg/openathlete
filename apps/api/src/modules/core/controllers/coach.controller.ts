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

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { CoachInvitationService } from 'src/modules/auth/services/coach-invitation.service';

import { CoachService } from '../services/coach.service';

@Controller('coach')
export class CoachController {
  constructor(
    private coachService: CoachService,
    private coachInvitationService: CoachInvitationService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('dashboard')
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
  @Get('invitations/pending')
  getPendingInvitations(@JwtUser() user: AuthUser) {
    return this.coachInvitationService.getPendingInvitationsForCoach(
      user.user_id,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('invitations/:invitationId/accept')
  acceptInvitation(
    @JwtUser() user: AuthUser,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.coachInvitationService.acceptInvitation(
      user.user_id,
      invitationId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('invitations/:invitationId/reject')
  rejectInvitation(
    @JwtUser() user: AuthUser,
    @Param('invitationId', ParseIntPipe) invitationId: number,
  ) {
    return this.coachInvitationService.rejectInvitation(
      user.user_id,
      invitationId,
    );
  }
}
