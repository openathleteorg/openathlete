import client from '@/utils/axios';

import {
  CreateTrainingZoneDto,
  UpdateTrainingZoneDto,
} from '@openathlete/shared';

export class TrainingZoneAPI {
  static async getAllForAthlete(athleteId: number) {
    const res = await client.get(`/training-zone/athlete/${athleteId}`);
    return res.data;
  }

  static async create(body: CreateTrainingZoneDto) {
    const res = await client.post('/training-zone', body);
    return res.data;
  }

  static async update(trainingZoneId: number, body: UpdateTrainingZoneDto) {
    const res = await client.patch(`/training-zone/${trainingZoneId}`, body);
    return res.data;
  }

  static async delete(trainingZoneId: number) {
    const res = await client.delete(`/training-zone/${trainingZoneId}`);
    return res.data;
  }
}
