export type ActivityFileKind = 'fit' | 'gpx';

/** Manual imports accept FIT and GPX files, by extension. */
export function activityFileKind(name: string): ActivityFileKind | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.fit')) return 'fit';
  if (lower.endsWith('.gpx')) return 'gpx';
  return null;
}

/** The activity name a file suggests: its file name without extension. */
export const fileActivityName = (name: string) =>
  name.replace(/\.(fit|gpx)$/i, '').slice(0, 100);

/**
 * The track name written in a GPX ("Morning Run", "Rodaje"), read in the
 * browser only to suggest the activity name. Empty when there is none.
 */
export function gpxTrackName(xml: string) {
  try {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) return '';
    const track = doc.getElementsByTagName('trk')[0];
    const name = track
      ? [...track.children].find((child) => child.localName === 'name')
      : undefined;
    return (name?.textContent ?? '').trim().slice(0, 100);
  } catch {
    return '';
  }
}
