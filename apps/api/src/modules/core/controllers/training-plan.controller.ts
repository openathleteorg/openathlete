import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AppliedTrainingPlansQuery,
  ApplyTrainingPlanDto,
  CreateTrainingPlanFromCalendarDto,
  CreateTrainingPlanTemplateDto,
  ImportTrainingPlanDto,
  ShiftTrainingPlanDto,
  TrainingPlanApplyResponse,
  UpdateTrainingPlanTemplateDto,
  appliedTrainingPlansQuerySchema,
  applyTrainingPlanSchema,
  createTrainingPlanFromCalendarSchema,
  createTrainingPlanTemplateSchema,
  importTrainingPlanSchema,
  shiftTrainingPlanSchema,
  updateTrainingPlanTemplateSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { QueueService } from '../../queue/queue.service';
import { TrainingPlanLibraryService } from '../services/training-plan-library.service';

@ApiTags('Training Plan')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('training-plans')
export class TrainingPlanController {
  constructor(
    private readonly library: TrainingPlanLibraryService,
    private readonly queue: QueueService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "The user's library of training plans",
    description:
      'Plans laid out by week and weekday, not tied to dates, with the number of athletes each is applied to now.',
  })
  @ApiResponse({ status: 200, description: 'Library plans, by name' })
  listTemplates(@JwtUser() user: AuthUser) {
    return this.library.listTemplates(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Add a plan to the library',
    description:
      'Built in the plan editor: cycles, weeks and sessions by weekday, with structured workouts whose targets are relative to zones.',
  })
  @ApiResponse({ status: 201, description: 'The plan, with its content' })
  createTemplate(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTrainingPlanTemplateSchema))
    body: CreateTrainingPlanTemplateDto,
  ) {
    return this.library.createTemplate(user, body);
  }

  @Post('from-calendar')
  @ApiOperation({
    summary: 'Save a date range of a calendar as a library plan',
    description:
      'Planned sessions and notes of the range become week and weekday offsets; training blocks become the cycles. Races are left out.',
  })
  @ApiResponse({ status: 201, description: 'The plan, with its content' })
  @ApiResponse({ status: 403, description: 'Not the user or their athlete' })
  createFromCalendar(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTrainingPlanFromCalendarSchema))
    body: CreateTrainingPlanFromCalendarDto,
  ) {
    return this.library.createFromCalendar(user, body);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import a plan file into the library',
    description:
      'An exported OpenAthlete plan (format "openathlete-training-plan"), or a plan of the website.',
  })
  @ApiResponse({ status: 201, description: 'The plan, with its content' })
  importTemplate(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(importTrainingPlanSchema))
    body: ImportTrainingPlanDto,
  ) {
    return this.library.importTemplate(user, body);
  }

  @Get('applied')
  @ApiOperation({
    summary: 'Plans applied to the user or the athletes they coach',
    description:
      'With their dates in the athlete time zone, the current week, and how many sessions are done or were changed by hand.',
  })
  @ApiResponse({ status: 200, description: 'Applied plans, latest first' })
  listApplied(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(appliedTrainingPlansQuerySchema))
    query: AppliedTrainingPlansQuery,
  ) {
    return this.library.listApplied(user, query);
  }

  @Get('apply-jobs/:jobId')
  @ApiOperation({
    summary: 'Progress of a plan applied to several athletes',
  })
  @ApiParam({ name: 'jobId', type: String })
  @ApiResponse({ status: 200, description: 'State and results so far' })
  @ApiResponse({ status: 404, description: 'Unknown job' })
  async getApplyJob(@JwtUser() user: AuthUser, @Param('jobId') jobId: string) {
    const status = await this.queue.getTrainingPlanApplyJob(jobId, user.userId);
    if (!status) throw new NotFoundException('Job not found');
    return status;
  }

  @Post('applied/:trainingPlanId/shift')
  @ApiOperation({
    summary: 'Move an applied plan by whole days',
    description:
      'Sessions still to do move, at the same local time; done sessions stay. Refused if a session would land in the past.',
  })
  @ApiParam({ name: 'trainingPlanId', type: Number })
  @ApiResponse({ status: 201, description: 'How many sessions moved' })
  shiftApplied(
    @JwtUser() user: AuthUser,
    @Param('trainingPlanId', ParseIntPipe) trainingPlanId: number,
    @Body(new ZodValidationPipe(shiftTrainingPlanSchema))
    body: ShiftTrainingPlanDto,
  ) {
    return this.library.shiftApplied(user, trainingPlanId, body);
  }

  @Delete('applied/:trainingPlanId')
  @ApiOperation({
    summary: 'Remove an applied plan',
    description:
      'Its sessions still to do are deleted, with their workouts on the watch. Done and past sessions stay.',
  })
  @ApiParam({ name: 'trainingPlanId', type: Number })
  @ApiResponse({ status: 200, description: 'Removed and kept sessions' })
  removeApplied(
    @JwtUser() user: AuthUser,
    @Param('trainingPlanId', ParseIntPipe) trainingPlanId: number,
  ) {
    return this.library.removeApplied(user, trainingPlanId);
  }

  @Get(':templateId')
  @ApiOperation({ summary: 'A library plan, with its content' })
  @ApiParam({ name: 'templateId', type: Number })
  @ApiResponse({ status: 404, description: 'Not one of the user’s plans' })
  getTemplate(
    @JwtUser() user: AuthUser,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    return this.library.getTemplate(user, templateId);
  }

  @Patch(':templateId')
  @ApiOperation({
    summary: 'Change a library plan',
    description: 'Plans already applied keep the sessions they were given.',
  })
  @ApiParam({ name: 'templateId', type: Number })
  updateTemplate(
    @JwtUser() user: AuthUser,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body(new ZodValidationPipe(updateTrainingPlanTemplateSchema))
    body: UpdateTrainingPlanTemplateDto,
  ) {
    return this.library.updateTemplate(user, templateId, body);
  }

  @Delete(':templateId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a library plan',
    description: 'Plans already applied stay on the calendars.',
  })
  @ApiParam({ name: 'templateId', type: Number })
  async deleteTemplate(
    @JwtUser() user: AuthUser,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    await this.library.deleteTemplate(user, templateId);
  }

  @Get(':templateId/export')
  @ApiOperation({
    summary: 'Export a library plan as a file',
    description: 'To share it, or import it into another instance.',
  })
  @ApiParam({ name: 'templateId', type: Number })
  exportTemplate(
    @JwtUser() user: AuthUser,
    @Param('templateId', ParseIntPipe) templateId: number,
  ) {
    return this.library.exportTemplate(user, templateId);
  }

  @Post(':templateId/apply/preview')
  @HttpCode(200)
  @ApiOperation({
    summary: 'What applying a plan would do',
    description:
      'Per athlete: the dates, the sessions added and skipped, sessions already planned, races, travel or illness periods, and other plans over the same days. Changes nothing.',
  })
  @ApiParam({ name: 'templateId', type: Number })
  previewApply(
    @JwtUser() user: AuthUser,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body(new ZodValidationPipe(applyTrainingPlanSchema))
    body: ApplyTrainingPlanDto,
  ) {
    return this.library.previewApply(user, templateId, body);
  }

  @Post(':templateId/apply')
  @ApiOperation({
    summary: 'Apply a plan to one or several athletes',
    description:
      'By start date, end date or race. One athlete is applied at once; several run in the background: poll apply-jobs/:jobId.',
  })
  @ApiParam({ name: 'templateId', type: Number })
  @ApiResponse({ status: 201, description: 'Done, or the queued job' })
  async apply(
    @JwtUser() user: AuthUser,
    @Param('templateId', ParseIntPipe) templateId: number,
    @Body(new ZodValidationPipe(applyTrainingPlanSchema))
    body: ApplyTrainingPlanDto,
  ): Promise<TrainingPlanApplyResponse> {
    const plan = await this.library.checkApply(user, templateId, body);
    const { targets, ...options } = body;
    if (targets.length === 1) {
      return {
        status: 'done',
        results: [await this.library.applyToAthlete(plan, targets[0], options)],
      };
    }
    const jobId = await this.queue.addTrainingPlanApplyJob({
      userId: user.userId,
      plan,
      targets,
      options,
    });
    return { status: 'queued', jobId };
  }
}
