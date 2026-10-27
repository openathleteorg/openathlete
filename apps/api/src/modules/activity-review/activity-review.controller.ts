import { ZodValidationPipe } from 'nestjs-zod';

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ResolveActivityReview,
  activityReviewQuerySchema,
  resolveActivityReviewSchema,
} from '@openathlete/shared';

import { JwtUser } from '../auth';
import { AuthUser } from '../auth/decorators/user.decorator';
import { ActivityReviewService } from './activity-review.service';

@ApiTags('Activity import')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('activity-import/reviews')
export class ActivityReviewController {
  constructor(private readonly reviews: ActivityReviewService) {}
  @Get()
  @ApiOperation({
    summary: 'Review pending recordings from all your activity sources',
  })
  list(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(activityReviewQuerySchema))
    query: { cursor?: string },
  ) {
    return this.reviews.list(user.userId, query.cursor);
  }
  @Post(':id/prepare')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Cache comparison details for a legacy pending recording without starting an import',
  })
  prepare(@JwtUser() user: AuthUser, @Param('id') id: string) {
    return this.reviews.prepare(user.userId, id);
  }
  @Post(':id/resolve')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Explicitly link, separately import, or ignore an owned pending recording',
  })
  resolve(
    @JwtUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(resolveActivityReviewSchema))
    body: ResolveActivityReview,
  ) {
    return this.reviews.resolve(user.userId, id, body);
  }
}
