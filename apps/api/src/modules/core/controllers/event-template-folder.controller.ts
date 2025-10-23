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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import {
  CreateEventTemplateFolderDto,
  UpdateEventTemplateFolderDto,
  createEventTemplateFolderSchema,
  updateEventTemplateFolderSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EventTemplateFolderService } from '../services/event-template-folder.service';

@Controller('event-template-folder')
export class EventTemplateFolderController {
  constructor(private eventTemplateFolderService: EventTemplateFolderService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getMyFolders(@JwtUser() user: AuthUser) {
    return this.eventTemplateFolderService.getMyFolders(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post()
  createFolder(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEventTemplateFolderSchema))
    body: CreateEventTemplateFolderDto,
  ) {
    return this.eventTemplateFolderService.createFolder(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':folderId')
  updateFolder(
    @JwtUser() user: AuthUser,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body(new ZodValidationPipe(updateEventTemplateFolderSchema))
    body: UpdateEventTemplateFolderDto,
  ) {
    return this.eventTemplateFolderService.updateFolder(user, folderId, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':folderId')
  deleteFolder(
    @JwtUser() user: AuthUser,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.eventTemplateFolderService.deleteFolder(user, folderId);
  }
}
