import client from '@/utils/axios';

import {
  ConnectGarminPersonal,
  GarminPersonalPreferences,
  GarminPersonalReviewPage,
  GarminPersonalStatus,
  GarminPersonalSync,
  ResolveGarminPersonalReview,
} from '@openathlete/shared';

const path = '/provider/garmin-personal';
export const GarminPersonalAPI = {
  reviews: (cursor?: number) =>
    client
      .get<GarminPersonalReviewPage>(`${path}/reviews`, { params: { cursor } })
      .then((r) => r.data),
  previewReview: (id: number) =>
    client.post(`${path}/reviews/${id}/preview`).then((r) => r.data),
  resolveReview: ({
    id,
    ...decision
  }: ResolveGarminPersonalReview & { id: number }) =>
    client
      .post<{ resolved: boolean; pending: boolean }>(
        `${path}/reviews/${id}/resolve`,
        decision,
      )
      .then((r) => r.data),
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
