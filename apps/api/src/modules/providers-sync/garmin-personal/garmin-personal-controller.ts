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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import {
  ConnectGarminPersonal,
  GarminPersonalPreferences,
  GarminPersonalSync,
  ResolveGarminPersonalReview,
  connectGarminPersonalSchema,
  garminPersonalPreferencesSchema,
  garminPersonalReviewQuerySchema,
  garminPersonalSyncSchema,
  resolveGarminPersonalReviewSchema,
} from '@openathlete/shared';

import { RATE_LIMITS } from '../../../common/security/rate-limits';
import { JwtUser } from '../../auth';
import { AuthUser } from '../../auth/decorators/user.decorator';
import { GarminPersonalService } from './garmin-personal-service';

@ApiTags('Provider')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('provider/garmin-personal')
export class GarminPersonalController {
  constructor(private readonly service: GarminPersonalService) {}
  @Get()
  @ApiOperation({
    summary: 'Get your Garmin Personal connection and sanitized sync status',
  })
  status(@JwtUser() user: AuthUser) {
    return this.service.status(user.userId);
  }
  @Post()
  @Throttle(RATE_LIMITS.login)
  @ApiOperation({
    summary: 'Validate and save your own Garmin Personal API key',
  })
  connect(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(connectGarminPersonalSchema))
    body: ConnectGarminPersonal,
  ) {
    return this.service.connect(user.userId, body);
  }
  @Patch()
  @ApiOperation({
    summary:
      'Change your activity-import consent and automatic sync preferences',
  })
  preferences(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(garminPersonalPreferencesSchema))
    body: GarminPersonalPreferences,
  ) {
    return this.service.preferences(user.userId, body);
  }
  @Delete()
  @ApiOperation({
    summary:
      'Delete your stored key and stop future pulls; keep imported activities',
  })
  disconnect(@JwtUser() user: AuthUser) {
    return this.service.disconnect(user.userId);
  }
  @Post('sync')
  @HttpCode(202)
  @ApiOperation({
    summary:
      'Queue your activity imports for an inclusive range of up to 28 calendar days',
  })
  sync(
    @JwtUser() user: AuthUser,
    @Body(new ZodValidationPipe(garminPersonalSyncSchema))
    body: GarminPersonalSync,
  ) {
    return this.service.enqueue(user.userId, body);
  }
  @Get('reviews')
  @ApiOperation({
    summary: 'List your Garmin recordings awaiting a match decision',
  })
  reviews(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(garminPersonalReviewQuerySchema))
    query: { cursor?: number },
  ) {
    return this.service.reviews(user.userId, query.cursor);
  }
  @Post('reviews/:id/preview')
  @HttpCode(200)
  @Throttle(RATE_LIMITS.login)
  @ApiOperation({
    summary: 'Load comparison details for an older pending Garmin recording',
  })
  preview(@JwtUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.previewReview(user.userId, id);
  }
  @Post('reviews/:id/resolve')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Link, separately import, or ignore your pending Garmin recording',
  })
  resolve(
    @JwtUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(resolveGarminPersonalReviewSchema))
    body: ResolveGarminPersonalReview,
  ) {
    return this.service.resolveReview(user.userId, id, body);
  }
}
