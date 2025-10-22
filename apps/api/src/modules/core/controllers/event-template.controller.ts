import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  CreateEventTemplateDto,
  UseEventTemplateDto,
  createEventTemplateSchema,
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
  getMyEventTemplates(@JwtUser() user: AuthUser) {
    return this.eventTemplateService.getMyEventTemplates(user);
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
