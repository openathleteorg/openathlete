import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CoachNote,
  CoachNotebook,
  CreateCoachNoteDto,
  UpdateCoachNoteDto,
  UpdateCoachNotebookDto,
  createCoachNoteDtoSchema,
  updateCoachNoteDtoSchema,
  updateCoachNotebookDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { CoachNoteService } from '../services/coach-note.service';

@ApiTags('Coach notes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('coach-notes')
export class CoachNoteController {
  constructor(private readonly coachNoteService: CoachNoteService) {}

  @Get()
  @ApiOperation({
    summary: "List the user's private notes",
    description:
      'Notes only their author reads, never the athlete they are about. With athleteId: the notes about that athlete. Without: every note, general ones and those about athletes the user still coaches. Pinned notes first, then the most recently updated.',
  })
  @ApiQuery({ name: 'athleteId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'The notes' })
  @ApiResponse({
    status: 403,
    description: 'The user does not coach this athlete',
  })
  list(
    @JwtUser() user: AuthUser,
    @Query('athleteId', new ParseIntPipe({ optional: true }))
    athleteId?: number,
  ): Promise<CoachNote[]> {
    return this.coachNoteService.list(user, athleteId);
  }

  @Get('notebook')
  @ApiOperation({
    summary: "The user's general notebook",
    description:
      'One free text for every athlete, private like the notes. Empty, with updatedAt null, until the first save.',
  })
  @ApiResponse({ status: 200, description: '{ content, updatedAt }' })
  getNotebook(@JwtUser() user: AuthUser): Promise<CoachNotebook> {
    return this.coachNoteService.getNotebook(user);
  }

  @Put('notebook')
  @ApiOperation({
    summary: "Save the user's general notebook",
    description: 'Replaces its whole text (100,000 characters at most).',
  })
  @ApiResponse({ status: 200, description: '{ content, updatedAt }' })
  @ApiResponse({ status: 400, description: 'Text too long' })
  saveNotebook(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateCoachNotebookDtoSchema))
    dto: UpdateCoachNotebookDto,
  ): Promise<CoachNotebook> {
    return this.coachNoteService.saveNotebook(user, dto);
  }

  @Post()
  @ApiOperation({
    summary: 'Write a private note',
    description:
      'A note about one athlete (athleteId) or a general one. Plain text, where links show clickable.',
  })
  @ApiResponse({ status: 201, description: 'The note' })
  @ApiResponse({ status: 400, description: 'Invalid note' })
  @ApiResponse({
    status: 403,
    description: 'The user does not coach this athlete',
  })
  create(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createCoachNoteDtoSchema))
    dto: CreateCoachNoteDto,
  ): Promise<CoachNote> {
    return this.coachNoteService.create(user, dto);
  }

  @Patch(':coachNoteId')
  @ApiOperation({ summary: 'Edit, pin or move a private note' })
  @ApiParam({ name: 'coachNoteId', type: Number })
  @ApiResponse({ status: 200, description: 'The note' })
  @ApiResponse({
    status: 403,
    description: 'The user does not coach the new athlete',
  })
  @ApiResponse({ status: 404, description: 'No such note of the user' })
  update(
    @JwtUser() user: AuthUser,
    @Param('coachNoteId', ParseIntPipe) coachNoteId: number,
    @Body(new ZodValidationPipe(updateCoachNoteDtoSchema))
    dto: UpdateCoachNoteDto,
  ): Promise<CoachNote> {
    return this.coachNoteService.update(user, coachNoteId, dto);
  }

  @Delete(':coachNoteId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a private note' })
  @ApiParam({ name: 'coachNoteId', type: Number })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'No such note of the user' })
  delete(
    @JwtUser() user: AuthUser,
    @Param('coachNoteId', ParseIntPipe) coachNoteId: number,
  ): Promise<void> {
    return this.coachNoteService.delete(user, coachNoteId);
  }
}
