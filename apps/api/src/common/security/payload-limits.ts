import type { NextFunction, Request, Response } from 'express';

import { MAX_ACTIVITY_FILE_BYTES } from '@openathlete/shared';

/** JSON bodies the app sends: plans, workouts and messages stay far below */
export const JSON_BODY_LIMIT = '1mb';

// Leave room for RunGap's metadata and multipart framing around the FIT file.
export const ACTIVITY_WEBHOOK_UPLOAD_PATH = '/activity-import/webhook/upload';
export const ACTIVITY_WEBHOOK_BODY_LIMIT =
  MAX_ACTIVITY_FILE_BYTES + 1024 * 1024;

/**
 * Garmin's production review requires accepting notification bodies of at
 * least 10 MB. These routes read the body without Zod.
 */
export const GARMIN_WEBHOOK_PATH = '/provider/garmin/webhook';
export const GARMIN_WEBHOOK_BODY_LIMIT = '10mb';
const GARMIN_WEBHOOK_BODY_BYTES = 10 * 1024 * 1024;

/**
 * Activity details, which the review requires accepting up to 100 MB. The
 * app drops them (the activity file brings the same stream): a body past
 * the JSON limit is read to its end and answered 200, without being kept.
 */
export const GARMIN_ACTIVITY_DETAILS_PATH = `${GARMIN_WEBHOOK_PATH}/activity-details`;
export const GARMIN_ACTIVITY_DETAILS_MAX_BYTES = 100 * 1024 * 1024;

/** Drains pushed activity details too large to parse, before any parser */
export function drainGarminActivityDetails(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const length = Number(req.headers['content-length']);
  if (
    req.method !== 'POST' ||
    !req.path.startsWith(GARMIN_ACTIVITY_DETAILS_PATH) ||
    !(length > GARMIN_WEBHOOK_BODY_BYTES)
  ) {
    next();
    return;
  }
  if (length > GARMIN_ACTIVITY_DETAILS_MAX_BYTES) {
    res.status(413).json({ statusCode: 413, message: 'Payload too large' });
    return;
  }
  req.on('end', () => res.status(200).json({ success: true }));
  req.on('error', () => {
    if (!res.headersSent) res.status(400).end();
  });
  req.resume();
}

/**
 * Array items a request may carry, all arrays together. Zod 3 records an
 * issue for every invalid element of an array, even past its .max(), so one
 * request with many wrong values can take hundreds of MB to validate
 * (GHSA-mrhx-c7xc-m3w5). The cap is on the total, not on each array: nested
 * arrays (sessions of workout steps) would otherwise let 1 MB of JSON carry
 * 250,000 values. Nothing the app sends comes close.
 */
export const MAX_ARRAY_ITEMS = 10_000;

/** Whether the value holds more array items than the limit, at any depth */
export function exceedsArrayLimit(
  value: unknown,
  max = MAX_ARRAY_ITEMS,
): boolean {
  // Iterative: a deeply nested body must not overflow the stack
  const pending: unknown[] = [value];
  let items = 0;
  while (pending.length) {
    const current = pending.pop();
    if (Array.isArray(current)) {
      items += current.length;
      if (items > max) return true;
      pending.push(...current);
    } else if (current !== null && typeof current === 'object') {
      pending.push(...Object.values(current));
    }
  }
  return false;
}

/** Answers 413 to a parsed body with an oversized array, before validation */
export function rejectOversizedArrays(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (
    !req.path.startsWith(GARMIN_WEBHOOK_PATH) &&
    !Buffer.isBuffer(req.body) &&
    exceedsArrayLimit(req.body)
  ) {
    res.status(413).json({
      statusCode: 413,
      message: `Requests are limited to ${MAX_ARRAY_ITEMS} array items`,
    });
    return;
  }
  next();
}
