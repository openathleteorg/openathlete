import { Response } from 'express';
import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { event } from '@openathlete/database';
import {
  ActivityStream,
  CreateEventDto,
  DuplicateEventDto,
  DuplicateWorkoutDto,
  ReorderWorkoutStepsDto,
  UpdateEventDto,
  createEventDtoSchema,
  duplicateEventDtoSchema,
  duplicateWorkoutSchema,
  reorderWorkoutStepsSchema,
  updateEventDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EventService } from '../services';
import { ActivityFeedbackService } from '../services/activity-feedback.service';

@ApiTags('Event')
@Controller('event')
export class EventController {
  constructor(
    private eventService: EventService,
    private activityFeedbackService: ActivityFeedbackService,
  ) {}

  @Get('ical')
  @ApiOperation({
    summary: 'Get iCal calendar file',
    description:
      "Retrieves an iCal calendar file (.ics) for an athlete's events. The calendar includes all events (training, competition, note) but excludes activities. The calendar secret is provided as a base64-encoded query parameter and is verified using Argon2 hashing with a pepper. The calendar is generated in UTC timezone and includes event name, type, start date, and end date.",
  })
  @ApiQuery({
    name: 'calendar',
    type: String,
    description:
      'Base64-encoded calendar secret for authentication. Use GET /event/ical/secret to obtain your secret.',
    example: 'dGVzdA==',
    required: true,
  })
  @ApiProduces('text/calendar')
  @ApiResponse({
    status: 200,
    description: 'iCal calendar file generated successfully',
    content: {
      'text/calendar': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
    headers: {
      'Content-Type': {
        description: 'text/calendar; charset=utf-8',
        schema: { type: 'string' },
      },
      'Content-Disposition': {
        description: 'attachment; filename="calendar.ics"',
        schema: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid calendar secret',
  })
  async getIcalCalendar(
    @Res() res: Response,
    @Query('calendar') calendar: string,
  ) {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    const ical = await this.eventService.getIcalCalendar(calendar);
    res.send(ical);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('ical/secret')
  @ApiOperation({
    summary: 'Get iCal calendar secret',
    description:
      'Generates and returns a base64-encoded calendar secret for the authenticated user. This secret can be used to access the iCal calendar feed at GET /event/ical?calendar={secret}. The secret is generated using Argon2 hashing with a pepper and is unique to each user. The user must have an associated athlete account.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calendar secret generated successfully',
    schema: {
      type: 'string',
      description: 'Base64-encoded calendar secret',
      example: 'dGVzdA==',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found for user',
  })
  async getMyIcalCalendarSecret(@JwtUser() user: AuthUser) {
    return this.eventService.getMyIcalCalendarSecret(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('unvalidated/:athleteId')
  @ApiOperation({
    summary: 'Get unvalidated activity sessions for an athlete',
    description:
      "Retrieves activity events that are not validated according to the athlete's settings. An activity is considered unvalidated if: (1) require_rpe is enabled and RPE is missing, (2) require_comment is enabled and description/comment is missing or empty. The results can be filtered by date range. Only activity events are returned (not training, competition, or note events). Uses CASL authorization to verify that the user has read access to the athlete.",
  })
  @ApiParam({
    name: 'athleteId',
    type: Number,
    description: 'ID of the athlete to get unvalidated sessions for',
    example: 1,
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    description:
      'Optional start date filter (ISO date string). Events that start, end, or span across this date will be included.',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    description:
      'Optional end date filter (ISO date string). Events that start, end, or span across this date will be included.',
    example: '2024-01-31T23:59:59.999Z',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of unvalidated activity events retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        description: 'Activity event object with all related information',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this athlete',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found',
  })
  getUnvalidatedSessions(
    @JwtUser() user: AuthUser,
    @Param('athleteId', ParseIntPipe) athleteId: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventService.getUnvalidatedSessions(
      user,
      athleteId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get events for the authenticated user',
    description:
      'Retrieves events (training, competition, note, activity) accessible to the authenticated user. If coach=true, returns events for all athletes the user coaches. If athleteId is provided, filters events for that specific athlete. Results can be filtered by date range - events that start, end, or span across the date range are included. Each event includes all related information (workout, segments, feedback questions, etc.). Uses CASL authorization to determine which events the user can access.',
  })
  @ApiQuery({
    name: 'coach',
    type: String,
    description:
      'If "true", returns events for all athletes the user coaches. Otherwise, returns events for the user\'s own athlete.',
    example: 'true',
    required: false,
  })
  @ApiQuery({
    name: 'athleteId',
    type: String,
    description:
      'Optional athlete ID to filter events. If coach=true, filters to this specific athlete. If coach=false, this parameter is ignored.',
    example: '1',
    required: false,
  })
  @ApiQuery({
    name: 'startDate',
    type: String,
    description:
      'Optional start date filter (ISO date string). Events that start, end, or span across this date will be included.',
    example: '2024-01-01T00:00:00.000Z',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    type: String,
    description:
      'Optional end date filter (ISO date string). Events that start, end, or span across this date will be included.',
    example: '2024-01-31T23:59:59.999Z',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of events retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        description:
          'Event object (training, competition, note, or activity) with all related information',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getMyEvents(
    @JwtUser() user: AuthUser,
    @Query('coach') coach: string,
    @Query('athleteId') athleteId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.eventService.getMyEvents(
      user,
      coach === 'true',
      athleteId ? Number(athleteId) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get(':eventId')
  @ApiOperation({
    summary: 'Get a specific event by ID',
    description:
      'Retrieves a single event (training, competition, note, or activity) by its ID. The event includes all related information: for training events - workout with steps, targets, repeat blocks; for activity events - segments, feedback questions, weather, normalization; for competition events - related activity if linked. Uses CASL authorization to verify that the user has read access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the event to retrieve',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Event retrieved successfully',
    schema: {
      type: 'object',
      description:
        'Event object (training, competition, note, or activity) with all related information',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event not found',
  })
  getEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.getEventById(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description:
      "Creates a new event (training, competition, note, or activity). For training events, a workout can be included with steps, targets, and repeat blocks. The event is assigned to an athlete (defaults to the authenticated user's athlete if not specified). For training events with workouts within 7 days, a workout export sync event is emitted. For future training events, training load estimation is automatically scheduled. If the event is a training with a workout, the workout is created with all steps, targets, and nested repeat blocks. Uses CASL authorization to verify that the user can create events for the specified athlete.",
  })
  @ApiBody({
    schema: {
      type: 'object',
      description:
        'Event creation data. Structure varies by event type (training, competition, note, activity). For training events, workout with steps can be included.',
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Event created successfully',
    schema: {
      type: 'object',
      description:
        'Complete event object (training, competition, note, or activity) with all related information',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or athlete ID required',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user is not allowed to create events for this athlete',
  })
  createEvent(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEventDtoSchema)) body: CreateEventDto,
  ) {
    return this.eventService.createEvent(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':eventId')
  @ApiOperation({
    summary: 'Update an existing event',
    description:
      'Updates an existing event. All fields are optional - only provided fields will be updated. For training events, the workout can be updated (existing steps are deleted and replaced). If RPE is updated on an activity, training load recalculation is triggered. If description is updated on an activity, message threads are created/updated. For training events with workouts within 7 days, workout export sync events are emitted. For future training events without estimated_load, training load estimation is scheduled. Templates are excluded from workout export sync and training load estimation. Uses CASL authorization to verify that the user has update access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the event to update',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      description:
        'Event update data. Structure varies by event type. All fields are optional.',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Event updated successfully',
    schema: {
      type: 'object',
      description:
        'Complete updated event object (training, competition, note, or activity) with all related information',
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
    description: 'Forbidden - user does not have update access to this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event not found',
  })
  updateEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Body(new ZodValidationPipe(updateEventDtoSchema)) body: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(user, eventId, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get(':eventId/stream')
  @ApiOperation({
    summary: 'Get activity stream data',
    description:
      'Retrieves activity stream data (GPS, heart rate, power, cadence, etc.) for an activity event. The stream is compressed in the database and is decompressed and optionally reduced to a specific resolution. If keys are provided, only those stream types are returned. Otherwise, all available stream types are returned. The resolution parameter determines how many data points to return (e.g., resolution=100 returns 100 evenly spaced points). Uses CASL authorization to verify that the user has read access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the activity event',
    example: 1,
  })
  @ApiQuery({
    name: 'resolution',
    type: Number,
    description:
      'Number of data points to return. The stream will be reduced to this resolution (evenly spaced points).',
    example: 100,
    required: true,
  })
  @ApiQuery({
    name: 'keys',
    type: [String],
    description:
      'Optional array of stream keys to return. If not provided, all available stream types are returned. Valid keys: latitude, longitude, altitude, heartRate, power, cadence, speed, etc.',
    example: ['latitude', 'longitude', 'heartRate'],
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity stream retrieved successfully',
    schema: {
      type: 'object',
      description:
        'Activity stream object with arrays of data points for each requested stream type',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event or activity stream not found',
  })
  getEventStream(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Query('resolution', ParseIntPipe) resolution: number,
    @Query('keys', ParseArrayPipe) keys?: (keyof ActivityStream)[],
  ) {
    return this.eventService.getEventStream(user, eventId, resolution, keys);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get(':eventId/weather')
  @ApiOperation({
    summary: 'Get weather data for an activity',
    description:
      'Retrieves weather data associated with an activity event. Weather data includes resolution (in meters), provider name, and samples (array of weather measurements along the activity route). Weather data is typically fetched from external weather services when an activity is imported. Uses CASL authorization to verify that the user has read access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the activity event',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Weather data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        resolutionM: {
          type: 'number',
          description: 'Weather data resolution in meters',
          example: 1000,
        },
        provider: {
          type: 'string',
          description: 'Weather data provider name',
          example: 'openweathermap',
        },
        samples: {
          type: 'array',
          description: 'Array of weather measurements along the activity route',
          items: {
            type: 'object',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event, activity, or weather data not found',
  })
  getEventWeather(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.getEventWeather(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get(':eventId/normalization')
  @ApiOperation({
    summary: 'Get speed normalization data for an activity',
    description:
      'Retrieves speed normalization data for an activity event. Normalization adjusts speed based on elevation changes and other factors. Returns the average normalized speed and an array of normalization factors with their time ranges and percentages. Uses CASL authorization to verify that the user has read access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the activity event',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Normalization data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        averageNormalizedSpeed: {
          type: 'number',
          nullable: true,
          description: 'Average normalized speed for the activity',
          example: 12.5,
        },
        factors: {
          type: 'array',
          description: 'Array of normalization factors with time ranges',
          items: {
            type: 'object',
            properties: {
              factor: {
                type: 'number',
                description: 'Normalization factor value',
                example: 1.05,
              },
              timeSeconds: {
                type: 'number',
                description: 'Time in seconds for this factor',
                example: 300,
              },
              percent: {
                type: 'number',
                description: 'Percentage of total time this factor applies',
                example: 25.5,
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event or activity not found',
  })
  getEventNormalization(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.getEventNormalization(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get(':eventId/activity/feedback-questions')
  @ApiOperation({
    summary: 'Get activity feedback questions',
    description:
      'Retrieves feedback questions for an activity event. Questions are ordered by ID and include question text, QCM options (if applicable), and answer text (if answered). Also returns whether feedback has been skipped. This endpoint delegates to the ActivityFeedbackService. Uses CASL authorization to verify that the user has read access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the activity event',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback questions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              questionId: { type: 'number', example: 1 },
              questionText: { type: 'string', example: 'How did you feel?' },
              qcmOptions: {
                type: 'array',
                nullable: true,
                items: {
                  type: 'object',
                  properties: { label: { type: 'string' } },
                },
              },
              answerText: { type: 'string', nullable: true, example: 'Good' },
            },
          },
        },
        feedbackSkipped: {
          type: 'boolean',
          description: 'Whether feedback has been skipped for this activity',
          example: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have read access to this activity',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event is not an activity or activity not found',
  })
  async getActivityFeedbackQuestions(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    // Get event_activity_id from event
    const eventData = await this.eventService.getEventById(user, eventId);
    if (eventData.type !== 'ACTIVITY') {
      throw new NotFoundException('Activity not found for this event');
    }
    // Access event_activity_id (snake_case) or eventActivityId (camelCase after keysToCamel)
    const eventActivityId =
      (eventData as { eventActivityId?: number }).eventActivityId ??
      (eventData as { event_activity_id?: number }).event_activity_id;
    if (!eventActivityId) {
      throw new NotFoundException('Activity ID not found');
    }
    return this.activityFeedbackService.getActivityFeedbackQuestions(
      user,
      eventActivityId,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':eventId/activity/feedback-questions/:questionId/answer')
  @ApiOperation({
    summary: 'Submit an answer to a feedback question',
    description:
      'Submits an answer to a specific feedback question for an activity event. Only the athlete who owns the activity can submit answers. If all questions are answered after this submission, an ActivityFeedbackCompletedEvent is emitted. This endpoint delegates to the ActivityFeedbackService. Uses CASL authorization to verify that the user has update access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the activity event',
    example: 1,
  })
  @ApiParam({
    name: 'questionId',
    type: Number,
    description: 'ID of the feedback question',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        answerText: {
          type: 'string',
          description: 'Answer text for the question',
          example: 'I felt good during the run',
        },
      },
      required: ['answerText'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Answer submitted successfully',
    schema: {
      type: 'object',
      properties: {
        questionId: { type: 'number', example: 1 },
        answerText: { type: 'string', example: 'I felt good during the run' },
      },
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
    description:
      'Forbidden - user does not have update access or is not the activity owner',
  })
  @ApiResponse({
    status: 404,
    description:
      'Not found - event is not an activity, activity not found, or question not found',
  })
  async submitQuestionAnswer(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Param('questionId', ParseIntPipe) questionId: number,
    @Body('answerText') answerText: string,
  ) {
    // Get event_activity_id from event
    const eventData = await this.eventService.getEventById(user, eventId);
    if (eventData.type !== 'ACTIVITY') {
      throw new NotFoundException('Activity not found for this event');
    }
    // Access event_activity_id (snake_case) or eventActivityId (camelCase after keysToCamel)
    const eventActivityId =
      (eventData as { eventActivityId?: number }).eventActivityId ??
      (eventData as { event_activity_id?: number }).event_activity_id;
    if (!eventActivityId) {
      throw new NotFoundException('Activity ID not found');
    }
    return this.activityFeedbackService.submitQuestionAnswer(
      user,
      eventActivityId,
      questionId,
      answerText,
    );
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':eventId/activity/feedback/skip')
  @ApiOperation({
    summary: 'Skip feedback for an activity',
    description:
      'Marks feedback as skipped for an activity event. Only the athlete who owns the activity can skip feedback. This endpoint delegates to the ActivityFeedbackService. Uses CASL authorization to verify that the user has update access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the activity event',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback skipped successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user does not have update access or is not the activity owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event is not an activity or activity not found',
  })
  async skipFeedback(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    const eventData = await this.eventService.getEventById(user, eventId);
    if (eventData.type !== 'ACTIVITY') {
      throw new NotFoundException('Activity not found for this event');
    }
    const eventActivityId =
      (eventData as { eventActivityId?: number }).eventActivityId ??
      (eventData as { event_activity_id?: number }).event_activity_id;
    if (!eventActivityId) {
      throw new NotFoundException('Activity ID not found');
    }
    return this.activityFeedbackService.skipFeedback(user, eventActivityId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':eventId/activity/feedback/unskip')
  @ApiOperation({
    summary: 'Unskip feedback for an activity',
    description:
      'Reopens feedback for an activity event that was previously skipped. Only the athlete who owns the activity can unskip feedback. This endpoint delegates to the ActivityFeedbackService. Uses CASL authorization to verify that the user has update access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the activity event',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback unskipped successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user does not have update access or is not the activity owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event is not an activity or activity not found',
  })
  async unskipFeedback(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    const eventData = await this.eventService.getEventById(user, eventId);
    if (eventData.type !== 'ACTIVITY') {
      throw new NotFoundException('Activity not found for this event');
    }
    const eventActivityId =
      (eventData as { eventActivityId?: number }).eventActivityId ??
      (eventData as { event_activity_id?: number }).event_activity_id;
    if (!eventActivityId) {
      throw new NotFoundException('Activity ID not found');
    }
    return this.activityFeedbackService.unskipFeedback(user, eventActivityId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':eventId')
  @ApiOperation({
    summary: 'Delete an event',
    description:
      'Deletes an event and all its related data. For training events, the workout and all provider exports are deleted. For activity events, weather data, normalization factors, records, feedback questions, and embeddings are deleted. The event and all its sub-entities (training, competition, note, activity) are permanently removed. If the event has an athlete, a WebSocket notification is sent for weekly load update. This operation cannot be undone. Uses CASL authorization to verify that the user has delete access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the event to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Event deleted successfully',
    schema: {
      type: 'object',
      description: 'Deleted event object',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have delete access to this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event not found',
  })
  deleteEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.deleteEvent(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':eventId/duplicate')
  @ApiOperation({
    summary: 'Duplicate an event',
    description:
      'Creates a complete duplicate of an event with all its data. For training events, the workout is duplicated with all steps, targets, and nested repeat blocks. Optionally, new start and end dates can be provided. IDs and relations are removed from the duplicated event. For future training events, training load estimation is automatically scheduled. A WebSocket notification is sent for weekly load update. Uses CASL authorization to verify that the user has read access to the source event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the event to duplicate',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          format: 'date-time',
          description: 'Optional new start date for the duplicated event',
          example: '2024-02-01T10:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          description: 'Optional new end date for the duplicated event',
          example: '2024-02-01T11:30:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Event duplicated successfully',
    schema: {
      type: 'object',
      description:
        'Complete duplicated event object (training, competition, note, or activity) with all related information',
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user does not have read access to the source event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - source event not found',
  })
  duplicateEventComplete(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Body(new ZodValidationPipe(duplicateEventDtoSchema))
    dto: DuplicateEventDto,
  ) {
    return this.eventService.duplicateEventComplete(user, eventId, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':eventId/related-activity/:activityId')
  @ApiOperation({
    summary: 'Link an activity to a training or competition event',
    description:
      'Links an activity event to a training or competition event. This creates a relationship where the activity represents the actual performance for the planned training/competition. The eventId must refer to a training or competition event, and activityId must refer to an activity event. Uses CASL authorization to verify that the user has update access to the event and read access to the activity.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the training or competition event',
    example: 1,
  })
  @ApiParam({
    name: 'activityId',
    type: Number,
    description: 'ID of the activity event to link',
    example: 2,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity linked successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - eventId is not a training/competition or activityId is not an activity',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user does not have update access to the event or read access to the activity',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event or activity not found',
  })
  setRelatedActivity(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Param('activityId', ParseIntPipe) activityId: event['event_id'],
  ) {
    return this.eventService.setRelatedActivity(user, eventId, activityId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':eventId/related-activity')
  @ApiOperation({
    summary: 'Unlink activity from a training or competition event',
    description:
      'Removes the link between an activity event and a training or competition event. The eventId must refer to a training or competition event. Uses CASL authorization to verify that the user has update access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the training or competition event',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Activity unlinked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - eventId is not a training or competition event',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have update access to the event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - event not found',
  })
  unsetRelatedActivity(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.unsetRelatedActivity(user, eventId);
  }

  // ============================================================================
  // Workout-related routes
  // ============================================================================

  /**
   * Reorder workout steps for a training event
   * PATCH /api/event/:eventId/workout/reorder
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':eventId/workout/reorder')
  @ApiOperation({
    summary: 'Reorder workout steps',
    description:
      'Reorders the steps of a workout for a training event. The stepOrders array specifies the new order for each step by providing stepId and order pairs. All steps must be included in the reorder request. Uses CASL authorization to verify that the user has update access to the event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the training event with workout',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        stepOrders: {
          type: 'array',
          description: 'Array of step order assignments',
          items: {
            type: 'object',
            properties: {
              stepId: {
                type: 'number',
                description: 'ID of the workout step',
                example: 1,
              },
              order: {
                type: 'number',
                description: 'New order index for this step',
                example: 0,
              },
            },
            required: ['stepId', 'order'],
          },
        },
      },
      required: ['stepOrders'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Workout steps reordered successfully',
    schema: {
      type: 'object',
      description:
        'Complete training event object with reordered workout steps',
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
    description: 'Forbidden - user does not have update access to the event',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - training event with workout not found',
  })
  reorderWorkoutSteps(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Body(new ZodValidationPipe(reorderWorkoutStepsSchema))
    dto: ReorderWorkoutStepsDto,
  ) {
    return this.eventService.reorderWorkoutSteps(user, eventId, dto);
  }

  /**
   * Duplicate workout from one training to another
   * POST /api/event/:eventId/workout/duplicate
   */
  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post(':eventId/workout/duplicate')
  @ApiOperation({
    summary: 'Duplicate workout from one training to another',
    description:
      'Duplicates a workout (with all steps, targets, and nested repeat blocks) from a source training event to a target training event. The source event (eventId) must have a workout, and the target event (targetTrainingId) must not have a workout. The workout is completely duplicated including all step types, durations, targets, and repeat blocks. Uses CASL authorization to verify that the user has read access to the source event and update access to the target event.',
  })
  @ApiParam({
    name: 'eventId',
    type: Number,
    description: 'ID of the source training event with workout',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        targetTrainingId: {
          type: 'number',
          description: 'ID of the target training event to copy the workout to',
          example: 2,
        },
      },
      required: ['targetTrainingId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Workout duplicated successfully',
    schema: {
      type: 'object',
      description:
        'Complete target training event object with duplicated workout',
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - validation error or target training already has a workout',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - user does not have read access to source event or update access to target event',
  })
  @ApiResponse({
    status: 404,
    description:
      'Not found - source training event with workout not found or target training event not found',
  })
  duplicateWorkout(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Body(new ZodValidationPipe(duplicateWorkoutSchema))
    dto: DuplicateWorkoutDto,
  ) {
    return this.eventService.duplicateWorkout(user, eventId, dto);
  }
}
