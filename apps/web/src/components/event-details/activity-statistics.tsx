import { m } from '@/paraglide/messages';
import { ReactNode } from 'react';

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
import {
  ActivityStatKey,
  getActivityStatKeys,
  getElapsedSeconds,
} from './activity-stat-keys';
import { ActivityTrainingLoadStats } from './activity-training-load-stats';

interface P {
  event: ActivityEvent;
  stream?: Pick<
    ActivityStream,
    'altitude' | 'heartrate' | 'latlng' | 'distance'
  >;
}

function ValueStat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="text-left">
      <div className="text-sm font-semibold">{label}</div>
      <div>
        {Math.round(value)}{' '}
        <span className="text-muted-foreground text-sm">{unit}</span>
      </div>
    </div>
  );
}

export function ActivityStatistics({ event, stream }: P) {
  const config = getSportConfig(event.sport);
  const athleteId = event.athleteId ?? undefined;

  const renderStat = (key: ActivityStatKey): ReactNode => {
    switch (key) {
      case 'distance':
        return <DistanceStat label={m.distance()} distance={event.distance} />;
      case 'averageSpeed':
        return (
          <SpeedStat
            label={m.average_speed()}
            speed={event.averageSpeed}
            unit={config.speedUnit}
            athleteId={athleteId}
          />
        );
      case 'maxSpeed':
        return (
          <SpeedStat
            label={m.max_speed()}
            speed={event.maxSpeed}
            unit={config.speedUnit}
            athleteId={athleteId}
          />
        );
      case 'gap':
        return (
          <SpeedStat
            label={m.gap()}
            speed={event.averageGapSpeed!}
            unit={config.speedUnit}
            athleteId={athleteId}
          />
        );
      case 'movingTime':
        return (
          <DurationStat label={m.moving_time()} duration={event.movingTime} />
        );
      case 'elapsedTime':
        return (
          <DurationStat
            label={m.elapsed_time()}
            duration={getElapsedSeconds(event)}
          />
        );
      case 'elevationGain':
        return (
          <ElevationStat
            label={m.elevation_gain()}
            elevation={event.elevationGain}
            altitudeStream={stream?.altitude}
            distanceStream={stream?.distance}
          />
        );
      case 'averageHeartrate':
        return (
          <HeartrateStat
            label={m.average_heart_rate()}
            heartrate={event.averageHeartrate!}
            sport={event.sport}
            athleteId={athleteId}
          />
        );
      case 'maxHeartrate':
        return (
          <HeartrateStat
            label={m.max_heart_rate()}
            heartrate={event.maxHeartrate!}
            sport={event.sport}
            athleteId={athleteId}
          />
        );
      case 'averagePower':
        return (
          <ValueStat
            label={m.average_power()}
            value={event.averageWatts!}
            unit={m.watts()}
          />
        );
      case 'normalizedPower':
        return (
          <ValueStat
            label={m.normalized_power()}
            value={event.weightedAverageWatts!}
            unit={m.watts()}
          />
        );
      case 'maxPower':
        return (
          <ValueStat
            label={m.max_power()}
            value={event.maxWatts!}
            unit={m.watts()}
          />
        );
      case 'averageCadence':
        return (
          <ValueStat
            label={m.average_cadence()}
            value={event.averageCadence!}
            unit={m.rpm()}
          />
        );
      case 'equipment':
        return <EquipmentStat equipmentId={event.equipmentId!} />;
    }
  };

  return (
    <>
      {getActivityStatKeys(event).map((key) => (
        <div key={key} data-activity-stat={key}>
          {renderStat(key)}
        </div>
      ))}
      <ActivityTrainingLoadStats activityId={event.eventId} />
    </>
  );
}
