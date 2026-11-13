import { ZodValidationPipe } from 'nestjs-zod';

import {
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
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
import { Throttle } from '@nestjs/throttler';

import {
  AcceptCoachJoinLinkResponseDto,
  CoachJoinLinkDto,
  CoachJoinLinkInfoDto,
  CoachJoinTokenParamsDto,
  coachJoinTokenParamsSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from 'src/common/security/rate-limits';

import { JwtUser } from '../decorators';
import { AuthUser } from '../decorators/user.decorator';
import { UserTypeGuard } from '../guards';
import { CoachJoinLinkService } from '../services/coach-join-link.service';

const linkSchema = {
  type: 'object',
  properties: {
    token: { type: 'string', example: 'q3Jm0bP2xS9vYd8kLw4aZg' },
    url: {
      type: 'string',
      example: 'https://app.openathlete.org/join/q3Jm0bP2xS9vYd8kLw4aZg',
    },
  },
};

const tokenParam = {
  name: 'token',
  type: String,
  description: "Token of the coach's join link",
};

@ApiTags('Coach join link')
@Controller('coach-join-link')
export class CoachJoinLinkController {
  constructor(private readonly coachJoinLinks: CoachJoinLinkService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: "Get the current coach's shareable join link",
    description:
      'Returns the link a coach shares with athletes (club group, messaging app). Anyone with an account who opens it becomes their athlete. Created on the first call.',
  })
  @ApiResponse({
    status: 200,
    description: 'The join link',
    schema: linkSchema,
  })
  @ApiResponse({ status: 403, description: 'The user is not a coach' })
  getLink(@JwtUser() user: AuthUser): Promise<CoachJoinLinkDto> {
    return this.coachJoinLinks.getOrCreateLink(user.userId);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('rotate')
  @HttpCode(200)
  @ApiOperation({
    summary: "Replace the current coach's join link",
    description:
      'Creates a new token: the previous link stops working. Athletes already linked stay linked.',
  })
  @ApiResponse({
    status: 200,
    description: 'The new join link',
    schema: linkSchema,
  })
  @ApiResponse({ status: 403, description: 'The user is not a coach' })
  rotateLink(@JwtUser() user: AuthUser): Promise<CoachJoinLinkDto> {
    return this.coachJoinLinks.rotateLink(user.userId);
  }

  // Public, and reveals whether a link exists: limited like account lookups
  @Throttle(RATE_LIMITS.accountLookup)
  @Get(':token')
  @ApiOperation({
    summary: 'Describe a join link',
    description:
      "Public. Returns what the join page shows: the coach's first name and last initial, never their email.",
  })
  @ApiParam(tokenParam)
  @ApiResponse({
    status: 200,
    description: 'The coach behind the link',
    schema: {
      type: 'object',
      properties: { coachName: { type: 'string', example: 'Ana L.' } },
    },
  })
  @ApiResponse({ status: 404, description: 'Unknown or revoked link' })
  getPublicInfo(
    @Param(new ZodValidationPipe(coachJoinTokenParamsSchema))
    params: CoachJoinTokenParamsDto,
  ): Promise<CoachJoinLinkInfoDto> {
    return this.coachJoinLinks.getPublicInfo(params.token);
  }

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Throttle(RATE_LIMITS.accountLookup)
  @Post(':token/accept')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Join a coach through their link',
    description:
      "Links the current user's athlete profile to the coach. Succeeds without change when already linked. Respects the coach's athlete limit.",
  })
  @ApiParam(tokenParam)
  @ApiResponse({
    status: 200,
    description: 'Linked, or already linked',
    schema: {
      type: 'object',
      properties: {
        coachName: { type: 'string', example: 'Ana L.' },
        alreadyLinked: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'The link is your own, or the coach has reached the athlete limit of their plan',
  })
  @ApiResponse({ status: 404, description: 'Unknown or revoked link' })
  accept(
    @JwtUser() user: AuthUser,
    @Param(new ZodValidationPipe(coachJoinTokenParamsSchema))
    params: CoachJoinTokenParamsDto,
  ): Promise<AcceptCoachJoinLinkResponseDto> {
    return this.coachJoinLinks.accept(user.userId, params.token);
  }
}
