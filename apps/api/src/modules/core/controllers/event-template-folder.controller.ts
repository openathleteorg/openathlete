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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  CreateEventTemplateFolderDto,
  UpdateEventTemplateFolderDto,
  createEventTemplateFolderSchema,
  updateEventTemplateFolderSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EventTemplateFolderService } from '../services/event-template-folder.service';

@ApiTags('Event Template Folder')
@Controller('event-template-folder')
export class EventTemplateFolderController {
  constructor(private eventTemplateFolderService: EventTemplateFolderService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all folders for the authenticated user',
    description:
      'Retrieves all event template folders belonging to the authenticated user. Folders are ordered alphabetically by name. Each folder includes counts of event templates and child folders it contains. Folders can be organized hierarchically using parent-child relationships.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of folders retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          eventTemplateFolderId: {
            type: 'number',
            description: 'Unique identifier for the folder',
            example: 1,
          },
          userId: {
            type: 'number',
            description: 'ID of the user who owns this folder',
            example: 1,
          },
          name: {
            type: 'string',
            description: 'Name of the folder',
            example: 'Endurance Training',
          },
          color: {
            type: 'string',
            nullable: true,
            description:
              'Color code for the folder (hex format). Default: "#6366f1"',
            example: '#6366f1',
          },
          description: {
            type: 'string',
            description: 'Description of the folder. Default: empty string',
            example: 'Templates for endurance training sessions',
          },
          parentFolderId: {
            type: 'number',
            nullable: true,
            description:
              'ID of the parent folder if this folder is nested. Null for root folders.',
            example: null,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the folder was created',
            example: '2024-01-15T10:30:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date and time when the folder was last updated',
            example: '2024-01-20T14:45:00.000Z',
          },
          _count: {
            type: 'object',
            properties: {
              eventTemplates: {
                type: 'number',
                description: 'Number of event templates in this folder',
                example: 5,
              },
              childFolders: {
                type: 'number',
                description: 'Number of child folders nested in this folder',
                example: 2,
              },
            },
          },
        },
        required: [
          'eventTemplateFolderId',
          'userId',
          'name',
          'description',
          'createdAt',
          'updatedAt',
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  getMyFolders(@JwtUser() user: AuthUser) {
    return this.eventTemplateFolderService.getMyFolders(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new event template folder',
    description:
      'Creates a new event template folder for the authenticated user. Folders can be organized hierarchically by specifying a parentFolderId. The folder can be customized with a name, color (hex format, default: "#6366f1"), and description. The created folder includes counts of event templates and child folders (initially 0).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the folder (required, minimum 1 character)',
          example: 'Endurance Training',
        },
        color: {
          type: 'string',
          description:
            'Color code for the folder in hex format. Optional, default: "#6366f1"',
          example: '#6366f1',
        },
        description: {
          type: 'string',
          description:
            'Description of the folder. Optional, default: empty string',
          example: 'Templates for endurance training sessions',
        },
        parentFolderId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the parent folder if this folder should be nested. Optional, null for root folders.',
          example: null,
        },
      },
      required: ['name'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
    schema: {
      type: 'object',
      properties: {
        eventTemplateFolderId: {
          type: 'number',
          description: 'Unique identifier for the created folder',
          example: 1,
        },
        userId: {
          type: 'number',
          description: 'ID of the user who owns this folder',
          example: 1,
        },
        name: {
          type: 'string',
          description: 'Name of the folder',
          example: 'Endurance Training',
        },
        color: {
          type: 'string',
          nullable: true,
          description:
            'Color code for the folder (hex format). Default: "#6366f1"',
          example: '#6366f1',
        },
        description: {
          type: 'string',
          description: 'Description of the folder. Default: empty string',
          example: 'Templates for endurance training sessions',
        },
        parentFolderId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the parent folder if this folder is nested. Null for root folders.',
          example: null,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the folder was created',
          example: '2024-01-15T10:30:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the folder was last updated',
          example: '2024-01-15T10:30:00.000Z',
        },
        _count: {
          type: 'object',
          properties: {
            eventTemplates: {
              type: 'number',
              description: 'Number of event templates in this folder',
              example: 0,
            },
            childFolders: {
              type: 'number',
              description: 'Number of child folders nested in this folder',
              example: 0,
            },
          },
        },
      },
      required: [
        'eventTemplateFolderId',
        'userId',
        'name',
        'description',
        'createdAt',
        'updatedAt',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error (e.g., name is empty)',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  createFolder(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEventTemplateFolderSchema))
    body: CreateEventTemplateFolderDto,
  ) {
    return this.eventTemplateFolderService.createFolder(user, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':folderId')
  @ApiOperation({
    summary: 'Update an event template folder',
    description:
      'Updates an existing event template folder. Only the folder owner can update it. All fields are optional - only provided fields will be updated. The folder can be moved to a different parent folder by changing parentFolderId, or made a root folder by setting parentFolderId to null. The updated folder includes counts of event templates and child folders.',
  })
  @ApiParam({
    name: 'folderId',
    type: Number,
    description: 'ID of the folder to update',
    example: 1,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description:
            'New name for the folder (optional, minimum 1 character)',
          example: 'Endurance Training Updated',
        },
        color: {
          type: 'string',
          description: 'New color code for the folder in hex format. Optional.',
          example: '#8b5cf6',
        },
        description: {
          type: 'string',
          description: 'New description for the folder. Optional.',
          example: 'Updated templates for endurance training sessions',
        },
        parentFolderId: {
          type: 'number',
          nullable: true,
          description:
            'New parent folder ID if this folder should be moved. Optional, null to make it a root folder.',
          example: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Folder updated successfully',
    schema: {
      type: 'object',
      properties: {
        eventTemplateFolderId: {
          type: 'number',
          description: 'Unique identifier for the folder',
          example: 1,
        },
        userId: {
          type: 'number',
          description: 'ID of the user who owns this folder',
          example: 1,
        },
        name: {
          type: 'string',
          description: 'Name of the folder',
          example: 'Endurance Training Updated',
        },
        color: {
          type: 'string',
          nullable: true,
          description: 'Color code for the folder (hex format)',
          example: '#8b5cf6',
        },
        description: {
          type: 'string',
          description: 'Description of the folder',
          example: 'Updated templates for endurance training sessions',
        },
        parentFolderId: {
          type: 'number',
          nullable: true,
          description:
            'ID of the parent folder if this folder is nested. Null for root folders.',
          example: null,
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the folder was created',
          example: '2024-01-15T10:30:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Date and time when the folder was last updated',
          example: '2024-01-20T14:45:00.000Z',
        },
        _count: {
          type: 'object',
          properties: {
            eventTemplates: {
              type: 'number',
              description: 'Number of event templates in this folder',
              example: 5,
            },
            childFolders: {
              type: 'number',
              description: 'Number of child folders nested in this folder',
              example: 2,
            },
          },
        },
      },
      required: [
        'eventTemplateFolderId',
        'userId',
        'name',
        'description',
        'createdAt',
        'updatedAt',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the owner of this folder',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - folder not found',
  })
  updateFolder(
    @JwtUser() user: AuthUser,
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body(new ZodValidationPipe(updateEventTemplateFolderSchema))
    body: UpdateEventTemplateFolderDto,
  ) {
    return this.eventTemplateFolderService.updateFolder(user, folderId, body);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':folderId')
  @ApiOperation({
    summary: 'Delete an event template folder',
    description:
      'Deletes an event template folder. Only the folder owner can delete it. The folder and all its contents (event templates and child folders) are permanently deleted. This operation cannot be undone.',
  })
  @ApiParam({
    name: 'folderId',
    type: Number,
    description: 'ID of the folder to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Folder deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user is not the owner of this folder',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - folder not found',
  })
  deleteFolder(
    @JwtUser() user: AuthUser,
    @Param('folderId', ParseIntPipe) folderId: number,
  ) {
    return this.eventTemplateFolderService.deleteFolder(user, folderId);
  }
}
