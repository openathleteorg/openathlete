import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { ConnectorProvider } from '@openathlete/database';

import { AccountDeletingEvent } from 'src/events';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import {
  GarminProviderService,
  PolarProviderService,
} from 'src/modules/providers-sync/providers';

/**
 * Garmin requires partners to delete the user's registration when the user
 * deletes their account; otherwise it keeps sending their data. Polar keeps
 * collecting it for us the same way until told otherwise.
 */
@Injectable()
export class ProviderDeregistrationListener {
  private readonly logger = new Logger(ProviderDeregistrationListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly garminProviderService: GarminProviderService,
    private readonly polarProviderService: PolarProviderService,
  ) {}

  @OnEvent(AccountDeletingEvent.SLUG)
  async handle(event: AccountDeletingEvent) {
    const { athleteId } = event.payload;
    if (!athleteId) return;

    const accounts = await this.prisma.providerAccount.findMany({
      where: {
        athleteId,
        provider: ConnectorProvider.GARMIN,
        refreshToken: { not: null },
      },
    });
    for (const account of accounts) {
      // Never blocks the deletion: the account goes either way
      await this.garminProviderService.disconnect(account).catch((error) => {
        this.logger.error(
          `Failed to deregister Garmin account ${account.providerAccountId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    }

    const polarAccounts = await this.prisma.providerAccount.findMany({
      where: { athleteId, provider: ConnectorProvider.POLAR },
    });
    for (const account of polarAccounts) {
      // Its failures are logged there and never block
      await this.polarProviderService.disconnect(account);
    }
  }
}
