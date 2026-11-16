import { ConnectorProvider } from '@openathlete/shared';

export const connectorProviderLabelMap: Record<ConnectorProvider, string> = {
  STRAVA: 'Strava',
  FITBIT: 'Fitbit',
  // The app's full name, as Garmin's brand guidelines require
  GARMIN: 'Garmin Connect',
  APPLE_HEALTH: 'Apple Health',
  SUUNTO: 'Suunto',
  COROS: 'COROS',
  POLAR: 'Polar',
};
