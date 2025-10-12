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

import { metric_type } from '@openathlete/database';
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
  ) {
    return this.metricService.createMetric(user, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':id')
  updateMetric(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateMetricDtoSchema))
    dto: UpdateMetricDto,
  ) {
    return this.metricService.updateMetric(user, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':id')
  deleteMetric(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.metricService.deleteMetric(user, id);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getMyMetrics(@JwtUser() user: AuthUser, @Query('type') type?: string) {
    return this.metricService.getMyMetrics(user, type as metric_type);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('latest')
  getLatestMetrics(@JwtUser() user: AuthUser) {
    return this.metricService.getLatestMetrics(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('history/:type')
  getMetricHistory(@JwtUser() user: AuthUser, @Param('type') type: string) {
    return this.metricService.getMetricHistory(user, type as metric_type);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('calculate/:type')
  calculateMetric(@JwtUser() user: AuthUser, @Param('type') type: string) {
    return this.metricService.calculateMetric(user, type as metric_type);
  }
}
