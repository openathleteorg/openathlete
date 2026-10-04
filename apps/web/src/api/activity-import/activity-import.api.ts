import client, { routes } from '@/utils/axios';

import { ImportedActivityDto } from '@openathlete/shared';

export class ActivityImportAPI {
  /** One FIT file of a recorded activity, saved for the signed-in athlete. */
  static async importFit(file: File, name: string) {
    const body = new FormData();
    body.append('file', file);
    body.append('name', name);
    const res = await client.post<ImportedActivityDto>(
      routes.activityImport.fit,
      body,
    );
    return res.data;
  }
}
