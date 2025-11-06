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
  InviteAthleteDto,
  InviteCoachDto,
  UpdateAthleteSettingsDto,
  inviteAthleteSchema,
  inviteCoachSchema,
  updateAthleteSettingsDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { AthleteService } from '../services/athlete.service';
import { AthleteSettingsService } from '../services/athlete-settings.service';

@Controller('athlete')
export class AthleteController {
  constructor(
    private athleteService: AthleteService,
    private athleteSettingsService: AthleteSettingsService,
  ) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('me')
  getMyAthlete(@JwtUser() user: AuthUser) {
    return this.athleteService.getAthleteByUserId(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('coached')
  getMyCoachedAthletes(@JwtUser() user: AuthUser) {
    return this.athleteService.getMyCoachedAthletes(user.user_id);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('coaches')
  getMyCoaches(@JwtUser() user: AuthUser) {
    return this.athleteService.getMyCoaches(user.user_id);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('invite/coach')
  inviteCoach(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(inviteCoachSchema)) body: InviteCoachDto,
  ) {
    return this.athleteService.inviteCoach(user.user_id, body.email);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('invite/athlete')
  inviteAthlete(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(inviteAthleteSchema)) body: InviteAthleteDto,
  ) {
    return this.athleteService.inviteAthlete(user.user_id, body.email);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':athleteId')
  removeAthlete(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
  ) {
    return this.athleteService.removeAthlete(user.user_id, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete('coach/:coachId')
  removeCoach(
    @JwtUser() user: AuthUser,
    @Param('coachId', ParseIntPipe) coachId: number,
  ) {
    return this.athleteService.removeCoach(user.user_id, coachId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get(':athleteId/settings')
  getAthleteSettings(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
  ) {
    return this.athleteSettingsService.getSettingsForAthlete(user, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':athleteId/settings')
  updateAthleteSettings(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
    @Body(new ZodValidationPipe(updateAthleteSettingsDtoSchema))
    dto: UpdateAthleteSettingsDto,
  ) {
    return this.athleteSettingsService.updateSettings(user, athleteId, dto);
  }
}
