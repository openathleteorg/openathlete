import { ConnectorProvider, TokenType } from '@openathlete/database';

import { passwordResetUrl } from 'src/modules/auth/helpers/password-reset-url';
import { AccountDeletionService } from 'src/modules/auth/services/account-deletion.service';
import { TokenService } from 'src/modules/auth/services/token.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

export const USAGE = `Usage: openathlete <command>

  list-users                  List the accounts of this instance
  reset-password <email>      Print a link to set a new password (valid 15 minutes)
  delete-user <email> --yes   Delete an account and all its data, for good
  delete-users --yes          Same for every email read from the standard input,
                              one per line (for waves of fake sign-ups)
  garmin-backfill             Ask Garmin to resend the last 30 days of activities
                              of every connected account (the worker imports them)`;

export interface CliDeps {
  prisma: PrismaService;
  tokens: TokenService;
  accountDeletion: AccountDeletionService;
  appUrl: string;
  /** Queues the historical import of these provider accounts */
  queueFullImports: (providerAccountIds: number[]) => Promise<void>;
  /** The whole standard input */
  readInput: () => Promise<string>;
}

/** How often delete-users reports its progress */
const PROGRESS_EVERY = 500;

/**
 * Administration commands for self-hosted instances, run inside the API
 * container: `docker compose exec api openathlete <command>`.
 *
 * @returns the exit code
 */
export async function runCommand(
  args: string[],
  deps: CliDeps,
  out: (line: string) => void,
): Promise<number> {
  const [command, ...rest] = args;
  const email = rest.find((arg) => !arg.startsWith('--'))?.toLowerCase();

  const findUser = async () => {
    if (!email) {
      out(USAGE);
      return null;
    }
    const user = await deps.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { userId: true, email: true },
    });
    if (!user) out(`No account with the email ${email}`);
    return user;
  };

  switch (command) {
    case 'list-users': {
      const users = await deps.prisma.user.findMany({
        select: {
          userId: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          createdAt: true,
        },
        orderBy: { userId: 'asc' },
      });
      for (const user of users) {
        out(
          [
            user.userId,
            user.email,
            `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
            user.roles.join(','),
            user.createdAt.toISOString().slice(0, 10),
          ].join('\t'),
        );
      }
      out(`${users.length} account${users.length === 1 ? '' : 's'}`);
      return 0;
    }

    case 'reset-password': {
      const user = await findUser();
      if (!user) return 1;
      const token = await deps.tokens.createToken(
        { userId: user.userId },
        TokenType.PASSWORD_RESET,
      );
      out(`Send this link to ${user.email}, it is valid 15 minutes:`);
      out(passwordResetUrl(deps.appUrl, token.token));
      return 0;
    }

    case 'delete-user': {
      const user = await findUser();
      if (!user) return 1;
      if (!rest.includes('--yes')) {
        out(
          `This deletes ${user.email} and all their data for good. Add --yes to confirm.`,
        );
        return 1;
      }
      await deps.accountDeletion.deleteAccount(user.userId);
      out(`Deleted ${user.email}`);
      return 0;
    }

    case 'delete-users': {
      const emails = [
        ...new Set(
          (await deps.readInput())
            .split(/\s+/)
            .map((line) => line.trim().toLowerCase())
            .filter(Boolean),
        ),
      ];
      if (emails.length === 0) {
        out('No email on the standard input');
        return 1;
      }
      // Sign-up stores emails in lower case
      const users = await deps.prisma.user.findMany({
        where: { email: { in: emails } },
        select: { userId: true, email: true },
        orderBy: { userId: 'asc' },
      });
      const missing = emails.length - users.length;
      if (!rest.includes('--yes')) {
        out(
          `This deletes ${users.length} account${users.length === 1 ? '' : 's'} and all their data for good${missing ? ` (${missing} email${missing === 1 ? ' matches' : 's match'} no account)` : ''}. Add --yes to confirm.`,
        );
        return 1;
      }

      let failed = 0;
      for (const [index, user] of users.entries()) {
        try {
          await deps.accountDeletion.deleteAccount(user.userId);
        } catch (error) {
          failed++;
          out(
            `Could not delete user ${user.userId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        if ((index + 1) % PROGRESS_EVERY === 0) {
          out(`${index + 1}/${users.length}`);
        }
      }
      out(
        `Deleted ${users.length - failed} account${users.length - failed === 1 ? '' : 's'}${failed ? `, ${failed} failed` : ''}${missing ? `, ${missing} email${missing === 1 ? '' : 's'} matched no account` : ''}`,
      );
      return failed ? 1 : 0;
    }

    case 'garmin-backfill': {
      // Recovers notifications lost on our side: a Garmin backfill sends the
      // activities again, and those already imported are skipped
      const accounts = await deps.prisma.providerAccount.findMany({
        where: {
          provider: ConnectorProvider.GARMIN,
          status: 'active',
          importActivitiesEnabled: true,
        },
        select: { providerAccountId: true },
      });
      await deps.queueFullImports(
        accounts.map((account) => account.providerAccountId),
      );
      out(
        `Backfill queued for ${accounts.length} Garmin account${accounts.length === 1 ? '' : 's'}`,
      );
      return 0;
    }

    default:
      out(USAGE);
      return command && command !== 'help' && command !== '--help' ? 1 : 0;
  }
}
