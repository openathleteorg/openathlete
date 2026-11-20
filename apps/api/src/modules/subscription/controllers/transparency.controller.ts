import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { SUPPORTER_GOAL, TransparencyDto } from '@openathlete/shared';

import { StripeService } from '../services/stripe.service';
import { TransparencyService } from '../services/transparency.service';

/** Public figures of the website's transparency page */
@ApiTags('Subscription')
@Controller('transparency')
export class TransparencyController {
  constructor(
    private readonly transparencyService: TransparencyService,
    private readonly stripeService: StripeService,
  ) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=3600')
  @ApiOperation({
    summary: 'Funding figures of the project',
    description:
      'The number of Supporters and the goal, the progress of each funding tier in percent (null when the tiers are not configured) and the names on the Supporter wall (first names or chosen names of those who agreed). No amount and no email. Refreshed every hour. Only on an instance that sells subscriptions.',
  })
  @ApiResponse({
    status: 200,
    description: 'The figures',
    schema: {
      type: 'object',
      properties: {
        supporters: {
          type: 'object',
          properties: {
            count: { type: 'number', example: 37 },
            goal: { type: 'number', example: SUPPORTER_GOAL },
          },
        },
        tiers: {
          type: 'array',
          nullable: true,
          items: { type: 'number', minimum: 0, maximum: 100 },
          example: [100, 40, 0, 0],
        },
        wall: { type: 'array', items: { type: 'string' }, example: ['Julie'] },
      },
      required: ['supporters', 'tiers', 'wall'],
    },
  })
  @ApiResponse({
    status: 503,
    description: 'This instance does not sell subscriptions',
  })
  async get(): Promise<TransparencyDto> {
    if (!this.stripeService.billingEnabled) {
      throw new ServiceUnavailableException('BILLING_DISABLED');
    }
    return this.transparencyService.get();
  }
}
