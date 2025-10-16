import { PrismaService } from 'src/modules/prisma/services/prisma.service';

/**
 * Tool Context for Mastra Tools
 *
 * This context provides access to NestJS services for all Mastra tools.
 * It allows tools to interact with the database and domain services while
 * maintaining proper separation of concerns.
 *
 * Usage in tools:
 * ```typescript
 * execute: async ({ context, input }) => {
 *   const { prisma } = context;
 *   const result = await prisma.athlete.findUnique({ where: { athlete_id: input.athleteId } });
 *   return keysToCamel(result);
 * }
 * ```
 */
export interface MastraToolContext {
  /**
   * Prisma service for database access
   * Use this to query all database tables
   */
  prisma: PrismaService;

  // TODO: Add more services as needed:
  // trainingLoadService: TrainingLoadService;
  // abilityFactory: CaslAbilityFactory;
  // etc.
}

/**
 * Create a tool context instance with injected NestJS services
 *
 * This should be called once when initializing the Mastra system,
 * typically in a NestJS service or controller that manages Mastra interactions.
 *
 * @param prismaService - Injected PrismaService from NestJS DI
 * @returns Tool context object to pass to Mastra tools
 */
export function createMastraToolContext(
  prismaService: PrismaService,
): MastraToolContext {
  return {
    prisma: prismaService,
  };
}
