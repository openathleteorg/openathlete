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

// Garmin notifications. Every webhook body maps a summary type (activities,
// dailies, activityFiles...) to a list of entries: a ping carries a callback
// URL to pull the data from, a push carries the summary itself.
export interface GarminNotificationEntry {
  userId?: string;
  callbackURL?: string;
  [field: string]: unknown;
}

export type GarminNotificationBody = Record<string, unknown>;

export interface GarminDeregistration {
  userId?: string;
}

export interface GarminUserPermissionsChange {
  userId?: string;
  summaryId?: string;
  permissions?: string[];
  changeTimeInSeconds?: number;
}

// Garmin Activity Files ping (FIT, TCX or GPX)
export interface GarminActivityFileNotification {
  userId: string;
  summaryId?: string;
  fileType: string;
  callbackURL: string;
  activityType?: string;
  deviceName?: string;
  startTimeInSeconds?: number;
  activityId: number | string;
  activityName?: string;
  manual?: boolean;
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
  timeOffsetHeartRateSamples?: Record<string, number>;
}

export interface GarminSleepSummary {
  summaryId: string;
  calendarDate: string;
  validation?: string;
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
  onDemand?: boolean;
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

export interface GarminStressDetailsSummary {
  summaryId: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds?: number;
  durationInSeconds?: number;
  calendarDate?: string;
  timeOffsetStressLevelValues?: Record<string, number>;
  timeOffsetBodyBatteryValues?: Record<string, number>;
  bodyBatteryDynamicFeedbackEvent?: {
    eventStartTimeInSeconds?: number;
    bodyBatteryLevel?: string;
  };
  bodyBatteryActivityEventList?: Array<{
    eventType?: string;
    eventStartTimeInSeconds?: number;
    eventStartTimeOffsetInSeconds?: number;
    duration?: number;
    bodyBatteryImpact?: number;
  }>;
}

export interface GarminEpochSummary {
  summaryId: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds?: number;
  activityType?: string;
  durationInSeconds?: number;
  activeTimeInSeconds?: number;
  steps?: number;
  pushes?: number;
  distanceInMeters?: number;
  pushDistanceInMeters?: number;
  activeKilocalories?: number;
  met?: number;
  intensity?: string;
  meanMotionIntensity?: number;
  maxMotionIntensity?: number;
}

export type GarminHealthSummaryType =
  | 'dailies'
  | 'epochs'
  | 'sleeps'
  | 'bodyComps'
  | 'stressDetails'
  | 'userMetrics'
  | 'pulseox'
  | 'allDayRespiration'
  | 'healthSnapshot'
  | 'hrv'
  | 'bloodPressures'
  | 'skinTemp';

// Polar API Types
export interface PolarOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  x_user_id: number; // Same id as polar-user-id, also on an already registered user
}

export interface PolarUser {
  'polar-user-id': number;
  'member-id': string;
  'registration-date': string;
}

/** The non-transactional exercise, in snake case unlike the deprecated one */
export interface PolarExercise {
  id: string;
  upload_time?: string;
  device?: string;
  start_time: string; // Local time, without a zone
  start_time_utc_offset?: number; // Minutes
  duration?: string; // ISO 8601 duration
  calories?: number; // Kilocalories
  distance?: number; // Meters
  heart_rate?: {
    average?: number;
    maximum?: number;
  };
  training_load?: number;
  sport?: string;
  detailed_sport_info?: string;
  has_route?: boolean;
}

export interface PolarDailyActivity {
  start_time?: string; // Local time, without a zone
  active_duration?: string; // ISO 8601 duration
  daily_activity?: number; // Percentage of the daily goal
  calories?: number;
  active_calories?: number;
  steps?: number;
  distance_from_steps?: number; // Meters
}

export interface PolarWebhookPayload {
  event:
    | 'PING'
    | 'EXERCISE'
    | 'SLEEP'
    | 'CONTINUOUS_HEART_RATE'
    | 'ACTIVITY_SUMMARY'
    | 'PHYSICAL_INFORMATION'
    | 'SLEEP_WISE_CIRCADIAN_BEDTIME'
    | 'SLEEP_WISE_ALERTNESS';
  user_id?: number; // AccessLink user id (not present for PING)
  entity_id?: string;
  timestamp: string; // ISO 8601
  url?: string; // Resource URL
}

export interface PolarWebhook {
  id: string;
  events: string[];
  url: string;
  active?: boolean;
}

export interface PolarCreatedWebhook {
  data: PolarWebhook & {
    signature_secret_key: string; // Only returned here
  };
}

export interface PolarSleep {
  date: string;
  light_sleep?: number; // Seconds
  deep_sleep?: number; // Seconds
  rem_sleep?: number; // Seconds
  unrecognized_sleep_stage?: number; // Seconds
  total_interruption_duration?: number; // Seconds
  sleep_score?: number;
}

export interface PolarNightlyRecharge {
  date: string;
  heart_rate_variability_avg?: number;
  breathing_rate_avg?: number;
}

export interface PolarPhysicalInfo {
  weight?: number;
  height?: number;
  modified?: string;
  maximum_heart_rate?: number;
  resting_heart_rate?: number;
  vo2_max?: number;
}

// Suunto Workout API Types
export interface SuuntoPoint {
  x: number; // Longitude
  y: number; // Latitude
}

export interface SuuntoHrdata {
  userMaxHR: number;
  workoutAvgHR: number;
  workoutMaxHR: number;
}

export interface SuuntoCadence {
  max?: number;
  avg?: number;
}

export interface SuuntoLimitedWorkout {
  activityId: number;
  workoutKey: string;
  workoutName?: string;
  startTime: number; // milliseconds since epoch
  stopTime?: number; // milliseconds since epoch
  totalTime: number; // seconds
  totalDistance: number; // meters
  totalAscent?: number; // meters
  totalDescent?: number; // meters
  avgSpeed?: number; // m/s (meters per second)
  maxSpeed?: number; // m/s (meters per second)
  avgPace?: number; // minutes per km
  energyConsumption?: number; // kcal
  minAltitude?: number; // meters
  maxAltitude?: number; // meters
  startPosition?: SuuntoPoint;
  stopPosition?: SuuntoPoint;
  centerPosition?: SuuntoPoint;
  hrdata?: SuuntoHrdata;
  cadence?: SuuntoCadence;
  extensionTypes?: string[];
  extensions?: unknown[];
}

export interface SuuntoWorkoutListResponse {
  error: {
    code: string;
    description: string;
  } | null;
  payload: SuuntoLimitedWorkout[];
  metadata: {
    workoutcount?: string;
    until?: string;
  };
}

export interface SuuntoWorkoutResponse {
  error: {
    code: string;
    description: string;
  } | null;
  payload: SuuntoLimitedWorkout;
  metadata: Record<string, string>;
}

export interface SuuntoWebhookPayload {
  type: string; // e.g., "WORKOUT_CREATED", "SUUNTO_247_ACTIVITY_CREATED", "SUUNTO_247_SLEEP_CREATED", "SUUNTO_247_RECOVERY_CREATED"
  username?: string; // Suunto username
  workout?: {
    workoutKey: string;
    activityId?: number;
    startTime?: number;
    totalTime?: number;
    totalDistance?: number;
    [key: string]: unknown;
  };
  workoutKey?: string; // Fallback: workoutKey can also be at root level
  workoutid?: string; // Legacy form-encoded notifications
  timestamp?: number;
  // 247 Data API webhook payloads
  samples?: Array<
    | {
        timestamp: string;
        entryData: SuuntoDailyActivityEntryData;
      }
    | {
        timestamp: string;
        entryData: SuuntoSleepEntryData;
      }
    | {
        timestamp: string;
        entryData: SuuntoRecoveryEntryData;
      }
  >;
}

// Suunto 247 Data API Types
export interface SuuntoActivitySample {
  Value: string | number | null;
  TimeISO8601: string;
}

export interface SuuntoActivityData {
  Name: string; // Watch identifier
  Samples: SuuntoActivitySample[];
}

export interface SuuntoAggregatedActivityData {
  Name: 'energyconsumption' | 'stepcount';
  Aggregation: 'sum' | 'avg';
  Sources: SuuntoActivityData[];
}

export interface SuuntoDailyActivityEntryData {
  HR?: number; // Average heart rate in BPM
  StepCount?: number; // Accumulated steps
  EnergyConsumption?: number; // Energy consumption in Joules
  SpO2?: number; // SpO2 (Oxygen saturation) 0..1
  Altitude?: number; // Altitude in meters
  HRExt?: {
    Min?: number;
    Max?: number;
  };
  HRV?: number; // HRV in ms
}

export interface SuuntoDailyActivityEntry {
  timestamp: string; // ISO8601 format
  entryData: SuuntoDailyActivityEntryData;
}

export interface SuuntoSleepEntryData {
  DeepSleepDuration?: number; // seconds
  LightSleepDuration?: number; // seconds
  REMSleepDuration?: number; // seconds
  Duration?: number; // seconds (includes awake time)
  Feeling?: number; // 1-5 (Poor to Excellent)
  HRAvg?: number; // BPM
  HRMin?: number; // BPM
  SleepQualityScore?: number; // 0-100
  BodyResourcesInsightId?: number;
  SleepId?: number;
  BedtimeStart?: string; // ISO8601
  BedtimeEnd?: string; // ISO8601
  MaxSpo2?: number; // 0..1
  Altitude?: number; // meters
  AvgHRV?: number; // ms
  AvgHRVSampleCount?: number;
  IsNap?: boolean;
  SleepOnsetLatencyDuration?: number; // seconds
  WakeAfterSleepOnsetDuration?: number; // seconds
  WakeBeforeOffBedDuration?: number; // seconds
  DateTime?: string; // ISO8601
}

export interface SuuntoSleepEntry {
  timestamp: string; // ISO8601 format
  entryData: SuuntoSleepEntryData;
}

export interface SuuntoRecoveryEntryData {
  Balance?: number; // 0.0-1.0 (body's energy level)
  StressState?: number; // 0=Invalid, 1=Relaxing, 2=Active, 3=Passive, 4=Stressful
}

export interface SuuntoRecoveryEntry {
  timestamp: string; // ISO8601 format
  entryData: SuuntoRecoveryEntryData;
}
