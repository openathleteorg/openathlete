import client, { routes } from '@/utils/axios';

import {
  BestRecordDto,
  CreateRecordExclusionDto,
  GetRecordEffortsQueryDto,
  GetRecordHistoryQueryDto,
  GetRecordsQueryDto,
  RecordEffortDto,
  RecordExclusionDto,
  RecordHistoryDto,
  SPORT_TYPE,
} from '@openathlete/shared';

export class RecordAPI {
  static async getRecords(query: GetRecordsQueryDto): Promise<BestRecordDto[]> {
    const res = await client.get(routes.record.getRecords, {
      params: {
        ...query,
        from: query.from?.toISOString(),
        to: query.to?.toISOString(),
      },
    });
    return res.data;
  }

  /** Sports that have records, the most frequent first. */
  static async getRecordSports(athleteId?: number): Promise<SPORT_TYPE[]> {
    const res = await client.get(routes.record.getRecordSports, {
      params: { athleteId },
    });
    return res.data;
  }

  static async getRecordHistory(
    query: GetRecordHistoryQueryDto,
  ): Promise<RecordHistoryDto> {
    const res = await client.get(routes.record.getRecordHistory, {
      params: query,
    });
    return res.data;
  }

  static async getRecordEfforts(
    query: GetRecordEffortsQueryDto,
  ): Promise<RecordEffortDto[]> {
    const res = await client.get(routes.record.getRecordEfforts, {
      params: query,
    });
    return res.data;
  }

  static async getRecordExclusions(
    query: GetRecordHistoryQueryDto,
  ): Promise<RecordExclusionDto[]> {
    const res = await client.get(routes.record.getRecordExclusions, {
      params: query,
    });
    return res.data;
  }

  static async createRecordExclusion(
    body: CreateRecordExclusionDto,
  ): Promise<RecordExclusionDto> {
    const res = await client.post(routes.record.createRecordExclusion, body);
    return res.data;
  }

  static async deleteRecordExclusion(recordExclusionId: number): Promise<void> {
    await client.delete(routes.record.deleteRecordExclusion(recordExclusionId));
  }
}
