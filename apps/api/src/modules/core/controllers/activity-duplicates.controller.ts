import {
  Controller,
  ForbiddenException,
  HttpCode,
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

import { RemoveDuplicateActivitiesResponseDto } from '@openathlete/shared';

import { JwtUser, UserTypeGuard } from 'src/modules/auth';
import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { QueueService } from '../../queue/queue.service';

@ApiTags('Activities')
@Controller('activity-duplicates')
export class ActivityDuplicatesController {
  constructor(private readonly queue: QueueService) {}

  @UseGuards(AuthGuard('jwt'), UserTypeGuard)
  @ApiBearerAuth()
  @Post('removal')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Remove duplicate activities',
    description:
      "Queues the removal of the authenticated athlete's activities saved twice from two sources (two providers, or a provider and an uploaded file): starts within 3 minutes and durations within 20%. One copy of each workout is kept: the commented one, then the one linked to a planned session, then a device's recording over Strava's, then the first imported. The others are deleted with their records, training load and weather, and a planned session linked to one of them moves to the kept copy. Activities logged by hand are left alone.",
  })
  @ApiResponse({ status: 202, description: 'Removal queued' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 403, description: 'No athlete profile' })
  async removeDuplicates(
    @JwtUser() user: AuthUser,
  ): Promise<RemoveDuplicateActivitiesResponseDto> {
    // Own activities only: the action sits in the athlete's connections
    const athleteId = user.athlete?.athleteId;
    if (!athleteId) throw new ForbiddenException();
    await this.queue.addDuplicateActivitiesJob(athleteId);
    return { queued: true };
  }
}
