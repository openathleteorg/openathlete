import {
  ActivityStream,
  CompressedActivityStream,
  CompressedActivityStreamUnit,
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

  for (let i = 0; i < stream.length; i += compression) {
    compressedStream.push(stream[Math.floor(i)]);
  }

  return compressedStream;
};

const checkEqual = (a: number | number[], b: number | number[]) => {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.every((v, i) => v === b[i]);
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
  const compressedStream: CompressedActivityStream = {};
  for (const key in stream) {
    if (stream[key] && stream[key].length > 0) {
      compressedStream[key] = compressStream(stream[key]);
    }
  }
  return compressedStream;
};

export const uncompressActivityStream = (
  stream: CompressedActivityStream,
): ActivityStream => {
  const uncompressedStream: ActivityStream = {};
  for (const key in stream) {
    if (stream[key] && stream[key].length > 0) {
      uncompressedStream[key] = uncompressStream(stream[key]);
    }
  }
  return uncompressedStream;
};
