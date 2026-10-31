import type { Request } from 'express';

import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { AnalyticsService } from './analytics.service';

/** Reports what the API did not mean to answer, then answers as Nest would. */
@Catch()
export class ExceptionReportingFilter extends BaseExceptionFilter {
  constructor(private readonly analytics: AnalyticsService) {
    super();
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    if (status >= 500 && host.getType() === 'http') {
      const request = host.switchToHttp().getRequest<Request>();
      this.analytics.captureException(exception, {
        // The route, not the URL: paths hold ids and query strings hold codes
        route: (request.route as { path?: string } | undefined)?.path,
        method: request.method,
        status,
      });
    }
    super.catch(exception, host);
  }
}
