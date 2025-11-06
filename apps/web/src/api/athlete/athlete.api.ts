import client, { routes } from '@/utils/axios';

import {
  Athlete,
  AthleteSettings,
  InviteCoachDto,
  TrainingZone,
  TrainingZoneValue,
  UpdateAthleteSettingsDto,
  User,
} from '@openathlete/shared';

export class AthleteAPI {
  static async getMyAthlete(): Promise<
    Athlete & {
      trainingZones: (TrainingZone & {
        values: TrainingZoneValue[];
      })[];
    }
  > {
    const res = await client.get(routes.athlete.getMyAthlete);
    return res.data;
  }

  static async getCoachedAthletes(): Promise<
    (Athlete & {
      trainingZones: (TrainingZone & {
        values: TrainingZoneValue[];
      })[];
    })[]
  > {
    const res = await client.get(routes.athlete.getCoachedAthletes);
    return res.data;
  }

  static async getMyCoaches(): Promise<User[]> {
    const res = await client.get(routes.athlete.getCoaches);
    return res.data;
  }

  static async inviteCoach(body: InviteCoachDto): Promise<void> {
    await client.post(routes.athlete.inviteCoach, body);
  }

  static async inviteAthlete(body: InviteCoachDto): Promise<void> {
    await client.post(routes.athlete.inviteAthlete, body);
  }

  static async removeAthlete(athleteId: number): Promise<void> {
    await client.delete(routes.athlete.removeAthlete(athleteId));
  }

  static async removeCoach(coachId: number): Promise<void> {
    await client.delete(routes.athlete.removeCoach(coachId));
  }

  static async getAthleteSettings(athleteId: number): Promise<AthleteSettings> {
    const res = await client.get(routes.athlete.getAthleteSettings(athleteId));
    return res.data;
  }

  static async updateAthleteSettings(
    athleteId: number,
    body: UpdateAthleteSettingsDto,
  ): Promise<AthleteSettings> {
    const res = await client.patch(
      routes.athlete.updateAthleteSettings(athleteId),
      body,
    );
    return res.data;
  }
}
