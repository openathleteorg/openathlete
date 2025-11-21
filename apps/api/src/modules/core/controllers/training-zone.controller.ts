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
  CreateTrainingZoneDto,
  UpdateTrainingZoneDto,
  createTrainingZoneDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { TrainingZoneService } from '../services/training-zone.service';

@Controller('training-zone')
export class TrainingZoneController {
  constructor(private readonly trainingZoneService: TrainingZoneService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('athlete/:athleteId')
  getAllForAthlete(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
  ) {
    return this.trainingZoneService.getAllForAthlete(user, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post()
  async create(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTrainingZoneDtoSchema))
    dto: CreateTrainingZoneDto,
  ) {
    return this.trainingZoneService.create(user, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':trainingZoneId')
  async update(
    @JwtUser() user: AuthUser,
    @Param('trainingZoneId', ParseIntPipe) trainingZoneId: number,
    @Body() dto: UpdateTrainingZoneDto,
  ) {
    return this.trainingZoneService.update(user, trainingZoneId, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':trainingZoneId')
  delete(
    @JwtUser() user: AuthUser,
    @Param('trainingZoneId', ParseIntPipe) trainingZoneId: number,
  ) {
    return this.trainingZoneService.delete(user, trainingZoneId);
  }
}
