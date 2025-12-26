import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateEventTemplateDto,
  UpdateEventTemplateDto,
  UseEventTemplateDto,
  createEventTemplateSchema,
  updateEventTemplateSchema,
  useEventTemplateDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EventTemplateService } from '../services/event-template.service';

@ApiTags('Event Template')
@Controller('event-template')
export class EventTemplateController {
  constructor(private eventTemplateService: EventTemplateService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all event templates for the authenticated user',
    description:
      'Retrieves all event templates belonging to the authenticated user. Templates can be filtered by searching in the event name (case-insensitive). Each template includes the full event data (training, competition, note, or activity) with all related information, and optionally the folder it belongs to. Templates are used to quickly create new events based on existing event structures.',
  })
  @ApiQuery({
    name: 'search',
    type: String,
    description:
      'Optional search term to filter templates by event name (case-insensitive)',
    example: 'endurance',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of event templates retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          eventTemplateId: {
            type: 'number',
            description: 'Unique identifier for the template',
            example: 1,
          },
          userId: {
            type: 'number',
            description: 'ID of the user who owns this template',
            example: 1,
          },
          eventId: {
            type: 'number',
            description: 'ID of the event this template is based on',
            example: 123,
          },
          folderId: {
            type: 'number',
            nullable: true,
            description:
              'ID of the folder this template belongs to. Null if not in a folder.',
            example: 1,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the template was created',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the template was last updated',
            example: '2024-01-20T14:45:00.000Z',
          },
          event: {
            type: 'object',
            description:
              'Full event data (training, competition, note, or activity) with all related information',
          },
          folder: {
            type: 'object',
            nullable: true,
            description: 'Folder this template belongs to, if any',
          },
        },
        required: [
          'eventTemplateId',
          'userId',
          'eventId',
          'createdAt',
          'updatedAt',
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getMyEventTemplates(
    @JwtUser() user: AuthUser,
    @Query('search') search?: string,
  ) {
    return this.eventTemplateService.getMyEventTemplates(user, search);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new event template from an existing event',
    description:
      'Creates a new event template by duplicating an existing event. The event is duplicated with all its data (training, competition, note, or activity), but the athlete association is removed and the event becomes a template. For training events, the workout is duplicated as well, but the estimated_load is reset to null. The template can optionally be assigned to a folder. The original event remains unchanged.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventId: {
          type: 'number',
          description: 'ID of the event to create a template from (required)',
          example: 123,
        },
        folderId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the folder to assign this template to. Optional, null if not in a folder.',
          example: 1,
        },
      },
      required: ['eventId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Event template created successfully',
    schema: {
      type: 'object',
      properties: {
        eventTemplateId: {
          type: 'number',
          description: 'Unique identifier for the created template',
          example: 1,
        },
        userId: {
          type: 'number',
          description: 'ID of the user who owns this template',
          example: 1,
        },
        eventId: {
          type: 'number',
          description: 'ID of the duplicated event',
          example: 124,
        },
        folderId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the folder this template belongs to. Null if not in a folder.',
          example: 1,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the template was created',
          example: '2024-01-15T10:30:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the template was last updated',
          example: '2024-01-15T10:30:00.000Z',
        },
      },
      required: [
        'eventTemplateId',
        'userId',
        'eventId',
        'createdAt',
        'updatedAt',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or event not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have access to the event',
  })
  createEventTemplate(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEventTemplateSchema))
    body: CreateEventTemplateDto,
  ) {
    return this.eventTemplateService.createEventTemplate(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':eventTemplateId')
  @ApiOperation({
    summary: 'Update an event template',
    description:
      'Updates an event template. Currently only supports updating the folder assignment. Only the template owner can update it. The updated template includes the full event data and folder information.',
  })
  @ApiParam({
    name: 'eventTemplateId',
    type: Number,
    description: 'ID of the template to update',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'number',
          nullable: true,
          description:
            'New folder ID to assign this template to. Optional, null to remove from folder.',
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Event template updated successfully',
    schema: {
      type: 'object',
      properties: {
        eventTemplateId: {
          type: 'number',
          description: 'Unique identifier for the template',
          example: 1,
        },
        userId: {
          type: 'number',
          description: 'ID of the user who owns this template',
          example: 1,
        },
        eventId: {
          type: 'number',
          description: 'ID of the event this template is based on',
          example: 123,
        },
        folderId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the folder this template belongs to. Null if not in a folder.',
          example: 1,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the template was created',
          example: '2024-01-15T10:30:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the template was last updated',
          example: '2024-01-20T14:45:00.000Z',
        },
        event: {
          type: 'object',
          description:
            'Full event data (training, competition, note, or activity) with all related information',
        },
        folder: {
          type: 'object',
          nullable: true,
          description: 'Folder this template belongs to, if any',
        },
      },
      required: [
        'eventTemplateId',
        'userId',
        'eventId',
        'createdAt',
        'updatedAt',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the owner of this template',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - template not found',
  })
  updateEventTemplate(
    @JwtUser() user: AuthUser,
    @Param('eventTemplateId', ParseIntPipe) eventTemplateId: number,
    @Body(new ZodValidationPipe(updateEventTemplateSchema))
    body: UpdateEventTemplateDto,
  ) {
    return this.eventTemplateService.updateEventTemplate(
      user,
      eventTemplateId,
      body,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':eventTemplateId')
  @ApiOperation({
    summary: 'Delete an event template',
    description:
      'Deletes an event template. Only the template owner can delete it. The template and its associated event are permanently deleted. This operation cannot be undone.',
  })
  @ApiParam({
    name: 'eventTemplateId',
    type: Number,
    description: 'ID of the template to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Event template deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the owner of this template',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - template not found',
  })
  deleteEventTemplate(
    @JwtUser() user: AuthUser,
    @Param('eventTemplateId', ParseIntPipe) eventTemplateId: number,
  ) {
    return this.eventTemplateService.deleteEventTemplate(user, eventTemplateId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':eventTemplateId/use')
  @ApiOperation({
    summary: 'Create an event from a template',
    description:
      'Creates a new event from a template with specific dates and athlete. The template event is duplicated with all its data (training, competition, note, or activity), but IDs and relations are removed. For training events, the workout is duplicated as well, but estimated_load is not copied (will be calculated separately). The new event is created with the provided startDate, endDate, and optionally assigned to an athlete. If the event is a future training event, training load estimation is automatically scheduled. If the event is within 7 days and has a workout, a workout export sync event is emitted. Only the template owner can use it.',
  })
  @ApiParam({
    name: 'eventTemplateId',
    type: Number,
    description: 'ID of the template to use',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date-time',
          description: 'Start date and time for the new event (required)',
          example: '2024-02-01T10:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: 'End date and time for the new event (required)',
          example: '2024-02-01T11:30:00.000Z',
        },
        athleteId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the athlete to assign this event to. Optional, null if not assigned.',
          example: 1,
        },
      },
      required: ['startDate', 'endDate'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Event created from template successfully',
    schema: {
      type: 'object',
      description:
        'Complete event object (training, competition, note, or activity) with all related information',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the owner of this template',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - template or template event not found',
  })
  useEventTemplate(
    @JwtUser() user: AuthUser,
    @Param('eventTemplateId', ParseIntPipe) eventTemplateId: number,
    @Body(new ZodValidationPipe(useEventTemplateDtoSchema))
    body: UseEventTemplateDto,
  ) {
    return this.eventTemplateService.useEventTemplate(
      user,
      eventTemplateId,
      body,
    );
  }
}
