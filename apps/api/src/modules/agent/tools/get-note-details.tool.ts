import { createTool } from '@mastra/core';
import { z } from 'zod';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

// Input type for the tool
type GetNoteDetailsInput = {
  eventId: number;
};

// Tool context type
type ToolContext = {
  user: AuthUser | null;
};

/**
 * Factory function to create the get note details tool
 * This tool retrieves comprehensive information about a note event
 */
export function getNoteDetailsToolFactory(
  prismaService: PrismaService,
  toolContext: ToolContext,
) {
  return createTool({
    id: 'get-note-details',
    description: `Retrieves complete detailed information about a specific note event (NOTE type event).

Use this tool when:
- The user wants to read a specific note they created
- After finding a note with findEvent or listEvents
- The user asks about the content of a note

This tool provides:
- Basic note information (name, date)
- Full note description/content`,
    inputSchema: z.object({
      eventId: z
        .number()
        .int()
        .positive()
        .describe('The ID of the event to retrieve note details for'),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      note: z
        .object({
          // Event information
          event_id: z.number(),
          name: z.string(),
          start_date: z.string(),
          end_date: z.string(),
          type: z.string(),

          // Note specific data
          note_id: z.number(),
          description: z.string(),
        })
        .optional(),
      message: z.string().optional(),
    }),
    execute: async (context) => {
      const user = toolContext.user;

      if (!user) {
        throw new Error('Missing required context: user');
      }

      const params = (context as any).context as GetNoteDetailsInput;
      const { eventId } = params;

      try {
        // Fetch the event with note data
        const event = await prismaService.event.findFirst({
          where: {
            event_id: eventId,
            athlete_id: user.user_id,
            type: 'NOTE',
          },
          include: {
            note: true,
          },
        });

        if (!event || !event.note) {
          return {
            success: false,
            message:
              'Note not found or you do not have permission to access it',
          };
        }

        const note = event.note;

        // Build the response object
        const response = {
          // Event information
          event_id: event.event_id,
          name: event.name,
          start_date: event.start_date.toISOString(),
          end_date: event.end_date.toISOString(),
          type: event.type,

          // Note specific data
          note_id: note.event_note_id,
          description: note.description,
        };

        return {
          success: true,
          note: response,
          message: `Retrieved complete details for note: ${event.name}`,
        };
      } catch (error) {
        console.error('[getNoteDetailsTool] Error:', error);
        throw new Error(
          `Failed to retrieve note details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    },
  });
}
