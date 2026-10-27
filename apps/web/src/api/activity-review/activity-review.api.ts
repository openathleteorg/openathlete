import client from '@/utils/axios';

import { ActivityReviewPage, ResolveActivityReview } from '@openathlete/shared';

const path = '/activity-import/reviews';
export const ActivityReviewAPI = {
  list: (cursor?: string) =>
    client
      .get<ActivityReviewPage>(path, { params: { cursor } })
      .then((r) => r.data),
  prepare: (id: string) =>
    client
      .post(`${path}/${encodeURIComponent(id)}/prepare`)
      .then((r) => r.data),
  resolve: ({ id, ...decision }: ResolveActivityReview & { id: string }) =>
    client
      .post<{ resolved: boolean; pending: boolean }>(
        `${path}/${encodeURIComponent(id)}/resolve`,
        decision,
      )
      .then((r) => r.data),
};
