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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { EquipmentType, SportType } from '@openathlete/database';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  createEquipmentDtoSchema,
  updateEquipmentDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EquipmentService } from '../services/equipment.service';

@ApiTags('Equipment')
@Controller('equipment')
export class EquipmentController {
  constructor(private equipmentService: EquipmentService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Create a new equipment item',
    description:
      "Creates a new equipment item (shoe or bike) for the authenticated athlete. Equipment can be associated with multiple sports. If isDefault is set to true, all other equipment items for the same sports will have their isDefault flag set to false (only one default equipment per sport). The equipment is automatically linked to the athlete's profile.",
  })
  @ApiBody({
    description: 'Equipment creation data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Equipment name (1-100 characters)',
          example: 'Nike Air Zoom Pegasus 40',
          minLength: 1,
          maxLength: 100,
        },
        type: {
          type: 'string',
          enum: Object.values(EquipmentType),
          description: 'Equipment type',
          example: 'SHOE',
        },
        sports: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(SportType),
          },
          description: 'Array of sports this equipment is used for',
          example: ['RUNNING', 'TRAIL_RUNNING'],
          minItems: 1,
        },
        isDefault: {
          type: 'boolean',
          description:
            'Whether this equipment is the default for the specified sports. If true, other default equipment for these sports will be unset.',
          example: true,
          default: false,
        },
      },
      required: ['name', 'type', 'sports'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Equipment created successfully',
    schema: {
      type: 'object',
      properties: {
        equipmentId: { type: 'number', example: 1 },
        athleteId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Nike Air Zoom Pegasus 40' },
        type: {
          type: 'string',
          enum: Object.values(EquipmentType),
          example: 'SHOE',
        },
        sports: {
          type: 'array',
          items: { type: 'string' },
          example: ['RUNNING', 'TRAIL_RUNNING'],
        },
        totalDistance: {
          type: 'number',
          description: 'Total distance covered with this equipment in meters',
          example: 0,
        },
        isDefault: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found for user',
  })
  createEquipment(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEquipmentDtoSchema))
    dto: CreateEquipmentDto,
  ) {
    return this.equipmentService.createEquipment(user, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an equipment item',
    description:
      "Updates an existing equipment item. Only the equipment owner can update it. If isDefault is set to true, all other equipment items for the same sports (or the equipment's current sports if sports are not being updated) will have their isDefault flag set to false. Only provided fields will be updated.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the equipment to update',
    example: 1,
  })
  @ApiBody({
    description: 'Equipment update data (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Updated equipment name (1-100 characters)',
          example: 'Nike Air Zoom Pegasus 41',
          minLength: 1,
          maxLength: 100,
        },
        type: {
          type: 'string',
          enum: Object.values(EquipmentType),
          description: 'Updated equipment type',
          example: 'SHOE',
        },
        sports: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(SportType),
          },
          description: 'Updated array of sports',
          example: ['RUNNING'],
        },
        isDefault: {
          type: 'boolean',
          description:
            'Updated default flag. If true, other default equipment for these sports will be unset.',
          example: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Equipment updated successfully',
    schema: {
      type: 'object',
      properties: {
        equipmentId: { type: 'number', example: 1 },
        athleteId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Nike Air Zoom Pegasus 41' },
        type: {
          type: 'string',
          enum: Object.values(EquipmentType),
          example: 'SHOE',
        },
        sports: {
          type: 'array',
          items: { type: 'string' },
          example: ['RUNNING'],
        },
        totalDistance: {
          type: 'number',
          description: 'Total distance covered with this equipment in meters',
          example: 15000,
        },
        isDefault: { type: 'boolean', example: false },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete or equipment not found',
  })
  updateEquipment(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateEquipmentDtoSchema))
    dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.updateEquipment(user, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an equipment item',
    description:
      'Permanently deletes an equipment item. Only the equipment owner can delete it. This operation cannot be undone. The equipment will be removed from all associated activities.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'ID of the equipment to delete',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Equipment deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete or equipment not found',
  })
  deleteEquipment(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.equipmentService.deleteEquipment(user, id);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: 'Get all equipment for the authenticated athlete',
    description:
      'Retrieves all equipment items owned by the authenticated athlete. Equipment is ordered by creation date (most recently created first). Each equipment item includes its type, associated sports, total distance covered, and default status.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of equipment retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          equipmentId: { type: 'number', example: 1 },
          athleteId: { type: 'number', example: 1 },
          name: { type: 'string', example: 'Nike Air Zoom Pegasus 40' },
          type: {
            type: 'string',
            enum: Object.values(EquipmentType),
            example: 'SHOE',
          },
          sports: {
            type: 'array',
            items: { type: 'string' },
            example: ['RUNNING', 'TRAIL_RUNNING'],
          },
          totalDistance: {
            type: 'number',
            description: 'Total distance covered with this equipment in meters',
            example: 15000,
          },
          isDefault: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found for user',
  })
  getMyEquipment(@JwtUser() user: AuthUser) {
    return this.equipmentService.getMyEquipment(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get('default')
  @ApiOperation({
    summary: 'Get default equipment for a specific sport',
    description:
      'Retrieves the default equipment item for a specific sport. Returns the equipment that is marked as default (isDefault=true) and associated with the specified sport. Returns null if no default equipment is found for the sport.',
  })
  @ApiQuery({
    name: 'sport',
    type: String,
    enum: Object.values(SportType),
    description: 'Sport type to get default equipment for',
    example: 'RUNNING',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description:
      'Default equipment retrieved successfully (or null if not found)',
    schema: {
      type: 'object',
      nullable: true,
      properties: {
        equipmentId: { type: 'number', example: 1 },
        athleteId: { type: 'number', example: 1 },
        name: { type: 'string', example: 'Nike Air Zoom Pegasus 40' },
        type: {
          type: 'string',
          enum: Object.values(EquipmentType),
          example: 'SHOE',
        },
        sports: {
          type: 'array',
          items: { type: 'string' },
          example: ['RUNNING', 'TRAIL_RUNNING'],
        },
        totalDistance: {
          type: 'number',
          description: 'Total distance covered with this equipment in meters',
          example: 15000,
        },
        isDefault: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing authentication token',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - athlete not found for user',
  })
  getDefaultEquipmentForSport(
    @JwtUser() user: AuthUser,
    @Query('sport') sport: SportType,
  ) {
    return this.equipmentService.getDefaultEquipmentForSport(user, sport);
  }
}
