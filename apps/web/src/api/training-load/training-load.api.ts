import client, { routes } from '@/utils/axios';

import {
  CalendarWeekLoadSummary,
  DailyTrainingLoad,
  RecalculateAllLoadsResponse,
  TRAINING_LOAD_CALCULATION_TYPE,
  TrainingLoadEntry,
  TrainingLoadHistory,
  TrainingLoadMetrics,
} from '@openathlete/shared';

export type TrainingLoadCalculationType = TRAINING_LOAD_CALCULATION_TYPE;
export const TrainingLoadCalculationType = TRAINING_LOAD_CALCULATION_TYPE;

export type {
  CalendarWeekLoadSummary,
  TrainingLoadEntry,
  DailyTrainingLoad,
  TrainingLoadMetrics,
  TrainingLoadHistory,
  RecalculateAllLoadsResponse,
};

const mapTrainingLoadEntry = (entry: TrainingLoadEntry): TrainingLoadEntry => ({
  ...entry,
  date: new Date(entry.date),
  createdAt: new Date(entry.createdAt),
  updatedAt: new Date(entry.updatedAt),
});

const mapDailyTrainingLoad = (item: DailyTrainingLoad): DailyTrainingLoad => ({
  ...item,
  date: new Date(item.date),
});

const mapTrainingLoadHistory = (
  item: TrainingLoadHistory,
): TrainingLoadHistory => ({
  ...item,
  date: new Date(item.date),
});

const mapCalendarWeekLoadSummary = (
  item: CalendarWeekLoadSummary,
): CalendarWeekLoadSummary => ({
  ...item,
  weekStart: new Date(item.weekStart),
  weekEnd: new Date(item.weekEnd),
});

export class TrainingLoadAPI {
  /**
   * Calculate training load for a specific activity
   */
  static async calculateActivityLoad(
    activityId: number,
    calculationType: TrainingLoadCalculationType,
  ): Promise<TrainingLoadEntry> {
    const res = await client.post(routes.trainingLoad.calculate(activityId), {
      calculationType,
    });
    return mapTrainingLoadEntry(res.data);
  }

  /**
   * Get all training load entries for a specific activity
   */
  static async getActivityTrainingLoads(
    activityId: number,
  ): Promise<TrainingLoadEntry[]> {
    const res = await client.get(routes.trainingLoad.activity(activityId));
    return res.data.map(mapTrainingLoadEntry);
  }

  /**
   * Get training load entries by period
   */
  static async getTrainingLoadByPeriod(
    calculationType: TrainingLoadCalculationType,
    startDate: Date,
    endDate: Date,
    athleteId?: number,
  ): Promise<DailyTrainingLoad[]> {
    const res = await client.get(routes.trainingLoad.period, {
      params: {
        calculationType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(athleteId && { athleteId }),
      },
    });
    return res.data.map(mapDailyTrainingLoad);
  }

  /**
   * Get current training load metrics (ATL, CTL, TSB)
   */
  static async getTrainingLoadMetrics(
    calculationType: TrainingLoadCalculationType,
    targetDate?: Date,
    athleteId?: number,
  ): Promise<TrainingLoadMetrics> {
    const res = await client.get(routes.trainingLoad.metrics, {
      params: {
        calculationType,
        ...(targetDate && { targetDate: targetDate.toISOString() }),
        ...(athleteId && { athleteId }),
      },
    });
    return res.data;
  }

  /**
   * Get historical training load with ATL/CTL/TSB over time
   */
  static async getTrainingLoadHistory(
    calculationType: TrainingLoadCalculationType,
    startDate: Date,
    endDate: Date,
    athleteId?: number,
  ): Promise<TrainingLoadHistory[]> {
    const res = await client.get(routes.trainingLoad.history, {
      params: {
        calculationType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(athleteId && { athleteId }),
      },
    });
    return res.data.map(mapTrainingLoadHistory);
  }

  /**
   * Recalculate all training loads for the athlete
   */
  static async recalculateAllLoads(
    calculationType: TrainingLoadCalculationType,
  ): Promise<RecalculateAllLoadsResponse> {
    const res = await client.post(routes.trainingLoad.recalculate, {
      calculationType,
    });
    return res.data;
  }

  static async getWeeklyLoadSummary(
    startDate: Date,
    endDate: Date,
    athleteId?: number,
  ): Promise<CalendarWeekLoadSummary[]> {
    const res = await client.get(routes.trainingLoad.weeklySummary, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(athleteId && { athleteId }),
      },
    });
    return res.data.map(mapCalendarWeekLoadSummary);
  }
}
