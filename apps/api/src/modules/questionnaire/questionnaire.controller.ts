import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
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
  Feature,
  type PendingQuestionnaire,
  type Questionnaire,
  type QuestionnaireForm,
  type QuestionnaireInput,
  type QuestionnaireResponses,
  type QuestionnaireResponsesQuery,
  type QuestionnaireSummary,
  type SubmitQuestionnaireAnswersDto,
  questionnaireInputSchema,
  questionnaireResponsesQuerySchema,
  submitQuestionnaireAnswersDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { FeatureAccessService } from 'src/modules/subscription/services/feature-access.service';

import { QuestionnaireResponseService } from './services/questionnaire-response.service';
import { QuestionnaireService } from './services/questionnaire.service';

/** Active (not archived) questionnaires a coach has without coach tools */
const FREE_ACTIVE_QUESTIONNAIRES = 1;

@ApiTags('Questionnaires')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('questionnaires')
export class QuestionnaireController {
  constructor(
    private readonly questionnaires: QuestionnaireService,
    private readonly responses: QuestionnaireResponseService,
    private readonly features: FeatureAccessService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * One active questionnaire is free; a second one is a coach tool. Those
   * already active keep being sent whatever the plan.
   */
  private async assertMayActivate(user: AuthUser): Promise<void> {
    const active = await this.prisma.questionnaire.count({
      where: { coachUserId: user.userId, archivedAt: null },
    });
    if (active >= FREE_ACTIVE_QUESTIONNAIRES) {
      await this.features.assertAsCoach(
        user.userId,
        Feature.COACH_QUESTIONNAIRES,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: "The coach's questionnaires",
    description:
      'The library of the questionnaires the user wrote, with how often each was placed and answered. Archived ones with archived=true.',
  })
  @ApiQuery({ name: 'archived', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'The questionnaires' })
  list(
    @JwtUser() user: AuthUser,
    @Query('archived', new ParseBoolPipe({ optional: true }))
    archived?: boolean,
  ): Promise<QuestionnaireSummary[]> {
    return this.questionnaires.list(user, { archived });
  }

  @Post()
  @ApiOperation({
    summary: 'Write a questionnaire',
    description:
      'Questions of any type (text, scale, number, choices, yes/no), an optional score over the scale questions, and metrics the answers fill.',
  })
  @ApiResponse({ status: 201, description: 'The questionnaire' })
  @ApiResponse({ status: 400, description: 'Invalid questionnaire' })
  async create(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(questionnaireInputSchema))
    body: QuestionnaireInput,
  ): Promise<Questionnaire> {
    await this.assertMayActivate(user);
    return this.questionnaires.create(user, body);
  }

  @Get('pending')
  @ApiOperation({
    summary: 'The questionnaires waiting for my answer',
    description:
      "The athlete's questionnaires open now and unanswered, the oldest first.",
  })
  @ApiResponse({ status: 200, description: 'The open questionnaires' })
  pending(@JwtUser() user: AuthUser): Promise<PendingQuestionnaire[]> {
    return this.responses.pending(user);
  }

  @Get('responses')
  @ApiOperation({
    summary: 'Answers over a span',
    description:
      'The answered and unanswered occurrences between from and to (at most a year), with the questionnaires and athletes they concern. A coach reads those of the questionnaires they wrote, and those placed for a club for the athletes the club entrusted to them; an athlete reads their own. Filter by athleteId, questionnaireId, or both.',
  })
  @ApiResponse({ status: 200, description: 'The answers' })
  @ApiResponse({ status: 400, description: 'Invalid span' })
  responsesOf(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(questionnaireResponsesQuerySchema))
    query: QuestionnaireResponsesQuery,
  ): Promise<QuestionnaireResponses> {
    return this.responses.responses(user, query);
  }

  @Get('events/:eventId')
  @ApiOperation({
    summary: 'The questionnaire of a calendar event',
    description:
      'Its questions, the answers given, when it closes and whether the athlete may answer now.',
  })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiResponse({ status: 200, description: 'The questionnaire to answer' })
  @ApiResponse({ status: 404, description: 'Not found, or not readable' })
  getForEvent(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<QuestionnaireForm> {
    return this.responses.getForEvent(user, eventId);
  }

  @Put('events/:eventId/answers')
  @ApiOperation({
    summary: 'Answer a questionnaire',
    description:
      'The athlete answers from the opening until the next occurrence (or a week), and may change the answers for a day. The answers replace earlier ones; numbers that fill a metric are recorded on the day, unless a device recorded it.',
  })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiResponse({ status: 200, description: 'The questionnaire answered' })
  @ApiResponse({
    status: 400,
    description: 'QUESTIONNAIRE_CLOSED, or INVALID_ANSWERS with the errors',
  })
  @ApiResponse({ status: 403, description: 'Only the athlete answers' })
  submit(
    @JwtUser() user: AuthUser,
    @Param('eventId', ParseIntPipe) eventId: number,
    @Body(new ZodValidationPipe(submitQuestionnaireAnswersDtoSchema))
    body: SubmitQuestionnaireAnswersDto,
  ): Promise<QuestionnaireForm> {
    return this.responses.submit(user, eventId, body);
  }

  @Get(':questionnaireId')
  @ApiOperation({ summary: 'One of the coach questionnaires' })
  @ApiParam({ name: 'questionnaireId', type: Number })
  @ApiResponse({ status: 200, description: 'The questionnaire' })
  @ApiResponse({ status: 404, description: 'Not found' })
  get(
    @JwtUser() user: AuthUser,
    @Param('questionnaireId', ParseIntPipe) questionnaireId: number,
  ): Promise<Questionnaire> {
    return this.questionnaires.get(user, questionnaireId);
  }

  @Put(':questionnaireId')
  @ApiOperation({
    summary: 'Edit a questionnaire',
    description:
      'Replaces its questions with the ones given, in order. An answered question whose type, scale, unit or options change is replaced, keeping its answers; one left out is archived if answered, deleted otherwise. Coming occurrences take the new title.',
  })
  @ApiParam({ name: 'questionnaireId', type: Number })
  @ApiResponse({ status: 200, description: 'The questionnaire' })
  update(
    @JwtUser() user: AuthUser,
    @Param('questionnaireId', ParseIntPipe) questionnaireId: number,
    @Body(new ZodValidationPipe(questionnaireInputSchema))
    body: QuestionnaireInput,
  ): Promise<Questionnaire> {
    return this.questionnaires.update(user, questionnaireId, body);
  }

  @Post(':questionnaireId/archive')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Archive a questionnaire',
    description:
      'Takes it out of the library and removes its coming unanswered occurrences from the calendars. The answers stay.',
  })
  @ApiParam({ name: 'questionnaireId', type: Number })
  @ApiResponse({ status: 200, description: '{ removedOccurrences }' })
  archive(
    @JwtUser() user: AuthUser,
    @Param('questionnaireId', ParseIntPipe) questionnaireId: number,
  ) {
    return this.questionnaires.archive(user, questionnaireId);
  }

  @Post(':questionnaireId/restore')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bring an archived questionnaire back' })
  @ApiParam({ name: 'questionnaireId', type: Number })
  @ApiResponse({ status: 200, description: 'The questionnaire' })
  async restore(
    @JwtUser() user: AuthUser,
    @Param('questionnaireId', ParseIntPipe) questionnaireId: number,
  ): Promise<Questionnaire> {
    await this.assertMayActivate(user);
    return this.questionnaires.restore(user, questionnaireId);
  }

  @Delete(':questionnaireId')
  @ApiOperation({
    summary: 'Delete a questionnaire never answered',
    description:
      'Deletes it with its occurrences in the calendars. One answered cannot be deleted (409): archive it instead.',
  })
  @ApiParam({ name: 'questionnaireId', type: Number })
  @ApiResponse({ status: 200, description: 'Deleted' })
  @ApiResponse({ status: 409, description: 'QUESTIONNAIRE_HAS_ANSWERS' })
  async remove(
    @JwtUser() user: AuthUser,
    @Param('questionnaireId', ParseIntPipe) questionnaireId: number,
  ): Promise<void> {
    await this.questionnaires.remove(user, questionnaireId);
  }
}
