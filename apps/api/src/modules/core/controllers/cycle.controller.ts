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

import { cycle } from '@openathlete/database';
import {
  CreateCycleDto,
  UpdateCycleDto,
  createCycleDtoSchema,
  updateCycleDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { CycleService } from '../services';

@Controller('cycle')
export class CycleController {
  constructor(private cycleService: CycleService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
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
  @Get(':cycleId')
  getCycle(
    @JwtUser() user: AuthUser,
    @Param('cycleId', ParseIntPipe) cycleId: cycle['cycle_id'],
  ) {
    return this.cycleService.getCycleById(user, cycleId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post()
  createCycle(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCycleDtoSchema)) body: CreateCycleDto,
  ) {
    return this.cycleService.createCycle(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':cycleId')
  updateCycle(
    @JwtUser() user: AuthUser,
    @Param('cycleId', ParseIntPipe) cycleId: cycle['cycle_id'],
    @Body(new ZodValidationPipe(updateCycleDtoSchema)) body: UpdateCycleDto,
  ) {
    return this.cycleService.updateCycle(user, cycleId, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':cycleId')
  deleteCycle(
    @JwtUser() user: AuthUser,
    @Param('cycleId', ParseIntPipe) cycleId: cycle['cycle_id'],
  ) {
    return this.cycleService.deleteCycle(user, cycleId);
  }
}
