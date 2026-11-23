/** A session read from an iCalendar file, in the athlete's local time */
export type IcsSession = {
  name: string;
  description: string;
  start: Date;
  end: Date;
  /** The file gave a day without a time */
  allDay: boolean;
};

/** Planned sessions without a time sit at noon, as in the calendar */
const ALL_DAY_HOUR = 12;
const DEFAULT_SECONDS = 3600;

const unescapeText = (value: string) =>
  value.replace(/\\([\\;,nN])/g, (_, c: string) =>
    c === 'n' || c === 'N' ? '\n' : c,
  );

/**
 * An iCalendar date or date-time. A date is a day; a time ending in Z is
 * UTC; any other time (floating, or with a TZID) is read as the athlete's
 * local time, which is what training calendars mean by it.
 */
function parseDate(
  value: string,
  isDate: boolean,
): { date: Date; allDay: boolean } | null {
  const m = value.match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/,
  );
  if (!m) return null;
  const [, y, mo, d, h, mi, s, utc] = m;
  if (isDate || h === undefined) {
    return {
      date: new Date(Number(y), Number(mo) - 1, Number(d), ALL_DAY_HOUR),
      allDay: true,
    };
  }
  const parts = [
    Number(y),
    Number(mo) - 1,
    Number(d),
    Number(h),
    Number(mi),
    Number(s ?? 0),
  ] as const;
  return {
    date: utc ? new Date(Date.UTC(...parts)) : new Date(...parts),
    allDay: false,
  };
}

/** An iCalendar DURATION such as PT1H30M or P1D, in seconds */
function parseDuration(value: string): number | null {
  const m = value.match(
    /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/,
  );
  if (!m) return null;
  const [, w, d, h, mi, s] = m.map((part) => Number(part ?? 0));
  return (((w * 7 + d) * 24 + h) * 60 + mi) * 60 + s;
}

/**
 * The events of an iCalendar file (a plan exported from a training site,
 * a coach's calendar), as sessions to plan. Cancelled events and events
 * without a start are left out; a timed event keeps its time and length,
 * an all-day one sits at noon for an hour.
 */
export function parseIcsSessions(text: string): IcsSession[] {
  // Long lines continue on lines starting with a space or a tab
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const sessions: IcsSession[] = [];
  let props: Map<string, { value: string; isDate: boolean }> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      props = new Map();
      continue;
    }
    if (line === 'END:VEVENT') {
      if (props) {
        const session = toSession(props);
        if (session) sessions.push(session);
      }
      props = null;
      continue;
    }
    if (!props) continue;
    const colon = line.indexOf(':');
    if (colon <= 0) continue;
    const [name, ...params] = line.slice(0, colon).split(';');
    const key = name.toUpperCase();
    // Only the first of each property counts, as in calendar apps
    if (props.has(key)) continue;
    props.set(key, {
      value: line.slice(colon + 1),
      isDate: params.some((param) => param.toUpperCase() === 'VALUE=DATE'),
    });
  }
  return sessions.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function toSession(
  props: Map<string, { value: string; isDate: boolean }>,
): IcsSession | null {
  if (props.get('STATUS')?.value.toUpperCase() === 'CANCELLED') return null;
  const dtstart = props.get('DTSTART');
  const start = dtstart && parseDate(dtstart.value, dtstart.isDate);
  if (!start) return null;

  let end: Date | null = null;
  if (!start.allDay) {
    const dtend = props.get('DTEND');
    const parsedEnd = dtend && parseDate(dtend.value, dtend.isDate);
    const duration = props.get('DURATION');
    const seconds = duration && parseDuration(duration.value);
    if (parsedEnd && parsedEnd.date > start.date) end = parsedEnd.date;
    else if (seconds) end = new Date(start.date.getTime() + seconds * 1000);
  }

  const name = unescapeText(props.get('SUMMARY')?.value ?? '').trim();
  return {
    name: name.slice(0, 100),
    description: unescapeText(props.get('DESCRIPTION')?.value ?? '').trim(),
    start: start.date,
    end: end ?? new Date(start.date.getTime() + DEFAULT_SECONDS * 1000),
    allDay: start.allDay,
  };
}
