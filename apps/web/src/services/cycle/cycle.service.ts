import client, { routes } from '@/utils/axios';

import { CreateCycleDto, Cycle, UpdateCycleDto } from '@openathlete/shared';

const mapCycle = (cycle: Cycle): Cycle => {
  return {
    ...cycle,
    startDate: new Date(cycle.startDate),
    endDate: new Date(cycle.endDate),
  };
};

export class CycleService {
  static async getMyCycles(
    isCoach?: boolean,
    athleteId?: number,
  ): Promise<Cycle[]> {
    const res = await client.get(routes.cycle.getMyCycles, {
      params: { coach: isCoach, athleteId },
    });
    const data = res.data as Cycle[];
    return data.map((cycle) => mapCycle(cycle));
  }

  static async getCycle(cycleId: number): Promise<Cycle> {
    const res = await client.get(routes.cycle.getCycle(cycleId));
    return mapCycle(res.data);
  }

  static async createCycle(body: CreateCycleDto): Promise<Cycle> {
    const res = await client.post(routes.cycle.create, body);
    return mapCycle(res.data);
  }

  static async updateCycle(params: {
    cycleId: number;
    body: UpdateCycleDto;
  }): Promise<Cycle> {
    const res = await client.patch(
      routes.cycle.update(params.cycleId),
      params.body,
    );
    return mapCycle(res.data);
  }

  static async deleteCycle(cycleId: number): Promise<{ success: boolean }> {
    const res = await client.delete(routes.cycle.deleteCycle(cycleId));
    return res.data;
  }
}
