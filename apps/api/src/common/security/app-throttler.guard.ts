import { createHash } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type TrackedRequest = {
  ip?: string;
  path?: string;
  headers?: Record<string, string | string[] | undefined>;
};

/**
 * Rate limits per client IP, except on the MCP endpoint: MCP clients such as
 * Claude or ChatGPT call it from a few shared server addresses for all their
 * users, so it is limited per access token instead.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: TrackedRequest): Promise<string> {
    const authorization = req.headers?.authorization;
    if (
      req.path === '/mcp' &&
      typeof authorization === 'string' &&
      authorization.startsWith('Bearer ')
    ) {
      return `mcp:${createHash('sha256').update(authorization).digest('hex')}`;
    }
    return req.ip ?? '';
  }
}
