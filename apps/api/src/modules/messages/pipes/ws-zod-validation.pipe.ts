import { ZodError, ZodSchema } from 'zod';

import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import {
  MAX_ARRAY_ITEMS,
  exceedsArrayLimit,
} from 'src/common/security/payload-limits';

@Injectable()
export class WsZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _: ArgumentMetadata) {
    // Before Zod, as for HTTP bodies: see MAX_ARRAY_ITEMS
    if (exceedsArrayLimit(value)) {
      throw new WsException({
        error: `Requests are limited to ${MAX_ARRAY_ITEMS} array items`,
      });
    }
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        throw new WsException({
          error: 'Validation failed',
          details: errorMessages,
        });
      }
      throw new WsException({
        error: 'Invalid request data',
      });
    }
  }
}
