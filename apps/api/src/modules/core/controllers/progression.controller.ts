import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { athlete, sport_type } from '@openathlete/database';

import { UserTypeGuard } from 'src/modules/auth';
import { AuthUser, JwtUser } from 'src/modules/auth/decorators/user.decorator';

import { ProgressionService } from '../services/progression.service';

@Controller('progression')
export class ProgressionController {
  constructor(private progressionService: ProgressionService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('first-activity-date')
  getFirstActivityDate(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId: athlete['athlete_id'],
    @Query('sport') sport?: string,
  ) {
    return this.progressionService.getFirstActivityDate(
      user,
      athleteId,
      sport as sport_type | undefined,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getProgressionData(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId: athlete['athlete_id'],
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('sport') sport?: string,
  ) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return this.progressionService.getProgressionData(
      user,
      athleteId,
      startDate,
      endDate,
      sport as sport_type | undefined,
    );
  }
}
