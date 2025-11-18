import { m } from '@/paraglide/messages';

import {
  ActivityEvent,
  ActivityStream,
  getSportConfig,
} from '@openathlete/shared';

import {
  DistanceStat,
  DurationStat,
  ElevationStat,
  EquipmentStat,
  HeartrateStat,
  SpeedStat,
} from '../numeric-stats';
import { ActivityTrainingLoadStats } from './activity-training-load-stats';

interface P {
  event: ActivityEvent;
  stream?: Pick<
    ActivityStream,
    'altitude' | 'heartrate' | 'latlng' | 'distance'
  >;
}

export function ActivityStatistics({ event, stream }: P) {
  const config = getSportConfig(event.sport);

  return (
    <>
      {config.showDistance && (
        <DistanceStat label={m.distance()} distance={event.distance} />
      )}
      {config.showSpeed && (
        <SpeedStat
          label={m.average_speed()}
          speed={event.averageSpeed}
          unit={config.speedUnit}
        />
      )}
      {config.showMaxSpeed && event.maxSpeed && (
        <SpeedStat
          label={m.max_speed()}
          speed={event.maxSpeed}
          unit={config.speedUnit}
        />
      )}
      {config.showGap && typeof event.averageGapSpeed === 'number' && (
        <SpeedStat
          label={m.gap()}
          speed={event.averageGapSpeed}
          unit={config.speedUnit}
        />
      )}
      <DurationStat
        label={m.duration()}
        duration={event.movingTime}
        movingDuration={event.movingTime}
      />
      {config.showElevation && (
        <ElevationStat
          label={m.elevation_gain()}
          elevation={event.elevationGain}
          altitudeStream={stream?.altitude}
          distanceStream={stream?.distance}
        />
      )}
      {config.showHeartrate && event.averageHeartrate && (
        <HeartrateStat
          label={m.average_heart_rate()}
          heartrate={event.averageHeartrate}
          sport={event.sport}
        />
      )}
      {config.showHeartrate && event.maxHeartrate && (
        <HeartrateStat
          label={m.max_heart_rate()}
          heartrate={event.maxHeartrate}
          sport={event.sport}
        />
      )}
      {event.equipmentId && <EquipmentStat equipmentId={event.equipmentId} />}
      <ActivityTrainingLoadStats activityId={event.eventId} />
    </>
  );
}
