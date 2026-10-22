import { AthleteAPI } from '@/api/athlete/athlete.api';
import { EventAPI } from '@/api/event/event.api';
import { MetricAPI } from '@/api/metric/metric.api';
import { m } from '@/paraglide/messages';
import { localZwift } from '@/utils/zwift';
import {
  cyclingSports,
  todaysZwiftWorkouts,
  zwiftWorkoutXML,
} from '@/utils/zwift-workout';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { type Event } from '@openathlete/shared';

import { useZwiftConnection } from './zwift-connection';
import { zwiftFailure } from './zwift-errors';

/** The sync panel and workout details share one authorization/export/upload flow. */
export function useZwiftUpload() {
  const connection = useZwiftConnection();
  const athleteQuery = useQuery({
    queryKey: ['zwiftOwnAthlete', connection.scope],
    queryFn: AthleteAPI.getMyAthlete,
    enabled: connection.available,
  });
  const athlete = athleteQuery.data;
  const { binding, scope } = connection;
  const [busy, setBusy] = useState<number | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const running = useRef(false);
  const current = useRef(scope);
  current.current = scope;
  useEffect(() => {
    current.current = scope;
    setBusy(null);
    setMessages({});
    return () => {
      current.current = '';
    };
  }, [scope]);
  const ownsWorkout = (event: Event) =>
    event.type === 'TRAINING' &&
    cyclingSports.has(event.sport) &&
    !event.relatedActivity &&
    Boolean(athlete?.athleteId) &&
    event.athleteId === athlete?.athleteId;
  const send = async (eventID: number, todayOnly = false) => {
    if (
      running.current ||
      !connection.available ||
      !connection.query.data?.connected ||
      !athlete?.athleteId
    )
      return;
    running.current = true;
    const started = scope;
    setBusy(eventID);
    setMessages((previous) => ({ ...previous, [eventID]: '' }));
    let stage = 'plan';
    try {
      const event = await EventAPI.getEvent(eventID);
      // Re-read ownership/completion and, for Sync, the day at the moment of sending.
      if (
        !ownsWorkout(event) ||
        (todayOnly && !todaysZwiftWorkouts([event], new Date()).length)
      )
        throw new Error('Changed workout');
      stage = 'metrics';
      const metrics = await MetricAPI.getLatestMetrics();
      stage = 'export';
      const xml = zwiftWorkoutXML(event, metrics.FTP_CYCLING?.value);
      if (current.current !== started) return;
      stage = 'upload';
      const result = await localZwift.upload({ ...binding, eventID, xml });
      if (!result.verified) throw new Error('Unverified upload');
      if (current.current === started)
        setMessages((previous) => ({
          ...previous,
          [eventID]: m.zwift_uploaded(),
        }));
    } catch (error) {
      if (current.current === started)
        setMessages((previous) => ({
          ...previous,
          [eventID]:
            zwiftFailure(error) +
            (stage === 'upload'
              ? ''
              : ` [openathlete-${stage}${isAxiosError(error) && error.response ? `-http-${error.response.status}` : ''}]`),
        }));
    } finally {
      running.current = false;
      if (current.current === started) setBusy(null);
    }
  };
  return {
    ...connection,
    busy,
    messages,
    send,
    ownsWorkout,
    athleteReady: Boolean(athlete?.athleteId),
    athleteQuery,
  };
}
