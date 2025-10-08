import { m } from '@/paraglide/messages';

import { ActivityEvent, ActivityStream, SPORT_TYPE } from '@openathlete/shared';

import {
  DistanceStat,
  DurationStat,
  ElevationStat,
  EquipmentStat,
  HeartrateStat,
  SpeedStat,
} from '../numeric-stats';

interface P {
  event: ActivityEvent;
  stream?: Pick<
    ActivityStream,
    'altitude' | 'heartrate' | 'latlng' | 'distance'
  >;
}

export function ActivityStatistics({ event, stream }: P) {
  if (
    event.sport === SPORT_TYPE.RUNNING ||
    event.sport === SPORT_TYPE.TRAIL_RUNNING
  ) {
    return (
      <>
        <DistanceStat label={m.distance()} distance={event.distance} />
        <SpeedStat label={m.average_speed()} speed={event.averageSpeed} />
        {typeof event.averageGapSpeed === 'number' && (
          <SpeedStat label="GAP" speed={event.averageGapSpeed} />
        )}
        <DurationStat
          label={m.duration()}
          duration={event.movingTime}
          movingDuration={event.movingTime}
        />
        <ElevationStat
          label={m.elevation_gain()}
          elevation={event.elevationGain}
          altitudeStream={stream?.altitude}
          distanceStream={stream?.distance}
        />
        {event.averageHeartrate && (
          <HeartrateStat
            label={m.average_heart_rate()}
            heartrate={event.averageHeartrate}
            sport={event.sport}
          />
        )}
        {event.maxHeartrate && (
          <HeartrateStat
            label={m.max_heart_rate()}
            heartrate={event.maxHeartrate}
            sport={event.sport}
          />
        )}
        {event.equipmentId && <EquipmentStat equipmentId={event.equipmentId} />}
      </>
    );
  } else if (event.sport === SPORT_TYPE.CYCLING) {
    return (
      <>
        <DistanceStat label={m.distance()} distance={event.distance} />
        <SpeedStat
          label={m.average_speed()}
          speed={event.averageSpeed}
          unit="km/h"
        />
        <DurationStat
          label={m.duration()}
          duration={event.movingTime}
          movingDuration={event.movingTime}
        />
        <SpeedStat label={m.max_speed()} speed={event.maxSpeed} unit="km/h" />
        <ElevationStat
          label={m.elevation_gain()}
          elevation={event.elevationGain}
          altitudeStream={stream?.altitude}
          distanceStream={stream?.distance}
        />
        {event.averageHeartrate && (
          <HeartrateStat
            label={m.average_heart_rate()}
            heartrate={event.averageHeartrate}
            sport={event.sport}
          />
        )}
        {event.maxHeartrate && (
          <HeartrateStat
            label={m.max_heart_rate()}
            heartrate={event.maxHeartrate}
            sport={event.sport}
          />
        )}
        {event.equipmentId && <EquipmentStat equipmentId={event.equipmentId} />}
      </>
    );
  } else if (event.sport === SPORT_TYPE.HIKING) {
    return (
      <>
        <DistanceStat label={m.distance()} distance={event.distance} />
        <SpeedStat label={m.average_speed()} speed={event.averageSpeed} />
        <DurationStat
          label={m.duration()}
          duration={event.movingTime}
          movingDuration={event.movingTime}
        />
        <ElevationStat
          label={m.elevation_gain()}
          elevation={event.elevationGain}
          altitudeStream={stream?.altitude}
          distanceStream={stream?.distance}
        />
        {event.averageHeartrate && (
          <HeartrateStat
            label={m.average_heart_rate()}
            heartrate={event.averageHeartrate}
            sport={event.sport}
          />
        )}
        {event.maxHeartrate && (
          <HeartrateStat
            label={m.max_heart_rate()}
            heartrate={event.maxHeartrate}
            sport={event.sport}
          />
        )}
        {event.equipmentId && <EquipmentStat equipmentId={event.equipmentId} />}
      </>
    );
  } else {
    return (
      <>
        <DurationStat
          label={m.duration()}
          duration={event.movingTime}
          movingDuration={event.movingTime}
        />
        {event.equipmentId && <EquipmentStat equipmentId={event.equipmentId} />}
      </>
    );
  }
}
