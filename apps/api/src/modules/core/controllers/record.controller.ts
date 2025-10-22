import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { athlete, sport_type } from '@openathlete/database';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { RecordService } from '../services/record.service';

@Controller('record')
export class RecordController {
  constructor(private recordService: RecordService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getRecords(
    @JwtUser() user: AuthUser,
    @Query('sport') sport?: string,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.recordService.getRecords(user, sport as sport_type, athleteId);
  }
}
