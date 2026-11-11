import type { NextFunction, Request, Response } from 'express';

/** JSON bodies the app sends: plans, workouts and messages stay far below */
export const JSON_BODY_LIMIT = '1mb';

/**
 * Garmin's production review requires accepting notification bodies of at
 * least 10 MB. These routes read the body without Zod.
 */
export const GARMIN_WEBHOOK_PATH = '/provider/garmin/webhook';
export const GARMIN_WEBHOOK_BODY_LIMIT = '10mb';

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
