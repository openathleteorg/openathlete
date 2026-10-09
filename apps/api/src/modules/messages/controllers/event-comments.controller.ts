import { ZodValidationPipe } from 'nestjs-zod';

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  AddEventCommentDto,
  EventComment,
  EventCommentCount,
  EventComments,
  addEventCommentDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { MessagesGateway } from '../gateways/messages.gateway';
import { EventCommentService } from '../services/event-comment.service';

/** Comments on planned sessions and activities, for the calendar */
@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('messages/events')
export class EventCommentsController {
  constructor(
    private readonly comments: EventCommentService,
    private readonly gateway: MessagesGateway,
  ) {}

  @Get('comments')
  @ApiOperation({ summary: 'Comment and unread counts of a calendar range' })
  counts(
    @JwtUser() user: AuthUser,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('athleteId', new ParseIntPipe({ optional: true }))
    athleteId?: number,
  ): Promise<EventCommentCount[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate are required');
    }
    return this.comments.counts(user, start, end, athleteId);
  }

  @Get(':eventId/comments')
  @ApiOperation({ summary: 'Comments on a session or an activity' })
  list(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<EventComments> {
    return this.comments.list(user, eventId);
  }

  @Post(':eventId/comments')
  @ApiOperation({ summary: 'Comment on a session or an activity' })
  async add(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body(new ZodValidationPipe(addEventCommentDtoSchema))
    body: AddEventCommentDto,
  ): Promise<EventComment> {
    const { message, threadId, participantIds } = await this.comments.add(
      user,
      eventId,
      body.content,
    );
    // The Messages page and other open calendars hear of it at once
    this.gateway.broadcastToUsers(
      'new_message',
      { message: { ...message, messageThreadId: threadId } },
      participantIds,
    );
    return {
      messageId: message.messageId,
      content: message.content,
      createdAt: message.createdAt,
      sender: {
        userId: message.sender.userId,
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
      },
      mine: true,
    };
  }

  @Post(':eventId/comments/read')
  @HttpCode(204)
  @ApiOperation({ summary: 'Mark the comments of an event read' })
  markRead(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<void> {
    return this.comments.markRead(user, eventId);
  }
}
