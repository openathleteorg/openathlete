import { createTool } from '@mastra/core';
import { z } from 'zod';

import { EVENT_TYPE, SPORT_TYPE } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Input type for the tool
type FindEventInput = {
  eventType?: EVENT_TYPE;
  sport?: SPORT_TYPE;
  nameSearch?: string;
  dateFrom?: string;
  dateTo?: string;
  exactDate?: string;
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the find event tool
 * This tool searches for a single event based on various criteria
 * It's designed to be chained with other tools for further operations
 */
export function findEventToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'find-event',
    description: `Searches for a single event (training, activity, competition, or note) based on various criteria and returns its ID.

Use this tool when the user mentions:
- A specific workout or activity by name or description (e.g., "the interval training from last week", "my long run last Sunday", "le fractionné de mercredi dernier")
- A training session or activity at a specific date (e.g., "the workout from 3 days ago", "l'activité d'avant-hier", "my run last Monday")
- A competition or race (e.g., "the marathon last month", "la course du 15 mars")
- A note (e.g., "my note from yesterday", "la note de la semaine dernière")

Event types explained:
- ACTIVITY: A completed workout/session that was actually done (e.g., "my run yesterday", "la séance d'hier", "ma dernière sortie", "the activity from...")
  Use for: past tense queries, "last/recent" workouts, completed training sessions
- TRAINING: A planned workout session (e.g., "the training I planned for tomorrow", "l'entraînement prévu", "the workout scheduled for...")
  Use for: future planned sessions, scheduled workouts
- COMPETITION: A race or competition event - the EVENT itself, not the completed activity (e.g., "the marathon", "la prochaine course officielle", "my next race")
  Use for: formal race events (planned or past), competitions
  Note: A completed race creates both a COMPETITION event AND an ACTIVITY event linked to it
- NOTE: A text note (e.g., "my note", "la note")

IMPORTANT distinction for "course":
- "ma dernière course" / "my last run" → Use ACTIVITY (the completed workout)
- "la course du 15 mars" / "the race on March 15" → Could be COMPETITION (the event) or ACTIVITY (the completed run) - prefer ACTIVITY for past dates unless explicitly about a formal race

The tool will:
1. Search based on date criteria (exact date, date range, or relative dates like "3 days ago")
2. Filter by event type if specified (defaults to searching all types)
3. Filter by sport if specified
4. Search in event names and descriptions if a text search is provided
5. Return the most relevant event ID for use with other tools
6. **AMBIGUITY DETECTION**: If no event is found with the specified type, checks for alternative event types

Smart ambiguity handling:
- If the requested type is not found, the tool checks alternative types (e.g., ACTIVITY when COMPETITION was requested)
- If alternatives are found, returns ambiguous: true with a clarificationNeeded message
- Provides the list of alternatives with their details
- YOU should then ask the user to clarify which one they meant - don't just pick one automatically

Example workflow:
1. User asks for their last race in January
2. You search with eventType: COMPETITION
3. Tool returns ambiguous: true with alternatives
4. You ask user to clarify: "Je n'ai pas trouvé de compétition en janvier, mais j'ai trouvé une sortie trail. C'est celle-ci que tu cherches ?"

If multiple events of the SAME type match, it returns the most recent one.`,
    inputSchema: z.object({
      eventType: z
        .nativeEnum(EVENT_TYPE)
        .optional()
        .describe(
          'Type of event to search for. ACTIVITY = completed workouts, TRAINING = planned sessions, COMPETITION = races, NOTE = text notes. If not specified, searches all types.',
        ),
      sport: z
        .nativeEnum(SPORT_TYPE)
        .optional()
        .describe(
          'Filter by sport type (only applies to activities, trainings, and competitions)',
        ),
      nameSearch: z
        .string()
        .optional()
        .describe(
          'Search term to look for in event names and descriptions. Supports partial matching (e.g., "fractionné", "interval", "long run")',
        ),
      dateFrom: z
        .string()
        .optional()
        .describe(
          'Start of date range to search (ISO format or natural language like "2024-01-01"). Use with dateTo for range searches.',
        ),
      dateTo: z
        .string()
        .optional()
        .describe(
          'End of date range to search (ISO format or natural language). Use with dateFrom for range searches.',
        ),
      exactDate: z
        .string()
        .optional()
        .describe(
          'Search for events on a specific date (ISO format like "2024-01-15" or with time). This searches for events starting on this day.',
        ),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      eventId: z.number().optional().describe('ID of the found event'),
      eventName: z.string().optional().describe('Name of the found event'),
      eventType: z
        .string()
        .optional()
        .describe('Type of the found event (TRAINING, ACTIVITY, etc.)'),
      startDate: z.string().optional().describe('Start date of the event'),
      sport: z.string().optional().describe('Sport type if applicable'),
      message: z.string().optional().describe('Human-readable result message'),

      // Ambiguity handling
      ambiguous: z
        .boolean()
        .optional()
        .describe('Whether multiple interpretations exist'),
      alternatives: z
        .array(
          z.object({
            eventId: z.number(),
            eventName: z.string(),
            eventType: z.string(),
            startDate: z.string(),
            sport: z.string().optional(),
          }),
        )
        .optional()
        .describe('Alternative events found if ambiguous'),
      clarificationNeeded: z
        .string()
        .optional()
        .describe('Question to ask user for clarification'),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as FindEventInput;
      const { eventType, sport, nameSearch, dateFrom, dateTo, exactDate } =
        params;

      try {
        // Build the where clause dynamically
        const whereClause: any = {
          athlete_id: user.user_id,
        };

        // Filter by event type if specified
        if (eventType) {
          whereClause.type = eventType;
        }

        // Handle date filtering
        if (exactDate) {
          // Search for events starting on this specific day
          const searchDate = new Date(exactDate);
          const startOfDay = new Date(searchDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(searchDate);
          endOfDay.setHours(23, 59, 59, 999);

          whereClause.start_date = {
            gte: startOfDay,
            lte: endOfDay,
          };
        } else if (dateFrom || dateTo) {
          // Date range search
          whereClause.start_date = {};
          if (dateFrom) {
            whereClause.start_date.gte = new Date(dateFrom);
          }
          if (dateTo) {
            whereClause.start_date.lte = new Date(dateTo);
          }
        }

        // Filter by sport (applies to activities, trainings, and competitions)
        if (sport) {
          whereClause.OR = [
            { activity: { sport } },
            { training: { sport } },
            { competition: { sport } },
          ];
        }

        // Search in name and description
        if (nameSearch) {
          whereClause.OR = whereClause.OR || [];
          const searchConditions = [
            { name: { contains: nameSearch, mode: 'insensitive' } },
            {
              activity: {
                description: { contains: nameSearch, mode: 'insensitive' },
              },
            },
            {
              training: {
                description: { contains: nameSearch, mode: 'insensitive' },
              },
            },
            {
              competition: {
                description: { contains: nameSearch, mode: 'insensitive' },
              },
            },
            {
              note: {
                description: { contains: nameSearch, mode: 'insensitive' },
              },
            },
          ];

          // If we already have OR conditions (from sport filter), combine them
          if (whereClause.OR.length > 0) {
            whereClause.AND = [
              { OR: whereClause.OR },
              { OR: searchConditions },
            ];
            delete whereClause.OR;
          } else {
            whereClause.OR = searchConditions;
          }
        }

        // Execute the primary query
        const events = await prismaService.event.findMany({
          where: whereClause,
          include: {
            activity: true,
            training: true,
            competition: true,
            note: true,
          },
          orderBy: {
            start_date: 'desc',
          },
          take: 1,
        });

        // AMBIGUITY DETECTION: If no event found and a specific type was requested, check for alternatives
        if (events.length === 0 && eventType) {
          console.log(
            `[findEventTool] No ${eventType} found, checking for alternatives...`,
          );

          // Define alternative types to check
          const alternativeTypes: Record<
            string,
            Array<'ACTIVITY' | 'COMPETITION' | 'TRAINING' | 'NOTE'>
          > = {
            COMPETITION: ['ACTIVITY', 'TRAINING'],
            ACTIVITY: ['COMPETITION', 'TRAINING'],
            TRAINING: ['ACTIVITY', 'COMPETITION'],
            NOTE: ['ACTIVITY', 'TRAINING'],
          };

          const typesToCheck = alternativeTypes[eventType] || [];
          const foundAlternatives: any[] = [];

          // Check each alternative type
          for (const altType of typesToCheck) {
            const altWhereClause = { ...whereClause, type: altType };

            const altEvents = await prismaService.event.findMany({
              where: altWhereClause,
              include: {
                activity: true,
                training: true,
                competition: true,
                note: true,
              },
              orderBy: {
                start_date: 'desc',
              },
              take: 1,
            });

            if (altEvents.length > 0) {
              const altEvent = altEvents[0];
              let altSport: string | undefined;
              if (altEvent.activity) altSport = altEvent.activity.sport;
              else if (altEvent.training) altSport = altEvent.training.sport;
              else if (altEvent.competition)
                altSport = altEvent.competition.sport;

              foundAlternatives.push({
                eventId: altEvent.event_id,
                eventName: altEvent.name,
                eventType: altEvent.type,
                startDate: altEvent.start_date.toISOString(),
                sport: altSport,
              });
            }
          }

          // If alternatives found, return ambiguous result with clarification needed
          if (foundAlternatives.length > 0) {
            const typeLabels: Record<string, string> = {
              ACTIVITY: 'completed workout/activity',
              COMPETITION: 'competition/race event',
              TRAINING: 'planned training session',
              NOTE: 'note',
            };

            return {
              success: false,
              ambiguous: true,
              alternatives: foundAlternatives,
              clarificationNeeded: `I couldn't find a ${typeLabels[eventType] || eventType} matching your request, but I found ${foundAlternatives.length} other type(s) of events around that time. Which one did you mean?`,
              message: `No ${eventType} found, but ${foundAlternatives.length} alternative(s) available.`,
            };
          }

          // No alternatives either
          return {
            success: false,
            message: `No event found matching the specified criteria (searched for ${eventType} and alternatives).`,
          };
        }

        // If no events found and no specific type (searched all types)
        if (events.length === 0) {
          return {
            success: false,
            message: 'No event found matching the specified criteria.',
          };
        }

        const event = events[0];

        // Determine sport from the event type
        let eventSport: string | undefined;
        if (event.activity) {
          eventSport = event.activity.sport;
        } else if (event.training) {
          eventSport = event.training.sport;
        } else if (event.competition) {
          eventSport = event.competition.sport;
        }

        // Build the success message
        const successMessage = `Found event: "${event.name}" (${event.type}) on ${event.start_date.toLocaleDateString('fr-FR')}`;

        return {
          success: true,
          eventId: event.event_id,
          eventName: event.name,
          eventType: event.type,
          startDate: event.start_date.toISOString(),
          sport: eventSport,
          message: successMessage,
          ambiguous: false,
        };
      } catch (error) {
        console.error('[findEventTool] Error searching for event:', error);
        throw new Error(
          `Failed to search for event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
