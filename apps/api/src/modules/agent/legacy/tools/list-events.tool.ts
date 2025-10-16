import { createTool } from '@mastra/core';
import { z } from 'zod';

import { event_type } from '@openathlete/database';
import { SPORT_TYPE } from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Input type for the tool
type ListEventsInput = {
  eventTypes?: Array<'TRAINING' | 'COMPETITION' | 'NOTE' | 'ACTIVITY'>;
  sports?: Array<
    'RUNNING' | 'TRAIL_RUNNING' | 'CYCLING' | 'SWIMMING' | 'OTHER'
  >;
  nameSearch?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  includeDescription?: boolean;
};

// Output type for a single event
type EventSummary = {
  eventId: number;
  name: string;
  type: string;
  sport?: string;
  startDate: string;
  endDate: string;
  distance?: number;
  duration?: number;
  elevationGain?: number;
  description?: string;
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the list events tool
 * This tool retrieves multiple events based on various criteria
 * It's designed for queries like "show me my last 10 runs" or "all competitions this month"
 */
export function listEventsToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'list-events',
    description: `Retrieves a list of events (trainings, activities, competitions, or notes) based on various criteria.

Use this tool when the user wants to see multiple events, such as:
- Recent completed activities (e.g., "mes derniers trails", "my last 10 bike rides", "mes dernières courses à vélo", "mes sorties du mois")
- Events in a time period (e.g., "all my runs this month", "mes activités de la semaine dernière")
- Formal competitions/races (e.g., "toutes mes compétitions", "all my official races this year")
- Planned training sessions (e.g., "mes entraînements prévus", "planned workouts")

Event types explained:
- ACTIVITY: Completed workouts/sessions that were actually done (use for "derniers/last/récents" queries)
- TRAINING: Planned workout sessions (use for "prévus/planned/scheduled" queries)
- COMPETITION: Formal race events - the event itself, not the completed activity
- NOTE: Text notes

CRITICAL: When the user says "mes dernières courses" / "my last runs", they mean ACTIVITY (completed workouts), NOT COMPETITION (race events).
Only use COMPETITION when they specifically ask about formal race events or say "compétitions officielles" / "official races".

The tool will:
1. Filter by event type(s) - can search multiple types at once
2. Filter by sport(s) - can search multiple sports at once
3. Filter by date range if specified
4. Return events ordered by date (most recent first)
5. Limit results to a specified number (default: 10, max: 999)

IMPORTANT - Choosing the right limit:
- User asks "how many" / "combien de" / wants to count → Use limit: 999 (maximum) to get all results
- User asks "my last 5" / "mes 3 dernières" → Use that specific number as limit
- User asks "recent" / "dernières" without number → Use default (10)
- If hasMore: true in response and user wanted to count all, inform them there are more than 999

This is useful for getting an overview of training history, planning, or performance tracking.`,
    inputSchema: z.object({
      eventTypes: z
        .array(z.enum(['TRAINING', 'COMPETITION', 'NOTE', 'ACTIVITY']))
        .optional()
        .describe(
          'Types of events to retrieve. Can specify multiple types (e.g., ["ACTIVITY", "COMPETITION"]). If not specified, returns all types.',
        ),
      sports: z
        .array(z.nativeEnum(SPORT_TYPE))
        .optional()
        .describe(
          'Filter by sport types. Can specify multiple sports (e.g., ["RUNNING", "TRAIL_RUNNING"]). Only applies to activities, trainings, and competitions.',
        ),
      dateFrom: z
        .string()
        .optional()
        .describe(
          'Start of date range (ISO format like "2024-01-01"). Returns events starting on or after this date.',
        ),
      dateTo: z
        .string()
        .optional()
        .describe(
          'End of date range (ISO format). Returns events starting on or before this date.',
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(999)
        .default(10)
        .describe(
          'Maximum number of events to return. Default: 10, Maximum: 999. IMPORTANT: When the user asks "how many" / "combien de", they want ALL matching results - use the maximum (999) to get a complete count. If they ask for "my last N", use N as the limit.',
        ),
      includeDescription: z
        .boolean()
        .default(false)
        .describe(
          'Whether to include descriptions in the output. Set to true if the user wants detailed information.',
        ),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      events: z.array(
        z.object({
          eventId: z.number(),
          name: z.string(),
          type: z.string(),
          sport: z.string().optional(),
          startDate: z.string(),
          endDate: z.string(),
          distance: z.number().optional().describe('In meters'),
          duration: z.number().optional().describe('In seconds'),
          elevationGain: z.number().optional().describe('In meters'),
          description: z.string().optional(),
        }),
      ),
      totalCount: z.number().describe('Total number of events returned'),
      hasMore: z
        .boolean()
        .describe('Whether there are more events matching the criteria'),
      message: z.string().optional(),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as ListEventsInput;
      console.log('[listEventsTool] User:', params);
      const {
        eventTypes,
        sports,
        nameSearch,
        dateFrom,
        dateTo,
        limit = 10,
        includeDescription = false,
      } = params;

      try {
        // Build the where clause dynamically
        const whereClause: any = {
          athlete_id: user.user_id,
        };

        // Filter by event types if specified
        if (eventTypes && eventTypes.length > 0) {
          whereClause.type = {
            in: eventTypes,
          };
        }

        // Handle date filtering
        if (dateFrom || dateTo) {
          whereClause.start_date = {};
          if (dateFrom) {
            whereClause.start_date.gte = new Date(dateFrom);
          }
          if (dateTo) {
            const endDate = new Date(dateTo);
            // Include the entire day
            endDate.setHours(23, 59, 59, 999);
            whereClause.start_date.lte = endDate;
          }
        }

        // Build sport filter conditions - only for relevant event types
        if (sports && sports.length > 0) {
          const sportConditions: any[] = [];

          // If event types are specified, only add sport conditions for those types
          if (eventTypes && eventTypes.length > 0) {
            if (eventTypes.includes('ACTIVITY')) {
              sportConditions.push({
                AND: [
                  { type: 'ACTIVITY' },
                  { activity: { sport: { in: sports } } },
                ],
              });
            }
            if (eventTypes.includes('TRAINING')) {
              sportConditions.push({
                AND: [
                  { type: 'TRAINING' },
                  { training: { sport: { in: sports } } },
                ],
              });
            }
            if (eventTypes.includes('COMPETITION')) {
              sportConditions.push({
                AND: [
                  { type: 'COMPETITION' },
                  { competition: { sport: { in: sports } } },
                ],
              });
            }
          } else {
            // If no event types specified, check all possible types
            sportConditions.push({ activity: { sport: { in: sports } } });
            sportConditions.push({ training: { sport: { in: sports } } });
            sportConditions.push({ competition: { sport: { in: sports } } });
          }

          if (sportConditions.length > 0) {
            // Combine with existing OR conditions if any
            if (whereClause.OR) {
              whereClause.OR = [...whereClause.OR, ...sportConditions];
            } else {
              whereClause.OR = sportConditions;
            }
          }
        }

        // Fetch events with a limit + 1 to check if there are more
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
          take: limit + 1, // Fetch one more to check if there are more results
        });

        // Check if there are more results
        const hasMore = events.length > limit;
        const eventsToReturn = hasMore ? events.slice(0, limit) : events;

        // Transform events to output format
        const formattedEvents: EventSummary[] = eventsToReturn.map((event) => {
          // Determine sport from the event type
          let eventSport: string | undefined;
          let distance: number | undefined;
          let duration: number | undefined;
          let elevationGain: number | undefined;
          let description: string | undefined;

          if (event.activity) {
            eventSport = event.activity.sport;
            distance = event.activity.distance;
            duration = event.activity.moving_time;
            elevationGain = event.activity.elevation_gain;
            if (includeDescription) {
              description = event.activity.description;
            }
          } else if (event.training) {
            eventSport = event.training.sport;
            distance = event.training.goal_distance ?? undefined;
            duration = event.training.goal_duration ?? undefined;
            elevationGain = event.training.goal_elevation_gain ?? undefined;
            if (includeDescription) {
              description = event.training.description;
            }
          } else if (event.competition) {
            eventSport = event.competition.sport;
            distance = event.competition.goal_distance ?? undefined;
            duration = event.competition.goal_duration ?? undefined;
            elevationGain = event.competition.goal_elevation_gain ?? undefined;
            if (includeDescription) {
              description = event.competition.description;
            }
          } else if (event.note && includeDescription) {
            description = event.note.description;
          }

          return {
            eventId: event.event_id,
            name: event.name,
            type: event.type,
            sport: eventSport,
            startDate: event.start_date.toISOString(),
            endDate: event.end_date.toISOString(),
            distance,
            duration,
            elevationGain,
            description,
          };
        });

        // Build a descriptive message
        let message = `Found ${formattedEvents.length} event(s)`;
        if (eventTypes && eventTypes.length > 0) {
          message += ` of type(s): ${eventTypes.join(', ')}`;
        }
        if (sports && sports.length > 0) {
          message += ` for sport(s): ${sports.join(', ')}`;
        }
        if (hasMore) {
          message += `. More results available (showing first ${limit}).`;
        }

        return {
          success: true,
          events: formattedEvents,
          totalCount: formattedEvents.length,
          hasMore,
          message,
        };
      } catch (error) {
        console.error('[listEventsTool] Error fetching events:', error);
        throw new Error(
          `Failed to retrieve events: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
