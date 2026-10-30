import client from '@/utils/axios';

import {
  ConnectGarminPersonal,
  GarminPersonalPreferences,
  GarminPersonalStatus,
  GarminPersonalSync,
} from '@openathlete/shared';

const path = '/provider/garmin-personal';
export const GarminPersonalAPI = {
  status: () => client.get<GarminPersonalStatus>(path).then((r) => r.data),
  connect: (body: ConnectGarminPersonal) =>
    client.post<GarminPersonalStatus>(path, body).then((r) => r.data),
  preferences: (body: GarminPersonalPreferences) =>
    client.patch<GarminPersonalStatus>(path, body).then((r) => r.data),
  disconnect: () =>
    client.delete<GarminPersonalStatus>(path).then((r) => r.data),
  sync: (body: GarminPersonalSync) =>
    client.post<{ queued: boolean }>(`${path}/sync`, body).then((r) => r.data),
};
