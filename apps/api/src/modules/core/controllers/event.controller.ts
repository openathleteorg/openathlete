import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
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
  createEventDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EventService } from '../services';

@Controller('event')
export class EventController {
  constructor(private eventService: EventService) {}

  @Get('ical')
  async getIcalCalendar(@Res() res, @Query('calendar') calendar: string) {
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
  @Get()
  getMyEvents(
    @JwtUser() user: AuthUser,
    @Query('coach') coach: string,
    @Query('athleteId') athleteId: string,
  ) {
    return this.eventService.getMyEvents(
      user,
      coach === 'true',
      athleteId ? Number(athleteId) : undefined,
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
    // @Body(new ZodValidationPipe(createEventDtoSchema)) body: CreateEventDto,
    @Body() body: Partial<CreateEventDto>,
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
  @Delete(':eventId')
  deleteEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: event['event_id'],
  ) {
    return this.eventService.deleteEvent(user, eventId);
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
}
