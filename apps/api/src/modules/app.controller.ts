import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor() {}

  @Get('health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description:
      'Returns the health status of the API server. This endpoint is typically used by monitoring systems, load balancers, and orchestration platforms (like Kubernetes) to verify that the service is running and responsive. Returns a simple status object indicating the API is operational.',
  })
  @ApiResponse({
    status: 200,
    description: 'API is healthy and operational',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'ok',
          description: 'Health status indicator',
        },
      },
      required: ['status'],
    },
  })
  health() {
    return { status: 'ok' };
  }
}
