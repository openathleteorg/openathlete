import {
  ActivityStream,
  CompressedActivityStream,
  CompressedActivityStreamUnit,
  isValidGpsPoint,
} from '@openathlete/shared';

export const reductActivityStreamToResolution = (
  stream: (number | number[] | boolean)[],
  resolution: number,
) => {
  if (resolution >= stream.length) {
    return stream;
  }

  const compression = stream.length / resolution;

  const compressedStream: (number | number[] | boolean)[] = [];

  let previousIndex = -1;
  for (let i = 0; i < stream.length; i += compression) {
    const index = Math.floor(i);
    const sample = stream[index];
    // Preserve GPS gaps even when their original sample would be skipped.
    const crossesGap =
      Array.isArray(sample) &&
      stream
        .slice(previousIndex + 1, index + 1)
        .some((point) => Array.isArray(point) && point.length === 0);
    compressedStream.push(crossesGap ? [] : sample);
    previousIndex = index;
  }

  return compressedStream;
};

const checkEqual = (a: number | number[], b: number | number[]) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
};

const CHANGE_TO_OBJECT = 3;

const pushToCompressed = (
  compressed: CompressedActivityStreamUnit[],
  previous: number | number[],
  repeatCount: number,
  incrCount: number,
) => {
  if (repeatCount === 1 && incrCount === 1) {
    compressed.push(previous || 0);
  } else if (repeatCount > 1) {
    if (repeatCount <= CHANGE_TO_OBJECT) {
      for (let j = 0; j < repeatCount; j++) {
        compressed.push(previous || 0);
      }
    } else {
      compressed.push({ r: repeatCount, v: previous || 0 });
    }
    repeatCount = 1;
  } else if (incrCount > 1 && typeof previous === 'number') {
    if (incrCount <= CHANGE_TO_OBJECT) {
      for (let j = 0; j < incrCount; j++) {
        compressed.push(previous - incrCount + j + 1);
      }
    } else {
      compressed.push({ s: (previous || 0) - incrCount + 1, i: incrCount });
    }
    incrCount = 1;
  }
  return { compressed, repeatCount, incrCount };
};

const compressStream = (
  stream: (number | number[])[],
): CompressedActivityStreamUnit[] => {
  let compressed: CompressedActivityStreamUnit[] = [];
  let repeatCount = 1;
  let incrCount = 1;
  let previous = stream[0];

  for (let i = 1; i < stream.length; i++) {
    const current = stream[i];
    if (checkEqual(previous, current) && incrCount === 1) {
      repeatCount++;
    } else if (
      typeof current === 'number' &&
      typeof previous === 'number' &&
      current === previous + 1 &&
      repeatCount === 1
    ) {
      incrCount++;
    } else {
      const result = pushToCompressed(
        compressed,
        previous,
        repeatCount,
        incrCount,
      );
      compressed = result.compressed;
      repeatCount = result.repeatCount;
      incrCount = result.incrCount;
    }
    previous = current;
  }
  const result = pushToCompressed(compressed, previous, repeatCount, incrCount);
  compressed = result.compressed;
  return compressed;
};

const uncompressStream = (
  stream: CompressedActivityStreamUnit[],
): (number | number[])[] => {
  const uncompressed: (number | number[])[] = [];

  for (const iter of stream) {
    if (typeof iter === 'number' || Array.isArray(iter)) {
      uncompressed.push(iter);
    } else {
      if ('r' in iter && 'v' in iter) {
        for (let i = 0; i < iter.r; i++) {
          uncompressed.push(iter.v);
        }
      } else if ('s' in iter && 'i' in iter) {
        for (let i = 0; i < iter.i; i++) {
          uncompressed.push(iter.s + i);
        }
      }
    }
  }
  return uncompressed;
};

export const compressActivityStream = (
  stream: ActivityStream,
): CompressedActivityStream => {
  const compressedStream: Partial<CompressedActivityStream> = {};
  for (const key in stream) {
    const typedKey = key as keyof ActivityStream;
    let value = stream[typedKey];
    if (typedKey === 'latlng' && value) {
      // Applies to FIT, Garmin and Strava streams. A shortened channel cannot
      // be aligned safely without original indices; never guess its timestamps.
      if (stream.time && value.length !== stream.time.length) continue;
      value = value.map((point) => (isValidGpsPoint(point) ? point : []));
      if (!value.some(isValidGpsPoint)) continue;
    }
    if (value && value.length > 0) {
      (compressedStream as Record<string, unknown>)[typedKey] =
        compressStream(value);
    }
  }
  return compressedStream as CompressedActivityStream;
};

export const uncompressActivityStream = (
  stream: CompressedActivityStream,
): ActivityStream => {
  const uncompressedStream: Partial<ActivityStream> = {};
  for (const key in stream) {
    const typedKey = key as keyof CompressedActivityStream;
    const value = stream[typedKey];
    if (value && value.length > 0) {
      (uncompressedStream as Record<string, unknown>)[typedKey] =
        uncompressStream(value);
    }
  }
  return uncompressedStream as ActivityStream;
};
