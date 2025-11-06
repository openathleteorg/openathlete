import { ZodValidationPipe } from 'nestjs-zod';

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { coachDashboardResponseSchema } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { CoachService } from '../services/coach.service';

@Controller('coach')
export class CoachController {
  constructor(private coachService: CoachService) {}

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
}
