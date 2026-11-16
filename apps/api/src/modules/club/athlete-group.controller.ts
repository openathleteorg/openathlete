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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  AthleteGroupAthletesDto,
  AthleteGroupDto,
  AthleteGroupIdParamsDto,
  AthleteGroupStaffDto,
  AthleteGroupsQueryDto,
  CreateAthleteGroupDto,
  UpdateAthleteGroupDto,
  athleteGroupAthletesDtoSchema,
  athleteGroupIdParamsSchema,
  athleteGroupStaffDtoSchema,
  athleteGroupsQuerySchema,
  createAthleteGroupDtoSchema,
  updateAthleteGroupDtoSchema,
} from '@openathlete/shared';

import { JwtUser } from 'src/modules/auth/decorators';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { UserTypeGuard } from 'src/modules/auth/guards';

import { AthleteGroupService } from './athlete-group.service';

const NOT_FOUND = {
  status: 404,
  description: 'No such group, or not one the user can see',
};
const FORBIDDEN = {
  status: 403,
  description: "Only the group's owner, or the club's coaches, change it",
};

@ApiTags('Athlete groups')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('athlete-groups')
export class AthleteGroupController {
  constructor(private readonly groups: AthleteGroupService) {}

  @Get()
  @ApiOperation({
    summary: 'List groups',
    description:
      "Without clubId, the coach's own groups. With it, the club's groups for its staff; an assistant sees the groups entrusted to them.",
  })
  @ApiQuery({ name: 'clubId', type: Number, required: false })
  @ApiResponse({ status: 200, description: 'Groups, flat, with parentId' })
  list(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(athleteGroupsQuerySchema))
    query: AthleteGroupsQueryDto,
  ): Promise<AthleteGroupDto[]> {
    return this.groups.list(user.userId, query.clubId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a group or a sub-group',
    description: 'Sub-groups have no sub-groups of their own.',
  })
  @ApiResponse({ status: 201, description: 'The new group' })
  @ApiResponse(FORBIDDEN)
  create(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAthleteGroupDtoSchema))
    body: CreateAthleteGroupDto,
  ): Promise<AthleteGroupDto> {
    return this.groups.create(user.userId, body);
  }

  @Patch(':athleteGroupId')
  @ApiOperation({ summary: 'Rename a group' })
  @ApiResponse({ status: 200, description: 'The group' })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  rename(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(athleteGroupIdParamsSchema))
    params: AthleteGroupIdParamsDto,
    @Body(new ZodValidationPipe(updateAthleteGroupDtoSchema))
    body: UpdateAthleteGroupDto,
  ): Promise<AthleteGroupDto> {
    return this.groups.rename(user.userId, params.athleteGroupId, body.name);
  }

  @Delete(':athleteGroupId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a group',
    description: 'Its sub-groups go too; the athletes stay where they are.',
  })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async delete(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(athleteGroupIdParamsSchema))
    params: AthleteGroupIdParamsDto,
  ): Promise<void> {
    await this.groups.delete(user.userId, params.athleteGroupId);
  }

  @Post(':athleteGroupId/athletes')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Add athletes to a group',
    description:
      'Athletes the coach coaches, for their own group; athletes of the club, for a club group. Already there: no change.',
  })
  @ApiResponse({ status: 200, description: 'The group' })
  @ApiResponse({ status: 400, description: 'An athlete cannot join it' })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  addAthletes(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(athleteGroupIdParamsSchema))
    params: AthleteGroupIdParamsDto,
    @Body(new ZodValidationPipe(athleteGroupAthletesDtoSchema))
    body: AthleteGroupAthletesDto,
  ): Promise<AthleteGroupDto> {
    return this.groups.addAthletes(
      user.userId,
      params.athleteGroupId,
      body.athleteIds,
    );
  }

  @Delete(':athleteGroupId/athletes/:athleteId')
  @ApiOperation({ summary: 'Take an athlete out of a group' })
  @ApiResponse({ status: 200, description: 'The group' })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  removeAthlete(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(athleteGroupIdParamsSchema))
    params: AthleteGroupIdParamsDto,
    @Param('athleteId', ParseIntPipe) athleteId: number,
  ): Promise<AthleteGroupDto> {
    return this.groups.removeAthlete(
      user.userId,
      params.athleteGroupId,
      athleteId,
    );
  }

  @Put(':athleteGroupId/staff')
  @ApiOperation({
    summary: 'Entrust a club group to assistants',
    description:
      'Replaces the list. The assistants coach the athletes of the group and its sub-groups, and no others.',
  })
  @ApiResponse({ status: 200, description: 'The group' })
  @ApiResponse({
    status: 400,
    description: 'Not a club group, or not assistants',
  })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  setStaff(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(athleteGroupIdParamsSchema))
    params: AthleteGroupIdParamsDto,
    @Body(new ZodValidationPipe(athleteGroupStaffDtoSchema))
    body: AthleteGroupStaffDto,
  ): Promise<AthleteGroupDto> {
    return this.groups.setStaff(
      user.userId,
      params.athleteGroupId,
      body.userIds,
    );
  }
}
