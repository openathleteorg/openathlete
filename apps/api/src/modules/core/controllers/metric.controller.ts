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

import { athlete, metric_type } from '@openathlete/database';
import {
  CreateMetricDto,
  UpdateMetricDto,
  createMetricDtoSchema,
  updateMetricDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { MetricService } from '../services/metric.service';

@Controller('metric')
export class MetricController {
  constructor(private metricService: MetricService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post()
  createMetric(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createMetricDtoSchema))
    dto: CreateMetricDto,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.metricService.createMetric(user, dto, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':id')
  updateMetric(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateMetricDtoSchema))
    dto: UpdateMetricDto,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.metricService.updateMetric(user, id, dto, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':id')
  deleteMetric(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.metricService.deleteMetric(user, id, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getMetrics(
    @JwtUser() user: AuthUser,
    @Query('type') type?: string,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.metricService.getMetrics(user, type as metric_type, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('latest')
  getLatestMetrics(
    @JwtUser() user: AuthUser,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.metricService.getLatestMetrics(user, athleteId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('history/:type')
  getMetricHistory(
    @JwtUser() user: AuthUser,
    @Param('type') type: string,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.metricService.getMetricHistory(
      user,
      type as metric_type,
      athleteId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('calculate/:type')
  calculateMetric(
    @JwtUser() user: AuthUser,
    @Param('type') type: string,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    return this.metricService.calculateMetric(
      user,
      type as metric_type,
      athleteId,
    );
  }
}
