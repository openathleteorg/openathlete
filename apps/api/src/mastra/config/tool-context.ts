import { PrismaService } from 'src/modules/prisma/services/prisma.service';

export interface MastraToolContext {
  prisma: PrismaService;
  athleteId: number;
}

export function createMastraToolContext(
  prismaService: PrismaService,
  athleteId: number,
): MastraToolContext {
  return {
    prisma: prismaService,
    athleteId,
  };
}
