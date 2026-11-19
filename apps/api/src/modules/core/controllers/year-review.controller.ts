import { ZodValidationPipe } from 'nestjs-zod';

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  GetYearReviewQueryDto,
  getYearReviewQuerySchema,
} from '@openathlete/shared';

import { UserTypeGuard } from 'src/modules/auth';
import { AuthUser, JwtUser } from 'src/modules/auth/decorators/user.decorator';

import { YearReviewService } from '../services/year-review.service';

@ApiTags('Year review')
@Controller('year-review')
export class YearReviewController {
  constructor(private readonly yearReviewService: YearReviewService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Get()
  @ApiOperation({
    summary: "An athlete's year in review",
    description:
      'Everything the year review story shows, on the athlete’s calendar: totals, sports, active days, months, fitness, race of the year, records beaten, plan completion and the hours they train at.',
  })
  @ApiQuery({ name: 'athleteId', type: Number })
  @ApiQuery({ name: 'year', type: Number })
  @ApiResponse({ status: 200, description: 'The year in review' })
  @ApiResponse({ status: 400, description: 'The year has not started' })
  @ApiResponse({ status: 403, description: 'Not allowed to read the athlete' })
  @ApiResponse({ status: 404, description: 'Athlete not found' })
  getYearReview(
    @JwtUser() user: AuthUser,
    @Query(new ZodValidationPipe(getYearReviewQuerySchema))
    query: GetYearReviewQueryDto,
  ) {
    return this.yearReviewService.getYearReview(
      user,
      query.athleteId,
      query.year,
    );
  }
}
