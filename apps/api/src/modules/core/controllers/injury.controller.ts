import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { athlete } from '@openathlete/database';
import { AthleteInjury } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { InjuryService } from '../services/injury.service';

@Controller('injury')
export class InjuryController {
  constructor(private injuryService: InjuryService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getInjuries(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ): Promise<AthleteInjury[]> {
    return this.injuryService.getInjuries(user, athleteId);
  }
}
