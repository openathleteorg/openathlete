import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { athlete, training_load_calculation_type } from '@openathlete/database';
import { DailyTrainingLoad, TrainingLoadMetrics } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { TrainingLoadService } from '../services/training-load.service';

@Controller('training-load')
export class TrainingLoadController {
  constructor(private trainingLoadService: TrainingLoadService) {}

  /**
   * Calculate training load for a specific activity
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('calculate/:activityId')
  async calculateActivityLoad(
    @JwtUser() user: AuthUser,
    @Param('activityId', ParseIntPipe) activityId: number,
    @Body('calculationType') calculationType: training_load_calculation_type,
  ) {
    return this.trainingLoadService.calculateActivityLoad(
      user,
      activityId,
      calculationType,
    );
  }

  /**
   * Get training load entries by period
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('period')
  async getTrainingLoadByPeriod(
    @JwtUser() user: AuthUser,
    @Query('calculationType') calculationType: training_load_calculation_type,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ): Promise<DailyTrainingLoad[]> {
    return this.trainingLoadService.getTrainingLoadByPeriod(
      user,
      calculationType,
      new Date(startDate),
      new Date(endDate),
      athleteId,
    );
  }

  /**
   * Get current training load metrics (ATL, CTL, TSB)
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('metrics')
  async getTrainingLoadMetrics(
    @JwtUser() user: AuthUser,
    @Query('calculationType') calculationType: training_load_calculation_type,
    @Query('targetDate') targetDate?: string,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ): Promise<TrainingLoadMetrics> {
    const date = targetDate ? new Date(targetDate) : new Date();
    return this.trainingLoadService.getTrainingLoadMetrics(
      user,
      calculationType,
      date,
      athleteId,
    );
  }

  /**
   * Get historical training load with ATL/CTL/TSB over time
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('history')
  async getTrainingLoadHistory(
    @JwtUser() user: AuthUser,
    @Query('calculationType') calculationType: training_load_calculation_type,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('athleteId', ParseIntPipe) athleteId?: athlete['athlete_id'],
  ) {
    const history = await this.trainingLoadService.getTrainingLoadHistory(
      user,
      calculationType,
      new Date(startDate),
      new Date(endDate),
      athleteId,
    );

    return history;
  }

  /**
   * Get all training load entries for a specific activity
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('activity/:activityId')
  async getActivityTrainingLoads(
    @JwtUser() user: AuthUser,
    @Param('activityId', ParseIntPipe) activityId: number,
  ) {
    return this.trainingLoadService.getActivityTrainingLoads(user, activityId);
  }

  /**
   * Recalculate all training loads for the athlete
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post('recalculate')
  async recalculateAllLoads(
    @JwtUser() user: AuthUser,
    @Body('calculationType') calculationType: training_load_calculation_type,
  ) {
    return this.trainingLoadService.recalculateAllLoads(user, calculationType);
  }
}
