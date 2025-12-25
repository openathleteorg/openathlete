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

@Controller('event')
export class EventController {
  constructor(
    private eventService: EventService,
    private activityFeedbackService: ActivityFeedbackService,
  ) {}

  @Get('ical')
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
  @Get('ical/secret')
  async getMyIcalCalendarSecret(@JwtUser() user: AuthUser) {
    return this.eventService.getMyIcalCalendarSecret(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('unvalidated/:athleteId')
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
  @Get()
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
  @Get(':eventId')
  getEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.getEventById(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post()
  createEvent(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEventDtoSchema)) body: CreateEventDto,
  ) {
    return this.eventService.createEvent(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':eventId')
  updateEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Body(new ZodValidationPipe(updateEventDtoSchema)) body: UpdateEventDto,
  ) {
    return this.eventService.updateEvent(user, eventId, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get(':eventId/stream')
  getEventStream(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Query('resolution', ParseIntPipe) resolution: number,
    @Query('keys', ParseArrayPipe) keys?: (keyof ActivityStream)[],
  ) {
    return this.eventService.getEventStream(user, eventId, resolution, keys);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get(':eventId/weather')
  getEventWeather(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.getEventWeather(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get(':eventId/normalization')
  getEventNormalization(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.getEventNormalization(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get(':eventId/activity/feedback-questions')
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
  @Patch(':eventId/activity/feedback-questions/:questionId/answer')
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
  @Post(':eventId/activity/feedback/skip')
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
  @Post(':eventId/activity/feedback/unskip')
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
  @Delete(':eventId')
  deleteEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.deleteEvent(user, eventId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post(':eventId/duplicate')
  duplicateEventComplete(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Body(new ZodValidationPipe(duplicateEventDtoSchema))
    dto: DuplicateEventDto,
  ) {
    return this.eventService.duplicateEventComplete(user, eventId, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post(':eventId/related-activity/:activityId')
  setRelatedActivity(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Param('activityId', ParseIntPipe) activityId: event['event_id'],
  ) {
    return this.eventService.setRelatedActivity(user, eventId, activityId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':eventId/related-activity')
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
  @Patch(':eventId/workout/reorder')
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
  @Post(':eventId/workout/duplicate')
  duplicateWorkout(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
    @Body(new ZodValidationPipe(duplicateWorkoutSchema))
    dto: DuplicateWorkoutDto,
  ) {
    return this.eventService.duplicateWorkout(user, eventId, dto);
  }
}
