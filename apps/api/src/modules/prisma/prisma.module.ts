import { Global, Module } from '@nestjs/common';

import { PrismaService } from './services/prisma.service';

/**
 * The one database client of the process. Each client keeps its own pool of
 * connections, so one per module would exhaust what PostgreSQL allows.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
