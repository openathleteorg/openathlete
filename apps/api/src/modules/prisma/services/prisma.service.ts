import { Injectable, OnModuleInit, Optional } from '@nestjs/common';

import { Prisma, PrismaClient, User } from '@openathlete/database';

/**
 * Columns no query returns unless it selects them: a response built from a
 * whole user row can then never carry the password hash or the device's
 * push token. Password checks and push delivery select them explicitly.
 */
const OMIT = {
  user: { password: true, pushToken: true },
} as const satisfies Prisma.GlobalOmitConfig;

type ClientOptions = Omit<Prisma.PrismaClientOptions, 'omit'>;

/** A user row as queries return it, without the omitted columns. */
export type UserRow = Omit<User, keyof typeof OMIT.user>;

@Injectable()
export class PrismaService
  extends PrismaClient<{ omit: typeof OMIT }>
  implements OnModuleInit
{
  // Nest builds it without options; integration tests pass a database URL
  constructor(@Optional() options?: ClientOptions) {
    super({ ...options, omit: OMIT });
  }

  async onModuleInit() {
    await this.$connect();
  }
}

/** The client inside `$transaction`, with the same omitted columns. */
export type PrismaTx = Omit<
  PrismaService,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$transaction'
  | '$extends'
  | 'onModuleInit'
>;
