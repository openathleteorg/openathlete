import { ActivityStream, isValidGpsPoint } from '@openathlete/shared';

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const finite = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/**
 * The GPS track of an activity as GPX 1.1, to follow it again or open it
 * elsewhere. Each point keeps its altitude and time, and heart rate and
 * cadence in the Garmin extension most apps read. A GPS gap starts a new
 * segment, so no straight line is drawn across it. Null without a point.
 */
export function activityToGpx(
  activity: {
    name: string;
    startDate: Date;
    sport: string;
    /** Who the data comes from, when they must be named */
    source?: string | null;
  },
  stream: ActivityStream,
): string | null {
  const latlng = stream.latlng ?? [];
  const start = activity.startDate.getTime();
  const segments: string[][] = [];
  let segment: string[] | null = null;

  latlng.forEach((point, i) => {
    if (!isValidGpsPoint(point)) {
      segment = null;
      return;
    }
    const [lat, lon] = point;
    const ele = stream.altitude?.[i];
    const seconds = stream.time?.[i];
    const hr = stream.heartrate?.[i];
    const cad = stream.cadence?.[i];
    const extensions = [
      finite(hr) && hr > 0 ? `<gpxtpx:hr>${Math.round(hr)}</gpxtpx:hr>` : '',
      finite(cad) && cad > 0
        ? `<gpxtpx:cad>${Math.round(cad)}</gpxtpx:cad>`
        : '',
    ].join('');
    const lines = [
      `      <trkpt lat="${lat.toFixed(7)}" lon="${lon.toFixed(7)}">`,
      finite(ele) ? `        <ele>${ele.toFixed(1)}</ele>` : null,
      finite(seconds)
        ? `        <time>${new Date(start + seconds * 1000).toISOString()}</time>`
        : null,
      extensions
        ? `        <extensions><gpxtpx:TrackPointExtension>${extensions}</gpxtpx:TrackPointExtension></extensions>`
        : null,
      '      </trkpt>',
    ];
    if (!segment) {
      segment = [];
      segments.push(segment);
    }
    segment.push(lines.filter((line) => line !== null).join('\n'));
  });

  if (segments.length === 0) return null;

  const name = escapeXml(activity.name);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<gpx version="1.1" creator="OpenAthlete"',
    '  xmlns="http://www.topografix.com/GPX/1/1"',
    '  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"',
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">',
    '  <metadata>',
    `    <name>${name}</name>`,
    `    <time>${activity.startDate.toISOString()}</time>`,
    '  </metadata>',
    '  <trk>',
    `    <name>${name}</name>`,
    // GPX 1.1 puts src between name and type
    ...(activity.source
      ? [`    <src>${escapeXml(activity.source)}</src>`]
      : []),
    `    <type>${escapeXml(activity.sport.toLowerCase())}</type>`,
    ...segments.map((points) =>
      ['    <trkseg>', ...points, '    </trkseg>'].join('\n'),
    ),
    '  </trk>',
    '</gpx>',
    '',
  ].join('\n');
}

/** "Garmin [device model]", or "Garmin": the web shows the same label */
export function garminSourceLabel(deviceName?: string | null): string {
  return deviceName ? `Garmin ${deviceName}` : 'Garmin';
}

/** The name a downloaded track gets: the activity's date and name */
export function gpxFileName(activity: { name: string; startDate: Date }) {
  const name =
    activity.name
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'activity';
  return `${activity.startDate.toISOString().slice(0, 10)}-${name}.gpx`;
}
