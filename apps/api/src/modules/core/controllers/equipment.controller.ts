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

import { sport_type } from '@openathlete/database';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  createEquipmentDtoSchema,
  updateEquipmentDtoSchema,
} from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { EquipmentService } from '../services/equipment.service';

@Controller('equipment')
export class EquipmentController {
  constructor(private equipmentService: EquipmentService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Post()
  createEquipment(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createEquipmentDtoSchema))
    dto: CreateEquipmentDto,
  ) {
    return this.equipmentService.createEquipment(user, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Patch(':id')
  updateEquipment(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(updateEquipmentDtoSchema))
    dto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.updateEquipment(user, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Delete(':id')
  deleteEquipment(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.equipmentService.deleteEquipment(user, id);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get()
  getMyEquipment(@JwtUser() user: AuthUser) {
    return this.equipmentService.getMyEquipment(user);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @Get('default')
  getDefaultEquipmentForSport(
    @JwtUser() user: AuthUser,
    @Query('sport') sport: sport_type,
  ) {
    return this.equipmentService.getDefaultEquipmentForSport(user, sport);
  }
}
