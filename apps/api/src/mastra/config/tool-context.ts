import { PrismaService } from 'src/modules/prisma/services/prisma.service';

export interface MastraToolContext {
  prisma: PrismaService;
  athleteId: number;
}
