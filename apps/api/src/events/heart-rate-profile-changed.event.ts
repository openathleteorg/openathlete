type HeartRateProfileChangedPayload = {
  athleteId: number;
};

/**
 * An athlete's HR max or resting HR was set, changed or removed by hand: the
 * TRIMP of every activity depends on them, so it is computed again.
 */
export class HeartRateProfileChangedEvent {
  static readonly SLUG = 'athlete.heart-rate-profile-changed';

  constructor(public readonly payload: HeartRateProfileChangedPayload) {}
}
