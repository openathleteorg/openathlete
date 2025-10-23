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

@Controller('event-template')
export class EventTemplateController {
  constructor(private eventTemplateService: EventTemplateService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getMyEventTemplates(
    @JwtUser() user: AuthUser,
    @Query('search') search?: string,
  ) {
    return this.eventTemplateService.getMyEventTemplates(user, search);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post()
  createEventTemplate(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEventTemplateSchema))
    body: CreateEventTemplateDto,
  ) {
    return this.eventTemplateService.createEventTemplate(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':eventTemplateId')
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
  @Delete(':eventTemplateId')
  deleteEventTemplate(
    @JwtUser() user: AuthUser,
    @Param('eventTemplateId', ParseIntPipe) eventTemplateId: number,
  ) {
    return this.eventTemplateService.deleteEventTemplate(user, eventTemplateId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post(':eventTemplateId/use')
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
