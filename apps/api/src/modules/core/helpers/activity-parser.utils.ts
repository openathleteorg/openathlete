/**
 * Utility functions shared across activity parsers
 */

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function toTimestamp(value: unknown): number | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export function toFitTimestamp(value: unknown): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }

    // Values coming from FIT files are usually seconds since epoch
    // Treat values that look like seconds and convert to ms
    if (value < 10_000_000_000) {
      return value * 1000;
    }

    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  return null;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function getFromExtensions(
  extensions: unknown,
  keys: string[],
): number | null {
  if (!extensions || typeof extensions !== 'object') {
    return null;
  }

  const containers: Array<Record<string, unknown>> = [];
  const root = extensions as Record<string, unknown>;
  containers.push(root);

  if (root['gpxtpx:TrackPointExtension']) {
    containers.push(
      root['gpxtpx:TrackPointExtension'] as Record<string, unknown>,
    );
  }
  if (root.TrackPointExtension) {
    containers.push(root.TrackPointExtension as Record<string, unknown>);
  }

  for (const container of containers) {
    for (const key of keys) {
      if (container[key] === undefined) {
        continue;
      }

      const value = toNumber(container[key]);
      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}
