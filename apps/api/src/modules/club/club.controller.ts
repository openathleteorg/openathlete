import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  AcceptClubJoinLinkResponseDto,
  ClubDetailDto,
  ClubIdParamsDto,
  ClubJoinLinkInfoDto,
  ClubJoinLinksDto,
  ClubJoinTokenParamsDto,
  ClubMemberParamsDto,
  ClubSummaryDto,
  CreateClubDto,
  RotateClubJoinLinkDto,
  TransferClubDto,
  UpdateClubDto,
  UpdateClubMemberDto,
  clubIdParamsSchema,
  clubJoinTokenParamsSchema,
  clubMemberParamsSchema,
  createClubDtoSchema,
  rotateClubJoinLinkDtoSchema,
  transferClubDtoSchema,
  updateClubDtoSchema,
  updateClubMemberDtoSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from 'src/common/security/rate-limits';
import { JwtUser } from 'src/modules/auth/decorators';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';
import { UserTypeGuard } from 'src/modules/auth/guards';

import { ClubJoinLinkService } from './club-join-link.service';
import { ClubService } from './club.service';

const NOT_A_MEMBER = {
  status: 404,
  description: 'No such club, or the user is not a member',
};

@ApiTags('Clubs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), UserTypeGuard)
@Controller('club')
export class ClubController {
  constructor(
    private readonly clubs: ClubService,
    private readonly joinLinks: ClubJoinLinkService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List my clubs',
    description: 'Every club the user belongs to, with their role in it.',
  })
  @ApiResponse({ status: 200, description: 'The clubs' })
  listMine(@JwtUser() user: AuthUser): Promise<ClubSummaryDto[]> {
    return this.clubs.listMine(user.userId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a club',
    description:
      'Creates a club owned by the user, who gains the coach role if they did not have it.',
  })
  @ApiResponse({ status: 201, description: 'The new club' })
  create(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(createClubDtoSchema)) body: CreateClubDto,
  ): Promise<ClubSummaryDto> {
    return this.clubs.create(user.userId, body);
  }

  @Get(':clubId')
  @ApiOperation({
    summary: 'Get a club and its members',
    description:
      'Staff see every member with their email; an assistant only the athletes they coach; an athlete only the staff, without emails.',
  })
  @ApiResponse({ status: 200, description: 'The club' })
  @ApiResponse(NOT_A_MEMBER)
  get(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
  ): Promise<ClubDetailDto> {
    return this.clubs.get(user.userId, params.clubId);
  }

  @Patch(':clubId')
  @ApiOperation({ summary: 'Rename or describe a club (admins)' })
  @ApiResponse({ status: 200, description: 'The updated club' })
  @ApiResponse({ status: 403, description: 'Not an admin of the club' })
  @ApiResponse(NOT_A_MEMBER)
  update(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
    @Body(new ZodValidationPipe(updateClubDtoSchema)) body: UpdateClubDto,
  ): Promise<ClubDetailDto> {
    return this.clubs.update(user.userId, params.clubId, body);
  }

  @Delete(':clubId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a club (owner)',
    description:
      'Removes the club, its groups and the coaching links it created. Members keep their accounts and data, and links coaches and athletes made themselves.',
  })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 403, description: 'Not the owner' })
  @ApiResponse(NOT_A_MEMBER)
  async delete(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
  ): Promise<void> {
    await this.clubs.delete(user.userId, params.clubId);
  }

  @Patch(':clubId/members/:userId')
  @ApiOperation({
    summary: "Change a member's role",
    description:
      'Admins change coaches, assistants and athletes; only the owner names or demotes admins. The coaching links follow at once.',
  })
  @ApiResponse({ status: 200, description: 'The updated club' })
  @ApiResponse({ status: 403, description: 'Not allowed for this member' })
  @ApiResponse(NOT_A_MEMBER)
  updateMember(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubMemberParamsSchema))
    params: ClubMemberParamsDto,
    @Body(new ZodValidationPipe(updateClubMemberDtoSchema))
    body: UpdateClubMemberDto,
  ): Promise<ClubDetailDto> {
    return this.clubs.updateMemberRole(
      user.userId,
      params.clubId,
      params.userId,
      body.role,
    );
  }

  @Delete(':clubId/members/:userId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Remove a member, or leave the club',
    description:
      "With the user's own id, leaves the club; the owner transfers it first. The coaching links the club created for this member go.",
  })
  @ApiResponse({ status: 204, description: 'Removed' })
  @ApiResponse({ status: 400, description: 'The owner cannot leave' })
  @ApiResponse({ status: 403, description: 'Not allowed for this member' })
  @ApiResponse(NOT_A_MEMBER)
  async removeMember(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubMemberParamsSchema))
    params: ClubMemberParamsDto,
  ): Promise<void> {
    await this.clubs.removeMember(user.userId, params.clubId, params.userId);
  }

  @Post(':clubId/transfer')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Hand the club to another coach (owner)',
    description: 'The new owner must be staff; the previous one becomes admin.',
  })
  @ApiResponse({ status: 200, description: 'The updated club' })
  @ApiResponse(NOT_A_MEMBER)
  transfer(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
    @Body(new ZodValidationPipe(transferClubDtoSchema)) body: TransferClubDto,
  ): Promise<ClubDetailDto> {
    return this.clubs.transfer(user.userId, params.clubId, body.userId);
  }

  @Get(':clubId/join-links')
  @ApiOperation({
    summary: "Get the club's join links (admins)",
    description:
      'One link for athletes, one for coaches. Created on the first call.',
  })
  @ApiResponse({ status: 200, description: 'The links' })
  @ApiResponse({ status: 403, description: 'Not an admin of the club' })
  @ApiResponse(NOT_A_MEMBER)
  getJoinLinks(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
  ): Promise<ClubJoinLinksDto> {
    return this.joinLinks.getLinks(user.userId, params.clubId);
  }

  @Post(':clubId/join-links/rotate')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Replace one of the join links (admins)',
    description: 'The previous link stops working; members stay members.',
  })
  @ApiResponse({ status: 200, description: 'The links' })
  @ApiResponse(NOT_A_MEMBER)
  rotateJoinLink(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubIdParamsSchema)) params: ClubIdParamsDto,
    @Body(new ZodValidationPipe(rotateClubJoinLinkDtoSchema))
    body: RotateClubJoinLinkDto,
  ): Promise<ClubJoinLinksDto> {
    return this.joinLinks.rotate(user.userId, params.clubId, body.kind);
  }
}

@ApiTags('Clubs')
@Controller('club-join')
export class ClubJoinController {
  constructor(private readonly joinLinks: ClubJoinLinkService) {}

  // Public, and reveals whether a link exists: limited like account lookups
  @Throttle(RATE_LIMITS.accountLookup)
  @Get(':token')
  @ApiOperation({
    summary: 'Describe a club join link',
    description:
      'Public. The club name, the role the link gives, and the staff who will see an athlete’s training (first name and last initial).',
  })
  @ApiResponse({ status: 200, description: 'The club behind the link' })
  @ApiResponse({ status: 404, description: 'Unknown or revoked link' })
  getPublicInfo(
    @Param(new ZodValidationPipe(clubJoinTokenParamsSchema))
    params: ClubJoinTokenParamsDto,
  ): Promise<ClubJoinLinkInfoDto> {
    return this.joinLinks.getPublicInfo(params.token);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Throttle(RATE_LIMITS.accountLookup)
  @Post(':token/accept')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Join a club through one of its links',
    description:
      'Makes the user a member, as athlete or coach depending on the link. Succeeds without change for a member.',
  })
  @ApiResponse({ status: 200, description: 'Joined, or already a member' })
  @ApiResponse({ status: 404, description: 'Unknown or revoked link' })
  accept(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(clubJoinTokenParamsSchema))
    params: ClubJoinTokenParamsDto,
  ): Promise<AcceptClubJoinLinkResponseDto> {
    return this.joinLinks.accept(user.userId, params.token);
  }
}
