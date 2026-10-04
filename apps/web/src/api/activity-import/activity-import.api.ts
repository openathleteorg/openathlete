import client, { routes } from '@/utils/axios';

import { ImportedActivityDto, SPORT_TYPE } from '@openathlete/shared';

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

  /**
   * One GPX track of a recorded activity. Without `sport`, the API uses the
   * sport the track declares.
   */
  static async importGpx(file: File, name: string, sport?: SPORT_TYPE) {
    const body = new FormData();
    body.append('file', file);
    body.append('name', name);
    if (sport) body.append('sport', sport);
    const res = await client.post<ImportedActivityDto>(
      routes.activityImport.gpx,
      body,
    );
    return res.data;
  }
}
