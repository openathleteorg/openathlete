export interface StravaSummaryActivity {
  id: number;
  resource_state: number;
  athlete: {
    id: number;
    resource_state: number;
  };
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: string;
  workout_type: string;
  external_id: string;
  upload_id: number;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset: number;
  start_latlng: {
    lat: number;
    lng: number;
  };
  end_latlng: {
    lat: number;
    lng: number;
  };
  location_city: string;
  location_state: string;
  location_country: string;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string;
  from_accepted_tag: boolean;
  average_speed: number;
  max_speed: number;
  average_cadence: number;
  average_watts: number;
  weighted_average_watts: number;
  kilojoules: number;
  device_watts: boolean;
  has_heartrate: boolean;
  average_heartrate: number;
  max_heartrate: number;
  max_watts: number;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: boolean;
  suffer_score: number;
}

export interface StravaSteam {
  type: string;
  data: (number | number[])[];
}

// Garmin Activity API Types
export interface GarminActivitySummary {
  summaryId: string;
  activityId: string;
  activityType: string;
  activityName: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds: number;
  durationInSeconds: number;
  averageSpeedInMetersPerSecond?: number;
  distanceInMeters?: number;
  activeKilocalories?: number;
  deviceName?: string;
  averagePaceInMinutesPerKilometer?: number;
  averageBikeCadenceInRoundsPerMinute?: number;
  averageHeartRateInBeatsPerMinute?: number;
  averageRunCadenceInStepsPerMinute?: number;
  averageSwimCadenceInStrokesPerMinute?: number;
  maxBikeCadenceInRoundsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  maxPaceInMinutesPerKilometer?: number;
  maxRunCadenceInStepsPerMinute?: number;
  maxSpeedInMetersPerSecond?: number;
  numberOfActiveLengths?: number;
  startingLatitudeInDegree?: number;
  startingLongitudeInDegree?: number;
  steps?: number;
  totalElevationGainInMeters?: number;
  totalElevationLossInMeters?: number;
  isParent?: boolean;
  parentSummaryId?: string;
  manual?: boolean;
  isWebUpload?: boolean;
}

export interface GarminActivityDetailSample {
  startTimeInSeconds: number;
  latitudeInDegree?: number;
  longitudeInDegree?: number;
  elevationInMeters?: number;
  airTemperatureCelcius?: number;
  heartRate?: number;
  speedMetersPerSecond?: number;
  stepsPerMinute?: number;
  totalDistanceInMeters?: number;
  timerDurationInSeconds?: number;
  clockDurationInSeconds?: number;
  movingDurationInSeconds?: number;
  powerInWatts?: number;
  bikeCadenceInRPM?: number;
  directWheelchairCadence?: number;
  swimCadenceInStrokesPerMinute?: number;
}

export interface GarminActivityDetail {
  summaryId: string;
  activityId: string;
  summary: {
    startTimeInSeconds: number;
    startTimeOffsetInSeconds: number;
    activityType: string;
    activityName: string;
    durationInSeconds: number;
    averageSpeedInMetersPerSecond?: number;
    distanceInMeters?: number;
    activeKilocalories?: number;
    deviceName?: string;
    averagePaceInMinutesPerKilometer?: number;
    averageBikeCadenceInRoundsPerMinute?: number;
    averageHeartRateInBeatsPerMinute?: number;
    averageRunCadenceInStepsPerMinute?: number;
    averageSwimCadenceInStrokesPerMinute?: number;
    maxBikeCadenceInRoundsPerMinute?: number;
    maxHeartRateInBeatsPerMinute?: number;
    maxPaceInMinutesPerKilometer?: number;
    maxRunCadenceInStepsPerMinute?: number;
    maxSpeedInMetersPerSecond?: number;
    numberOfActiveLengths?: number;
    startingLatitudeInDegree?: number;
    startingLongitudeInDegree?: number;
    steps?: number;
    totalElevationGainInMeters?: number;
    totalElevationLossInMeters?: number;
    isParent?: boolean;
    parentSummaryId?: string;
    manual?: boolean;
  };
  samples?: GarminActivityDetailSample[];
  laps?: Array<{ startTimeInSeconds: number }>;
}

// Garmin Webhook Types
export interface GarminActivityPingWebhook {
  userId: string;
  callbackURL: string; // URL to call to fetch activities (contains Pull Token)
}

export interface GarminDeregistrationWebhook {
  userId: string;
}

// Garmin Activity Files Webhook (for FIT/TCX/GPX files)
export interface GarminActivityFilePingWebhook {
  userId: string;
  summaryId: string;
  fileType: 'FIT' | 'GPX';
  callbackURL: string;
  activityType: string;
  deviceName: string;
  startTimeInSeconds: number;
  activityId: number;
  activityName: string;
  manual: boolean;
  activityDescription?: string;
}

// Garmin Health Summary Types
export interface GarminDailySummary {
  summaryId: string;
  calendarDate: string;
  steps?: number;
  distanceInMeters?: number;
  activeTimeInSeconds?: number;
  moderateIntensityDurationInSeconds?: number;
  vigorousIntensityDurationInSeconds?: number;
  floorsClimbed?: number;
  activeKilocalories?: number;
  bmrKilocalories?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  minHeartRateInBeatsPerMinute?: number;
  restingHeartRateInBeatsPerMinute?: number;
  averageStressLevel?: number;
  maxStressLevel?: number;
  stressDurationInSeconds?: number;
  restStressDurationInSeconds?: number;
  activityStressDurationInSeconds?: number;
  lowStressDurationInSeconds?: number;
  mediumStressDurationInSeconds?: number;
  highStressDurationInSeconds?: number;
  bodyBatteryChargedValue?: number;
  bodyBatteryDrainedValue?: number;
}

export interface GarminSleepSummary {
  summaryId: string;
  calendarDate: string;
  durationInSeconds?: number;
  totalNapDurationInSeconds?: number;
  deepSleepDurationInSeconds?: number;
  lightSleepDurationInSeconds?: number;
  remSleepInSeconds?: number;
  awakeDurationInSeconds?: number;
  overallSleepScore?: {
    value?: number;
  };
  timeOffsetSleepRespiration?: Record<string, number>;
  timeOffsetSleepSpo2?: Record<string, number>;
}

export interface GarminBodyCompositionSummary {
  summaryId: string;
  measurementTimeInSeconds: number;
  measurementTimeOffsetInSeconds?: number;
  weightInGrams?: number;
  bodyFatInPercent?: number;
  bodyWaterInPercent?: number;
  bodyMassIndex?: number;
  muscleMassInGrams?: number;
  boneMassInGrams?: number;
}

export interface GarminUserMetricsSummary {
  summaryId: string;
  calendarDate: string;
  vo2Max?: number;
  vo2MaxCycling?: number;
  fitnessAge?: number;
}

export interface GarminPulseOxSummary {
  summaryId: string;
  calendarDate: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds?: number;
  timeOffsetSpo2Values?: Record<string, number>;
}

export interface GarminRespirationSummary {
  summaryId: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds?: number;
  durationInSeconds?: number;
  timeOffsetEpochToBreaths?: Record<string, number>;
}

export interface GarminHealthSnapshotSummary {
  summaryId: string;
  calendarDate: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds?: number;
  summaries: Array<{
    summaryType: string;
    avgValue?: number;
  }>;
}

export interface GarminHrvSummary {
  summaryId: string;
  calendarDate: string;
  lastNightAvg?: number;
  lastNight5MinHigh?: number;
}

export interface GarminBloodPressureSummary {
  summaryId: string;
  measurementTimeInSeconds: number;
  measurementTimeOffsetInSeconds?: number;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
}

export interface GarminSkinTempSummary {
  summaryId: string;
  calendarDate: string;
  avgDeviationCelsius?: number;
}

export type GarminHealthSummaryType =
  | 'dailies'
  | 'sleeps'
  | 'bodyComps'
  | 'userMetrics'
  | 'pulseox'
  | 'allDayRespiration'
  | 'healthSnapshot'
  | 'hrv'
  | 'bloodPressures'
  | 'skinTemp';

export interface GarminHealthNotification {
  userId: string;
  callbackURL: string;
}

export type GarminHealthPingPayload = Partial<
  Record<GarminHealthSummaryType, GarminHealthNotification[]>
>;
