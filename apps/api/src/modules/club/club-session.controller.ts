import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CancelClubSessionDto,
  ClubIdParamsDto,
  ClubSessionAnswerDto,
  ClubSessionDto,
  ClubSessionForEventDto,
  ClubSessionParamsDto,
  CreateClubSessionDto,
  cancelClubSessionDtoSchema,
  clubIdParamsSchema,
  clubSessionAnswerDtoSchema,
  clubSessionParamsSchema,
  createClubSessionDtoSchema,
} from '@openathlete/shared';

import { JwtUser } from 'src/modules/auth/decorators';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { UserTypeGuard } from 'src/modules/auth/guards';

import { ClubSessionService } from './club-session.service';

@ApiTags('Club sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller()
export class ClubSessionController {
  constructor(private readonly sessions: ClubSessionService) {}

  @Get('club/:clubId/sessions')
  @ApiOperation({
    summary: "List the club's sessions (staff)",
    description:
      'Each session with its coming occurrences: how many athletes got it, and how many said they come or not.',
  })
  @ApiResponse({ status: 200, description: 'The sessions' })
  list(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
  ): Promise<ClubSessionDto[]> {
    return this.sessions.list(user, params.clubId);
  }

  @Post('club/:clubId/sessions')
  @ApiOperation({
    summary: 'Plan a club session (coaches)',
    description:
      "A place, a local time and a group (or all athletes), once or every week, with a template of the club's library as content. Each occurrence becomes a session in its athletes' calendars, four weeks ahead.",
  })
  @ApiResponse({ status: 201, description: 'The session' })
  create(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
    @Body(new ZodValidationPipe(createClubSessionDtoSchema))
    body: CreateClubSessionDto,
  ): Promise<ClubSessionDto> {
    return this.sessions.create(user, params.clubId, body);
  }

  @Put('club/:clubId/sessions/:clubSessionId')
  @ApiOperation({
    summary: 'Change a club session (coaches)',
    description:
      'Its coming occurrences are made again, and the athletes who had them are told.',
  })
  @ApiResponse({ status: 200, description: 'The session' })
  update(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubSessionParamsSchema))
    params: ClubSessionParamsDto,
    @Body(new ZodValidationPipe(createClubSessionDtoSchema))
    body: CreateClubSessionDto,
  ): Promise<ClubSessionDto> {
    return this.sessions.update(
      user,
      params.clubId,
      params.clubSessionId,
      body,
    );
  }

  @Delete('club/:clubId/sessions/:clubSessionId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Stop a club session (coaches)',
    description:
      'Its coming occurrences leave the calendars; done ones stay in the athletes’ history.',
  })
  @ApiResponse({ status: 204, description: 'Stopped' })
  async delete(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubSessionParamsSchema))
    params: ClubSessionParamsDto,
  ): Promise<void> {
    await this.sessions.delete(user, params.clubId, params.clubSessionId);
  }

  @Post('club/:clubId/sessions/:clubSessionId/cancel')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Call one occurrence off (coaches)',
    description: 'It leaves the calendars, and its athletes are told.',
  })
  @ApiResponse({ status: 200, description: 'The session' })
  cancel(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubSessionParamsSchema))
    params: ClubSessionParamsDto,
    @Body(new ZodValidationPipe(cancelClubSessionDtoSchema))
    body: CancelClubSessionDto,
  ): Promise<ClubSessionDto> {
    return this.sessions.cancelOccurrence(
      user,
      params.clubId,
      params.clubSessionId,
      body.date,
    );
  }

  @Get('club-sessions/event/:eventId')
  @ApiOperation({
    summary: 'The club session behind a session of the calendar',
    description:
      'Its club, place and notes, and whether the athlete said they come.',
  })
  @ApiResponse({ status: 200, description: 'The club session' })
  @ApiResponse({ status: 404, description: 'Not a club session' })
  forEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<ClubSessionForEventDto> {
    return this.sessions.forEvent(user, eventId);
  }

  @Put('club-sessions/attendance')
  @ApiOperation({
    summary: 'Say whether you come to a club session',
    description: 'From the session in your own calendar.',
  })
  @ApiResponse({ status: 200, description: 'The club session' })
  answer(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(clubSessionAnswerDtoSchema))
    body: ClubSessionAnswerDto,
  ): Promise<ClubSessionForEventDto> {
    return this.sessions.answer(user, body.eventId, body.going);
  }
}
