import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ConnectorProvider } from '@openathlete/database';
import { ProviderSyncResponse, ProviderSyncStatus } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { QueueService } from 'src/modules/queue/queue.service';

@ApiTags('Provider')
@Controller('provider/strava')
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@ApiBearerAuth()
export class StravaSyncController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => QueueService))
    private readonly queue: QueueService,
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue a catch-up import of the last 30 days from Strava',
    description:
      'Uses only the signed-in athlete’s active Strava connection. Imports run in the worker and use the existing duplicate reconciliation. Repeated requests within one minute are coalesced. This does not reset the one-time historical import.',
  })
  @ApiResponse({
    status: 202,
    description: 'Sync queued; imports are not yet complete',
  })
  @ApiResponse({ status: 400, description: 'Activity imports disabled' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({
    status: 404,
    description: 'No active Strava connection for this athlete',
  })
  async sync(@JwtUser() user: AuthUser): Promise<ProviderSyncResponse> {
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        athlete: { userId: user.userId },
        provider: ConnectorProvider.STRAVA,
        status: 'active',
      },
    });
    if (!account)
      throw new NotFoundException('Active Strava connection not found');
    if (!account.importActivitiesEnabled)
      throw new BadRequestException('Strava activity imports are disabled');
    const syncId = await this.queue.addRecentStravaSyncJob(
      account.providerAccountId,
    );
    return { success: true, queued: true, syncId };
  }

  @Get('sync/:syncId')
  @ApiOperation({
    summary:
      'Read progress of your Strava catch-up, including activity imports',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress and sanitized import counts',
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({
    status: 404,
    description: 'Sync or active connection not found',
  })
  async status(
    @JwtUser() user: AuthUser,
    @Param('syncId', ParseIntPipe) syncId: number,
  ): Promise<ProviderSyncStatus> {
    const account = await this.prisma.providerAccount.findFirst({
      where: {
        athlete: { userId: user.userId },
        provider: ConnectorProvider.STRAVA,
        status: 'active',
      },
    });
    if (!account)
      throw new NotFoundException('Active Strava connection not found');
    return this.queue.getRecentStravaSyncStatus(
      account.providerAccountId,
      String(syncId),
    );
  }
}
