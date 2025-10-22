import client, { routes } from '@/utils/axios';

import {
  CreateEquipmentDto,
  Equipment,
  UpdateEquipmentDto,
} from '@openathlete/shared';

export class EquipmentAPI {
  static async getMyEquipment(): Promise<Equipment[]> {
    const res = await client.get(routes.equipment.getMyEquipment);
    return res.data;
  }

  static async createEquipment(body: CreateEquipmentDto): Promise<Equipment> {
    const res = await client.post(routes.equipment.createEquipment, body);
    return res.data;
  }

  static async updateEquipment({
    id,
    body,
  }: {
    id: number;
    body: UpdateEquipmentDto;
  }): Promise<Equipment> {
    const res = await client.patch(routes.equipment.updateEquipment(id), body);
    return res.data;
  }

  static async deleteEquipment(id: number): Promise<void> {
    await client.delete(routes.equipment.deleteEquipment(id));
  }
}
