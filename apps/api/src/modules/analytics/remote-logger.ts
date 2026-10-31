import { SeverityNumber } from '@opentelemetry/api-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from '@opentelemetry/sdk-logs';

import { ConsoleLogger, LogLevel } from '@nestjs/common';

const SEVERITIES: Partial<Record<LogLevel, SeverityNumber>> = {
  log: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

/**
 * Writes to the console as Nest does, and copies logs to PostHog. Used only
 * when POSTHOG_PROJECT_TOKEN is set; debug and verbose stay on the console.
 */
export class RemoteLogger extends ConsoleLogger {
  private readonly provider: LoggerProvider;
  private readonly remote;

  constructor(token: string, host: string) {
    super();
    this.provider = new LoggerProvider({
      resource: resourceFromAttributes({
        // The same image runs both roles
        'service.name':
          process.env.ENABLE_ACTIVITY_PROCESSING === 'true'
            ? 'openathlete-worker'
            : 'openathlete-api',
        'deployment.environment': process.env.NODE_ENV ?? 'production',
      }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${host.replace(/\/$/, '')}/i/v1/logs`,
            headers: { Authorization: `Bearer ${token}` },
          }),
        }),
      ],
    });
    this.remote = this.provider.getLogger('nestjs');
  }

  protected override printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
  ) {
    super.printMessages(
      messages,
      context,
      logLevel,
      writeStreamType,
      errorStack,
    );
    const severityNumber = SEVERITIES[logLevel];
    if (severityNumber === undefined) return;
    for (const message of messages) {
      this.remote.emit({
        severityNumber,
        severityText: logLevel.toUpperCase(),
        body: typeof message === 'string' ? message : JSON.stringify(message),
        attributes: {
          context,
          ...(errorStack ? { stack: String(errorStack) } : {}),
        },
      });
    }
  }

  shutdown(): Promise<void> {
    return this.provider.shutdown();
  }
}
