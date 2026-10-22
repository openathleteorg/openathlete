import { json } from 'express';

import { NestExpressApplication } from '@nestjs/platform-express';

/** Keep large workout samples scoped to their ingestion endpoint. */
export function configureBodyParsers(app: NestExpressApplication) {
  app.use('/activity-import/healthkit', json({ limit: '20mb' }));
  // Nest detects the route-specific jsonParser above and skips installing its
  // default JSON parser. Register it explicitly for login and every other route,
  // retaining the normal 100 KB limit and raw-body capture for signed webhooks.
  app.useBodyParser('json');
}
