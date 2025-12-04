/**
 * Suunto Guide API Types
 * Based on SuuntoPlus Guides API specification
 */

// Guide object structure
export interface SuuntoGuide {
  type: 'sequence';
  name: string; // 1-60 characters
  description: string; // 1-256 characters
  richText?: string; // 1-100000 characters, Markdown format
  shortDescription: string; // 1-23 characters
  owner: string; // 1-64 characters
  url: string; // 1-256 characters, valid URL
  activities?: number[]; // 1-100 activities (activity IDs)
  usage: 'workout';
  localDate?: string; // yyyy-MM-dd format
  externalId?: string; // 1-64 characters
  steps: SuuntoStep[]; // 1-1000 steps
}

// Step types
export type SuuntoStep = SuuntoFieldsStep | SuuntoRepeatStep;

// FieldsStep
export interface SuuntoFieldsStep {
  id?: string; // 1-64 characters
  type: 'fields';
  title?: string; // 1-13 characters
  createManualLap?: boolean;
  transitions?: SuuntoTransition[];
  fields: SuuntoField[]; // Required
  notification?: SuuntoNotification;
}

// RepeatStep
export interface SuuntoRepeatStep {
  id?: string;
  type: 'repeat';
  times: number; // 1-100
  steps: SuuntoFieldsStep[]; // Only FieldsSteps allowed, 1-1000 steps
}

// Transition
export interface SuuntoTransition {
  condition: SuuntoCondition;
  stepId?: string; // If omitted, jumps to next step
}

// Condition types
export type SuuntoCondition =
  | SuuntoManualLapCondition
  | SuuntoStepDistanceCondition
  | SuuntoDistanceCondition
  | SuuntoStepDurationCondition
  | SuuntoDurationCondition
  | SuuntoLocationCondition
  | SuuntoRouteCompletedCondition
  | SuuntoRouteExitedCondition
  | SuuntoOrCondition
  | SuuntoAndCondition;

export interface SuuntoManualLapCondition {
  type: 'manualLap';
}

export interface SuuntoStepDistanceCondition {
  type: 'stepDistance';
  value: number; // meters
}

export interface SuuntoDistanceCondition {
  type: 'distance';
  value: number; // meters
}

export interface SuuntoStepDurationCondition {
  type: 'stepDuration';
  value: number; // seconds
}

export interface SuuntoDurationCondition {
  type: 'duration';
  value: number; // seconds
}

export interface SuuntoLocationCondition {
  type: 'location';
  latitude: number; // WGS84 decimal degrees
  longitude: number; // WGS84 decimal degrees
  distance?: number; // meters
  direction?: number; // degrees 0-360, 0=North
}

export interface SuuntoRouteCompletedCondition {
  type: 'routeCompleted';
}

export interface SuuntoRouteExitedCondition {
  type: 'routeExited';
}

export interface SuuntoOrCondition {
  type: 'or';
  conditions: SuuntoCondition[];
}

export interface SuuntoAndCondition {
  type: 'and';
  conditions: SuuntoCondition[];
}

// Notification
export interface SuuntoNotification {
  title?: string; // 1-13 characters
  text?: string; // 1-54 characters
}

// Field types
export type SuuntoField =
  | SuuntoTextField
  | SuuntoStepDurationCountdownField
  | SuuntoStepDistanceCountdownField
  | SuuntoHeartRateField
  | SuuntoSpeedField
  | SuuntoPaceField
  | SuuntoPowerField
  | SuuntoAltitudeField
  | SuuntoDistanceField
  | SuuntoDurationField
  | SuuntoTemperatureField
  | SuuntoCadenceField
  | SuuntoStrokeRateField
  | SuuntoStrokesField
  | SuuntoEnergyField
  | SuuntoAscentField
  | SuuntoDescentField
  | SuuntoVerticalSpeedField
  | SuuntoSwolfField
  | SuuntoAscentTimeField
  | SuuntoDescentTimeField
  | SuuntoTargetHeartRateField
  | SuuntoTargetSpeedField
  | SuuntoTargetPaceField
  | SuuntoTargetPowerField
  | SuuntoTargetCadenceField;

export type SuuntoWindow = 'workout' | 'manualLap' | 'step';
export type SuuntoAggregate = 'average' | 'min' | 'max';

// Base field interface
interface SuuntoFieldBase {
  title?: string; // 1-9 chars (multiple fields), 12 chars (single field)
}

// TextField
export interface SuuntoTextField extends SuuntoFieldBase {
  type: 'text';
  value: string; // 1-54 characters, can use \n for up to 6 rows
}

// StepDurationCountdownField
export interface SuuntoStepDurationCountdownField extends SuuntoFieldBase {
  type: 'stepDurationCountdown';
  value: number; // seconds
}

// StepDistanceCountdownField
export interface SuuntoStepDistanceCountdownField extends SuuntoFieldBase {
  type: 'stepDistanceCountdown';
  value: number; // meters
}

// HeartRateField
export interface SuuntoHeartRateField extends SuuntoFieldBase {
  type: 'heartRate';
  window?: SuuntoWindow; // 'workout' | 'manualLap'
  aggregate?: SuuntoAggregate; // 'average' | 'min' | 'max'
}

// SpeedField
export interface SuuntoSpeedField extends SuuntoFieldBase {
  type: 'speed';
  window?: SuuntoWindow; // 'workout' | 'manualLap'
  aggregate?: SuuntoAggregate;
}

// PaceField
export interface SuuntoPaceField extends SuuntoFieldBase {
  type: 'pace';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate;
}

// PowerField
export interface SuuntoPowerField extends SuuntoFieldBase {
  type: 'power';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate;
}

// AltitudeField
export interface SuuntoAltitudeField extends SuuntoFieldBase {
  type: 'altitude';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate;
}

// DistanceField
export interface SuuntoDistanceField extends SuuntoFieldBase {
  type: 'distance';
  window?: SuuntoWindow; // 'workout' | 'step' | 'manualLap'
}

// DurationField
export interface SuuntoDurationField extends SuuntoFieldBase {
  type: 'duration';
  window?: SuuntoWindow; // 'workout' | 'step' | 'manualLap'
}

// TemperatureField
export interface SuuntoTemperatureField extends SuuntoFieldBase {
  type: 'temperature';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate;
}

// CadenceField
export interface SuuntoCadenceField extends SuuntoFieldBase {
  type: 'cadence';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate;
}

// StrokeRateField
export interface SuuntoStrokeRateField extends SuuntoFieldBase {
  type: 'strokeRate';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate; // 'average' only
}

// StrokesField
export interface SuuntoStrokesField extends SuuntoFieldBase {
  type: 'strokes';
  window?: SuuntoWindow;
}

// EnergyField
export interface SuuntoEnergyField extends SuuntoFieldBase {
  type: 'energy';
  window?: SuuntoWindow;
}

// AscentField
export interface SuuntoAscentField extends SuuntoFieldBase {
  type: 'ascent';
  window?: SuuntoWindow;
}

// DescentField
export interface SuuntoDescentField extends SuuntoFieldBase {
  type: 'descent';
  window?: SuuntoWindow;
}

// VerticalSpeedField
export interface SuuntoVerticalSpeedField extends SuuntoFieldBase {
  type: 'verticalSpeed';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate;
}

// SwolfField
export interface SuuntoSwolfField extends SuuntoFieldBase {
  type: 'swolf';
  window?: SuuntoWindow;
  aggregate?: SuuntoAggregate; // 'average' only
}

// AscentTimeField
export interface SuuntoAscentTimeField extends SuuntoFieldBase {
  type: 'ascentTime';
  window?: SuuntoWindow;
}

// DescentTimeField
export interface SuuntoDescentTimeField extends SuuntoFieldBase {
  type: 'descentTime';
  window?: SuuntoWindow;
}

// Target fields
export interface SuuntoTargetHeartRateField extends SuuntoFieldBase {
  type: 'targetHeartRate';
  value?: number; // BPM
  min?: number; // BPM
  max?: number; // BPM
}

export interface SuuntoTargetSpeedField extends SuuntoFieldBase {
  type: 'targetSpeed';
  value?: number; // m/s
  min?: number; // m/s
  max?: number; // m/s
}

export interface SuuntoTargetPaceField extends SuuntoFieldBase {
  type: 'targetPace';
  value?: number; // m/s
  min?: number; // m/s
  max?: number; // m/s
}

export interface SuuntoTargetPowerField extends SuuntoFieldBase {
  type: 'targetPower';
  value?: number; // watts
  min?: number; // watts
  max?: number; // watts
}

export interface SuuntoTargetCadenceField extends SuuntoFieldBase {
  type: 'targetCadence';
  value?: number; // Hertz
  min?: number; // Hertz
  max?: number; // Hertz
}

// API Response types
export interface SuuntoGuideResponse {
  error: {
    code: string;
    description: string;
  } | null;
  payload: SuuntoGuidePayload | null;
  metadata: Record<string, string>;
}

export interface SuuntoGuidePayload {
  id: string;
  username: string;
  modificationTime: number; // Unix Epoch milliseconds
  fileModificationTime: number; // Unix Epoch milliseconds
  name: string;
  description: string;
  shortDescription: string;
  richText?: string;
  owner: string;
  url: string;
  iconUrl?: string;
  type: 'SEQUENCE';
  activities: number[];
  localDate?: string;
  usage: 'WORKOUT';
  pinned: boolean;
  externalId?: string;
}

export interface SuuntoGuideListResponse {
  error: {
    code: string;
    description: string;
  } | null;
  payload: SuuntoGuidePayload[];
  metadata: Record<string, string>;
}
